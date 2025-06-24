import {
    Grid,
    Stack,
    TextField,
    Typography,
    InputLabel,
    Button,
    Select,
    MenuItem,
    FormHelperText,
    FormControl
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddVolunteerForm() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        role: '',
        phone: '',
        email: '',
        booth_id: '',
        party_id: '',
        area_responsibility: '',
        remarks: ''
    });

    const [errors, setErrors] = useState({});
    const [boothOptions, setBoothOptions] = useState([]);
    const [partyOptions, setPartyOptions] = useState([]);

    // Fetch booth and party data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const boothRes = await fetch('http://localhost:5000/api/booths');
                const boothData = await boothRes.json();
                if (boothData.success) setBoothOptions(boothData.data);

                const partyRes = await fetch('http://localhost:5000/api/parties');
                const partyData = await partyRes.json();
                if (partyData.success) setPartyOptions(partyData.data);
            } catch (err) {
                console.error('Failed to fetch booth or party data:', err);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.role.trim()) newErrors.role = 'Role is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Enter a valid 10-digit phone number';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Enter a valid email address';
        if (!formData.booth_id.trim()) newErrors.booth_id = 'Booth is required';
        if (!formData.party_id.trim()) newErrors.party_id = 'Party is required';

        return newErrors;
    };

    const handleSubmit = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/booth-volunteers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                navigate('/booth-volunteer');
            }
        } catch (err) {
            console.error('Failed to add volunteer:', err);
        }
    };

    return (
        <>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                Add New Volunteer
            </Typography>
            <Grid container spacing={3}>
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
                            <TextField
                                name={name}
                                value={formData[name]}
                                onChange={handleChange}
                                fullWidth
                                error={Boolean(errors[name])}
                                helperText={errors[name]}
                            />
                        </Stack>
                    </Grid>
                ))}

                {/* Booth Dropdown */}
                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <InputLabel>Booth</InputLabel>
                        <FormControl fullWidth error={Boolean(errors.booth_id)}>
                            <Select
                                name="booth_id"
                                value={formData.booth_id}
                                onChange={handleChange}
                                displayEmpty
                            >
                                <MenuItem value="" disabled>
                                    Select Booth
                                </MenuItem>
                                {boothOptions.map((booth) => (
                                    <MenuItem key={booth._id} value={booth._id}>
                                        {booth.name} ({booth.booth_number})
                                    </MenuItem>
                                ))}
                            </Select>
                            <FormHelperText>{errors.booth_id}</FormHelperText>
                        </FormControl>
                    </Stack>
                </Grid>

                {/* Party Dropdown */}
                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <InputLabel>Party</InputLabel>
                        <FormControl fullWidth error={Boolean(errors.party_id)}>
                            <Select
                                name="party_id"
                                value={formData.party_id}
                                onChange={handleChange}
                                displayEmpty
                            >
                                <MenuItem value="" disabled>
                                    Select Party
                                </MenuItem>
                                {partyOptions.map((party) => (
                                    <MenuItem key={party._id} value={party._id}>
                                        {party.name} ({party.abbreviation})
                                    </MenuItem>
                                ))}
                            </Select>
                            <FormHelperText>{errors.party_id}</FormHelperText>
                        </FormControl>
                    </Stack>
                </Grid>

                <Grid item xs={12}>
                    <Stack direction="row" justifyContent="flex-end" spacing={2}>
                        <Button variant="outlined" onClick={() => navigate('/volunteers')}>
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={handleSubmit}>
                            Submit
                        </Button>
                    </Stack>
                </Grid>
            </Grid>
        </>
    );
}
