import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    FormControlLabel, Switch, Box, Chip
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import { DatePicker } from '@mui/x-date-pickers';
import JWTContext from 'contexts/JWTContext';

export default function VisitModal({
    open,
    modalToggler,
    visit,
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
        person_name: '',
        post: '',
        date: new Date(),
        declaration: '',
        remark: '',
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        district_id: '',
        block_id: '',
        booth_id: '',
        is_active: true
    });

    const [submitted, setSubmitted] = useState(false);

    // Filtered arrays for cascading dropdowns
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredDistricts, setFilteredDistricts] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    useEffect(() => {
        if (visit) {
            setFormData({
                person_name: visit.person_name || '',
                post: visit.post || '',
                date: visit.date ? new Date(visit.date) : new Date(),
                declaration: visit.declaration || '',
                remark: visit.remark || '',
                state_id: visit.state_id?._id?.toString() || visit.state_id?.toString() || '',
                division_id: visit.division_id?._id?.toString() || visit.division_id?.toString() || '',
                parliament_id: visit.parliament_id?._id?.toString() || visit.parliament_id?.toString() || '',
                assembly_id: visit.assembly_id?._id?.toString() || visit.assembly_id?.toString() || '',
                district_id: visit.district_id?._id?.toString() || visit.district_id?.toString() || '',
                block_id: visit.block_id?._id?.toString() || visit.block_id?.toString() || '',
                booth_id: visit.booth_id?._id?.toString() || visit.booth_id?.toString() || '',
                is_active: visit.is_active !== undefined ? visit.is_active : true
            });
        } else {
            setFormData({
                person_name: '',
                post: '',
                date: new Date(),
                declaration: '',
                remark: '',
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                district_id: '',
                block_id: '',
                booth_id: '',
                is_active: true
            });
        }
    }, [visit]);

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
                setFormData(prev => ({
                    ...prev,
                    district_id: '',
                    block_id: '',
                    booth_id: ''
                }));
            }
        } else {
            setFilteredDistricts([]);
            setFormData(prev => ({
                ...prev,
                district_id: '',
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.assembly_id, districts]);

    // District -> Block
    useEffect(() => {
        if (formData.district_id) {
            const filtered = blocks?.filter(block => {
                const blockDistrictId = block.district_id?._id || block.district_id;
                return blockDistrictId === formData.district_id;
            }) || [];
            setFilteredBlocks(filtered);

            if (formData.block_id && !filtered.find(b => b._id === formData.block_id)) {
                setFormData(prev => ({
                    ...prev,
                    block_id: '',
                    booth_id: ''
                }));
            }
        } else {
            setFilteredBlocks([]);
            setFormData(prev => ({
                ...prev,
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.district_id, blocks]);

    // Block -> Booth
    useEffect(() => {
        if (formData.block_id) {
            const filtered = booths?.filter(booth => {
                const boothBlockId = booth.block_id?._id || booth.block_id;
                return boothBlockId === formData.block_id;
            }) || [];
            setFilteredBooths(filtered);

            if (formData.booth_id && !filtered.find(b => b._id === formData.booth_id)) {
                setFormData(prev => ({
                    ...prev,
                    booth_id: ''
                }));
            }
        } else {
            setFilteredBooths([]);
            setFormData(prev => ({
                ...prev,
                booth_id: ''
            }));
        }
    }, [formData.block_id, booths]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({
            ...prev,
            date: date
        }));
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        
        // Validation
        const requiredFields = [
            'person_name', 'post', 'date',
            'state_id', 'division_id', 'parliament_id',
            'assembly_id', 'district_id', 'block_id', 'booth_id'
        ];
        
        for (const field of requiredFields) {
            if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
                return;
            }
        }

        const method = visit ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = visit
            ? `http://localhost:5000/api/visits/${visit._id}`
            : 'http://localhost:5000/api/visits';

        // Get user ID from context or localStorage
        let userId = user?._id || user?.id;
        if (!userId) {
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                userId = localUser._id || localUser.id;
            } catch (e) {
                console.error('Failed to parse localStorage user:', e);
            }
        }

        const userTracking = visit 
            ? { updated_by: userId } 
            : { created_by: userId };
            
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
                console.error('Failed to submit visit:', errorData);
                alert('Failed to save visit. Please check the form data.');
            }
        } catch (error) {
            console.error('Error submitting visit:', error);
            alert('An error occurred while saving the visit.');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{visit ? 'Edit Visit' : 'Add Visit'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    {/* Row 1: Person Name and Post */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Person Name</InputLabel>
                            <TextField
                                name="person_name"
                                value={formData.person_name}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.person_name}
                                helperText={submitted && !formData.person_name ? 'Person name is required' : ''}
                                placeholder="Enter person name"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Post/Designation</InputLabel>
                            <TextField
                                name="post"
                                value={formData.post}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.post}
                                helperText={submitted && !formData.post ? 'Post is required' : ''}
                                placeholder="Enter post/designation"
                            />
                        </Stack>
                    </Grid>

                    {/* Row 2: Date and Status */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Visit Date</InputLabel>
                            <DatePicker
                                value={formData.date}
                                onChange={handleDateChange}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        required
                                        error={submitted && !formData.date}
                                        helperText={submitted && !formData.date ? 'Date is required' : ''}
                                    />
                                )}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControlLabel
                            control={
                                <Switch
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                />
                            }
                            label="Active"
                        />
                    </Grid>

                    {/* Row 3: State and Division */}
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

                    {/* Row 4: Parliament and Assembly */}
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

                    {/* Row 5: District and Block */}
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

                    {/* Row 6: Booth and Remarks */}
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

                    {/* Row 7: Declaration and Remark */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Declaration</InputLabel>
                            <TextField
                                name="declaration"
                                value={formData.declaration}
                                onChange={handleChange}
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Enter declaration"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel>Remark</InputLabel>
                            <TextField
                                name="remark"
                                value={formData.remark}
                                onChange={handleChange}
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Enter remark"
                            />
                        </Stack>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {visit ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}