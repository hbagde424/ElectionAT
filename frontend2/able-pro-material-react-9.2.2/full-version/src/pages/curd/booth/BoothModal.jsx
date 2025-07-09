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
    Grid
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';

// project imports
import JWTContext from 'contexts/JWTContext';

export default function BoothModal({
    open,
    modalToggler,
    booth,
    states,
    districts,
    divisions,
    assemblies,
    parliaments,
    blocks,
    refresh
}) {
    // Get logged-in user from context
    const contextValue = useContext(JWTContext);
    const { user, isLoggedIn, isInitialized } = contextValue || {};

    console.log('=== BOOTH JWT CONTEXT DEBUG ===');
    console.log('Full context value:', contextValue);
    console.log('isLoggedIn:', isLoggedIn);
    console.log('isInitialized:', isInitialized);
    console.log('user from context:', user);
    console.log('=== END BOOTH JWT CONTEXT DEBUG ===');

    // Debug logging to check user context and localStorage
    console.log('=== BOOTH USER DEBUG INFO ===');
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
    console.log('=== END BOOTH DEBUG INFO ===');
    const [formData, setFormData] = useState({
        name: '',
        booth_number: '',
        full_address: '',
        latitude: '',
        longitude: '',
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        district_id: '',
        block_id: ''
    });

    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredDistricts, setFilteredDistricts] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);

    // Utility to safely extract ID
    const getId = (ref) => (typeof ref === 'string' ? ref : ref?._id || '');

    useEffect(() => {
        if (booth) {
            setFormData({
                name: booth.name || '',
                booth_number: booth.booth_number || '',
                full_address: booth.full_address || '',
                latitude: booth.latitude || '',
                longitude: booth.longitude || '',
                state_id: getId(booth.state_id),
                division_id: getId(booth.division_id),
                parliament_id: getId(booth.parliament_id),
                assembly_id: getId(booth.assembly_id),
                district_id: getId(booth.district_id),
                block_id: getId(booth.block_id)
            });
        } else {
            setFormData({
                name: '',
                booth_number: '',
                full_address: '',
                latitude: '',
                longitude: '',
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                district_id: '',
                block_id: ''
            });
        }
    }, [booth]);

    useEffect(() => {
        if (formData.state_id) {
            setFilteredDivisions(divisions.filter(div => getId(div.state_id) === formData.state_id));
        } else {
            setFilteredDivisions([]);
        }
    }, [formData.state_id, divisions]);

    useEffect(() => {
        if (formData.division_id) {
            setFilteredParliaments(parliaments.filter(par => getId(par.division_id) === formData.division_id));
        } else {
            setFilteredParliaments([]);
        }
    }, [formData.division_id, parliaments]);

    useEffect(() => {
        if (formData.parliament_id) {
            setFilteredAssemblies(assemblies.filter(asm => getId(asm.parliament_id) === formData.parliament_id));
        } else {
            setFilteredAssemblies([]);
        }
    }, [formData.parliament_id, assemblies]);

    useEffect(() => {
        if (formData.assembly_id) {
            setFilteredDistricts(districts.filter(dist => getId(dist.assembly_id) === formData.assembly_id));
        } else {
            setFilteredDistricts([]);
        }
    }, [formData.assembly_id, districts]);

    useEffect(() => {
        if (formData.district_id) {
            setFilteredBlocks(blocks.filter(blk => getId(blk.district_id) === formData.district_id));
        } else {
            setFilteredBlocks([]);
        }
    }, [formData.district_id, blocks]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const resetFields = {
                state_id: ['division_id', 'parliament_id', 'assembly_id', 'district_id', 'block_id'],
                division_id: ['parliament_id', 'assembly_id', 'district_id', 'block_id'],
                parliament_id: ['assembly_id', 'district_id', 'block_id'],
                assembly_id: ['district_id', 'block_id'],
                district_id: ['block_id']
            };

            let updatedForm = { ...prev, [name]: value };

            if (resetFields[name]) {
                resetFields[name].forEach(field => updatedForm[field] = '');
            }

            return updatedForm;
        });
    };

    const handleSubmit = async () => {
        const method = booth ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = booth
            ? `http://localhost:5000/api/booths/${booth._id}`
            : 'http://localhost:5000/api/booths';

        // Debug user information
        console.log('Booth HandleSubmit - User context:', user);
        console.log('Booth HandleSubmit - User ID check:', user?._id);
        console.log('Booth HandleSubmit - User ID (alternative):', user?.id);

        // Try to get user ID from different possible fields or fallback to localStorage
        let userId = user?._id || user?.id;

        // Fallback: try to get user from localStorage if context fails
        if (!userId) {
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                userId = localUser._id || localUser.id;
                console.log('Booth Fallback - localStorage user:', localUser);
                console.log('Booth Fallback - userId:', userId);
            } catch (e) {
                console.error('Booth Failed to parse localStorage user:', e);
            }
        }

        // Validate that user is logged in
        if (!userId) {
            console.error('Booth User validation failed:', { contextUser: user, userId });

            // TEMPORARY BYPASS FOR TESTING - Remove this after fixing user context
            const tempUserId = "507f1f77bcf86cd799439022"; // Replace with a valid user ID from your database
            console.warn('BOOTH USING TEMPORARY USER ID FOR TESTING:', tempUserId);
            userId = tempUserId;

            // Uncomment the lines below to re-enable validation after fixing user context
            // alert(`User not logged in. Please login again. Debug: contextUser=${!!user}, userId=${userId}`);
            // return;
        }

        // Create payload with user tracking
        const payload = {
            ...formData,
            ...(booth ? { updated_by: userId } : { created_by: userId })
        };

        console.log('Booth - User ID being used:', userId);
        console.log('Booth payload:', payload);

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
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{booth ? 'Edit Booth' : 'Add Booth'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} mt={2}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Booth Name</InputLabel>
                                <TextField
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                />
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Booth Number</InputLabel>
                                <TextField
                                    name="booth_number"
                                    value={formData.booth_number}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                />
                            </Stack>
                        </Grid>
                    </Grid>

                    <Stack spacing={1}>
                        <InputLabel>Full Address</InputLabel>
                        <TextField
                            name="full_address"
                            value={formData.full_address}
                            onChange={handleChange}
                            fullWidth
                            required
                            multiline
                            rows={3}
                        />
                    </Stack>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Latitude</InputLabel>
                                <TextField
                                    name="latitude"
                                    value={formData.latitude}
                                    onChange={handleChange}
                                    fullWidth
                                    type="number"
                                />
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Longitude</InputLabel>
                                <TextField
                                    name="longitude"
                                    value={formData.longitude}
                                    onChange={handleChange}
                                    fullWidth
                                    type="number"
                                />
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>State</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="state_id"
                                        value={formData.state_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <MenuItem value="">Select State</MenuItem>
                                        {states.map(state => (
                                            <MenuItem key={state._id} value={state._id}>
                                                {state.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Division</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="division_id"
                                        value={formData.division_id}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.state_id}
                                    >
                                        <MenuItem value="">Select Division</MenuItem>
                                        {filteredDivisions.map(division => (
                                            <MenuItem key={division._id} value={division._id}>
                                                {division.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Parliament</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="parliament_id"
                                        value={formData.parliament_id}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.division_id}
                                    >
                                        <MenuItem value="">Select Parliament</MenuItem>
                                        {filteredParliaments.map(parliament => (
                                            <MenuItem key={parliament._id} value={parliament._id}>
                                                {parliament.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Assembly</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="assembly_id"
                                        value={formData.assembly_id}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.parliament_id}
                                    >
                                        <MenuItem value="">Select Assembly</MenuItem>
                                        {filteredAssemblies.map(assembly => (
                                            <MenuItem key={assembly._id} value={assembly._id}>
                                                {assembly.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>District</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="district_id"
                                        value={formData.district_id}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.assembly_id}
                                    >
                                        <MenuItem value="">Select District</MenuItem>
                                        {filteredDistricts.map(district => (
                                            <MenuItem key={district._id} value={district._id}>
                                                {district.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Block</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="block_id"
                                        value={formData.block_id}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.district_id}
                                    >
                                        <MenuItem value="">Select Block</MenuItem>
                                        {filteredBlocks.map(block => (
                                            <MenuItem key={block._id} value={block._id}>
                                                {block.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                    </Grid>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {booth ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
