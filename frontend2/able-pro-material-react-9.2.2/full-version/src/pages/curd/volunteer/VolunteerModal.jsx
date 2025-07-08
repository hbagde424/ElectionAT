import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    Stack,
    TextField,
    InputLabel,
    Select,
    MenuItem,
    FormControl
} from '@mui/material';
import { useEffect, useState } from 'react';

export default function VolunteerModal({
    open,
    modalToggler,
    volunteer,
    states,
    divisions,
    booths,
    parties,
    users,
    refresh
}) {
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        phone: '',
        email: '',
        state_id: '',
        division_id: '',
        booth_id: '',
        party_id: '',
        assembly_id: '',
        parliament_id: '',
        block_id: '',
        area_responsibility: '',
        activity_level: 'Medium',
        remarks: ''
    });

    // Filtered arrays for cascading dropdowns
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    useEffect(() => {
        if (volunteer) {
            setFormData({
                name: volunteer.name || '',
                role: volunteer.role || '',
                phone: volunteer.phone || '',
                email: volunteer.email || '',
                state_id: volunteer.state_id?._id || '',
                division_id: volunteer.division_id?._id || '',
                booth_id: volunteer.booth_id?._id || '',
                party_id: volunteer.party_id?._id || '',
                assembly_id: volunteer.assembly_id?._id || '',
                parliament_id: volunteer.parliament_id?._id || '',
                block_id: volunteer.block_id?._id || '',
                area_responsibility: volunteer.area_responsibility || '',
                activity_level: volunteer.activity_level || 'Medium',
                remarks: volunteer.remarks || ''
            });
        } else {
            setFormData({
                name: '',
                role: '',
                phone: '',
                email: '',
                state_id: '',
                division_id: '',
                booth_id: '',
                party_id: '',
                assembly_id: '',
                parliament_id: '',
                block_id: '',
                area_responsibility: '',
                activity_level: 'Medium',
                remarks: ''
            });
        }
    }, [volunteer]);

    // Cascading dropdown logic for State -> Division
    useEffect(() => {
        if (formData.state_id) {
            const filtered = divisions?.filter(
                division => (division.state_id?._id || division.state_id) === formData.state_id
            ) || [];
            setFilteredDivisions(filtered);

            if (formData.division_id && !filtered.find(d => d._id === formData.division_id)) {
                setFormData(prev => ({ ...prev, division_id: '' }));
            }
        } else {
            setFilteredDivisions([]);
            setFormData(prev => ({ ...prev, division_id: '' }));
        }
    }, [formData.state_id, divisions]);


    // Filter booths based on division
    useEffect(() => {
        if (formData.division_id) {
            const filtered = booths?.filter(
                booth => (booth.division_id?._id || booth.division_id) === formData.division_id
            ) || [];
            setFilteredBooths(filtered);

            if (formData.booth_id && !filtered.find(b => b._id === formData.booth_id)) {
                setFormData(prev => ({ ...prev, booth_id: '' }));
            }
        } else {
            setFilteredBooths([]);
            setFormData(prev => ({ ...prev, booth_id: '' }));
        }
    }, [formData.division_id, booths]);


    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        const method = volunteer ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = volunteer
            ? `http://localhost:5000/api/booth-volunteers/${volunteer._id}`
            : 'http://localhost:5000/api/booth-volunteers';

        // Add user tracking
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const submitData = {
            ...formData,
            ...(volunteer ? { updated_by: user.id } : { created_by: user.id })
        };

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
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{volunteer ? 'Edit Volunteer' : 'Add Volunteer'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    {[
                        ['Name', 'name'],
                        ['Role', 'role'],
                        ['Phone', 'phone'],
                        ['Email', 'email'],
                        ['Area Responsibility', 'area_responsibility'],
                        ['Remarks', 'remarks']
                    ].map(([label, name]) => (
                        <Grid item xs={12} sm={6} key={name}>
                            <Stack spacing={1}>
                                <InputLabel>{label}</InputLabel>
                                <TextField name={name} value={formData[name]} onChange={handleChange} fullWidth />
                            </Stack>
                        </Grid>
                    ))}

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>State</InputLabel>
                            <FormControl fullWidth>
                                <Select
                                    name="state_id"
                                    value={formData.state_id}
                                    onChange={handleChange}
                                    required
                                >
                                    {states?.map((state) => (
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
                            <InputLabel>Division</InputLabel>
                            <FormControl fullWidth>
                                <Select
                                    name="division_id"
                                    value={formData.division_id}
                                    onChange={handleChange}
                                    disabled={!formData.state_id}
                                    required
                                >
                                    {filteredDivisions.map((division) => (
                                        <MenuItem key={division._id} value={division._id}>
                                            {division.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Booth</InputLabel>
                            <FormControl fullWidth>
                                <Select
                                    name="booth_id"
                                    value={formData.booth_id}
                                    onChange={handleChange}
                                    disabled={!formData.division_id}
                                >
                                    {filteredBooths.map((booth) => (
                                        <MenuItem key={booth._id} value={booth._id}>
                                            {booth.name} ({booth.booth_number})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Party</InputLabel>
                            <FormControl fullWidth>
                                <Select name="party_id" value={formData.party_id} onChange={handleChange}>
                                    {parties?.map((party) => (
                                        <MenuItem key={party._id} value={party._id}>
                                            {party.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Activity Level</InputLabel>
                            <FormControl fullWidth>
                                <Select name="activity_level" value={formData.activity_level} onChange={handleChange}>
                                    <MenuItem value="High">High</MenuItem>
                                    <MenuItem value="Medium">Medium</MenuItem>
                                    <MenuItem value="Low">Low</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {volunteer ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
