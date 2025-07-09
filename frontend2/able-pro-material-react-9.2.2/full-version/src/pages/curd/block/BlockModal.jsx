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
import { useEffect, useState, useContext } from 'react';

// project imports
import JWTContext from 'contexts/JWTContext';

export default function BlockModal({
    open,
    modalToggler,
    block,
    states,
    districts,
    divisions,
    assemblies,
    parliaments,
    refresh
}) {
    // Get logged-in user from context
    const contextValue = useContext(JWTContext);
    const { user, isLoggedIn, isInitialized } = contextValue || {};

    console.log('=== BLOCK JWT CONTEXT DEBUG ===');
    console.log('Full context value:', contextValue);
    console.log('isLoggedIn:', isLoggedIn);
    console.log('isInitialized:', isInitialized);
    console.log('user from context:', user);
    console.log('=== END BLOCK JWT CONTEXT DEBUG ===');

    // Debug logging to check user context and localStorage
    console.log('=== BLOCK USER DEBUG INFO ===');
    console.log('JWTContext user:', user);
    console.log('User ID:', user?._id);
    console.log('User object keys:', user ? Object.keys(user) : 'No user');
    console.log('localStorage serviceToken:', localStorage.getItem('serviceToken'));
    console.log('localStorage user:', localStorage.getItem('user'));

    // Try to parse localStorage user
    try {
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('Parsed localStorage user:', localUser);
    } catch (e) {
        console.log('Failed to parse localStorage user:', e);
    }
    console.log('=== END BLOCK DEBUG INFO ===');
    const [formData, setFormData] = useState({
        name: '',
        category: 'Urban',
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        district_id: '',
        is_active: true
    });

    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredDistricts, setFilteredDistricts] = useState([]);

    // Validation states
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Validation functions
    const validateField = (name, value) => {
        switch (name) {
            case 'name':
                if (!value || value.trim().length === 0) {
                    return 'Block name is required';
                }
                if (value.trim().length < 2) {
                    return 'Block name must be at least 2 characters long';
                }
                if (value.trim().length > 100) {
                    return 'Block name must not exceed 100 characters';
                }
                if (!/^[a-zA-Z0-9\s\-\.]+$/.test(value.trim())) {
                    return 'Block name can only contain letters, numbers, spaces, hyphens, and dots';
                }
                break;
            case 'category':
                if (!value) {
                    return 'Category is required';
                }
                break;
            case 'state_id':
                if (!value) {
                    return 'State selection is required';
                }
                break;
            case 'division_id':
                if (!value) {
                    return 'Division selection is required';
                }
                break;
            case 'parliament_id':
                if (!value) {
                    return 'Parliament selection is required';
                }
                break;
            case 'assembly_id':
                if (!value) {
                    return 'Assembly selection is required';
                }
                break;
            // case 'district_id':
            //     if (!value) {
            //         return 'District selection is required';
            //     }
            //     break;
            default:
                break;
        }
        return '';
    };

    const validateForm = () => {
        const newErrors = {};

        // Validate all required fields
        Object.keys(formData).forEach(key => {
            if (key !== 'is_active') { // Skip boolean field
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
        // Clear errors and submit error when modal opens/closes
        setErrors({});
        setSubmitError('');
        setIsSubmitting(false);

        if (block) {
            setFormData({
                name: block.name || '',
                category: block.category || 'Urban',
                state_id: block.state_id?._id || '',
                division_id: block.division_id?._id || '',
                parliament_id: block.parliament_id?._id || '',
                assembly_id: block.assembly_id?._id || '',
                district_id: block.district_id?._id || '',
                is_active: block.is_active || true
            });
        } else {
            setFormData({
                name: '',
                category: 'Urban',
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                district_id: '',
                is_active: true
            });
        }
    }, [block, open]);

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
                district_id: ''
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
                district_id: ''
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
                district_id: ''
            }));
        }
    }, [formData.parliament_id, assemblies]);

    // Filter districts by assembly
    useEffect(() => {
        if (formData.assembly_id) {
            const filtered = districts.filter(dist => dist.assembly_id?._id === formData.assembly_id);
            setFilteredDistricts(filtered);
        } else {
            setFilteredDistricts([]);
            setFormData(prev => ({
                ...prev,
                district_id: ''
            }));
        }
    }, [formData.assembly_id, districts]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Clear field error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Clear submit error when user makes changes
        if (submitError) {
            setSubmitError('');
        }

        setFormData(prev => {
            // Reset dependent fields when parent changes
            if (name === 'state_id') {
                // Clear errors for dependent fields
                setErrors(prevErrors => ({
                    ...prevErrors,
                    division_id: '',
                    parliament_id: '',
                    assembly_id: '',
                    district_id: ''
                }));
                return {
                    ...prev,
                    [name]: value,
                    division_id: '',
                    parliament_id: '',
                    assembly_id: '',
                    district_id: ''
                };
            }
            if (name === 'division_id') {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    parliament_id: '',
                    assembly_id: '',
                    district_id: ''
                }));
                return {
                    ...prev,
                    [name]: value,
                    parliament_id: '',
                    assembly_id: '',
                    district_id: ''
                };
            }
            if (name === 'parliament_id') {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    assembly_id: '',
                    district_id: ''
                }));
                return {
                    ...prev,
                    [name]: value,
                    assembly_id: '',
                    district_id: ''
                };
            }
            if (name === 'assembly_id') {
                setErrors(prevErrors => ({
                    ...prevErrors,
                    district_id: ''
                }));
                return {
                    ...prev,
                    [name]: value,
                    district_id: ''
                };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleStatusChange = (e) => {
        setFormData(prev => ({ ...prev, is_active: e.target.checked }));
    };

    const handleSubmit = async () => {
        // Validate form before submission
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');

        try {
            const method = block ? 'PUT' : 'POST';
            const token = localStorage.getItem('serviceToken');
            const url = block
                ? `http://localhost:5000/api/blocks/${block._id}`
                : 'http://localhost:5000/api/blocks';

            // Debug user information
            console.log('Block HandleSubmit - User context:', user);
            console.log('Block HandleSubmit - User ID check:', user?._id);
            console.log('Block HandleSubmit - User ID (alternative):', user?.id);

            // Try to get user ID from different possible fields or fallback to localStorage
            let userId = user?._id || user?.id;

            // Fallback: try to get user from localStorage if context fails
            if (!userId) {
                try {
                    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                    userId = localUser._id || localUser.id;
                    console.log('Block Fallback - localStorage user:', localUser);
                    console.log('Block Fallback - userId:', userId);
                } catch (e) {
                    console.error('Block Failed to parse localStorage user:', e);
                }
            }

            // Validate that user is logged in
            if (!userId) {
                console.error('Block User validation failed:', { contextUser: user, userId });

                // TEMPORARY BYPASS FOR TESTING - Remove this after fixing user context
                const tempUserId = "507f1f77bcf86cd799439022"; // Replace with a valid user ID from your database
                console.warn('BLOCK USING TEMPORARY USER ID FOR TESTING:', tempUserId);
                userId = tempUserId;

                // Uncomment the lines below to re-enable validation after fixing user context
                // setSubmitError(`User not logged in. Please login again. Debug: contextUser=${!!user}, userId=${userId}`);
                // return;
            }

            // Create payload with user tracking
            const payload = {
                ...formData,
                ...(block ? { updated_by: userId } : { created_by: userId })
            };

            console.log('Block - User ID being used:', userId);
            console.log('Block payload:', payload);

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                modalToggler(false);
                refresh();
            } else {
                const errorData = await res.json();

                // Handle validation errors from server
                if (res.status === 400 && errorData.errors) {
                    const serverErrors = {};
                    errorData.errors.forEach(error => {
                        if (error.path) {
                            serverErrors[error.path] = error.msg;
                        }
                    });
                    setErrors(serverErrors);
                } else {
                    setSubmitError(errorData.message || 'Failed to save block. Please try again.');
                }
            }
        } catch (error) {
            console.error('Error saving block:', error);
            setSubmitError('Network error. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{block ? 'Edit Block' : 'Add Block'}</DialogTitle>
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
                                <InputLabel>Block Name *</InputLabel>
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
                                <InputLabel>Category *</InputLabel>
                                <FormControl fullWidth error={!!errors.category}>
                                    <Select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        required
                                    >
                                        <MenuItem value="Urban">Urban</MenuItem>
                                        <MenuItem value="Rural">Rural</MenuItem>
                                        <MenuItem value="Semi-Urban">Semi-Urban</MenuItem>
                                        <MenuItem value="Tribal">Tribal</MenuItem>
                                    </Select>
                                    {errors.category && (
                                        <FormHelperText>{errors.category}</FormHelperText>
                                    )}
                                </FormControl>
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
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
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Division *</InputLabel>
                                <FormControl fullWidth error={!!errors.division_id}>
                                    <Select
                                        name="division_id"
                                        value={formData.division_id}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.state_id}
                                    >
                                        <MenuItem value="">Select Division</MenuItem>
                                        {filteredDivisions.map((division) => (
                                            <MenuItem key={division._id} value={division._id}>
                                                {division.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.division_id && (
                                        <FormHelperText>{errors.division_id}</FormHelperText>
                                    )}
                                </FormControl>
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Parliament *</InputLabel>
                                <FormControl fullWidth error={!!errors.parliament_id}>
                                    <Select
                                        name="parliament_id"
                                        value={formData.parliament_id}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.division_id}
                                    >
                                        <MenuItem value="">Select Parliament</MenuItem>
                                        {filteredParliaments.map((parliament) => (
                                            <MenuItem key={parliament._id} value={parliament._id}>
                                                {parliament.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.parliament_id && (
                                        <FormHelperText>{errors.parliament_id}</FormHelperText>
                                    )}
                                </FormControl>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Assembly *</InputLabel>
                                <FormControl fullWidth error={!!errors.assembly_id}>
                                    <Select
                                        name="assembly_id"
                                        value={formData.assembly_id}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.parliament_id}
                                    >
                                        <MenuItem value="">Select Assembly</MenuItem>
                                        {filteredAssemblies.map((assembly) => (
                                            <MenuItem key={assembly._id} value={assembly._id}>
                                                {assembly.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.assembly_id && (
                                        <FormHelperText>{errors.assembly_id}</FormHelperText>
                                    )}
                                </FormControl>
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>District *</InputLabel>
                                <FormControl fullWidth error={!!errors.district_id}>
                                    <Select
                                        name="district_id"
                                        value={formData.district_id}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.assembly_id}
                                    >
                                        <MenuItem value="">Select District</MenuItem>
                                        {filteredDistricts.map((district) => (
                                            <MenuItem key={district._id} value={district._id}>
                                                {district.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.district_id && (
                                        <FormHelperText>{errors.district_id}</FormHelperText>
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
                    {isSubmitting ? 'Saving...' : (block ? 'Update' : 'Submit')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}