import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    Chip, Box
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import JWTContext from 'contexts/JWTContext';

export default function InfluencerModal({
    open,
    modalToggler,
    influencer,
    states,
    divisions,
    parliaments,
    assemblies,
    districts,
    blocks,
    booths,
    refresh
}) {
    const contextValue = useContext(JWTContext);
    const { user } = contextValue || {};

    const [formData, setFormData] = useState({
        name: '',
        contact_number: '',
        alternate_number: '',
        email: '',
        full_address: '',
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        district_id: '',
        block_id: '',
        booth_id: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredDistricts, setFilteredDistricts] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    useEffect(() => {
        if (influencer) {
            setFormData({
                name: influencer.name || '',
                contact_number: influencer.contact_number || '',
                alternate_number: influencer.alternate_number || '',
                email: influencer.email || '',
                full_address: influencer.full_address || '',
                state_id: influencer.state_id?._id?.toString() || influencer.state_id?.toString() || '',
                division_id: influencer.division_id?._id?.toString() || influencer.division_id?.toString() || '',
                parliament_id: influencer.parliament_id?._id?.toString() || influencer.parliament_id?.toString() || '',
                assembly_id: influencer.assembly_id?._id?.toString() || influencer.assembly_id?.toString() || '',
                district_id: influencer.district_id?._id?.toString() || influencer.district_id?.toString() || '',
                block_id: influencer.block_id?._id?.toString() || influencer.block_id?.toString() || '',
                booth_id: influencer.booth_id?._id?.toString() || influencer.booth_id?.toString() || ''
            });
        } else {
            setFormData({
                name: '',
                contact_number: '',
                alternate_number: '',
                email: '',
                full_address: '',
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                district_id: '',
                block_id: '',
                booth_id: ''
            });
        }
    }, [influencer]);

    // State -> Division
    useEffect(() => {
        if (formData.state_id) {
            const filtered = divisions?.filter(division => {
                const divisionStateId = division.state_id?._id || division.state_id;
                return divisionStateId === formData.state_id;
            }) || [];
            setFilteredDivisions(filtered);

            if (formData.division_id && !filtered.find(d => d._id === formData.division_id)) {
                setFormData(prev => ({
                    ...prev,
                    division_id: '',
                    parliament_id: '',
                    assembly_id: '',
                    district_id: '',
                    block_id: '',
                    booth_id: ''
                }));
            }
        } else {
            setFilteredDivisions([]);
            setFormData(prev => ({
                ...prev,
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                district_id: '',
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.state_id, divisions]);

    // Division -> Parliament
    useEffect(() => {
        if (formData.division_id) {
            const filtered = parliaments?.filter(parliament => {
                const parliamentDivisionId = parliament.division_id?._id || parliament.division_id;
                return parliamentDivisionId === formData.division_id;
            }) || [];
            setFilteredParliaments(filtered);

            if (formData.parliament_id && !filtered.find(p => p._id === formData.parliament_id)) {
                setFormData(prev => ({
                    ...prev,
                    parliament_id: '',
                    assembly_id: '',
                    district_id: '',
                    block_id: '',
                    booth_id: ''
                }));
            }
        } else {
            setFilteredParliaments([]);
            setFormData(prev => ({
                ...prev,
                parliament_id: '',
                assembly_id: '',
                district_id: '',
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.division_id, parliaments]);

    // Parliament -> Assembly
    useEffect(() => {
        if (formData.parliament_id) {
            const filtered = assemblies?.filter(assembly => {
                const assemblyParliamentId = assembly.parliament_id?._id || assembly.parliament_id;
                return assemblyParliamentId === formData.parliament_id;
            }) || [];
            setFilteredAssemblies(filtered);

            if (formData.assembly_id && !filtered.find(a => a._id === formData.assembly_id)) {
                setFormData(prev => ({
                    ...prev,
                    assembly_id: '',
                    district_id: '',
                    block_id: '',
                    booth_id: ''
                }));
            }
        } else {
            setFilteredAssemblies([]);
            setFormData(prev => ({
                ...prev,
                assembly_id: '',
                district_id: '',
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.parliament_id, assemblies]);

    // Assembly -> District
    useEffect(() => {
        if (formData.assembly_id) {
            const filtered = districts?.filter(district => {
                const districtAssemblyId = district.assembly_id?._id || district.assembly_id;
                return districtAssemblyId === formData.assembly_id;
            }) || [];
            setFilteredDistricts(filtered);

            if (formData.district_id && !filtered.find(d => d._id === formData.district_id)) {
                setFormData(prev => ({ ...prev, district_id: '', block_id: '', booth_id: '' }));
            }
        } else {
            setFilteredDistricts([]);
            setFormData(prev => ({ ...prev, district_id: '', block_id: '', booth_id: '' }));
        }
    }, [formData.assembly_id, districts]);

    // District -> Blocks
    useEffect(() => {
        if (formData.district_id) {
            const filtered = blocks?.filter(block => {
                const blockDistrictId = block.district_id?._id || block.district_id;
                return blockDistrictId === formData.district_id;
            }) || [];
            setFilteredBlocks(filtered);

            if (formData.block_id && !filtered.find(b => b._id === formData.block_id)) {
                setFormData(prev => ({ ...prev, block_id: '', booth_id: '' }));
            }
        } else {
            setFilteredBlocks([]);
            setFormData(prev => ({ ...prev, block_id: '', booth_id: '' }));
        }
    }, [formData.district_id, blocks]);

    // Block -> Booths
    useEffect(() => {
        if (formData.block_id) {
            const filtered = booths?.filter(booth => {
                const boothBlockId = booth.block_id?._id || booth.block_id;
                return boothBlockId === formData.block_id;
            }) || [];
            setFilteredBooths(filtered);

            if (formData.booth_id && !filtered.find(b => b._id === formData.booth_id)) {
                setFormData(prev => ({ ...prev, booth_id: '' }));
            }
        } else {
            setFilteredBooths([]);
            setFormData(prev => ({ ...prev, booth_id: '' }));
        }
    }, [formData.block_id, booths]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        const requiredFields = [
            'name', 'contact_number', 'full_address',
            'state_id', 'division_id', 'parliament_id',
            'assembly_id', 'district_id', 'block_id', 'booth_id'
        ];
        
        for (const field of requiredFields) {
            if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
                return;
            }
        }

        const method = influencer ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = influencer
            ? `http://localhost:5000/api/influencers/${influencer._id}`
            : 'http://localhost:5000/api/influencers';

        let userId = user?._id || user?.id;
        if (!userId) {
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                userId = localUser._id || localUser.id;
            } catch (e) {
                console.error('Failed to parse localStorage user:', e);
            }
        }

        const userTracking = influencer ? { updated_by: userId } : { created_by: userId };
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
                console.error('Failed to submit influencer:', errorData);
                alert('Failed to save influencer. Please check the form data.');
            }
        } catch (error) {
            console.error('Error submitting influencer:', error);
            alert('An error occurred while saving the influencer.');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{influencer ? 'Edit Influencer' : 'Add Influencer'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    {/* Row 1: Name and Contact Number */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Name</InputLabel>
                            <TextField
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.name}
                                helperText={submitted && !formData.name ? 'Name is required' : ''}
                                placeholder="Enter influencer name"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Contact Number</InputLabel>
                            <TextField
                                name="contact_number"
                                value={formData.contact_number}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.contact_number}
                                helperText={submitted && !formData.contact_number ? 'Contact number is required' : ''}
                                placeholder="Enter contact number"
                            />
                        </Stack>
                    </Grid>

                    {/* Row 2: Alternate Number and Email */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Alternate Number</InputLabel>
                            <TextField
                                name="alternate_number"
                                value={formData.alternate_number}
                                onChange={handleChange}
                                fullWidth
                                placeholder="Enter alternate number"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Email</InputLabel>
                            <TextField
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                fullWidth
                                type="email"
                                placeholder="Enter email address"
                            />
                        </Stack>
                    </Grid>

                    {/* Row 3: Full Address */}
                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel required>Full Address</InputLabel>
                            <TextField
                                name="full_address"
                                value={formData.full_address}
                                onChange={handleChange}
                                fullWidth
                                required
                                multiline
                                rows={3}
                                error={submitted && !formData.full_address}
                                helperText={submitted && !formData.full_address ? 'Full address is required' : ''}
                                placeholder="Enter full address"
                            />
                        </Stack>
                    </Grid>

                    {/* Row 4: State and Division */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>State</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.state_id}>
                                <Select
                                    name="state_id"
                                    value={formData.state_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <MenuItem value="">Select State</MenuItem>
                                    {states?.map((state) => (
                                        <MenuItem key={state._id} value={state._id}>
                                            {state.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.state_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>State is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Division</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.division_id}>
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
                            </FormControl>
                            {submitted && !formData.division_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Division is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    {/* Row 5: Parliament and Assembly */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Parliament</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.parliament_id}>
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
                            </FormControl>
                            {submitted && !formData.parliament_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Parliament is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Assembly</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.assembly_id}>
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
                            </FormControl>
                            {submitted && !formData.assembly_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Assembly is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    {/* Row 6: District and Block */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>District</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.district_id}>
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
                            </FormControl>
                            {submitted && !formData.district_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>District is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Block</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.block_id}>
                                <Select
                                    name="block_id"
                                    value={formData.block_id}
                                    onChange={handleChange}
                                    required
                                    disabled={!formData.district_id}
                                >
                                    <MenuItem value="">Select Block</MenuItem>
                                    {filteredBlocks.map((block) => (
                                        <MenuItem key={block._id} value={block._id}>
                                            {block.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.block_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Block is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    {/* Row 7: Booth */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Booth</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.booth_id}>
                                <Select
                                    name="booth_id"
                                    value={formData.booth_id}
                                    onChange={handleChange}
                                    required
                                    disabled={!formData.block_id}
                                >
                                    <MenuItem value="">Select Booth</MenuItem>
                                    {filteredBooths.map((booth) => (
                                        <MenuItem key={booth._id} value={booth._id}>
                                            {booth.name} (Booth #{booth.booth_number})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.booth_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Booth is required</Box>
                            )}
                        </Stack>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {influencer ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}