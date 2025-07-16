import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import JWTContext from 'contexts/JWTContext';

export default function ElectionYearModal({
    open,
    modalToggler,
    electionYear,
    refresh
}) {
    const contextValue = useContext(JWTContext);
    const { user } = contextValue || {};

    const [formData, setFormData] = useState({
        year: '',
        election_type: ''
    });
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (electionYear) {
            setFormData({
                year: electionYear.year || '',
                election_type: electionYear.election_type || ''
            });
        } else {
            setFormData({
                year: '',
                election_type: ''
            });
        }
    }, [electionYear]);

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
        if (!formData.year || !formData.election_type) {
            return;
        }

        const method = electionYear ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = electionYear
            ? `http://localhost:5000/api/election-years/${electionYear._id}`
            : 'http://localhost:5000/api/election-years';

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

        const userTracking = electionYear ? { updated_by: userId } : { created_by: userId };
        const submitData = {
            ...formData,
            ...userTracking,
            year: parseInt(formData.year)
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
                console.error('Failed to submit election year:', errorData);
                alert('Failed to save election year. Please check the form data.');
            }
        } catch (error) {
            console.error('Error submitting election year:', error);
            alert('An error occurred while saving the election year.');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="sm">
            <DialogTitle>{electionYear ? 'Edit Election Year' : 'Add Election Year'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    {/* Year */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Year</InputLabel>
                            <TextField
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                fullWidth
                                required
                                type="number"
                                inputProps={{ min: 1900, max: 2100 }}
                                error={submitted && !formData.year}
                                helperText={submitted && !formData.year ? 'Year is required' : ''}
                                placeholder="Enter year (e.g. 2024)"
                            />
                        </Stack>
                    </Grid>

                    {/* Election Type */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Election Type</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.election_type}>
                                <Select
                                    name="election_type"
                                    value={formData.election_type}
                                    onChange={handleChange}
                                    required
                                >
                                    <MenuItem value="">Select Election Type</MenuItem>
                                    <MenuItem value="Assembly">Assembly</MenuItem>
                                    <MenuItem value="Parliament">Parliament</MenuItem>
                                </Select>
                            </FormControl>
                            {submitted && !formData.election_type && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Election type is required</Box>
                            )}
                        </Stack>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {electionYear ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}