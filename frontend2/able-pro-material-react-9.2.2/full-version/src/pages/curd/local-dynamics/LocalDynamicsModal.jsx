// LocalDynamicsModal.jsx
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel
} from '@mui/material';
import { useEffect, useState } from 'react';

export default function LocalDynamicsModal({ open, modalToggler, localDynamics, refresh }) {
    const [formData, setFormData] = useState({
        booth_id: '',
        dominant_caste: '',
        known_issues: '',
        local_leader: '',
        grassroots_orgs: ''
    });

    useEffect(() => {
        if (localDynamics) {
            setFormData({
                booth_id: localDynamics.booth_id || '',
                dominant_caste: localDynamics.dominant_caste || '',
                known_issues: localDynamics.known_issues || '',
                local_leader: localDynamics.local_leader || '',
                grassroots_orgs: localDynamics.grassroots_orgs || ''
            });
        } else {
            setFormData({
                booth_id: '',
                dominant_caste: '',
                known_issues: '',
                local_leader: '',
                grassroots_orgs: ''
            });
        }
    }, [localDynamics]);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        const method = localDynamics ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = localDynamics
            ? `http://localhost:5000/api/local-dynamics/${localDynamics._id}`
            : 'http://localhost:5000/api/local-dynamics';

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

    const formFields = [
        { label: 'Booth ID', name: 'booth_id', type: 'text' },
        { label: 'Dominant Caste', name: 'dominant_caste', type: 'text' },
        { label: 'Local Leader', name: 'local_leader', type: 'text' },
        { label: 'Known Issues', name: 'known_issues', type: 'text', multiline: true, rows: 3 },
        { label: 'Grassroots Organizations', name: 'grassroots_orgs', type: 'text', multiline: true, rows: 3 }
    ];

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{localDynamics ? 'Edit Local Dynamics' : 'Add Local Dynamics'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    {formFields.map(({ label, name, type, multiline, rows }) => (
                        <Grid item xs={12} sm={multiline ? 12 : 6} key={name}>
                            <Stack spacing={1}>
                                <InputLabel>{label}</InputLabel>
                                <TextField
                                    name={name}
                                    type={type}
                                    value={formData[name]}
                                    onChange={handleChange}
                                    fullWidth
                                    multiline={multiline}
                                    rows={rows}
                                />
                            </Stack>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {localDynamics ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
