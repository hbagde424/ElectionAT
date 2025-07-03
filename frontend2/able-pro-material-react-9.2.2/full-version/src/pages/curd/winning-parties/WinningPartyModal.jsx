import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Stack,
    TextField,
    InputLabel,
    Select,
    MenuItem,
    FormControl
} from '@mui/material';
import { useEffect, useState } from 'react';

export default function WinningPartyModal({ open, modalToggler, party, refresh }) {
    const [formData, setFormData] = useState({
        candidate_id: '',
        assembly_id: '',
        parliament_id: '',
        party_id: '',
        year_id: '',
        votes: '',
        margin: ''
    });

    const [candidates, setCandidates] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [parties, setParties] = useState([]);
    const [years, setYears] = useState([]);

    useEffect(() => {
        Promise.all([
            fetch('http://localhost:5000/api/candidates').then((res) => res.json()),
            fetch('http://localhost:5000/api/assemblies').then((res) => res.json()),
            fetch('http://localhost:5000/api/parliaments').then((res) => res.json()),
            fetch('http://localhost:5000/api/parties').then((res) => res.json()),
            fetch('http://localhost:5000/api/years').then((res) => res.json())
        ]).then(([candidatesRes, assembliesRes, parliamentsRes, partiesRes, yearsRes]) => {
            if (candidatesRes.success) setCandidates(candidatesRes.data);
            if (assembliesRes.success) setAssemblies(assembliesRes.data);
            if (parliamentsRes.success) setParliaments(parliamentsRes.data);
            if (partiesRes.success) setParties(partiesRes.data);
            if (yearsRes.success) setYears(yearsRes.data);
        });
    }, []);

    useEffect(() => {
        if (party) {
            setFormData({
                candidate_id: party.candidate_id?._id || '',
                assembly_id: party.assembly_id?._id || '',
                parliament_id: party.parliament_id?._id || '',
                party_id: party.party_id?._id || '',
                year_id: party.year_id?._id || '',
                votes: party.votes || '',
                margin: party.margin || ''
            });
        } else {
            setFormData({
                candidate_id: '',
                assembly_id: '',
                parliament_id: '',
                party_id: '',
                year_id: '',
                votes: '',
                margin: ''
            });
        }
    }, [party]);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        const method = party ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = party
            ? `http://localhost:5000/api/winning-parties/${party._id}`
            : 'http://localhost:5000/api/winning-parties';

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
        }
    };

    const renderSelect = (label, name, options, labelKey = 'name') => (
        <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
                <InputLabel>{label}</InputLabel>
                <FormControl fullWidth>
                    <Select name={name} value={formData[name]} onChange={handleChange}>
                        {options.map((option) => (
                            <MenuItem key={option._id} value={option._id}>
                                {option[labelKey]}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Stack>
        </Grid>
    );

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{party ? 'Edit Winning Party' : 'Add Winning Party'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    {renderSelect('Candidate', 'candidate_id', candidates)}
                    {renderSelect('Assembly', 'assembly_id', assemblies)}
                    {renderSelect('Parliament', 'parliament_id', parliaments)}
                    {renderSelect('Party', 'party_id', parties)}
                    {renderSelect('Year', 'year_id', years, 'year')}

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Votes</InputLabel>
                            <TextField name="votes" type="number" value={formData.votes} onChange={handleChange} fullWidth />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Margin</InputLabel>
                            <TextField name="margin" type="number" value={formData.margin} onChange={handleChange} fullWidth />
                        </Stack>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {party ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
