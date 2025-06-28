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
    Grid
} from '@mui/material';
import { useEffect, useState } from 'react';

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

    useEffect(() => {
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
    }, [block]);

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
        setFormData(prev => {
            // Reset dependent fields when parent changes
            if (name === 'state_id') {
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
                return { 
                    ...prev, 
                    [name]: value, 
                    parliament_id: '', 
                    assembly_id: '',
                    district_id: '' 
                };
            }
            if (name === 'parliament_id') {
                return { 
                    ...prev, 
                    [name]: value, 
                    assembly_id: '',
                    district_id: '' 
                };
            }
            if (name === 'assembly_id') {
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
        const method = block ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = block
            ? `http://localhost:5000/api/blocks/${block._id}`
            : 'http://localhost:5000/api/blocks';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            modalToggler(false);
            refresh();
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{block ? 'Edit Block' : 'Add Block'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} mt={2}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Block Name</InputLabel>
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
                                <InputLabel>Category</InputLabel>
                                <FormControl fullWidth>
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
                                </FormControl>
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
                                        {states.map((state) => (
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
                                        {filteredDivisions.map((division) => (
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
                                        {filteredParliaments.map((parliament) => (
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
                                        {filteredAssemblies.map((assembly) => (
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
                                        {filteredDistricts.map((district) => (
                                            <MenuItem key={district._id} value={district._id}>
                                                {district.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
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
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {block ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}