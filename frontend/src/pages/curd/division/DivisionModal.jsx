import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    Switch, FormControlLabel, Chip, Box
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import JWTContext from 'contexts/JWTContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
        is_active: true,
        description: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [serverError, setServerError] = useState('');

    useEffect(() => {
        if (division) {
            setFormData({
                name: division.name || '',
                division_code: division.division_code || '',
                state_id: division.state_id?._id?.toString() || division.state_id?.toString() || '',
                is_active: division.is_active !== undefined ? division.is_active : true,
                description: division.description || ''
            });
        } else {
            setFormData({
                name: '',
                division_code: '',
                state_id: '',
                is_active: true,
                description: ''
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

    const handleDescriptionChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            description: value
        }));
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        setServerError('');
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
            ? `${import.meta.env.VITE_APP_API_URL}/divisions/${division._id}`
            : `${import.meta.env.VITE_APP_API_URL}/divisions`;

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
                let errorMsg = 'Failed to save division. Please check the form data.';
                try {
                    const errorData = await res.json();
                    errorMsg = errorData?.message || JSON.stringify(errorData) || errorMsg;
                    setServerError(errorMsg);
                } catch (e) {
                    // ignore JSON parse error
                }
                setServerError(errorMsg);
                console.error('Failed to submit division:', errorMsg);
            }
        } catch (error) {
            console.error('Error submitting division:', error);
            setServerError('An error occurred while saving the division.');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{division ? 'Edit Division' : 'Add Division'}</DialogTitle>
            <DialogContent>
                {serverError && (
                    <div style={{ color: 'red', marginBottom: 12, fontWeight: 500 }}>
                        {/* Show only the error message if it's a JSON string */}
                        {(() => {
                            try {
                                const errObj = JSON.parse(serverError);
                                return errObj.error || serverError;
                            } catch {
                                return serverError;
                            }
                        })()}
                    </div>
                )}
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

                    {/* Row 3: Description */}
                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel>Description</InputLabel>
                            <ReactQuill
                                value={formData.description}
                                onChange={handleDescriptionChange}
                                theme="snow"
                                placeholder="Enter description..."
                            />
                        </Stack>
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
