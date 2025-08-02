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
    FormHelperText,
    Alert,
    CircularProgress,
    Grid
} from '@mui/material';
import { useEffect, useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export default function BoothSurveyModal({
    open,
    modalToggler,
    survey,
    booths,
    users,
    states,
    divisions,
    parliaments,
    assemblies,
    blocks,
    refresh
}) {
    const [formData, setFormData] = useState({
        booth_id: '',
        survey_done_by: '',
        survey_date: new Date(),
        status: 'Pending',
        remark: '',
        poll_result: '',
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: ''
    });

    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filtered data based on hierarchy
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    // Status options
    const statusOptions = ['Pending', 'In Progress', 'Completed', 'Verified', 'Rejected'];

    useEffect(() => {
        if (survey) {
            setFormData({
                booth_id: survey.booth_id?._id || '',
                survey_done_by: survey.survey_done_by?._id || '',
                survey_date: new Date(survey.survey_date) || new Date(),
                status: survey.status || 'Pending',
                remark: survey.remark || '',
                poll_result: survey.poll_result || '',
                state_id: survey.state_id?._id || '',
                division_id: survey.division_id?._id || '',
                parliament_id: survey.parliament_id?._id || '',
                assembly_id: survey.assembly_id?._id || '',
                block_id: survey.block_id?._id || ''
            });
        } else {
            setFormData({
                booth_id: '',
                survey_done_by: '',
                survey_date: new Date(),
                status: 'Pending',
                remark: '',
                poll_result: '',
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: ''
            });
        }
        setErrors({});
        setSubmitError('');
    }, [survey, open]);

    // Filter divisions by state
    useEffect(() => {
        if (formData.state_id) {
            const filtered = divisions.filter(div => div.state_id?._id === formData.state_id);
            setFilteredDivisions(filtered);
        } else {
            setFilteredDivisions([]);
            setFormData(prev => ({
                ...prev,
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.state_id, divisions]);

    // Filter parliaments by division
    useEffect(() => {
        if (formData.division_id) {
            const filtered = parliaments.filter(par => par.division_id?._id === formData.division_id);
            setFilteredParliaments(filtered);
        } else {
            setFilteredParliaments([]);
            setFormData(prev => ({
                ...prev,
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.division_id, parliaments]);

    // Filter assemblies by parliament
    useEffect(() => {
        if (formData.parliament_id) {
            const filtered = assemblies.filter(asm => asm.parliament_id?._id === formData.parliament_id);
            setFilteredAssemblies(filtered);
        } else {
            setFilteredAssemblies([]);
            setFormData(prev => ({
                ...prev,
                assembly_id: '',
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.parliament_id, assemblies]);

    // Filter blocks by assembly
    useEffect(() => {
        if (formData.assembly_id) {
            const filtered = blocks.filter(blk => blk.assembly_id?._id === formData.assembly_id);
            setFilteredBlocks(filtered);
        } else {
            setFilteredBlocks([]);
            setFormData(prev => ({
                ...prev,
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.assembly_id, blocks]);

    // Filter booths by block
    useEffect(() => {
        if (formData.block_id) {
            const filtered = booths.filter(booth => booth.block_id?._id === formData.block_id);
            setFilteredBooths(filtered);
        } else {
            setFilteredBooths([]);
            setFormData(prev => ({
                ...prev,
                booth_id: ''
            }));
        }
    }, [formData.block_id, booths]);

    // Validate individual field
    const validateField = (name, value) => {
        switch (name) {
            case 'booth_id':
                if (!value) return 'Booth selection is required';
                break;
            case 'survey_done_by':
                if (!value) return 'Surveyor selection is required';
                break;
            case 'state_id':
                if (!value) return 'State selection is required';
                break;
            case 'division_id':
                if (!value) return 'Division selection is required';
                break;
            case 'parliament_id':
                if (!value) return 'Parliament selection is required';
                break;
            case 'assembly_id':
                if (!value) return 'Assembly selection is required';
                break;
            case 'block_id':
                if (!value) return 'Block selection is required';
                break;
            case 'status':
                if (!value) return 'Status selection is required';
                break;
            case 'remark':
                if (value && value.trim().length > 500) return 'Remarks cannot exceed 500 characters';
                break;
            case 'poll_result':
                if (value && value.trim().length > 200) return 'Poll result cannot exceed 200 characters';
                break;
            default:
                break;
        }
        return '';
    };

    // Validate entire form
    const validateForm = () => {
        const newErrors = {};
        const requiredFields = ['booth_id', 'survey_done_by', 'state_id', 'division_id', 'parliament_id', 'assembly_id', 'block_id', 'status'];

        requiredFields.forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) newErrors[field] = error;
        });

        // Validate optional fields
        ['remark', 'poll_result'].forEach(field => {
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

        setFormData(prev => {
            // Handle cascading resets
            if (name === 'state_id') {
                return {
                    ...prev,
                    [name]: value,
                    division_id: '',
                    parliament_id: '',
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                };
            }
            if (name === 'division_id') {
                return {
                    ...prev,
                    [name]: value,
                    parliament_id: '',
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                };
            }
            if (name === 'parliament_id') {
                return {
                    ...prev,
                    [name]: value,
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                };
            }
            if (name === 'assembly_id') {
                return {
                    ...prev,
                    [name]: value,
                    block_id: '',
                    booth_id: ''
                };
            }
            if (name === 'block_id') {
                return {
                    ...prev,
                    [name]: value,
                    booth_id: ''
                };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, survey_date: date }));
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');

        try {
            const method = survey ? 'PUT' : 'POST';
            const token = localStorage.getItem('serviceToken');
            const url = survey
                ? `http://localhost:5000/api/booth-surveys/${survey._id}`
                : 'http://localhost:5000/api/booth-surveys';

            const payload = {
                ...formData,
                survey_date: formData.survey_date.toISOString()
            };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
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
                    setSubmitError('An error occurred while saving the survey');
                }
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setSubmitError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderSelect = (label, name, options, labelKey = 'name', required = false, disabled = false) => (
        <Grid item xs={12} sm={6} key={name}>
            <Stack spacing={1}>
                <InputLabel required={required}>{label}</InputLabel>
                <FormControl fullWidth error={!!errors[name]} disabled={disabled || isSubmitting}>
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
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
                <DialogTitle>{survey ? 'Edit Booth Survey' : 'Add Booth Survey'}</DialogTitle>
                <DialogContent>
                    {submitError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {submitError}
                        </Alert>
                    )}

                    <Stack spacing={2} mt={2}>
                        {/* Hierarchy Dropdowns */}
                        <Grid container spacing={2}>
                            {renderSelect('State', 'state_id', states, 'name', true)}
                            {renderSelect('Division', 'division_id', filteredDivisions, 'name', true, !formData.state_id)}
                        </Grid>

                        <Grid container spacing={2}>
                            {renderSelect('Parliament', 'parliament_id', filteredParliaments, 'name', true, !formData.division_id)}
                            {renderSelect('Assembly', 'assembly_id', filteredAssemblies, 'name', true, !formData.parliament_id)}
                        </Grid>

                        <Grid container spacing={2}>
                            {renderSelect('Block', 'block_id', filteredBlocks, 'name', true, !formData.assembly_id)}
                            {renderSelect('Booth', 'booth_id', filteredBooths, 'name', true, !formData.block_id)}
                        </Grid>

                        {/* Survey Details */}
                        <Grid container spacing={2}>
                            {renderSelect('Surveyor', 'survey_done_by', users, 'username', true)}
                            <Grid item xs={12} sm={6}>
                                <Stack spacing={1}>
                                    <InputLabel required>Survey Date</InputLabel>
                                    <DatePicker
                                        value={formData.survey_date}
                                        onChange={handleDateChange}
                                        disabled={isSubmitting}
                                        renderInput={(params) => <TextField fullWidth {...params} />}
                                    />
                                </Stack>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            {renderSelect('Status', 'status', statusOptions.map(s => ({ _id: s, name: s })), 'name', true)}
                        </Grid>

                        {/* Text Fields */}
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Stack spacing={1}>
                                    <InputLabel>Poll Result</InputLabel>
                                    <TextField
                                        name="poll_result"
                                        value={formData.poll_result}
                                        onChange={handleChange}
                                        fullWidth
                                        multiline
                                        rows={2}
                                        error={!!errors.poll_result}
                                        helperText={errors.poll_result || 'Maximum 200 characters'}
                                        inputProps={{ maxLength: 200 }}
                                        disabled={isSubmitting}
                                    />
                                </Stack>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Stack spacing={1}>
                                    <InputLabel>Remarks</InputLabel>
                                    <TextField
                                        name="remark"
                                        value={formData.remark}
                                        onChange={handleChange}
                                        fullWidth
                                        multiline
                                        rows={3}
                                        error={!!errors.remark}
                                        helperText={errors.remark || 'Maximum 500 characters'}
                                        inputProps={{ maxLength: 500 }}
                                        disabled={isSubmitting}
                                    />
                                </Stack>
                            </Grid>
                        </Grid>
                    </Stack>
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
                        {isSubmitting ? 'Saving...' : (survey ? 'Update' : 'Submit')}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}