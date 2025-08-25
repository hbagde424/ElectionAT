import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Grid, Stack, TextField, InputLabel, Select,
    MenuItem, FormControl, FormHelperText, Alert,
    CircularProgress, Typography
} from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useEffect, useState } from 'react';

// Helper components to organize the code
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

const ElectionYearSelect = ({
    value,
    onChange,
    error,
    disabled,
    electionYears = []
}) => {
    return (
        <Stack spacing={1}>
            <InputLabel required>Election Year</InputLabel>
            <FormControl fullWidth error={!!error} disabled={disabled}>
                <Select name="election_year" value={value} onChange={onChange}>
                    <MenuItem value=""><em>Select Election Year</em></MenuItem>
                    {electionYears.map((opt) => (
                        <MenuItem key={opt._id} value={opt._id}>
                            {`${opt.year} (${opt.election_type})`}
                        </MenuItem>
                    ))}
                </Select>
                {error && <FormHelperText>{error}</FormHelperText>}
            </FormControl>
        </Stack>
    );
};

export default function WinningPartyModal({
    open,
    modalToggler,
    winningParty,
    states = [],
    divisions = [],
    parliaments = [],
    assemblies = [],
    blocks = [],
    booths = [],
    parties = [],
    candidates = [],
    electionYears = { data: [] },
    refresh
}) {

    // Auto-populate form when editing
    useEffect(() => {
        if (open) {
            // Modal opened
        }
    }, [open, candidates, electionYears]);




    // Form state management
    const [formData, setFormData] = useState(initializeFormData(winningParty));
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filtered data states
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);
    const [filteredCandidates, setFilteredCandidates] = useState(candidates);

    // Initialize form data
    function initializeFormData(winningParty) {
        if (!winningParty) {
            return {
                candidate_id: '',
                party_id: '',
                assembly_id: '',
                parliament_id: '',
                state_id: '',
                division_id: '',
                block_id: '',
                booth_id: '',
                election_year: '',
                votes: '',
                booth_number: '',
                margin: '',
                description: ''
            };
        }

        return {
            candidate_id: winningParty.candidate_id?._id || winningParty.candidate_id || '',
            party_id: winningParty.party_id?._id || winningParty.party_id || '',
            assembly_id: winningParty.assembly_id?._id || winningParty.assembly_id || '',
            parliament_id: winningParty.parliament_id?._id || winningParty.parliament_id || '',
            state_id: winningParty.state_id?._id || winningParty.state_id || '',
            division_id: winningParty.division_id?._id || winningParty.division_id || '',
            block_id: winningParty.block_id?._id || winningParty.block_id || '',
            booth_id: winningParty.booth_id?._id || winningParty.booth_id || '',
            election_year: winningParty.election_year?._id || winningParty.election_year || '',
            votes: winningParty.votes || '',
            booth_number: winningParty.booth_number || '',
            margin: winningParty.margin || '',
            description: winningParty.description || ''
        };
    }
    // For ReactQuill editor
    const handleDescriptionChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            description: value
        }));
    };

    // Reset form when modal opens/closes or winningParty changes
    useEffect(() => {
        if (open) {
            setFormData(initializeFormData(winningParty));
            setErrors({});
            setSubmitError('');
        }
    }, [open, winningParty]);

    // Initialize filtered candidates when candidates prop changes
    useEffect(() => {
        setFilteredCandidates(candidates);
    }, [candidates]);

    // Filter dependent data based on selections
    // State → Division filtering
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

    // Division → Parliament filtering
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

    // Parliament → Assembly filtering
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

    // Assembly → Block filtering
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

    // Block → Booth filtering
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
            candidate_id: () => !value && 'Candidate selection is required',
            party_id: () => !value && 'Party selection is required',
            assembly_id: () => !value && 'Assembly selection is required',
            parliament_id: () => !value && 'Parliament selection is required',
            state_id: () => !value && 'State selection is required',
            division_id: () => !value && 'Division selection is required',
            block_id: () => !value && 'Block selection is required',
            booth_id: () => !value && 'Booth selection is required',
            election_year: () => !value && 'Election year selection is required',
            votes: () => {
                if (!value) return 'Votes count is required';
                if (isNaN(value)) return 'Votes must be a number';
                if (parseInt(value) < 0) return 'Votes cannot be negative';
                return '';
            },
            booth_number: () => {
                if (!value) return 'Booth number is required';
                if (isNaN(value)) return 'Booth number must be a number';
                if (parseInt(value) < 0) return 'Booth number cannot be negative';
                return '';
            },
            margin: () => {
                if (!value) return 'Margin is required';
                if (isNaN(value)) return 'Margin must be a number';
                if (parseInt(value) < 0) return 'Margin cannot be negative';
                return '';
            }
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

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (submitError) setSubmitError('');

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        setSubmitError('');

        try {
            const token = localStorage.getItem('serviceToken');
            const url = winningParty
                ? `${import.meta.env.VITE_APP_API_URL}/winning-parties/${winningParty._id}`
                : `${import.meta.env.VITE_APP_API_URL}/winning-parties`;
            const method = winningParty ? 'PUT' : 'POST';

            const submitData = {
                ...formData,
                description: typeof formData.description === 'string' ? formData.description : ''
            };

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
                {winningParty ? 'Edit Winning Party Record' : 'Add Winning Party Record'}
            </DialogTitle>

            <DialogContent>
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
                            required
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
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormSelect
                            label="Party"
                            name="party_id"
                            value={formData.party_id}
                            options={parties}
                            onChange={handleChange}
                            error={errors.party_id}
                            disabled={isSubmitting}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormSelect
                            label="Candidate"
                            name="candidate_id"
                            value={formData.candidate_id}
                            options={filteredCandidates}
                            onChange={handleChange}
                            error={errors.candidate_id}
                            disabled={isSubmitting}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <ElectionYearSelect
                            value={formData.election_year}
                            onChange={handleChange}
                            error={errors.election_year}
                            disabled={isSubmitting}
                            electionYears={electionYears.data}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormTextField
                            label="Votes"
                            name="votes"
                            value={formData.votes}
                            onChange={handleChange}
                            error={errors.votes}
                            disabled={isSubmitting}
                            type="number"
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormTextField
                            label="Booth Number"
                            name="booth_number"
                            value={formData.booth_number}
                            onChange={handleChange}
                            error={errors.booth_number}
                            disabled={isSubmitting}
                            type="number"
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormTextField
                            label="Margin"
                            name="margin"
                            value={formData.margin}
                            onChange={handleChange}
                            error={errors.margin}
                            disabled={isSubmitting}
                            type="number"
                            required
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
                                style={{ minHeight: 100 }}
                            />
                        </Stack>
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
                    {isSubmitting ? 'Saving...' : (winningParty ? 'Update' : 'Submit')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
