import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl, Box, Typography
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import JWTContext from 'contexts/JWTContext';

export default function BoothModal({
    open,
    modalToggler,
    booth,
    states,
    divisions,
    parliaments,
    assemblies,
    blocks,
    users,
    refresh
}) {
    const contextValue = useContext(JWTContext);
    const { user } = contextValue || {};

    const [formData, setFormData] = useState({
        name: '',
        booth_number: '',
        full_address: '',
        latitude: 0,
        longitude: 0,
        Male_Count: 0,
        Female_Count: 0,
        others_Count: 0,
        Total: 0,
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        polygon: null
    });
    const [fileName, setFileName] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Filtered arrays for cascading dropdowns
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);

    useEffect(() => {
        if (booth && Array.isArray(states) && states.length > 0) {
            setFormData({
                name: booth.name || '',
                booth_number: booth.booth_number || '',
                full_address: booth.full_address || '',
                latitude: booth.latitude || 0,
                longitude: booth.longitude || 0,
                Male_Count: booth.Male_Count || 0,
                Female_Count: booth.Female_Count || 0,
                others_Count: booth.others_Count || 0,
                Total: booth.Total || 0,
                state_id: booth.state_id?._id?.toString() || booth.state_id?.toString() || '',
                division_id: booth.division_id?._id?.toString() || booth.division_id?.toString() || '',
                parliament_id: booth.parliament_id?._id?.toString() || booth.parliament_id?.toString() || '',
                assembly_id: booth.assembly_id?._id?.toString() || booth.assembly_id?.toString() || '',
                block_id: booth.block_id?._id?.toString() || booth.block_id?.toString() || ''
            });
        } else if (!booth) {
            setFormData({
                name: '',
                booth_number: '',
                full_address: '',
                latitude: 0,
                longitude: 0,
                Male_Count: 0,
                Female_Count: 0,
                others_Count: 0,
                Total: 0,
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                polygon: null
            });
            setFileName('');
        }
    }, [booth, states]);

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
                    block_id: ''
                }));
            }
        } else {
            setFilteredDivisions([]);
            setFormData(prev => ({
                ...prev,
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: ''
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
                    block_id: ''
                }));
            }
        } else {
            setFilteredParliaments([]);
            setFormData(prev => ({
                ...prev,
                parliament_id: '',
                assembly_id: '',
                block_id: ''
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
                    block_id: ''
                }));
            }
        } else {
            setFilteredAssemblies([]);
            setFormData(prev => ({
                ...prev,
                assembly_id: '',
                block_id: ''
            }));
        }
    }, [formData.parliament_id, assemblies]);

    // Assembly -> Block
    useEffect(() => {
        if (formData.assembly_id) {
            const filtered = blocks?.filter(block => {
                const blockAssemblyId = block.assembly_id?._id || block.assembly_id;
                return blockAssemblyId === formData.assembly_id;
            }) || [];
            setFilteredBlocks(filtered);

            if (formData.block_id && !filtered.find(b => b._id === formData.block_id)) {
                setFormData(prev => ({
                    ...prev,
                    block_id: ''
                }));
            }
        } else {
            setFilteredBlocks([]);
            setFormData(prev => ({
                ...prev,
                block_id: ''
            }));
        }
    }, [formData.assembly_id, blocks]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);

        try {
            const text = await file.text();
            const json = JSON.parse(text);

            let feature = null;
            if (json.type === 'FeatureCollection' && json.features?.length > 0) {
                feature = json.features[0];
            } else if (json.type === 'Feature') {
                feature = json;
            } else if (json.type === 'Polygon' || json.type === 'MultiPolygon') {
                feature = {
                    type: "Feature",
                    geometry: json,
                    properties: {}
                };
            }

            if (feature && feature.geometry) {
                setFormData(prev => ({ ...prev, polygon: feature }));
            } else {
                alert('Invalid GeoJSON: Could not find valid Feature or Geometry');
                setFileName('');
            }
        } catch (err) {
            console.error('Error reading geojson:', err);
            alert('Invalid JSON file');
            setFileName('');
        }
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        const requiredFields = ['name', 'booth_number', 'state_id', 'division_id', 'parliament_id', 'assembly_id', 'block_id'];
        for (const field of requiredFields) {
            if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
                return;
            }
        }

        const method = booth ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = booth
            ? `${import.meta.env.VITE_APP_API_URL}/booths/${booth._id}`
            : `${import.meta.env.VITE_APP_API_URL}/booths`;

        let userId = user?._id || user?.id;
        if (!userId) {
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                userId = localUser._id || localUser.id;
            } catch (e) {
                console.error('Failed to parse localStorage user:', e);
            }
        }

        const userTracking = booth ? { updated_by: userId } : { created_by: userId };
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
                console.error('Failed to submit booth:', errorData);
                alert('Failed to save booth. Please check the form data.');
            }
        } catch (error) {
            console.error('Error submitting booth:', error);
            alert('An error occurred while saving the booth.');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{booth ? 'Edit Booth' : 'Add Booth'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Booth Name <span style={{ color: 'red' }}>*</span></InputLabel>
                            <TextField
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.name}
                                helperText={submitted && !formData.name ? 'Booth name is required' : ''}
                                placeholder="Enter booth name"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Booth Number <span style={{ color: 'red' }}>*</span></InputLabel>
                            <TextField
                                name="booth_number"
                                type="number"
                                value={formData.booth_number}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.booth_number}
                                helperText={submitted && !formData.booth_number ? 'Booth number is required' : ''}
                                placeholder="Enter booth number"
                                inputProps={{ min: 1 }}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel>Full Address</InputLabel>
                            <TextField
                                name="full_address"
                                value={formData.full_address}
                                onChange={handleChange}
                                fullWidth
                                placeholder="Enter full address"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Latitude</InputLabel>
                            <TextField
                                name="latitude"
                                type="number"
                                value={formData.latitude}
                                onChange={handleChange}
                                fullWidth
                                placeholder="Enter latitude"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Longitude</InputLabel>
                            <TextField
                                name="longitude"
                                type="number"
                                value={formData.longitude}
                                onChange={handleChange}
                                fullWidth
                                placeholder="Enter longitude"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <Stack spacing={1}>
                            <InputLabel>Male Count</InputLabel>
                            <TextField
                                name="Male_Count"
                                type="number"
                                value={formData.Male_Count}
                                onChange={handleChange}
                                fullWidth
                                inputProps={{ min: 0 }}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <Stack spacing={1}>
                            <InputLabel>Female Count</InputLabel>
                            <TextField
                                name="Female_Count"
                                type="number"
                                value={formData.Female_Count}
                                onChange={handleChange}
                                fullWidth
                                inputProps={{ min: 0 }}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <Stack spacing={1}>
                            <InputLabel>Total Count</InputLabel>
                            <TextField
                                name="Total"
                                type="number"
                                value={formData.Total}
                                onChange={handleChange}
                                fullWidth
                                inputProps={{ min: 0 }}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>State <span style={{ color: 'red' }}>*</span></InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.state_id}>
                                <Select name="state_id" value={formData.state_id} onChange={handleChange} required>
                                    <MenuItem value="">Select State</MenuItem>
                                    {states?.map((state) => (
                                        <MenuItem key={state._id} value={state._id}>{state.name}</MenuItem>
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
                            <InputLabel>Division <span style={{ color: 'red' }}>*</span></InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.division_id}>
                                <Select name="division_id" value={formData.division_id} onChange={handleChange} required disabled={!formData.state_id}>
                                    <MenuItem value="">Select Division</MenuItem>
                                    {filteredDivisions.map((division) => (
                                        <MenuItem key={division._id} value={division._id}>{division.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.division_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Division is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Parliament <span style={{ color: 'red' }}>*</span></InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.parliament_id}>
                                <Select name="parliament_id" value={formData.parliament_id} onChange={handleChange} required disabled={!formData.division_id}>
                                    <MenuItem value="">Select Parliament</MenuItem>
                                    {filteredParliaments.map((parliament) => (
                                        <MenuItem key={parliament._id} value={parliament._id}>{parliament.name}</MenuItem>
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
                            <InputLabel>Assembly <span style={{ color: 'red' }}>*</span></InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.assembly_id}>
                                <Select name="assembly_id" value={formData.assembly_id} onChange={handleChange} required disabled={!formData.parliament_id}>
                                    <MenuItem value="">Select Assembly</MenuItem>
                                    {filteredAssemblies.map((assembly) => (
                                        <MenuItem key={assembly._id} value={assembly._id}>{assembly.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.assembly_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Assembly is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Block <span style={{ color: 'red' }}>*</span></InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.block_id}>
                                <Select name="block_id" value={formData.block_id} onChange={handleChange} required disabled={!formData.assembly_id}>
                                    <MenuItem value="">Select Block</MenuItem>
                                    {filteredBlocks.map((block) => (
                                        <MenuItem key={block._id} value={block._id}>{block.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.block_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Block is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel>Booth Polygon (GeoJSON)</InputLabel>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <Button variant="outlined" component="label">
                                    Upload File
                                    <input type="file" hidden accept=".json,.geojson" onChange={handleFileChange} />
                                </Button>
                                <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {fileName || (booth?.polygon ? 'Polygon Exists' : 'No file selected')}
                                </Typography>
                                {(fileName || booth?.polygon) && (
                                    <Button variant="outlined" color="error" size="small" onClick={() => {
                                        setFormData(prev => ({ ...prev, polygon: null }));
                                        setFileName('');
                                    }}>
                                        Delete Polygon
                                    </Button>
                                )}
                            </Box>
                        </Stack>
                    </Grid>
                </Grid>
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
