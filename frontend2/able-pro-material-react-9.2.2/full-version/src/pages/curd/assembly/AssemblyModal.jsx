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
    FormControl
} from '@mui/material';
import { useEffect, useState } from 'react';

export default function AssemblyModal({ 
    open, 
    modalToggler, 
    assembly, 
    states, 
    districts, 
    divisions, 
    parliaments,
    refresh 
}) {
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        category: 'General',
        state_id: '',
        district_id: null, // Changed to null for optional field
        division_id: '',
        parliament_id: ''
    });

    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);

    useEffect(() => {
        if (assembly) {
            setFormData({
                name: assembly.name || '',
                type: assembly.type || '',
                category: assembly.category || 'General',
                state_id: assembly.state_id?._id || '',
                district_id: assembly.district_id?._id || null, // Handle null for empty value
                division_id: assembly.division_id?._id || '',
                parliament_id: assembly.parliament_id?._id || ''
            });
        } else {
            setFormData({
                name: '',
                type: '',
                category: 'General',
                state_id: '',
                district_id: null, // Initialize as null
                division_id: '',
                parliament_id: ''
            });
        }
    }, [assembly]);

    useEffect(() => {
        if (formData.state_id) {
            // Get divisions directly by state_id (bypassing district)
            const filtered = divisions.filter(div => div.state_id?._id === formData.state_id);
            setFilteredDivisions(filtered);
        } else {
            setFilteredDivisions([]);
            setFormData(prev => ({ ...prev, division_id: '', parliament_id: '' }));
        }
    }, [formData.state_id, divisions]);

    useEffect(() => {
        if (formData.division_id) {
            const filtered = parliaments.filter(par => par.division_id?._id === formData.division_id);
            setFilteredParliaments(filtered);
        } else {
            setFilteredParliaments([]);
            setFormData(prev => ({ ...prev, parliament_id: '' }));
        }
    }, [formData.division_id, parliaments]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            // Reset dependent fields when parent changes
            if (name === 'state_id') {
                return { 
                    ...prev, 
                    [name]: value, 
                    district_id: null, // Reset to null
                    division_id: '', 
                    parliament_id: '' 
                };
            }
            if (name === 'division_id') {
                return { ...prev, [name]: value, parliament_id: '' };
            }
            // Handle empty district_id selection
            if (name === 'district_id') {
                return { ...prev, [name]: value === '' ? null : value };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleSubmit = async () => {
        const method = assembly ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = assembly
            ? `http://localhost:5000/api/assemblies/${assembly._id}`
            : 'http://localhost:5000/api/assemblies';

        // Create payload without district_id if it's null
        const payload = {
            ...formData,
            district_id: formData.district_id || undefined // Send undefined instead of null
        };

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
            console.error('Submission failed:', errorData);
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="sm">
            <DialogTitle>{assembly ? 'Edit Assembly' : 'Add Assembly'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} mt={2}>
                    <Stack spacing={1}>
                        <InputLabel>Assembly Name</InputLabel>
                        <TextField 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            fullWidth 
                            required
                        />
                    </Stack>

                    <Stack spacing={1}>
                        <InputLabel>Type</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                required
                            >
                                <MenuItem value="">Select Type</MenuItem>
                                <MenuItem value="Urban">Urban</MenuItem>
                                <MenuItem value="Rural">Rural</MenuItem>
                                <MenuItem value="Mixed">Mixed</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>

                    <Stack spacing={1}>
                        <InputLabel>Category</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                <MenuItem value="General">General</MenuItem>
                                <MenuItem value="Reserved">Reserved</MenuItem>
                                <MenuItem value="Special">Special</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>

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

                    {/* <Stack spacing={1}>
                        <InputLabel>District (Optional)</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="district_id"
                                value={formData.district_id || ''} // Handle null value
                                onChange={handleChange}
                                disabled={!formData.state_id}
                            >
                                <MenuItem value="">Select District (Optional)</MenuItem>
                                {districts.filter(d => d.state_id?._id === formData.state_id).map((district) => (
                                    <MenuItem key={district._id} value={district._id}>
                                        {district.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack> */}

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
                </Stack>
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