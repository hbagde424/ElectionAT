import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl, Box, Typography
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import JWTContext from 'contexts/JWTContext';

export default function AssemblyModal({
    open,
    modalToggler,
    assembly,
    states,
    divisions,
    parliaments,
    users,
    refresh
}) {
    const contextValue = useContext(JWTContext);
    const { user } = contextValue || {};

    const [formData, setFormData] = useState({
        name: '',
        AC_NO: '',
        type: 'Urban',
        category: 'General',
        state_id: '',
        division_id: '',
        parliament_id: '',
        description: '',
        polygon: null
    });
    const [fileName, setFileName] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);

    const typeOptions = ['Urban', 'Rural', 'Semi-Urban', 'Tribal'];
    const categoryOptions = ['General', 'SC', 'ST', 'OBC'];

    useEffect(() => {
        if (assembly && Array.isArray(states) && states.length > 0) {
            setFormData({
                name: assembly.name || '',
                AC_NO: assembly.AC_NO || '',
                type: assembly.type || 'Urban',
                category: assembly.category || 'General',
                state_id: assembly.state_id?._id?.toString() || assembly.state_id?.toString() || '',
                division_id: assembly.division_id?._id?.toString() || assembly.division_id?.toString() || '',
                parliament_id: assembly.parliament_id?._id?.toString() || assembly.parliament_id?.toString() || '',
                description: assembly.description || ''
            });
        } else if (!assembly) {
            setFormData({
                name: '',
                AC_NO: '',
                type: 'Urban',
                category: 'General',
                state_id: '',
                division_id: '',
                parliament_id: '',
                description: '',
                polygon: null
            });
            setFileName('');
        }
    }, [assembly, states]);

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
                    parliament_id: ''
                }));
            }
        } else {
            setFilteredDivisions([]);
            setFormData(prev => ({
                ...prev,
                division_id: '',
                parliament_id: ''
            }));
        }
    }, [formData.state_id, divisions]);

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
                    parliament_id: ''
                }));
            }
        } else {
            setFilteredParliaments([]);
            setFormData(prev => ({
                ...prev,
                parliament_id: ''
            }));
        }
    }, [formData.division_id, parliaments]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleDescriptionChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            description: value
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
        const requiredFields = ['name', 'AC_NO', 'state_id', 'division_id', 'parliament_id'];
        for (const field of requiredFields) {
            if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
                return;
            }
        }

        const method = assembly ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = assembly
            ? `${import.meta.env.VITE_APP_API_URL}/assemblies/${assembly._id}`
            : `${import.meta.env.VITE_APP_API_URL}/assemblies`;

        let userId = user?._id || user?.id;
        if (!userId) {
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                userId = localUser._id || localUser.id;
            } catch (e) {
                console.error('Failed to parse localStorage user:', e);
            }
        }

        const userTracking = assembly ? { updated_by: userId } : { created_by: userId };
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
                console.error('Failed to submit assembly:', errorData);
                alert('Failed to save assembly. Please check the form data.');
            }
        } catch (error) {
            console.error('Error submitting assembly:', error);
            alert('An error occurred while saving the assembly.');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{assembly ? 'Edit Assembly' : 'Add Assembly'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Assembly Name <span style={{ color: 'red' }}>*</span></InputLabel>
                            <TextField
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.name}
                                helperText={submitted && !formData.name ? 'Assembly name is required' : ''}
                                placeholder="Enter assembly name"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>AC Number <span style={{ color: 'red' }}>*</span></InputLabel>
                            <TextField
                                name="AC_NO"
                                type="number"
                                value={formData.AC_NO}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.AC_NO}
                                helperText={submitted && !formData.AC_NO ? 'AC number is required' : ''}
                                placeholder="Enter AC number"
                                inputProps={{ min: 1 }}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Type <span style={{ color: 'red' }}>*</span></InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.type}>
                                <Select name="type" value={formData.type} onChange={handleChange} required>
                                    {typeOptions.map((type) => (
                                        <MenuItem key={type} value={type}>{type}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Category <span style={{ color: 'red' }}>*</span></InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.category}>
                                <Select name="category" value={formData.category} onChange={handleChange} required>
                                    {categoryOptions.map((category) => (
                                        <MenuItem key={category} value={category}>{category}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
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

                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel>Assembly Polygon (GeoJSON)</InputLabel>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <Button variant="outlined" component="label">
                                    Upload File
                                    <input type="file" hidden accept=".json,.geojson" onChange={handleFileChange} />
                                </Button>
                                <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {fileName || (assembly?.polygon ? 'Polygon Exists' : 'No file selected')}
                                </Typography>
                                {(fileName || assembly?.polygon) && (
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

                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel>Description</InputLabel>
                            <ReactQuill
                                value={formData.description}
                                onChange={handleDescriptionChange}
                                theme="snow"
                                placeholder="Enter assembly description..."
                            />
                        </Stack>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {assembly ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
