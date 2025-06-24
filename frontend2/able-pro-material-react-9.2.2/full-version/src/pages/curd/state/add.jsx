// src/pages/state/AddStateForm.jsx
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

export default function AddStateForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: ''
    });

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        try {
            console.log('formData', formData);
            const res = await fetch('http://localhost:5000/api/states', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                navigate('/state-list'); // Navigate back to list
            }
        } catch (err) {
            console.error('Failed to add state:', err);
        }
    };

    return (
        <>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                Add New State
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <InputLabel>State Name</InputLabel>
                        <TextField 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            fullWidth 
                        />
                    </Stack>
                </Grid>

                <Grid item xs={12}>
                    <Stack direction="row" justifyContent="flex-end" spacing={2}>
                        <Button variant="outlined" onClick={() => navigate('/states')}>
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