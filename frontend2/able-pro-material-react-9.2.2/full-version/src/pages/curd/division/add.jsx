import {
    Grid,
    Stack,
    TextField,
    Typography,
    InputLabel,
    Button,
    MenuItem,
    Select,
    FormControl
} from '@mui/material';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import JWTContext from 'contexts/JWTContext'; // Import your JWT context

export default function AddDivisionForm() {
    const navigate = useNavigate();
    const { user } = useContext(JWTContext); // Get user from context
    const [formData, setFormData] = useState({
        name: '',
        state_id: '',
        created_by: user?._id || '' // Use actual logged-in user ID
    });
    const [states, setStates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch states for dropdown with auth token
        const token = localStorage.getItem('serviceToken');
        fetch('http://localhost:5000/api/states', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch states');
            return res.json();
        })
        .then(data => {
            if (data.success) {
                setStates(data.data || []);
            }
            setLoading(false);
        })
        .catch(err => {
            console.error('Error fetching states:', err);
            setError(err.message);
            setLoading(false);
        });
    }, []);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const res = await fetch('http://localhost:5000/api/divisions', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to add division');
            }
            
            const data = await res.json();
            if (data.success) {
                navigate('/division-list');
            }
        } catch (err) {
            console.error('Failed to add division:', err);
            setError(err.message);
        }
    };

    if (loading) return <Typography>Loading states...</Typography>;

    return (
        <>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                Add New Division
            </Typography>
            
            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    Error: {error}
                </Typography>
            )}
            
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <InputLabel>Division Name</InputLabel>
                        <TextField 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            fullWidth 
                            required
                        />
                    </Stack>
                </Grid>

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
                                {states.map((state) => (
                                    <MenuItem key={state._id} value={state._id}>
                                        {state.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Grid>

                <Grid item xs={12}>
                    <Stack direction="row" justifyContent="flex-end" spacing={2}>
                        <Button variant="outlined" onClick={() => navigate('/divisions')}>
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