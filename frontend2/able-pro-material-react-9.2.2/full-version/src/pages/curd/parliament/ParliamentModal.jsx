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

export default function ParliamentModal({ 
    open, 
    modalToggler, 
    parliament, 
    states, 
    divisions, 
    assemblies,
    refresh 
}) {
    const [formData, setFormData] = useState({
        name: '',
        state_id: '',
        division_id: '',
        assembly_id: null, // Changed to null to handle empty value
        category: '',
        regional_type: ''
    });

    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);

    useEffect(() => {
        if (parliament) {
            setFormData({
                name: parliament.name || '',
                state_id: parliament.state_id?._id || '',
                division_id: parliament.division_id?._id || '',
                assembly_id: parliament.assembly_id?._id || null, // Handle null for empty value
                category: parliament.category || '',
                regional_type: parliament.regional_type || ''
            });
        } else {
            setFormData({
                name: '',
                state_id: '',
                division_id: '',
                assembly_id: null, // Initialize as null
                category: '',
                regional_type: ''
            });
        }
    }, [parliament]);

    useEffect(() => {
        if (formData.state_id) {
            const filtered = divisions.filter(div => div.state_id?._id === formData.state_id);
            setFilteredDivisions(filtered);
        } else {
            setFilteredDivisions([]);
            setFormData(prev => ({ ...prev, division_id: '', assembly_id: null }));
        }
    }, [formData.state_id, divisions]);

    useEffect(() => {
        if (formData.division_id) {
            const filtered = assemblies.filter(asm => asm.division_id?._id === formData.division_id);
            setFilteredAssemblies(filtered);
        } else {
            setFilteredAssemblies([]);
            setFormData(prev => ({ ...prev, assembly_id: null }));
        }
    }, [formData.division_id, assemblies]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            // Reset dependent fields when parent changes
            if (name === 'state_id') {
                return { ...prev, [name]: value, division_id: '', assembly_id: null };
            }
            if (name === 'division_id') {
                return { ...prev, [name]: value, assembly_id: null };
            }
            // Handle empty assembly_id selection
            if (name === 'assembly_id') {
                return { ...prev, [name]: value === '' ? null : value };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleSubmit = async () => {
        const method = parliament ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = parliament
            ? `http://localhost:5000/api/parliaments/${parliament._id}`
            : 'http://localhost:5000/api/parliaments';

        // Create payload without assembly_id if it's null
        const payload = {
            ...formData,
            assembly_id: formData.assembly_id || undefined // Send undefined instead of null
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
            <DialogTitle>{parliament ? 'Edit Parliament' : 'Add Parliament'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} mt={2}>
                    <Stack spacing={1}>
                        <InputLabel>Parliament Name</InputLabel>
                        <TextField 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            fullWidth 
                            required
                        />
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

                    {/* <Stack spacing={1}>
                        <InputLabel>Assembly (Optional)</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="assembly_id"
                                value={formData.assembly_id || ''} // Handle null value
                                onChange={handleChange}
                                disabled={!formData.division_id}
                            >
                                <MenuItem value="">Select Assembly (Optional)</MenuItem>
                                {filteredAssemblies.map((assembly) => (
                                    <MenuItem key={assembly._id} value={assembly._id}>
                                        {assembly.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack> */}

                    <Stack spacing={1}>
                        <InputLabel>Category</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                <MenuItem value="">Select Category</MenuItem>
                                <MenuItem value="reserved">Reserved</MenuItem>
                                <MenuItem value="special">Special</MenuItem>
                                <MenuItem value="general">General</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>

                    <Stack spacing={1}>
                        <InputLabel>Regional Type</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="regional_type"
                                value={formData.regional_type}
                                onChange={handleChange}
                                required
                            >
                                <MenuItem value="">Select Regional Type</MenuItem>
                                <MenuItem value="urban">Urban</MenuItem>
                                <MenuItem value="rural">Rural</MenuItem>
                                <MenuItem value="mixed">Mixed</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </Stack>
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