import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Grid, Stack, TextField, InputLabel, Select,
    MenuItem, FormControl, FormHelperText, Alert,
    CircularProgress, Typography
} from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useEffect, useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers';

// Form Components (previously imported from FormComponents.jsx)
const FormSelect = ({
    label,
    name,
    value,
    options,
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
                    <MenuItem key={opt._id} value={opt._id}>
                        {opt[labelKey] || 'Unknown'}
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

export default function VisitModal({
    open,
    modalToggler,
    visit,
    states = [],
    divisions = [],
    parliaments = [],
    assemblies = [],
    blocks = [],
    booths = [],
    candidates = [],
    refresh
}) {
    // Form state management
    const [formData, setFormData] = useState(initializeFormData(visit));
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filtered data states
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    // Initialize form data
    function initializeFormData(visit) {
        if (!visit) {
            return {
                state_id: '',
                division_id: '',
                assembly_id: '',
                parliament_id: '',
                block_id: '',
                booth_id: '',
                candidate_id: '',
                post: '',
                date: new Date(),
                work_status: 'announced',
                declaration: '',
                remark: '',
                longitude: '',
                latitude: '',
                locationName: '',
                description: ''
            };
        }

        return {
            state_id: visit.state_id?._id || visit.state_id || '',
            division_id: visit.division_id?._id || visit.division_id || '',
            assembly_id: visit.assembly_id?._id || visit.assembly_id || '',
            parliament_id: visit.parliament_id?._id || visit.parliament_id || '',
            block_id: visit.block_id?._id || visit.block_id || '',
            booth_id: visit.booth_id?._id || visit.booth_id || '',
            candidate_id: visit.candidate_id?._id || visit.candidate_id || '',
            post: visit.post || '',
            date: visit.date ? new Date(visit.date) : new Date(),
            work_status: visit.work_status || 'announced',
            declaration: visit.declaration || '',
            remark: visit.remark || '',
            longitude: visit.longitude || '',
            latitude: visit.latitude || '',
            locationName: visit.locationName || '',
            description: visit.description || ''
        };
    }
    // For ReactQuill editor
    const handleDescriptionChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            description: value
        }));
    };

    // Reset form when modal opens/closes or visit changes
    useEffect(() => {
        if (open) {
            setFormData(initializeFormData(visit));
            setErrors({});
            setSubmitError('');
        }
    }, [open, visit]);

    // Filter dependent data based on selections
    useEffect(() => {
        if (formData.state_id) {
            const filtered = divisions.filter(d => {
                const divisionStateId = d.state_id?._id || d.state_id;
                return divisionStateId?.toString() === formData.state_id.toString();
            });
            setFilteredDivisions(filtered);

            if (!filtered.some(d => d._id?.toString() === formData.division_id?.toString())) {
                setFormData(prev => ({ ...prev, division_id: '', parliament_id: '', assembly_id: '', block_id: '', booth_id: '' }));
            }
        } else {
            setFilteredDivisions([]);
            setFormData(prev => ({ ...prev, division_id: '', parliament_id: '', assembly_id: '', block_id: '', booth_id: '' }));
        }
    }, [formData.state_id, divisions]);

    useEffect(() => {
        if (formData.division_id) {
            const filtered = parliaments.filter(p => {
                const parliamentDivisionId = p.division_id?._id || p.division_id;
                return parliamentDivisionId?.toString() === formData.division_id.toString();
            });
            setFilteredParliaments(filtered);

            if (!filtered.some(p => p._id?.toString() === formData.parliament_id?.toString())) {
                setFormData(prev => ({ ...prev, parliament_id: '', assembly_id: '', block_id: '', booth_id: '' }));
            }
        } else {
            setFilteredParliaments([]);
            setFormData(prev => ({ ...prev, parliament_id: '', assembly_id: '', block_id: '', booth_id: '' }));
        }
    }, [formData.division_id, parliaments]);

    useEffect(() => {
        if (formData.parliament_id) {
            const filtered = assemblies.filter(a => {
                const assemblyParliamentId = a.parliament_id?._id || a.parliament_id;
                return assemblyParliamentId?.toString() === formData.parliament_id.toString();
            });
            setFilteredAssemblies(filtered);

            if (!filtered.some(a => a._id?.toString() === formData.assembly_id?.toString())) {
                setFormData(prev => ({ ...prev, assembly_id: '', block_id: '', booth_id: '' }));
            }
        } else {
            setFilteredAssemblies([]);
            setFormData(prev => ({ ...prev, assembly_id: '', block_id: '', booth_id: '' }));
        }
    }, [formData.parliament_id, assemblies]);

    useEffect(() => {
        if (formData.assembly_id) {
            const filtered = blocks.filter(b => {
                const blockAssemblyId = b.assembly_id?._id || b.assembly_id;
                return blockAssemblyId?.toString() === formData.assembly_id.toString();
            });
            setFilteredBlocks(filtered);

            if (!filtered.some(b => b._id?.toString() === formData.block_id?.toString())) {
                setFormData(prev => ({ ...prev, block_id: '', booth_id: '' }));
            }
        } else {
            setFilteredBlocks([]);
            setFormData(prev => ({ ...prev, block_id: '', booth_id: '' }));
        }
    }, [formData.assembly_id, blocks]);

    useEffect(() => {
        if (formData.block_id) {
            const filtered = booths.filter(b => {
                const boothBlockId = b.block_id?._id || b.block_id;
                return boothBlockId?.toString() === formData.block_id.toString();
            });
            setFilteredBooths(filtered);

            if (!filtered.some(b => b._id?.toString() === formData.booth_id?.toString())) {
                setFormData(prev => ({ ...prev, booth_id: '' }));
            }
        } else {
            setFilteredBooths([]);
            setFormData(prev => ({ ...prev, booth_id: '' }));
        }
    }, [formData.block_id, booths]);

    // Field validation
    const validateField = (name, value) => {
        const validations = {
            state_id: () => !value && 'State selection is required',
            division_id: () => !value && 'Division selection is required',
            assembly_id: () => !value && 'Assembly selection is required',
            parliament_id: () => !value && 'Parliament selection is required',
            // block_id: () => !value && 'Block selection is required', // Made optional
            // booth_id: () => !value && 'Booth selection is required', // Made optional
            candidate_id: () => !value && 'Candidate selection is required',
            post: () => {
                if (!value) return 'Post is required';
                if (value.length > 100) return 'Post cannot exceed 100 characters';
                return '';
            },
            date: () => !value && 'Date is required',
            work_status: () => !value && 'Work status is required',
            declaration: () => value.length > 500 && 'Declaration cannot exceed 500 characters',
            remark: () => value.length > 500 && 'Remark cannot exceed 500 characters',
            longitude: () => {
                if (value && (isNaN(value) || value < -180 || value > 180))
                    return 'Longitude must be between -180 and 180';
                return '';
            },
            latitude: () => {
                if (value && (isNaN(value) || value < -90 || value > 90))
                    return 'Latitude must be between -90 and 90';
                return '';
            },
            locationName: () => value.length > 200 && 'Location name cannot exceed 200 characters'
        };

        return validations[name] ? validations[name]() : '';
    };

    const validateForm = () => {
        const newErrors = {};
        Object.keys(formData).forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) newErrors[field] = error;
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (submitError) setSubmitError('');

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, date }));
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        setSubmitError('');

        try {
            const token = localStorage.getItem('serviceToken');
            const url = visit
                ? `${import.meta.env.VITE_APP_API_URL}/visits/${visit._id}`
                : `${import.meta.env.VITE_APP_API_URL}/visits`;
            const method = visit ? 'PUT' : 'POST';

            const submitData = {
                ...formData,
                description: typeof formData.description === 'string' ? formData.description : '',
                // Convert empty strings to null for ObjectId fields
                block_id: formData.block_id || null,
                booth_id: formData.booth_id || null
            };

            // Remove null values to avoid sending them to backend
            Object.keys(submitData).forEach(key => {
                if (submitData[key] === null || submitData[key] === '') {
                    if (key === 'block_id' || key === 'booth_id') {
                        delete submitData[key];
                    }
                }
            });

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(submitData)
            });

            const data = await res.json();

            if (res.ok) {
                modalToggler(false);
                refresh();
            } else {
                handleSubmissionError(data);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setSubmitError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmissionError = (data) => {
        if (data.errors) {
            const serverErrors = {};
            Object.keys(data.errors).forEach(key => {
                serverErrors[key] = data.errors[key].message;
            });
            setErrors(serverErrors);
        } else {
            setSubmitError(data.message || 'An error occurred while saving the record');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>
                {visit ? 'Edit Visit Record' : 'Add Visit Record'}
            </DialogTitle>

            <DialogContent sx={{ maxHeight: '90vh' }}>
                {submitError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {submitError}
                    </Alert>
                )}

                <Grid container spacing={2} mt={1}>
                    <Grid item xs={12} sm={6}>
                        <FormSelect
                            label="State"
                            name="state_id"
                            value={formData.state_id}
                            options={states}
                            onChange={handleChange}
                            error={errors.state_id}
                            disabled={isSubmitting}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormSelect
                            label="Division"
                            name="division_id"
                            value={formData.division_id}
                            options={filteredDivisions}
                            onChange={handleChange}
                            error={errors.division_id}
                            disabled={isSubmitting}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormSelect
                            label="Parliament"
                            name="parliament_id"
                            value={formData.parliament_id}
                            options={filteredParliaments}
                            onChange={handleChange}
                            error={errors.parliament_id}
                            disabled={isSubmitting}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormSelect
                            label="Assembly"
                            name="assembly_id"
                            value={formData.assembly_id}
                            options={filteredAssemblies}
                            onChange={handleChange}
                            error={errors.assembly_id}
                            disabled={isSubmitting}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormSelect
                            label="Block"
                            name="block_id"
                            value={formData.block_id}
                            options={filteredBlocks}
                            onChange={handleChange}
                            error={errors.block_id}
                            disabled={isSubmitting}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormSelect
                            label="Booth"
                            name="booth_id"
                            value={formData.booth_id}
                            options={filteredBooths}
                            onChange={handleChange}
                            error={errors.booth_id}
                            disabled={isSubmitting}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormSelect
                            label="Politician"
                            name="candidate_id"
                            value={formData.candidate_id}
                            options={candidates}
                            onChange={handleChange}
                            error={errors.candidate_id}
                            disabled={isSubmitting}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormTextField
                            label="Post"
                            name="post"
                            value={formData.post}
                            onChange={handleChange}
                            error={errors.post}
                            disabled={isSubmitting}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Date</InputLabel>
                            <DatePicker
                                value={formData.date}
                                onChange={handleDateChange}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        error={!!errors.date}
                                        helperText={errors.date}
                                        disabled={isSubmitting}
                                    />
                                )}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormSelect
                            label="Work Status"
                            name="work_status"
                            value={formData.work_status}
                            options={[
                                { _id: 'announced', name: 'Announced' },
                                { _id: 'approved', name: 'Approved' },
                                { _id: 'in progress', name: 'In Progress' },
                                { _id: 'complete', name: 'Complete' },
                                { _id: 'N/A', name: 'N/A' }
                            ]}
                            onChange={handleChange}
                            error={errors.work_status}
                            disabled={isSubmitting}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormTextField
                            label="Longitude"
                            name="longitude"
                            value={formData.longitude}
                            onChange={handleChange}
                            error={errors.longitude}
                            disabled={isSubmitting}
                            type="number"
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormTextField
                            label="Latitude"
                            name="latitude"
                            value={formData.latitude}
                            onChange={handleChange}
                            error={errors.latitude}
                            disabled={isSubmitting}
                            type="number"
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <FormTextField
                            label="Location Name"
                            name="locationName"
                            value={formData.locationName}
                            onChange={handleChange}
                            error={errors.locationName}
                            disabled={isSubmitting}
                            multiline
                            rows={2}
                        />
                    </Grid>


                    {/* Row: Description (Rich Text) */}
                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel>Description</InputLabel>
                            <ReactQuill
                                theme="snow"
                                value={formData.description}
                                onChange={handleDescriptionChange}
                                placeholder="Enter description (optional)"
                                style={{ minHeight: 200, height: 200 }}
                            />
                        </Stack>
                    </Grid>

                    {/* Add space between Description and Declaration */}
                    <Grid item xs={12} style={{ marginTop: 24 }} />

                    <Grid item xs={12}>
                        <FormTextField
                            label="Declaration"
                            name="declaration"
                            value={formData.declaration}
                            onChange={handleChange}
                            error={errors.remark}
                            disabled={isSubmitting}
                            multiline
                            rows={7}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <FormTextField
                            label="Remark"
                            name="remark"
                            value={formData.remark}
                            onChange={handleChange}
                            error={errors.remark}
                            disabled={isSubmitting}
                            multiline
                            rows={7}
                        />
                    </Grid>
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
                    {isSubmitting ? 'Saving...' : (visit ? 'Update' : 'Submit')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
