// === CandidateModal.jsx ===
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl
} from '@mui/material';
import { useEffect, useState } from 'react';

export default function CandidateModal({ open, modalToggler, candidate, refresh }) {
    const [formData, setFormData] = useState({
        name: '',
        party: '',
        assembly: '',
        election_year: '',
        caste: '',
        votes: '',
        criminal_cases: '',
        assets: '',
        liabilities: '',
        education: '',
        photo: '',
        is_active: true
    });
    const [parties, setParties] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [years, setYears] = useState([]);

    useEffect(() => {
        Promise.all([
            fetch('http://localhost:5000/api/parties').then(res => res.json()),
            fetch('http://localhost:5000/api/assemblies').then(res => res.json()),
            fetch('http://localhost:5000/api/election-years').then(res => res.json())
        ]).then(([partyRes, assemblyRes, yearRes]) => {
            if (partyRes.success) setParties(partyRes.data);
            if (assemblyRes.success) setAssemblies(assemblyRes.data);
            if (yearRes.success) setYears(yearRes.data);
        });
    }, []);

    useEffect(() => {
        if (candidate) {
            setFormData({
                name: candidate.name || '',
                party: candidate.party?._id || '',
                assembly: candidate.assembly?._id || '',
                election_year: candidate.election_year?._id || '',
                caste: candidate.caste || '',
                votes: candidate.votes || '',
                criminal_cases: candidate.criminal_cases || '',
                assets: candidate.assets || '',
                liabilities: candidate.liabilities || '',
                education: candidate.education || '',
                photo: candidate.photo || '',
                is_active: candidate.is_active
            });
        } else {
            setFormData({
                name: '',
                party: '',
                assembly: '',
                election_year: '',
                caste: '',
                votes: '',
                criminal_cases: '',
                assets: '',
                liabilities: '',
                education: '',
                photo: '',
                is_active: true
            });
        }
    }, [candidate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('serviceToken');
        const url = candidate ? `http://localhost:5000/api/candidates/${candidate._id}` : 'http://localhost:5000/api/candidates';
        const method = candidate ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            modalToggler(false);
            refresh();
        } else {
            const err = await res.json();
            console.error(err);
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{candidate ? 'Edit Candidate' : 'Add Candidate'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    {[['Name', 'name'], ['Caste', 'caste'], ['Votes', 'votes'], ['Criminal Cases', 'criminal_cases'], ['Assets', 'assets'], ['Liabilities', 'liabilities'], ['Education', 'education'], ['Photo URL', 'photo']]
                        .map(([label, name]) => (
                            <Grid item xs={12} sm={6} key={name}>
                                <Stack spacing={1}>
                                    <InputLabel>{label}</InputLabel>
                                    <TextField name={name} value={formData[name]} onChange={handleChange} fullWidth />
                                </Stack>
                            </Grid>
                        ))}

                    {[{ label: 'Party', name: 'party', options: parties }, { label: 'Assembly', name: 'assembly', options: assemblies }, { label: 'Election Year', name: 'election_year', options: years }]
                        .map(({ label, name, options }) => (
                            <Grid item xs={12} sm={6} key={name}>
                                <Stack spacing={1}>
                                    <InputLabel>{label}</InputLabel>
                                    <FormControl fullWidth>
                                        <Select name={name} value={formData[name]} onChange={handleChange}>
                                            {options.map((opt) => (
                                                <MenuItem key={opt._id} value={opt._id}>{opt.name || opt.year}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </Grid>
                        ))}
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>{candidate ? 'Update' : 'Submit'}</Button>
            </DialogActions>
        </Dialog>
    );
}
