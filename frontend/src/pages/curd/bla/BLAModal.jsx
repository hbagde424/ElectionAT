import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Grid, Stack, TextField, InputLabel, Select,
    MenuItem, FormControl, FormHelperText, Alert,
    CircularProgress, Typography, Autocomplete, Divider,
    IconButton, Tooltip, Switch, FormControlLabel
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { useEffect, useState, useRef } from 'react';
import axiosServices from 'utils/axios';
import StarRating from 'components/StarRating';

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
                        {opt[labelKey] || 'Unknown'}{opt.booth_number ? ` (${opt.booth_number})` : ''}
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
    required = false,
    multiline = false,
    rows = 1
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
            multiline={multiline}
            rows={multiline ? rows : 1}
        />
    </Stack>
);

export default function BLAModal({
    open,
    modalToggler,
    BLA,
    states = [],
    divisions = [],
    parliaments = [],
    assemblies = [],
    blocks = [],
    booths = [],
    electionYears = [],
    refresh
}) {
    // helper to normalize id (accepts string id or populated object)
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
        bla_name: '',
        contact_number: '',
        email: '',
        full_address: '',
        is_active: true,
        election_year_id: '',
        performance_rating: 0
    });

    // Location suggestions state
    const [locationOptions, setLocationOptions] = useState([]);
    const [locationLoading, setLocationLoading] = useState(false);
    const locationSearchDebounce = useRef(null);

    // Filtered data for hierarchical dropdowns
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [errors, setErrors] = useState({});

    // Initialize form data
    useEffect(() => {
        if (BLA) {
            setFormData({
                state_id: BLA.state_id?._id || '',
                division_id: BLA.division_id?._id || '',
                parliament_id: BLA.parliament_id?._id || '',
                assembly_id: BLA.assembly_id?._id || '',
                block_id: BLA.block_id?._id || '',
                booth_id: BLA.booth_id?._id || '',
                bla_name: BLA.bla_name || '',
                contact_number: BLA.contact_number || '',
                email: BLA.email || '',
                full_address: BLA.full_address || '',
                is_active: BLA.is_active !== undefined ? BLA.is_active : true,
                election_year_id: BLA.election_year_id?._id || '',
                performance_rating: BLA.performance_rating || 0
            });
        } else {
            setFormData({
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: '',
                bla_name: '',
                contact_number: '',
                email: '',
                full_address: '',
                is_active: true,
                election_year_id: '',
                performance_rating: 0
            });
        }
        setErrors({});
        setSubmitError('');
    }, [BLA, open]);

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
        if (!formData.bla_name.trim()) newErrors.bla_name = 'BLA name is required';

        // Validate BLA name length
        if (formData.bla_name.length > 100) {
            newErrors.bla_name = 'BLA name cannot exceed 100 characters';
        }

        // Validate contact number length (only if provided)
        if (formData.contact_number && formData.contact_number.length > 15) {
            newErrors.contact_number = 'Contact number cannot exceed 15 characters';
        }

        // Validate email format (only if provided)
        if (formData.email && formData.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                newErrors.email = 'Please enter a valid email address';
            }
            if (formData.email.length > 100) {
                newErrors.email = 'Email cannot exceed 100 characters';
            }
        }

        // Validate full address length (only if provided)
        if (formData.full_address && formData.full_address.length > 500) {
            newErrors.full_address = 'Full address cannot exceed 500 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear hierarchy if parent changes
        if (name === 'state_id') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
            }));
        } else if (name === 'division_id') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
            }));
        } else if (name === 'parliament_id') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                assembly_id: '',
                block_id: '',
                booth_id: ''
            }));
        } else if (name === 'assembly_id') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                block_id: '',
                booth_id: ''
            }));
        } else if (name === 'block_id') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                booth_id: ''
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Location autocomplete handler with Mapbox geocoding (debounced + fuzzy + fallback)
    const handleLocationInputChange = (event, value) => {
        setFormData(prev => ({ ...prev, location: value }));

        // Clear any pending debounce
        if (locationSearchDebounce.current) {
            clearTimeout(locationSearchDebounce.current);
            locationSearchDebounce.current = null;
        }

        // Only search when user typed at least 2 characters
        if (!value || value.length < 2) {
            setLocationOptions([]);
            return;
        }

        setLocationLoading(true);

        // Debounce requests to avoid rate limiting
        locationSearchDebounce.current = setTimeout(async () => {
            try {
                // Mapbox request with fuzzyMatch and sensible types
                const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&autocomplete=true&fuzzyMatch=true&limit=5&types=place,locality,neighborhood,address`;
                const res = await fetch(mapboxUrl);
                const data = await res.json();

                if (data?.features && data.features.length > 0) {
                    setLocationOptions(data.features);
                } else {
                    // Fallback to Nominatim (OpenStreetMap) which can be more tolerant to misspellings
                    try {
                        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(value)}`;
                        const nomRes = await fetch(nominatimUrl, { headers: { 'Accept-Language': 'en' } });
                        const nomData = await nomRes.json();
                        const mapped = (nomData || []).map(item => ({
                            place_name: item.display_name,
                            center: [parseFloat(item.lon), parseFloat(item.lat)]
                        }));
                        setLocationOptions(mapped);
                    } catch (nomErr) {
                        setLocationOptions([]);
                    }
                }
            } catch (err) {
                setLocationOptions([]);
            } finally {
                setLocationLoading(false);
                locationSearchDebounce.current = null;
            }
        }, 500);
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

    // Use browser geolocation to auto-fill coordinates (and reverse geocode to location)
    const handleUseCurrentLocation = async () => {
        // Clear any previous error on location
        setErrors(prev => ({ ...prev, location: undefined }));

        if (!('geolocation' in navigator)) {
            setErrors(prev => ({ ...prev, location: 'Geolocation is not supported by this browser.' }));
            return;
        }

        setLocationLoading(true);
        const geolocationOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

        const getPosition = () => new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, geolocationOptions);
        });

        try {
            const position = await getPosition();
            const { latitude, longitude } = position.coords;

            // Update coordinates immediately
            setFormData(prev => ({ ...prev, latitude, longitude }));

            // Try reverse geocoding to get a human-readable place name
            try {
                if (MAPBOX_ACCESS_TOKEN) {
                    const res = await fetch(
                        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`
                    );
                    const data = await res.json();
                    const place = data?.features?.[0]?.place_name;
                    setFormData(prev => ({ ...prev, location: place || `${latitude}, ${longitude}` }));
                } else {
                    // Fallback if no token
                    setFormData(prev => ({ ...prev, location: `${latitude}, ${longitude}` }));
                }
            } catch (rgErr) {
                // Reverse geocode failed; still keep coords
                setFormData(prev => ({ ...prev, location: `${latitude}, ${longitude}` }));
            }
        } catch (err) {
            let msg = 'Unable to fetch current location.';
            if (err?.code === 1) msg = 'Location permission denied. Please allow access.';
            if (err?.code === 2) msg = 'Location unavailable. Try again.';
            if (err?.code === 3) msg = 'Location request timed out. Try again.';
            setErrors(prev => ({ ...prev, location: msg }));
        } finally {
            setLocationLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        setSubmitError('');

        try {
            const submitData = {
                state_id: formData.state_id,
                division_id: formData.division_id,
                parliament_id: formData.parliament_id,
                assembly_id: formData.assembly_id,
                block_id: formData.block_id,
                booth_id: formData.booth_id,
                bla_name: formData.bla_name.trim(),
                contact_number: formData.contact_number ? formData.contact_number.trim() : '',
                email: formData.email ? formData.email.trim() : '',
                full_address: formData.full_address ? formData.full_address.trim() : '',
                is_active: formData.is_active,
                election_year_id: formData.election_year_id || null,
                performance_rating: formData.performance_rating || 0
            };

            if (BLA) {
                await axiosServices.put(`/blas/${BLA._id}`, submitData);
            } else {
                await axiosServices.post('/blas', submitData);
            }

            modalToggler();
            refresh();
        } catch (error) {
            console.error('Error saving BLA:', error);
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
            bla_name: '',
            contact_number: '',
            email: '',
            full_address: '',
            is_active: true,
            election_year_id: '',
            performance_rating: 0
        });
        setErrors({});
        setSubmitError('');
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Typography variant="h4">
                    {BLA ? 'Edit BLA Officer' : 'Add New BLA'}
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
                        {states.length === 0 && (
                            <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                                Loading states...
                            </Typography>
                        )}
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

                    {/* BLA Information */}
                    <Grid item xs={12} sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            BLA Information
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormTextField
                            label="BLA Name"
                            name="bla_name"
                            value={formData.bla_name}
                            onChange={handleInputChange}
                            error={errors.bla_name}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel sx={{ fontWeight: 'bold' }}>Status:</InputLabel>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                        color="primary"
                                    />
                                }
                                label={formData.is_active ? 'Active' : 'Inactive'}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12}>
                        <FormTextField
                            label="Full Address"
                            name="full_address"
                            value={formData.full_address}
                            onChange={handleInputChange}
                            error={errors.full_address}
                            multiline
                            rows={3}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel sx={{ fontWeight: 'bold' }}>Performance Rating:</InputLabel>
                            <StarRating
                                value={formData.performance_rating}
                                onChange={(newValue) => {
                                    setFormData(prev => ({ ...prev, performance_rating: newValue || 0 }));
                                }}
                                readOnly={false}
                                showLabel={true}
                                size="large"
                            />
                        </Stack>
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
                                                    <Tooltip title="Use current location">
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                onClick={handleUseCurrentLocation}
                                                                disabled={locationLoading}
                                                                aria-label="Use current location"
                                                                edge="end"
                                                                sx={{ mr: 0.5 }}
                                                            >
                                                                <MyLocationIcon fontSize="small" />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
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

                    {/* BLA Contact Information */}
                    <Grid item xs={12} sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            BLA Contact Information
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <FormTextField
                            label="Contact Number"
                            name="contact_number"
                            value={formData.contact_number}
                            onChange={handleInputChange}
                            error={errors.contact_number}
                            type="tel"
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <FormTextField
                            label="Email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            error={errors.email}
                            type="email"
                        />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <FormSelect
                            label="Election Year"
                            name="election_year_id"
                            value={formData.election_year_id}
                            options={electionYears}
                            onChange={handleInputChange}
                            error={errors.election_year_id}
                            labelKey="year"
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
                            {BLA ? 'Updating...' : 'Creating...'}
                        </>
                    ) : (
                        BLA ? 'Update BLA' : 'Create BLA'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};



