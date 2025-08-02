import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Box
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import JWTContext from 'contexts/JWTContext';

export default function PartyModal({
    open,
    modalToggler,
    party,
    users,
    refresh
}) {
    const contextValue = useContext(JWTContext);
    const { user } = contextValue || {};

    const [formData, setFormData] = useState({
        name: '',
        abbreviation: '',
        symbol: '',
        founded_year: ''
    });
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (party) {
            setFormData({
                name: party.name || '',
                abbreviation: party.abbreviation || '',
                symbol: party.symbol || '',
                founded_year: party.founded_year || ''
            });
        } else {
            setFormData({
                name: '',
                abbreviation: '',
                symbol: '',
                founded_year: ''
            });
        }
    }, [party]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        
        // Validation
        if (!formData.name || !formData.abbreviation) {
            return;
        }

        const method = party ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = party
            ? `http://localhost:5000/api/parties/${party._id}`
            : 'http://localhost:5000/api/parties';

        // Get user ID from context or localStorage
        let userId = user?._id || user?.id;
        if (!userId) {
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                userId = localUser._id || localUser.id;
            } catch (e) {
                console.error('Failed to parse localStorage user:', e);
            }
        }

        const userTracking = party ? { updated_by: userId } : { created_by: userId };
        const submitData = {
            ...formData,
            ...userTracking
        };

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });

            if (res.ok) {
                modalToggler(false);
                refresh();
            } else {
                const errorData = await res.json();
                console.error('Failed to submit party:', errorData);
                alert('Failed to save party. Please check the form data.');
            }
        } catch (error) {
            console.error('Error submitting party:', error);
            alert('An error occurred while saving the party.');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="sm">
            <DialogTitle>{party ? 'Edit Party' : 'Add Party'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel required>Party Name</InputLabel>
                            <TextField
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.name}
                                helperText={submitted && !formData.name ? 'Party name is required' : ''}
                                placeholder="Enter party name"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Abbreviation</InputLabel>
                            <TextField
                                name="abbreviation"
                                value={formData.abbreviation}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.abbreviation}
                                helperText={submitted && !formData.abbreviation ? 'Abbreviation is required' : ''}
                                placeholder="Enter party abbreviation"
                                inputProps={{ style: { textTransform: 'uppercase' } }}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Founded Year</InputLabel>
                            <TextField
                                name="founded_year"
                                value={formData.founded_year}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                placeholder="Enter founding year"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel>Symbol</InputLabel>
                            <TextField
                                name="symbol"
                                value={formData.symbol}
                                onChange={handleChange}
                                fullWidth
                                placeholder="Enter party symbol"
                            />
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