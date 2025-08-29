import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Switch, FormControlLabel
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import JWTContext from 'contexts/JWTContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function StateModal({
    open,
    modalToggler,
    state,
    refresh
}) {
    const contextValue = useContext(JWTContext);
    const { user } = contextValue || {};

    const [formData, setFormData] = useState({
        name: '',
        is_active: true,
        description: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [serverError, setServerError] = useState('');

    useEffect(() => {
        if (state) {
            setFormData({
                name: state.name || '',
                is_active: state.is_active !== undefined ? state.is_active : true,
                description: state.description || ''
            });
        } else {
            setFormData({
                name: '',
                is_active: true,
                description: ''
            });
        }
    }, [state]);

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
        if (!formData.name || formData.name.trim() === '') {
            return;
        }
        setServerError('');
        if (!formData.name || formData.name.trim() === '') {
            return;
        }
        const url = state
            ? `${import.meta.env.VITE_APP_API_URL}/states/${state._id}`
            : `${import.meta.env.VITE_APP_API_URL}/states`;


        const method = state ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');

        let userId = user?._id || user?.id;
        if (!userId) {
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                userId = localUser._id || localUser.id;
            } catch (e) {
                console.error('Failed to parse localStorage user:', e);
            }
        }

        const userTracking = state ? { updated_by: userId } : { created_by: userId };
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
                setServerError(errorData.message || 'Failed to save state.');
                console.error('Failed to submit state:', errorData);
                //  alert('Failed to save state. Please check the form data.');
            }
        } catch (error) {
            console.error('Error submitting state:', error);
            // alert('An error occurred while saving the state.');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="sm">
            <DialogTitle>{state ? 'Edit State' : 'Add State'}</DialogTitle>
            <DialogContent>
                {serverError && (
                    <div style={{ color: 'red', marginBottom: 12, fontWeight: 500 }}>
                        {serverError}
                    </div>
                )}
                <Grid container spacing={2} mt={1}>
                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel required>State Name</InputLabel>
                            <TextField
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.name}
                                helperText={submitted && !formData.name ? 'State name is required' : ''}
                                placeholder="Enter state name"
                            />
                        </Stack>
                    </Grid>

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

                    <Grid item xs={12}>
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
                    {state ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
