import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Grid, Stack, TextField, InputLabel, Select,
    MenuItem, FormControl, FormHelperText, Alert,
    CircularProgress, Typography, Avatar
} from '@mui/material';
import { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Helper components
const FormSelect = ({
    label,
    name,
    value,
    options = [],
    onChange,
    error,
    disabled,
    labelKey = 'name',
    required = false
}) => (
    <Stack spacing={1}>
        <InputLabel required={required}>{label}</InputLabel>
        <FormControl fullWidth error={!!error} disabled={disabled}>
            <Select name={name} value={value} onChange={onChange}>
                <MenuItem value=""><em>Select {label}</em></MenuItem>
                {options.map((opt) => (
                    <MenuItem key={opt._id || opt} value={opt._id || opt}>
                        {opt[labelKey] || opt}
                    </MenuItem>
                ))}
            </Select>
            {error && <FormHelperText>{error}</FormHelperText>}
        </FormControl>
    </Stack>
);

const FormTextField = ({
    label,
    name,
    value,
    onChange,
    error,
    disabled,
    type = 'text',
    required = false
}) => (
    <Stack spacing={1}>
        <InputLabel required={required}>{label}</InputLabel>
        <TextField
            name={name}
            value={value}
            onChange={onChange}
            fullWidth
            type={type}
            error={!!error}
            helperText={error}
            disabled={disabled}
        />
    </Stack>
);

export default function CandidateModal({
    open,
    modalToggler,
    candidate,
    refresh
}) {
    const [formData, setFormData] = useState({
        name: '',
        caste: 'General',
        criminal_cases: 0,
        assets: '',
        liabilities: '',
        education: '',
        description: '',
        photo: '',
        is_active: true
    });
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');

    // Initialize form data when candidate prop changes
    useEffect(() => {
        if (candidate) {
            setFormData({
                name: candidate.name || '',
                caste: candidate.caste || 'General',
                criminal_cases: candidate.criminal_cases || 0,
                assets: candidate.assets || '',
                liabilities: candidate.liabilities || '',
                education: candidate.education || '',
                description: candidate.description || '',
                photo: candidate.photo || '',
                is_active: candidate.is_active !== undefined ? candidate.is_active : true
            });
            setPhotoPreview(candidate.photo || '');
        } else {
            setFormData({
                name: '',
                caste: 'General',
                criminal_cases: 0,
                assets: '',
                liabilities: '',
                education: '',
                description: '',
                photo: '',
                is_active: true
            });
            setPhotoPreview('');
        }
    }, [candidate]);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const validateField = (name, value) => {
        switch (name) {
            case 'name':
                return !value ? 'Name is required' : '';
            case 'caste':
                return !value ? 'Caste is required' : '';
            case 'criminal_cases':
                if (isNaN(value)) return 'Must be a number';
                if (parseInt(value) < 0) return 'Cannot be negative';
                return '';
            default:
                return '';
        }
    };

    const validateForm = () => {
        const newErrors = {};
        let isValid = true;

        ['name', 'caste', 'criminal_cases'].forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) {
                newErrors[field] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (submitError) setSubmitError('');
    };

    const handleDescriptionChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            description: value
        }));
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        setSubmitError('');

        try {
            // 1. Get authentication token
            const token = localStorage.getItem('serviceToken');
            if (!token) {
                throw new Error('Please login to continue');
            }

            // 3. Prepare form data
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('caste', formData.caste);
            formDataToSend.append('criminal_cases', formData.criminal_cases);
            if (formData.assets) formDataToSend.append('assets', formData.assets);
            if (formData.liabilities) formDataToSend.append('liabilities', formData.liabilities);
            if (formData.education) formDataToSend.append('education', formData.education);
            if (formData.description) formDataToSend.append('description', formData.description);
            if (photoFile) formDataToSend.append('photo', photoFile);

            // 4. Make the API request
            const url = candidate
                ? `${import.meta.env.VITE_APP_API_URL}/candidates/${candidate._id}`
                : `${import.meta.env.VITE_APP_API_URL}/candidates`;
            const method = candidate ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formDataToSend
            });

            let data = null;
            try {
                data = await res.json();
            } catch (jsonErr) {
                // If response is not JSON, ignore parsing error
                data = {};
            }

            if (!res.ok) {
                // Handle backend validation errors
                if (data && data.errors) {
                    const errorMessages = Object.values(data.errors).map(err => err.message);
                    throw new Error(errorMessages.join(', '));
                }
                throw new Error((data && (data.message || data.error)) || 'Failed to save candidate');
            }

            // Success case
            setSubmitError('');
            modalToggler(false);
            refresh();

        } catch (error) {
            console.error('Submission error:', error);
            setSubmitError(error.message || 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="sm">
            <DialogTitle>
                {candidate ? 'Edit Candidate' : 'Add New Candidate'}
            </DialogTitle>

            <DialogContent>
                {submitError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {submitError}
                    </Alert>
                )}

                <Grid container spacing={2} mt={1}>
                    <Grid item xs={12}>
                        <FormTextField
                            label="Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            error={errors.name}
                            disabled={isSubmitting}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormSelect
                            label="Caste"
                            name="caste"
                            value={formData.caste}
                            options={[
                                { _id: 'General', name: 'General' },
                                { _id: 'OBC', name: 'OBC' },
                                { _id: 'SC', name: 'SC' },
                                { _id: 'ST', name: 'ST' },
                                { _id: 'Other', name: 'Other' }
                            ]}
                            onChange={handleChange}
                            error={errors.caste}
                            disabled={isSubmitting}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormTextField
                            label="Criminal Cases"
                            name="criminal_cases"
                            value={formData.criminal_cases}
                            onChange={handleChange}
                            error={errors.criminal_cases}
                            disabled={isSubmitting}
                            type="number"
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <FormTextField
                            label="Education"
                            name="education"
                            value={formData.education}
                            onChange={handleChange}
                            error={errors.education}
                            disabled={isSubmitting}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormTextField
                            label="Assets"
                            name="assets"
                            value={formData.assets}
                            onChange={handleChange}
                            error={errors.assets}
                            disabled={isSubmitting}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormTextField
                            label="Liabilities"
                            name="liabilities"
                            value={formData.liabilities}
                            onChange={handleChange}
                            error={errors.liabilities}
                            disabled={isSubmitting}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel>Photo</InputLabel>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar
                                    src={photoPreview || '/default-avatar.png'}
                                    alt="Candidate"
                                    sx={{ width: 60, height: 60 }}
                                />
                                <Button variant="outlined" component="label">
                                    Upload Photo
                                    <input
                                        type="file"
                                        hidden
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        disabled={isSubmitting}
                                    />
                                </Button>
                            </Stack>
                        </Stack>
                    </Grid>
                </Grid>
                <Grid item xs={12}>
                    <Stack spacing={1}>
                        <InputLabel>Description</InputLabel>
                        <ReactQuill
                            value={formData.description}
                            onChange={handleDescriptionChange}
                            theme="snow"
                            placeholder="Enter candidate description..."
                        />
                    </Stack>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                >
                    {isSubmitting ? 'Saving...' : (candidate ? 'Update' : 'Submit')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
