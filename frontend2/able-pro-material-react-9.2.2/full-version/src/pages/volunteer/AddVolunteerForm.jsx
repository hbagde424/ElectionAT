// src/pages/volunteer/AddVolunteerForm.jsx
import {
    Grid,
    Stack,
    TextField,
    Typography,
    InputLabel,
    Button
} from '@mui/material';
import { useState } from 'react';
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

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        try {
            console.log('formData',formData);
                    return;
                                const res = await fetch('http://localhost:5000/api/booth-volunteers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                navigate('/volunteers'); // Navigate back to list
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
                    ['Booth ID', 'booth_id'],
                    ['Party ID', 'party_id'],
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
