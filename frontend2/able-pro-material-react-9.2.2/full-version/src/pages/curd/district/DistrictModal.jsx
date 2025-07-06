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

export default function DistrictModal({
    open,
    modalToggler,
    district,
    states,
    divisions,
    assemblies,
    parliaments,
    refresh
}) {
    const [formData, setFormData] = useState({
        name: '',
        state_id: '',
        division_id: '',
        assembly_id: '',
        parliament_id: ''
    });

    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);

    const getId = (val) => typeof val === 'string' ? val : val?._id || '';

    useEffect(() => {
        if (district) {
            setFormData({
                name: district.name || '',
                state_id: getId(district.state_id),
                division_id: getId(district.division_id),
                assembly_id: getId(district.assembly_id),
                parliament_id: getId(district.parliament_id)
            });
        } else {
            setFormData({
                name: '',
                state_id: '',
                division_id: '',
                assembly_id: '',
                parliament_id: ''
            });
        }
    }, [district]);

    useEffect(() => {
        if (formData.state_id) {
            const filtered = divisions.filter(div => getId(div.state_id) === formData.state_id);
            setFilteredDivisions(filtered);
        } else {
            setFilteredDivisions([]);
            setFormData(prev => ({ ...prev, division_id: '', assembly_id: '', parliament_id: '' }));
        }
    }, [formData.state_id, divisions]);

    useEffect(() => {
        if (formData.division_id) {
            const filteredAsm = assemblies.filter(asm => getId(asm.division_id) === formData.division_id);
            const filteredPar = parliaments.filter(par => getId(par.division_id) === formData.division_id);
            setFilteredAssemblies(filteredAsm);
            setFilteredParliaments(filteredPar);
        } else {
            setFilteredAssemblies([]);
            setFilteredParliaments([]);
            setFormData(prev => ({ ...prev, assembly_id: '', parliament_id: '' }));
        }
    }, [formData.division_id, assemblies, parliaments]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            if (name === 'state_id') {
                return { ...prev, [name]: value, division_id: '', assembly_id: '', parliament_id: '' };
            }
            if (name === 'division_id') {
                return { ...prev, [name]: value, assembly_id: '', parliament_id: '' };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleSubmit = async () => {
        const method = district ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = district
            ? `http://localhost:5000/api/districts/${district._id}`
            : 'http://localhost:5000/api/districts';

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
        } else {
            console.error('Failed to save district');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="sm">
            <DialogTitle>{district ? 'Edit District' : 'Add District'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} mt={2}>
                    <Stack spacing={1}>
                        <InputLabel>District Name</InputLabel>
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

                    <Stack spacing={1}>
                        <InputLabel>Assembly (Optional)</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="assembly_id"
                                value={formData.assembly_id}
                                onChange={handleChange}
                                disabled={!formData.division_id}
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

                    <Stack spacing={1}>
                        <InputLabel>Parliament (Optional)</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="parliament_id"
                                value={formData.parliament_id}
                                onChange={handleChange}
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
                    {district ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
