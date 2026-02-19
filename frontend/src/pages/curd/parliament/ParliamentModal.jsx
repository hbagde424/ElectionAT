import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl, Box, Typography
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import JWTContext from 'contexts/JWTContext';

export default function ParliamentModal({
    open,
    modalToggler,
    parliament,
    states,
    divisions,
    users,
    refresh
}) {
    const contextValue = useContext(JWTContext);
    const { user } = contextValue || {};

    const [formData, setFormData] = useState({
        name: '',
        parliament_no: '',
        category: 'General',
        regional_type: 'Urban',
        state_id: '',
        division_id: '',
        description: '',
        polygon: null
    });
    const [fileName, setFileName] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const [filteredDivisions, setFilteredDivisions] = useState([]);

    const categoryOptions = ['General', 'SC', 'ST', 'OBC'];
    const regionalTypeOptions = ['Urban', 'Rural', 'Semi-Urban', 'Tribal'];

    useEffect(() => {
        if (parliament && Array.isArray(states) && states.length > 0) {
            setFormData({
                name: parliament.name || '',
                parliament_no: parliament.parliament_no || '',
                category: parliament.category || 'General',
                regional_type: parliament.regional_type || 'Urban',
                state_id: parliament.state_id?._id?.toString() || parliament.state_id?.toString() || '',
                division_id: parliament.division_id?._id?.toString() || parliament.division_id?.toString() || '',
                description: parliament.description || ''
            });
        } else if (!parliament) {
            setFormData({
                name: '',
                parliament_no: '',
                category: 'General',
                regional_type: 'Urban',
                state_id: '',
                division_id: '',
                description: '',
                polygon: null
            });
            setFileName('');
        }
    }, [parliament, states]);

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
                    division_id: ''
                }));
            }
        } else {
            setFilteredDivisions([]);
            setFormData(prev => ({
                ...prev,
                division_id: ''
            }));
        }
    }, [formData.state_id, divisions]);

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
        const requiredFields = ['name', 'parliament_no', 'state_id', 'division_id'];
        for (const field of requiredFields) {
            if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
                return;
            }
        }

        const method = parliament ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = parliament
            ? `${import.meta.env.VITE_APP_API_URL}/parliaments/${parliament._id}`
            : `${import.meta.env.VITE_APP_API_URL}/parliaments`;

        let userId = user?._id || user?.id;
        if (!userId) {
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                userId = localUser._id || localUser.id;
            } catch (e) {
                console.error('Failed to parse localStorage user:', e);
            }
        }

        const userTracking = parliament ? { updated_by: userId } : { created_by: userId };
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
                console.error('Failed to submit parliament:', errorData);
                alert('Failed to save parliament. Please check the form data.');
            }
        } catch (error) {
            console.error('Error submitting parliament:', error);
            alert('An error occurred while saving the parliament.');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{parliament ? 'Edit Parliament' : 'Add Parliament'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Parliament Name <span style={{ color: 'red' }}>*</span></InputLabel>
                            <TextField
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.name}
                                helperText={submitted && !formData.name ? 'Parliament name is required' : ''}
                                placeholder="Enter parliament name"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>PC Number <span style={{ color: 'red' }}>*</span></InputLabel>
                            <TextField
                                name="parliament_no"
                                type="number"
                                value={formData.parliament_no}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.parliament_no}
                                helperText={submitted && !formData.parliament_no ? 'PC number is required' : ''}
                                placeholder="Enter PC number"
                                inputProps={{ min: 1 }}
                            />
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
                            <InputLabel>Regional Type <span style={{ color: 'red' }}>*</span></InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.regional_type}>
                                <Select name="regional_type" value={formData.regional_type} onChange={handleChange} required>
                                    {regionalTypeOptions.map((type) => (
                                        <MenuItem key={type} value={type}>{type}</MenuItem>
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

                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel>Parliament Polygon (GeoJSON)</InputLabel>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <Button variant="outlined" component="label">
                                    Upload File
                                    <input type="file" hidden accept=".json,.geojson" onChange={handleFileChange} />
                                </Button>
                                <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {fileName || (parliament?.polygon ? 'Polygon Exists' : 'No file selected')}
                                </Typography>
                                {(fileName || parliament?.polygon) && (
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
                                placeholder="Enter parliament description..."
                            />
                        </Stack>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {parliament ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
