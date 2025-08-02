import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    Switch, FormControlLabel, Chip, Box
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import JWTContext from 'contexts/JWTContext';

export default function DivisionModal({
    open,
    modalToggler,
    division,
    states,
    refresh
}) {
    const contextValue = useContext(JWTContext);
    const { user } = contextValue || {};

    const [formData, setFormData] = useState({
        name: '',
        division_code: '',
        state_id: '',
        is_active: true
    });
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (division) {
            setFormData({
                name: division.name || '',
                division_code: division.division_code || '',
                state_id: division.state_id?._id?.toString() || division.state_id?.toString() || '',
                is_active: division.is_active !== undefined ? division.is_active : true
            });
        } else {
            setFormData({
                name: '',
                division_code: '',
                state_id: '',
                is_active: true
            });
        }
    }, [division]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        // Validation
        const requiredFields = ['name', 'division_code', 'state_id'];
        for (const field of requiredFields) {
            if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
                return;
            }
        }

        const method = division ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = division
            ? `http://localhost:5000/api/divisions/${division._id}`
            : 'http://localhost:5000/api/divisions';

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

        // Temporary bypass for testing - remove in production
        if (!userId) {
            userId = "507f1f77bcf86cd799439022";
        }

        const userTracking = division ? { updated_by: userId } : { created_by: userId };
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
                console.error('Failed to submit division:', errorData);
                alert('Failed to save division. Please check the form data.');
            }
        } catch (error) {
            console.error('Error submitting division:', error);
            alert('An error occurred while saving the division.');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{division ? 'Edit Division' : 'Add Division'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    {/* Row 1: Name and Division Code */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Division Name</InputLabel>
                            <TextField
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.name}
                                helperText={submitted && !formData.name ? 'Division name is required' : ''}
                                placeholder="Enter division name"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Division Code</InputLabel>
                            <TextField
                                name="division_code"
                                value={formData.division_code}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.division_code}
                                helperText={submitted && !formData.division_code ? 'Division code is required' : ''}
                                placeholder="Enter division code"
                                inputProps={{ style: { textTransform: 'uppercase' } }}
                            />
                        </Stack>
                    </Grid>

                    {/* Row 2: State */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>State</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.state_id}>
                                <Select
                                    name="state_id"
                                    value={formData.state_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <MenuItem value="">Select State</MenuItem>
                                    {states?.map((state) => (
                                        <MenuItem key={state._id} value={state._id}>
                                            {state.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.state_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>State is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControlLabel
                            control={
                                <Switch
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                />
                            }
                            label="Active"
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {division ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}