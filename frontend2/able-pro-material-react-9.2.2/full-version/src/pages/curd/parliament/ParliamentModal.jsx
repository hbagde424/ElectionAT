import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    Chip, Box
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import JWTContext from 'contexts/JWTContext';

export default function ParliamentModal({
    open,
    modalToggler,
    parliament,
    states,
    divisions,
    assemblies,
    refresh
}) {
    const contextValue = useContext(JWTContext);
    const { user } = contextValue || {};

    const [formData, setFormData] = useState({
        name: '',
        category: 'general',
        regional_type: 'urban',
        state_id: '',
        division_id: '',
        assembly_id: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);

    const categoryOptions = ['general', 'reserved', 'special'];
    const regionalTypeOptions = ['urban', 'rural', 'mixed'];

    useEffect(() => {
        if (parliament) {
            setFormData({
                name: parliament.name || '',
                category: parliament.category || 'general',
                regional_type: parliament.regional_type || 'urban',
                state_id: parliament.state_id?._id?.toString() || parliament.state_id?.toString() || '',
                division_id: parliament.division_id?._id?.toString() || parliament.division_id?.toString() || '',
                assembly_id: parliament.assembly_id?._id?.toString() || parliament.assembly_id?.toString() || ''
            });
        } else {
            setFormData({
                name: '',
                category: 'general',
                regional_type: 'urban',
                state_id: '',
                division_id: '',
                assembly_id: ''
            });
        }
    }, [parliament]);

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
                    assembly_id: ''
                }));
            }
        } else {
            setFilteredDivisions([]);
            setFormData(prev => ({
                ...prev,
                division_id: '',
                assembly_id: ''
            }));
        }
    }, [formData.state_id, divisions]);

    // Division -> Assembly
    useEffect(() => {
        if (formData.division_id) {
            const filtered = assemblies?.filter(assembly => {
                const assemblyDivisionId = assembly.division_id?._id || assembly.division_id;
                return assemblyDivisionId === formData.division_id;
            }) || [];
            setFilteredAssemblies(filtered);

            if (formData.assembly_id && !filtered.find(a => a._id === formData.assembly_id)) {
                setFormData(prev => ({
                    ...prev,
                    assembly_id: ''
                }));
            }
        } else {
            setFilteredAssemblies([]);
            setFormData(prev => ({
                ...prev,
                assembly_id: ''
            }));
        }
    }, [formData.division_id, assemblies]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        const requiredFields = ['name', 'category', 'regional_type', 'state_id', 'division_id'];
        for (const field of requiredFields) {
            if (!formData[field]) return;
        }

        const method = parliament ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = parliament 
            ? `http://localhost:5000/api/parliaments/${parliament._id}`
            : 'http://localhost:5000/api/parliaments';

        let userId = user?._id || user?.id;
        if (!userId) {
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                userId = localUser._id || localUser.id;
            } catch (e) {
                console.error('Failed to parse user from localStorage:', e);
            }
        }

        const submitData = {
            ...formData,
            ...(parliament ? { updated_by: userId } : { created_by: userId })
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
                    {/* Row 1: Name */}
                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel required>Parliament Name</InputLabel>
                            <TextField
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.name}
                                helperText={submitted && !formData.name ? 'Name is required' : ''}
                            />
                        </Stack>
                    </Grid>

                    {/* Row 2: Category and Regional Type */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Category</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.category}>
                                <Select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                >
                                    {categoryOptions.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {option.charAt(0).toUpperCase() + option.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Regional Type</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.regional_type}>
                                <Select
                                    name="regional_type"
                                    value={formData.regional_type}
                                    onChange={handleChange}
                                >
                                    {regionalTypeOptions.map(option => (
                                        <MenuItem key={option} value={option}>
                                            {option.charAt(0).toUpperCase() + option.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
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
                                >
                                    <MenuItem value="">Select State</MenuItem>
                                    {states?.map(state => (
                                        <MenuItem key={state._id} value={state._id}>
                                            {state.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
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

                    {/* Row 4: Assembly (Optional) */}
                    {/* <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel>Assembly (Optional)</InputLabel>
                            <FormControl fullWidth>
                                <Select
                                    name="assembly_id"
                                    value={formData.assembly_id}
                                    onChange={handleChange}
                                    disabled={!formData.division_id}
                                >
                                    <MenuItem value="">Select Assembly (Optional)</MenuItem>
                                    {filteredAssemblies.map(assembly => (
                                        <MenuItem key={assembly._id} value={assembly._id}>
                                            {assembly.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid> */}
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