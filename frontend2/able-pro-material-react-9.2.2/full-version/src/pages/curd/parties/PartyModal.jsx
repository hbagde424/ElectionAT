// PartyModal.jsx
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel
} from '@mui/material';
import { useEffect, useState } from 'react';

export default function PartyModal({ open, modalToggler, party, refresh }) {
    const [formData, setFormData] = useState({
        name: '',
        abbreviation: '',
        symbol: '',
        founded_year: ''
    });

    useEffect(() => {
        if (party) {
            setFormData({
                name: party.name || '',
                abbreviation: party.abbreviation || '',
                symbol: party.symbol || '',
                founded_year: party.founded_year || ''
            });
        } else {
            setFormData({ name: '', abbreviation: '', symbol: '', founded_year: '' });
        }
    }, [party]);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        const method = party ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = party
            ? `http://localhost:5000/api/parties/${party._id}`
            : 'http://localhost:5000/api/parties';

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

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="sm">
            <DialogTitle>{party ? 'Edit Party' : 'Add Party'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    {[['Party Name', 'name'], ['Abbreviation', 'abbreviation'], ['Symbol', 'symbol'], ['Founded Year', 'founded_year']].map(([label, name]) => (
                        <Grid item xs={12} key={name}>
                            <Stack spacing={1}>
                                <InputLabel>{label}</InputLabel>
                                <TextField name={name} value={formData[name]} onChange={handleChange} fullWidth />
                            </Stack>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>{party ? 'Update' : 'Submit'}</Button>
            </DialogActions>
        </Dialog>
    );
}
