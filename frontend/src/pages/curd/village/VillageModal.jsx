import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Grid, Stack, TextField, InputLabel, Select,
    MenuItem, FormControl, FormHelperText, Alert,
    CircularProgress, Typography, Autocomplete, Divider
} from '@mui/material';
import { useEffect, useState } from 'react';
import axiosServices from 'utils/axios';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

// Form Components
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
        <InputLabel required={required} sx={{ fontWeight: 'bold' }}>{label}:</InputLabel>
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
        <InputLabel required={required} sx={{ fontWeight: 'bold' }}>{label}:</InputLabel>
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

export default function VillageModal({
    open,
    modalToggler,
    village,
    states = [],
    divisions = [],
    parliaments = [],
    assemblies = [],
    blocks = [],
    booths = [],
    panchayats = [],
    refresh
}) {
    const getId = (val) => {
        if (!val) return undefined;
        if (typeof val === 'string') return val;
        return val._id || val.id || undefined;
    };
    // Form state management
    const [formData, setFormData] = useState({
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: '',
        panchayat_id: '',
        village_name: '',
        location: '',
        latitude: '',
        longitude: '',
        male_count: '',
        female_count: '',
        others_count: ''
    });

    // Location suggestions state
    const [locationOptions, setLocationOptions] = useState([]);
    const [locationLoading, setLocationLoading] = useState(false);

    // Filtered data for hierarchical dropdowns
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);
    const [filteredPanchayats, setFilteredPanchayats] = useState([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [errors, setErrors] = useState({});

    // Initialize form data
    useEffect(() => {
        if (village) {
            setFormData({
                state_id: village.state_id?._id || '',
                division_id: village.division_id?._id || '',
                parliament_id: village.parliament_id?._id || '',
                assembly_id: village.assembly_id?._id || '',
                block_id: village.block_id?._id || '',
                booth_id: village.booth_id?._id || '',
                panchayat_id: village.panchayat_id?._id || '',
                village_name: village.village_name || '',
                location: village.location || '',
                latitude: village.latitude || '',
                longitude: village.longitude || '',
                male_count: village.male_count || '',
                female_count: village.female_count || '',
                others_count: village.others_count || ''
            });
        } else {
            setFormData({
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: '',
                panchayat_id: '',
                village_name: '',
                location: '',
                latitude: '',
                longitude: '',
                male_count: '',
                female_count: '',
                others_count: ''
            });
        }
        setErrors({});
        setSubmitError('');
    }, [village, open]);

    // Update filtered options based on selections
    useEffect(() => {
        if (formData.state_id) {
            setFilteredDivisions(divisions.filter(d => getId(d.state_id) === formData.state_id));
        } else {
            setFilteredDivisions([]);
        }
    }, [formData.state_id, divisions]);

    useEffect(() => {
        if (formData.division_id) {
            setFilteredParliaments(parliaments.filter(p => getId(p.division_id) === formData.division_id));
        } else {
            setFilteredParliaments([]);
        }
    }, [formData.division_id, parliaments]);

    useEffect(() => {
        if (formData.parliament_id) {
            setFilteredAssemblies(assemblies.filter(a => getId(a.parliament_id) === formData.parliament_id));
        } else {
            setFilteredAssemblies([]);
        }
    }, [formData.parliament_id, assemblies]);

    useEffect(() => {
        if (formData.assembly_id) {
            setFilteredBlocks(blocks.filter(b => getId(b.assembly_id) === formData.assembly_id));
        } else {
            setFilteredBlocks([]);
        }
    }, [formData.assembly_id, blocks]);

    useEffect(() => {
        if (formData.block_id) {
            setFilteredBooths(booths.filter(b => getId(b.block_id) === formData.block_id));
        } else {
            setFilteredBooths([]);
        }
    }, [formData.block_id, booths]);

    useEffect(() => {
        if (formData.booth_id) {
            setFilteredPanchayats(panchayats.filter(p => getId(p.booth_id) === formData.booth_id));
        } else {
            setFilteredPanchayats([]);
        }
    }, [formData.booth_id, panchayats]);

    // Form validation
    const validateForm = () => {
        const newErrors = {};

        // Required field validation
        if (!formData.state_id) newErrors.state_id = 'State is required';
        if (!formData.division_id) newErrors.division_id = 'Division is required';
        if (!formData.parliament_id) newErrors.parliament_id = 'Parliament is required';
        if (!formData.assembly_id) newErrors.assembly_id = 'Assembly is required';
        if (!formData.block_id) newErrors.block_id = 'Block is required';
        if (!formData.booth_id) newErrors.booth_id = 'Booth is required';
        if (!formData.panchayat_id) newErrors.panchayat_id = 'Panchayat is required';
        if (!formData.village_name.trim()) newErrors.village_name = 'Village name is required';

        // Validate village name length
        if (formData.village_name.length > 100) {
            newErrors.village_name = 'Village name cannot exceed 100 characters';
        }

        // Validate location length
        if (formData.location.length > 200) {
            newErrors.location = 'Location cannot exceed 200 characters';
        }

        // Validate numeric fields
        const numericFields = ['male_count', 'female_count', 'others_count'];
        numericFields.forEach(field => {
            if (formData[field] && (isNaN(formData[field]) || formData[field] < 0)) {
                newErrors[field] = 'Must be a valid positive number';
            }
        });

        // Validate coordinates if provided
        if (formData.latitude && (isNaN(formData.latitude) || formData.latitude < -90 || formData.latitude > 90)) {
            newErrors.latitude = 'Latitude must be between -90 and 90';
        }
        if (formData.longitude && (isNaN(formData.longitude) || formData.longitude < -180 || formData.longitude > 180)) {
            newErrors.longitude = 'Longitude must be between -180 and 180';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Clear hierarchy if parent changes
        if (name === 'state_id') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: '',
                panchayat_id: ''
            }));
        } else if (name === 'division_id') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: '',
                panchayat_id: ''
            }));
        } else if (name === 'parliament_id') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                assembly_id: '',
                block_id: '',
                booth_id: '',
                panchayat_id: ''
            }));
        } else if (name === 'assembly_id') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                block_id: '',
                booth_id: '',
                panchayat_id: ''
            }));
        } else if (name === 'block_id') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                booth_id: '',
                panchayat_id: ''
            }));
        } else if (name === 'booth_id') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                panchayat_id: ''
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Location autocomplete handler with Mapbox geocoding
    const handleLocationInputChange = async (event, value) => {
        setFormData(prev => ({ ...prev, location: value }));
        if (value && value.length > 2) {
            setLocationLoading(true);
            try {
                const res = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&autocomplete=true&limit=5`
                );
                const data = await res.json();
                if (data.features) {
                    setLocationOptions(data.features);
                } else {
                    setLocationOptions([]);
                }
            } catch (err) {
                setLocationOptions([]);
            }
            setLocationLoading(false);
        } else {
            setLocationOptions([]);
        }
    };

    // When user selects a location suggestion
    const handleLocationSelect = (event, newValue) => {
        if (newValue) {
            setFormData(prev => ({
                ...prev,
                location: newValue.place_name,
                latitude: newValue.center[1],
                longitude: newValue.center[0]
            }));
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        setSubmitError('');

        try {
            const submitData = {
                ...formData,
                male_count: formData.male_count ? parseInt(formData.male_count) : 0,
                female_count: formData.female_count ? parseInt(formData.female_count) : 0,
                others_count: formData.others_count ? parseInt(formData.others_count) : 0,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null
            };

            if (village) {
                await axiosServices.put(`/villages/${village._id}`, submitData);
            } else {
                await axiosServices.post('/villages', submitData);
            }

            modalToggler();
            refresh();
        } catch (error) {
            console.error('Error saving village:', error);
            setSubmitError(error.response?.data?.message || 'An error occurred while saving');
        }
        setIsSubmitting(false);
    };

    const handleClose = () => {
        modalToggler();
        setFormData({
            state_id: '',
            division_id: '',
            parliament_id: '',
            assembly_id: '',
            block_id: '',
            booth_id: '',
            panchayat_id: '',
            village_name: '',
            location: '',
            latitude: '',
            longitude: '',
            male_count: '',
            female_count: '',
            others_count: ''
        });
        setErrors({});
        setSubmitError('');
        setLocationOptions([]);
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Typography variant="h4">
                    {village ? 'Edit Village' : 'Add New Village'}
                </Typography>
            </DialogTitle>
            
            <DialogContent dividers sx={{ p: 3 }}>
                {submitError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {submitError}
                    </Alert>
                )}

                <Grid container spacing={2}>
                    {/* Hierarchy Selection */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Hierarchy Information
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormSelect
                            label="State"
                            name="state_id"
                            value={formData.state_id}
                            options={states}
                            onChange={handleInputChange}
                            error={errors.state_id}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormSelect
                            label="Division"
                            name="division_id"
                            value={formData.division_id}
                            options={filteredDivisions}
                            onChange={handleInputChange}
                            error={errors.division_id}
                            disabled={!formData.state_id}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormSelect
                            label="Parliament"
                            name="parliament_id"
                            value={formData.parliament_id}
                            options={filteredParliaments}
                            onChange={handleInputChange}
                            error={errors.parliament_id}
                            disabled={!formData.division_id}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormSelect
                            label="Assembly"
                            name="assembly_id"
                            value={formData.assembly_id}
                            options={filteredAssemblies}
                            onChange={handleInputChange}
                            error={errors.assembly_id}
                            disabled={!formData.parliament_id}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormSelect
                            label="Block"
                            name="block_id"
                            value={formData.block_id}
                            options={filteredBlocks}
                            onChange={handleInputChange}
                            error={errors.block_id}
                            disabled={!formData.assembly_id}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormSelect
                            label="Booth"
                            name="booth_id"
                            value={formData.booth_id}
                            options={filteredBooths}
                            onChange={handleInputChange}
                            error={errors.booth_id}
                            disabled={!formData.block_id}
                            required
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <FormSelect
                            label="Panchayat"
                            name="panchayat_id"
                            value={formData.panchayat_id}
                            options={filteredPanchayats}
                            onChange={handleInputChange}
                            error={errors.panchayat_id}
                            disabled={!formData.booth_id}
                            required
                            labelKey="panchayat_name"
                        />
                    </Grid>

                    {/* Village Information */}
                    <Grid item xs={12} sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Village Information
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormTextField
                            label="Village Name"
                            name="village_name"
                            value={formData.village_name}
                            onChange={handleInputChange}
                            error={errors.village_name}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required sx={{ fontWeight: 'bold' }}>Location:</InputLabel>
                            <Autocomplete
                                freeSolo
                                options={locationOptions}
                                getOptionLabel={(option) => 
                                    typeof option === 'string' ? option : option.place_name || ''
                                }
                                loading={locationLoading}
                                value={formData.location}
                                onInputChange={handleLocationInputChange}
                                onChange={handleLocationSelect}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Enter location for auto-coordinates"
                                        error={!!errors.location}
                                        helperText={errors.location}
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <>
                                                    {locationLoading && <CircularProgress color="inherit" size={20} />}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormTextField
                            label="Latitude"
                            name="latitude"
                            value={formData.latitude}
                            onChange={handleInputChange}
                            error={errors.latitude}
                            type="number"
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormTextField
                            label="Longitude"
                            name="longitude"
                            value={formData.longitude}
                            onChange={handleInputChange}
                            error={errors.longitude}
                            type="number"
                        />
                    </Grid>

                    {/* Population Information */}
                    <Grid item xs={12} sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Population Information
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <FormTextField
                            label="Male Count"
                            name="male_count"
                            value={formData.male_count}
                            onChange={handleInputChange}
                            error={errors.male_count}
                            type="number"
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <FormTextField
                            label="Female Count"
                            name="female_count"
                            value={formData.female_count}
                            onChange={handleInputChange}
                            error={errors.female_count}
                            type="number"
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <FormTextField
                            label="Others Count"
                            name="others_count"
                            value={formData.others_count}
                            onChange={handleInputChange}
                            error={errors.others_count}
                            type="number"
                        />
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
                <Button onClick={handleClose} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button 
                    variant="contained" 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            {village ? 'Updating...' : 'Creating...'}
                        </>
                    ) : (
                        village ? 'Update Village' : 'Create Village'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
}