import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl
} from '@mui/material';
import { useEffect, useState } from 'react';

export default function CandidateModal({
    open,
    modalToggler,
    candidate,
    states,
    divisions,
    parliaments,
    assemblies,
    parties,
    electionYears,
    users,
    refresh
}) {
    const [formData, setFormData] = useState({
        name: '',
        party_id: '',
        assembly_id: '',
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

    // Use props instead of fetching data
    const partiesList = parties || [];
    const assembliesList = assemblies || [];
    const electionYearsList = electionYears || [];
    const parliamentsList = parliaments || [];



    useEffect(() => {
        if (candidate) {
            setFormData({
                name: candidate.name || '',
                party_id: candidate.party_id?._id || candidate.party_id || '',
                assembly_id: candidate.assembly_id?._id || candidate.assembly_id || '',
                parliament_id: candidate.parliament_id?._id || candidate.parliament_id || '',
                election_year: candidate.election_year?._id || candidate.election_year || '',
                caste: candidate.caste || '',
                votes: candidate.votes || '',
                criminal_cases: candidate.criminal_cases || '',
                assets: candidate.assets || '',
                liabilities: candidate.liabilities || '',
                education: candidate.education || '',
                photo: candidate.photo || '',
                is_active: candidate.is_active ?? true
            });


        } else {
            setFormData({
                name: '',
                party_id: '',
                assembly_id: '',
                election_year: '',
                parliament_id: '',
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

    const renderTextField = (label, name) => (
        <Grid item xs={12} sm={6} key={name}>
            <Stack spacing={1}>
                <InputLabel>{label}</InputLabel>
                <TextField name={name} value={formData[name]} onChange={handleChange} fullWidth />
            </Stack>
        </Grid>
    );

    const renderSelect = (label, name, options, labelKey = 'name') => (
        <Grid item xs={12} sm={6} key={name}>
            <Stack spacing={1}>
                <InputLabel>{label}</InputLabel>
                <FormControl fullWidth>
                    <Select name={name} value={formData[name]} onChange={handleChange}>
                        {options.map((opt) => (
                            <MenuItem key={opt._id} value={opt._id}>
                                {opt[labelKey] || 'Unknown'}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Stack>
        </Grid>
    );

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{candidate ? 'Edit Candidate' : 'Add Candidate'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    {[
                        ['Name', 'name'],
                        ['Caste', 'caste'],
                        ['Votes', 'votes'],
                        ['Criminal Cases', 'criminal_cases'],
                        ['Assets', 'assets'],
                        ['Liabilities', 'liabilities'],
                        ['Education', 'education'],
                        ['Photo URL', 'photo']
                    ].map(([label, name]) => renderTextField(label, name))}

                    {renderSelect('Party', 'party_id', partiesList)}
                    {renderSelect('Assembly', 'assembly_id', assembliesList)}
                    {renderSelect('Parliament', 'parliament_id', parliamentsList)}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Election Year</InputLabel>
                            <FormControl fullWidth>
                                <Select
                                    name="election_year"
                                    value={formData.election_year}
                                    onChange={handleChange}
                                >
                                    {electionYearsList.map((opt) => (
                                        <MenuItem key={opt._id} value={opt._id}>
                                            {`${opt.year} (${opt.election_type})`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {candidate ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
