import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    Switch, FormControlLabel, Chip, Box
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import JWTContext from 'contexts/JWTContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function AssemblyModal({
    open,
    modalToggler,
    assembly,
    states,
    divisions,
    parliaments,
    refresh
}) {
    const contextValue = useContext(JWTContext);
    const { user } = contextValue || {};

    const [formData, setFormData] = useState({
        name: '',
        AC_NO: '',
        description: '',
        type: 'Urban',
        category: 'General',
        state_id: '',
        division_id: '',
        parliament_id: ''
    });
    const [submitted, setSubmitted] = useState(false);

    // Filtered arrays for cascading dropdowns
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);

    const typeOptions = ['Urban', 'Rural', 'Mixed'];
    const categoryOptions = ['General', 'Reserved', 'Special'];

    useEffect(() => {
        if (assembly) {
            setFormData({
                name: assembly.name || '',
                AC_NO: assembly.AC_NO || '',
                description: assembly.description || '',
                type: assembly.type || 'Urban',
                category: assembly.category || 'General',
                state_id: assembly.state_id?._id || assembly.state_id || '',
                division_id: assembly.division_id?._id || assembly.division_id || '',
                parliament_id: assembly.parliament_id?._id || assembly.parliament_id || ''
            });
        } else {
            setFormData({
                name: '',
                AC_NO: '',
                description: '',
                type: 'Urban',
                category: 'General',
                state_id: '',
                division_id: '',
                parliament_id: ''
            });
        }
    }, [assembly]);

    // State -> Division
    useEffect(() => {
        if (formData.state_id) {
            // Filter divisions for selected state
            const filtered = divisions?.filter(div => {
                const divStateId = div.state_id?._id || div.state_id;
                return divStateId === formData.state_id;
            }) || [];
            setFilteredDivisions(filtered);

            // If selected division is not in filtered, reset
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
    // Rich text editor change handler
    const handleDescriptionChange = (value) => {
        setFormData((prev) => ({ ...prev, description: value }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        // Validation
        const requiredFields = ['name', 'AC_NO', 'type', 'category', 'state_id', 'division_id', 'parliament_id'];
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

        const submitData = {
            ...formData,
            ...(assembly ? { updated_by: userId } : { created_by: userId })
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
                alert(errorData?.message || 'Failed to save assembly. Please check the form data.');
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
                    {/* Row 1: Name and AC_NO */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Assembly Name</InputLabel>
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
                            <InputLabel required>Assembly AC_NO</InputLabel>
                            <TextField
                                name="AC_NO"
                                value={formData.AC_NO}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.AC_NO}
                                helperText={submitted && !formData.AC_NO ? 'AC_NO is required' : ''}
                                placeholder="Enter assembly AC_NO"
                            />
                        </Stack>
                    </Grid>

                    {/* Row 2: Description Rich Text Editor */}
                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel>Description</InputLabel>
                            <ReactQuill
                                theme="snow"
                                value={formData.description}
                                onChange={handleDescriptionChange}
                                placeholder="Enter description (optional)"
                                style={{ minHeight: 120 }}
                            />
                        </Stack>
                    </Grid>

                    {/* Row 3: Type and Category */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Type</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.type}>
                                <Select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    required
                                >
                                    {typeOptions.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.type && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Type is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Category</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.category}>
                                <Select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >
                                    {categoryOptions.map((category) => (
                                        <MenuItem key={category} value={category}>
                                            {category}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.category && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Category is required</Box>
                            )}
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

                    {/* Row 5: Parliament */}
                    <Grid item xs={12}>
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
