import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    TextField,
    InputLabel,
    Select,
    MenuItem,
    FormControl,
    Switch,
    FormControlLabel,
    Grid,
    FormHelperText,
    Alert
} from '@mui/material';
import { useEffect, useState } from 'react';

export default function DivisionModal({
    open,
    modalToggler,
    division,
    states,
    refresh
}) {
    const [formData, setFormData] = useState({
        name: '',
        division_code: '',
        state_id: '',
        is_active: true
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const validateField = (name, value) => {
        switch (name) {
            case 'name':
                if (!value || value.trim().length === 0) {
                    return 'Division name is required';
                }
                if (value.trim().length < 2) {
                    return 'Division name must be at least 2 characters long';
                }
                if (value.trim().length > 100) {
                    return 'Division name must not exceed 100 characters';
                }
                if (!/^[a-zA-Z0-9\s\-\.]+$/.test(value.trim())) {
                    return 'Division name can only contain letters, numbers, spaces, hyphens, and dots';
                }
                break;
            case 'division_code':
                if (!value) {
                    return 'Division code is required';
                }
                if (value.length > 20) {
                    return 'Division code must not exceed 20 characters';
                }
                if (!/^[A-Z0-9]+$/.test(value)) {
                    return 'Division code must be uppercase alphanumeric';
                }
                break;
            case 'state_id':
                if (!value) {
                    return 'State selection is required';
                }
                break;
            default:
                break;
        }
        return '';
    };

    const validateForm = () => {
        const newErrors = {};

        Object.keys(formData).forEach(key => {
            if (key !== 'is_active') {
                const error = validateField(key, formData[key]);
                if (error) {
                    newErrors[key] = error;
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        setErrors({});
        setSubmitError('');
        setIsSubmitting(false);

        if (division) {
            setFormData({
                name: division.name || '',
                division_code: division.division_code || '',
                state_id: division.state_id?._id || '',
                is_active: division.is_active || true
            });
        } else {
            setFormData({
                name: '',
                division_code: '',
                state_id: '',
                is_active: true
            });
        }
    }, [division, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        if (submitError) {
            setSubmitError('');
        }

        setFormData(prev => ({
            ...prev,
            [name]: name === 'division_code' ? value.toUpperCase() : value
        }));
    };

    const handleStatusChange = (e) => {
        setFormData(prev => ({ ...prev, is_active: e.target.checked }));
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');

        try {
            const method = division ? 'PUT' : 'POST';
            const token = localStorage.getItem('serviceToken');
            const user = JSON.parse(localStorage.getItem('user'));
            const url = division
                ? `http://localhost:5000/api/divisions/${division._id}`
                : 'http://localhost:5000/api/divisions';

            // Prepare the data to send
            const dataToSend = {
                name: formData.name.trim(),
                division_code: formData.division_code,
                state_id: formData.state_id,
                is_active: formData.is_active,
                updated_by: user._id
            };

            // Only include created_by for new records
            if (!division) {
                dataToSend.created_by = user._id;
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(dataToSend)
            });

            if (res.ok) {
                modalToggler(false);
                refresh();
            } else {
                const errorData = await res.json();
                if (res.status === 400 && errorData.errors) {
                    const serverErrors = {};
                    errorData.errors.forEach(error => {
                        if (error.path) {
                            serverErrors[error.path] = error.msg;
                        }
                    });
                    setErrors(serverErrors);
                } else {
                    setSubmitError(errorData.message || 'Failed to save division. Please try again.');
                }
            }
        } catch (error) {
            console.error('Error saving division:', error);
            setSubmitError('Network error. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{division ? 'Edit Division' : 'Add Division'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} mt={2}>
                    {submitError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {submitError}
                        </Alert>
                    )}

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Division Name *</InputLabel>
                                <TextField
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    error={!!errors.name}
                                    helperText={errors.name}
                                    inputProps={{ maxLength: 100 }}
                                />
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Division Code *</InputLabel>
                                <TextField
                                    name="division_code"
                                    value={formData.division_code}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    error={!!errors.division_code}
                                    helperText={errors.division_code}
                                    inputProps={{ maxLength: 20 }}
                                />
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Stack spacing={1}>
                                <InputLabel>State *</InputLabel>
                                <FormControl fullWidth error={!!errors.state_id}>
                                    <Select
                                        name="state_id"
                                        value={formData.state_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <MenuItem value="">Select State</MenuItem>
                                        {states.map((state) => (
                                            <MenuItem key={state._id} value={state._id}>
                                                {state.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.state_id && (
                                        <FormHelperText>{errors.state_id}</FormHelperText>
                                    )}
                                </FormControl>
                            </Stack>
                        </Grid>
                    </Grid>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.is_active}
                                onChange={handleStatusChange}
                                color="success"
                            />
                        }
                        label="Active Status"
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={() => modalToggler(false)}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : (division ? 'Update' : 'Submit')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}