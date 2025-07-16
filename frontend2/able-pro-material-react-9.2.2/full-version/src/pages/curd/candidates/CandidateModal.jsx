import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    FormHelperText, Alert, CircularProgress, Avatar, Box, Typography
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
        parliament_id: '',
        state_id: '',
        division_id: '',
        election_year: '',
        caste: '',
        criminal_cases: '',
        assets: '',
        liabilities: '',
        education: '',
        photo: '',
        is_active: true
    });

    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState('');

    // Use props instead of fetching data
    // With these more defensive checks:
    const partiesList = Array.isArray(parties) ? parties : [];
    const assembliesList = Array.isArray(assemblies) ? assemblies : [];
    const electionYearsList = Array.isArray(electionYears) ? electionYears : [];
    const parliamentsList = Array.isArray(parliaments) ? parliaments : [];
    const statesList = Array.isArray(states) ? states : [];
    const divisionsList = Array.isArray(divisions) ? divisions : [];
    console.log('electionYears:', electionYears, 'electionYearsList:', electionYearsList);
    // Caste options
    const casteOptions = ['General', 'OBC', 'SC', 'ST', 'Other'];

    useEffect(() => {
        if (candidate) {
            setFormData({
                name: candidate.name || '',
                party_id: candidate.party_id?._id || candidate.party_id || '',
                assembly_id: candidate.assembly_id?._id || candidate.assembly_id || '',
                parliament_id: candidate.parliament_id?._id || candidate.parliament_id || '',
                state_id: candidate.state_id?._id || candidate.state_id || '',
                division_id: candidate.division_id?._id || candidate.division_id || '',
                election_year: candidate.election_year?._id || candidate.election_year || '',
                caste: candidate.caste || '',
                criminal_cases: candidate.criminal_cases || '',
                assets: candidate.assets || '',
                liabilities: candidate.liabilities || '',
                education: candidate.education || '',
                photo: candidate.photo || '',
                is_active: candidate.is_active ?? true
            });
            setImagePreview(candidate.photo || '');
        } else {
            setFormData({
                name: '',
                party_id: '',
                assembly_id: '',
                parliament_id: '',
                state_id: '',
                division_id: '',
                election_year: '',
                caste: '',
                criminal_cases: '',
                assets: '',
                liabilities: '',
                education: '',
                photo: '',
                is_active: true
            });
            setImagePreview('');
        }
        setErrors({});
        setSubmitError('');
    }, [candidate, open]);

    // Validate individual field
    const validateField = (name, value) => {
        switch (name) {
            case 'name':
                if (!value || value.trim().length === 0) return 'Name is required';
                if (value.trim().length < 2) return 'Name must be at least 2 characters';
                if (value.trim().length > 100) return 'Name cannot exceed 100 characters';
                if (!/^[a-zA-Z\s]+$/.test(value.trim())) return 'Name can only contain letters and spaces';
                break;
            case 'party_id':
                if (!value) return 'Party selection is required';
                break;
            case 'assembly_id':
                if (!value) return 'Assembly selection is required';
                break;
            case 'parliament_id':
                if (!value) return 'Parliament selection is required';
                break;
            case 'state_id':
                if (!value) return 'State selection is required';
                break;
            case 'division_id':
                if (!value) return 'Division selection is required';
                break;
            case 'election_year':
                if (!value) return 'Election year selection is required';
                break;
            case 'caste':
                if (!value) return 'Caste selection is required';
                if (!casteOptions.includes(value)) return 'Please select a valid caste';
                break;
            case 'criminal_cases':
                if (value && isNaN(value)) return 'Criminal cases must be a number';
                if (value && parseInt(value) < 0) return 'Criminal cases cannot be negative';
                if (value && parseInt(value) > 100) return 'Criminal cases value seems unrealistic';
                break;
            case 'assets':
                if (value && value.trim().length > 500) return 'Assets description cannot exceed 500 characters';
                break;
            case 'liabilities':
                if (value && value.trim().length > 500) return 'Liabilities description cannot exceed 500 characters';
                break;
            case 'education':
                if (value && value.trim().length > 200) return 'Education description cannot exceed 200 characters';
                break;
            case 'photo':
                if (value && value.trim().length > 0) {
                    const urlPattern = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
                    if (!urlPattern.test(value.trim())) {
                        return 'Please enter a valid URL (must start with http://, https://, or ftp://)';
                    }
                }
                break;
            default:
                break;
        }
        return '';
    };

    // Validate entire form
    const validateForm = () => {
        const newErrors = {};
        const requiredFields = ['name', 'party_id', 'assembly_id', 'parliament_id', 'state_id', 'division_id', 'election_year', 'caste'];

        requiredFields.forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) newErrors[field] = error;
        });

        // Validate optional fields
        ['criminal_cases', 'assets', 'liabilities', 'education', 'photo'].forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) newErrors[field] = error;
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (submitError) setSubmitError('');

        setFormData(prev => ({ ...prev, [name]: value }));

        // Update image preview for photo field
        if (name === 'photo') {
            setImagePreview(value);
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');

        try {
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

            const data = await res.json();

            if (res.ok) {
                modalToggler(false);
                refresh();
            } else {
                // Handle server-side validation errors
                if (data.errors) {
                    const serverErrors = {};
                    Object.keys(data.errors).forEach(key => {
                        serverErrors[key] = data.errors[key].message;
                    });
                    setErrors(serverErrors);
                } else if (data.message) {
                    setSubmitError(data.message);
                } else {
                    setSubmitError('An error occurred while saving the candidate');
                }
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setSubmitError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderTextField = (label, name, type = 'text', required = false) => (
        <Grid item xs={12} sm={6} key={name}>
            <Stack spacing={1}>
                <InputLabel required={required}>{label}</InputLabel>
                <TextField
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    fullWidth
                    type={type}
                    error={!!errors[name]}
                    helperText={errors[name]}
                    disabled={isSubmitting}
                />
            </Stack>
        </Grid>
    );

    const renderSelect = (label, name, options, labelKey = 'name', required = false) => (
        <Grid item xs={12} sm={6} key={name}>
            <Stack spacing={1}>
                <InputLabel required={required}>{label}</InputLabel>
                <FormControl fullWidth error={!!errors[name]} disabled={isSubmitting}>
                    <Select name={name} value={formData[name]} onChange={handleChange}>
                        <MenuItem value="">
                            <em>Select {label}</em>
                        </MenuItem>
                        {options.map((opt) => (
                            <MenuItem key={opt._id} value={opt._id}>
                                {opt[labelKey] || 'Unknown'}
                            </MenuItem>
                        ))}
                    </Select>
                    {errors[name] && <FormHelperText>{errors[name]}</FormHelperText>}
                </FormControl>
            </Stack>
        </Grid>
    );

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{candidate ? 'Edit Candidate' : 'Add Candidate'}</DialogTitle>
            <DialogContent>
                {submitError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {submitError}
                    </Alert>
                )}

                <Grid container spacing={2} mt={1}>
                    {renderTextField('Name', 'name', 'text', true)}
                    {renderSelect('Party', 'party_id', partiesList, 'name', true)}
                    {renderSelect('State', 'state_id', statesList, 'name', true)}
                    {renderSelect('Division', 'division_id', divisionsList, 'name', true)}
                    {renderSelect('Parliament', 'parliament_id', parliamentsList, 'name', true)}
                    {renderSelect('Assembly', 'assembly_id', assembliesList, 'name', true)}

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Election Year</InputLabel>
                            <FormControl fullWidth error={!!errors.election_year} disabled={isSubmitting}>
                                <Select
                                    name="election_year"
                                    value={formData.election_year}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="">
                                        <em>Select Election Year</em>
                                    </MenuItem>
                                    {electionYearsList.map((opt) => (
                                        <MenuItem key={opt._id} value={opt._id}>
                                            {`${opt.year} (${opt.election_type})`}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.election_year && <FormHelperText>{errors.election_year}</FormHelperText>}
                            </FormControl>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Caste</InputLabel>
                            <FormControl fullWidth error={!!errors.caste} disabled={isSubmitting}>
                                <Select name="caste" value={formData.caste} onChange={handleChange}>
                                    <MenuItem value="">
                                        <em>Select Caste</em>
                                    </MenuItem>
                                    {casteOptions.map((caste) => (
                                        <MenuItem key={caste} value={caste}>
                                            {caste}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.caste && <FormHelperText>{errors.caste}</FormHelperText>}
                            </FormControl>
                        </Stack>
                    </Grid>

                    {renderTextField('Criminal Cases', 'criminal_cases', 'number')}
                    {renderTextField('Assets', 'assets')}
                    {renderTextField('Liabilities', 'liabilities')}
                    {renderTextField('Education', 'education')}

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Photo URL</InputLabel>
                            <TextField
                                name="photo"
                                value={formData.photo}
                                onChange={handleChange}
                                fullWidth
                                placeholder="https://example.com/photo.jpg"
                                error={!!errors.photo}
                                helperText={errors.photo || 'Enter a valid image URL'}
                                disabled={isSubmitting}
                            />
                        </Stack>
                    </Grid>

                    {imagePreview && (
                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel>Image Preview</InputLabel>
                                <Box display="flex" justifyContent="center">
                                    <Avatar
                                        src={imagePreview}
                                        alt="Candidate"
                                        sx={{ width: 80, height: 80 }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                </Box>
                                <Typography variant="caption" color="textSecondary" textAlign="center">
                                    Image preview (if URL is valid)
                                </Typography>
                            </Stack>
                        </Grid>
                    )}
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