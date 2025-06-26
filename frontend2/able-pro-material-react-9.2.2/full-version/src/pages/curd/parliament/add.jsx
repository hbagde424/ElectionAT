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
import JWTContext from 'contexts/JWTContext';

export default function AddParliamentForm() {
    const navigate = useNavigate();
    const { user } = useContext(JWTContext);
    const [formData, setFormData] = useState({
        name: '',
        state_id: '',
        division_id: '',
        assembly_id: '',
        created_by: user?._id || ''
    });
    
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch divisions when state changes
    useEffect(() => {
        if (formData.state_id) {
            const token = localStorage.getItem('serviceToken');
            fetch(`http://localhost:5000/api/divisions?state=${formData.state_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch divisions');
                    return res.json();
                })
                .then(data => {
                    if (data.success) {
                        setDivisions(data.data || []);
                        // Clear division and assembly when state changes
                        setFormData(prev => ({ ...prev, division_id: '', assembly_id: '' }));
                        setAssemblies([]);
                    }
                })
                .catch(err => {
                    console.error('Error fetching divisions:', err);
                    setError(err.message);
                });
        }
    }, [formData.state_id]);

    // Fetch assemblies when division changes
    useEffect(() => {
        if (formData.division_id) {
            const token = localStorage.getItem('serviceToken');
            fetch(`http://localhost:5000/api/assemblies?division=${formData.division_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch assemblies');
                    return res.json();
                })
                .then(data => {
                    if (data.success) {
                        setAssemblies(data.data || []);
                        // Clear assembly when division changes
                        setFormData(prev => ({ ...prev, assembly_id: '' }));
                    }
                })
                .catch(err => {
                    console.error('Error fetching assemblies:', err);
                    setError(err.message);
                });
        } else {
            // Clear assemblies if no division selected
            setAssemblies([]);
            setFormData(prev => ({ ...prev, assembly_id: '' }));
        }
    }, [formData.division_id]);

    // Initial data load
    useEffect(() => {
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
                if (data.success) setStates(data.data || []);
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
            // Prepare data - remove assembly_id if empty
            const submissionData = { ...formData };
            if (!submissionData.assembly_id) {
                delete submissionData.assembly_id;
            }

            const token = localStorage.getItem('serviceToken');
            const res = await fetch('http://localhost:5000/api/parliaments', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(submissionData)
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to add parliament');
            }
            
            const data = await res.json();
            if (data.success) {
                navigate('/parliament-list');
            }
        } catch (err) {
            console.error('Failed to add parliament:', err);
            setError(err.message);
        }
    };

    if (loading) return <Typography>Loading data...</Typography>;

    return (
        <>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                Add New Parliament
            </Typography>
            
            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    Error: {error}
                </Typography>
            )}
            
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
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

                <Grid item xs={12} sm={6}>
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
                                {divisions.map((division) => (
                                    <MenuItem key={division._id} value={division._id}>
                                        {division.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Grid>

                {/* <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <InputLabel>Assembly (Optional)</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="assembly_id"
                                value={formData.assembly_id}
                                onChange={handleChange}
                                disabled={!formData.division_id}
                            >
                                <MenuItem value="">None</MenuItem>
                                {assemblies.map((assembly) => (
                                    <MenuItem key={assembly._id} value={assembly._id}>
                                        {assembly.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Grid> */}

                <Grid item xs={12}>
                    <Stack direction="row" justifyContent="flex-end" spacing={2}>
                        <Button variant="outlined" onClick={() => navigate('/parliaments')}>
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