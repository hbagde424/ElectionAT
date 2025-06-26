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

export default function AddBoothForm() {
    const navigate = useNavigate();
    const { user } = useContext(JWTContext);
    const [formData, setFormData] = useState({
        name: '',
        booth_number: '',
        full_address: '',
        latitude: '',
        longitude: '',
        state_id: '',
        division_id: '',
        district_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        created_by: user?._id || ''
    });
    
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
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
                    if (data.success) setDivisions(data.data || []);
                })
                .catch(err => {
                    console.error('Error fetching divisions:', err);
                    setError(err.message);
                });
        }
    }, [formData.state_id]);

    // Fetch districts when division changes
    useEffect(() => {
        if (formData.division_id) {
            const token = localStorage.getItem('serviceToken');
            fetch(`http://localhost:5000/api/districts?division=${formData.division_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch districts');
                    return res.json();
                })
                .then(data => {
                    if (data.success) setDistricts(data.data || []);
                })
                .catch(err => {
                    console.error('Error fetching districts:', err);
                    setError(err.message);
                });
        }
    }, [formData.division_id]);

    // Fetch parliaments when state changes
    useEffect(() => {
        if (formData.state_id) {
            const token = localStorage.getItem('serviceToken');
            fetch(`http://localhost:5000/api/parliaments?state=${formData.state_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch parliaments');
                    return res.json();
                })
                .then(data => {
                    if (data.success) setParliaments(data.data || []);
                })
                .catch(err => {
                    console.error('Error fetching parliaments:', err);
                    setError(err.message);
                });
        }
    }, [formData.state_id]);

    // Fetch assemblies when district changes
    useEffect(() => {
        if (formData.district_id) {
            const token = localStorage.getItem('serviceToken');
            fetch(`http://localhost:5000/api/assemblies?district=${formData.district_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch assemblies');
                    return res.json();
                })
                .then(data => {
                    if (data.success) setAssemblies(data.data || []);
                })
                .catch(err => {
                    console.error('Error fetching assemblies:', err);
                    setError(err.message);
                });
        }
    }, [formData.district_id]);

    // Fetch blocks when assembly changes
    useEffect(() => {
        if (formData.assembly_id) {
            const token = localStorage.getItem('serviceToken');
            fetch(`http://localhost:5000/api/blocks?assembly=${formData.assembly_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch blocks');
                    return res.json();
                })
                .then(data => {
                    if (data.success) setBlocks(data.data || []);
                })
                .catch(err => {
                    console.error('Error fetching blocks:', err);
                    setError(err.message);
                });
        }
    }, [formData.assembly_id]);

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
            const token = localStorage.getItem('serviceToken');
            const res = await fetch('http://localhost:5000/api/booths', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to add booth');
            }
            
            const data = await res.json();
            if (data.success) {
                navigate('/booths');
            }
        } catch (err) {
            console.error('Failed to add booth:', err);
            setError(err.message);
        }
    };

    if (loading) return <Typography>Loading data...</Typography>;

    return (
        <>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                Add New Booth
            </Typography>
            
            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    Error: {error}
                </Typography>
            )}
            
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <InputLabel>Booth Name</InputLabel>
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
                        <InputLabel>Booth Number</InputLabel>
                        <TextField 
                            name="booth_number" 
                            value={formData.booth_number} 
                            onChange={handleChange} 
                            fullWidth 
                            required
                        />
                    </Stack>
                </Grid>

                <Grid item xs={12}>
                    <Stack spacing={1}>
                        <InputLabel>Full Address</InputLabel>
                        <TextField 
                            name="full_address" 
                            value={formData.full_address} 
                            onChange={handleChange} 
                            fullWidth 
                            required
                            multiline
                            rows={3}
                        />
                    </Stack>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <InputLabel>Latitude</InputLabel>
                        <TextField 
                            name="latitude" 
                            value={formData.latitude} 
                            onChange={handleChange} 
                            fullWidth 
                            type="number"
                        />
                    </Stack>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <InputLabel>Longitude</InputLabel>
                        <TextField 
                            name="longitude" 
                            value={formData.longitude} 
                            onChange={handleChange} 
                            fullWidth 
                            type="number"
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

                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <InputLabel>District</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="district_id"
                                value={formData.district_id}
                                onChange={handleChange}
                                required
                                disabled={!formData.division_id}
                            >
                                {districts.map((district) => (
                                    <MenuItem key={district._id} value={district._id}>
                                        {district.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <InputLabel>Parliament</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="parliament_id"
                                value={formData.parliament_id}
                                onChange={handleChange}
                                required
                                disabled={!formData.state_id}
                            >
                                {parliaments.map((parliament) => (
                                    <MenuItem key={parliament._id} value={parliament._id}>
                                        {parliament.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <InputLabel>Assembly</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="assembly_id"
                                value={formData.assembly_id}
                                onChange={handleChange}
                                required
                                disabled={!formData.district_id}
                            >
                                {assemblies.map((assembly) => (
                                    <MenuItem key={assembly._id} value={assembly._id}>
                                        {assembly.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <InputLabel>Block</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="block_id"
                                value={formData.block_id}
                                onChange={handleChange}
                                required
                                disabled={!formData.assembly_id}
                            >
                                {blocks.map((block) => (
                                    <MenuItem key={block._id} value={block._id}>
                                        {block.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Grid>

                <Grid item xs={12}>
                    <Stack direction="row" justifyContent="flex-end" spacing={2}>
                        <Button variant="outlined" onClick={() => navigate('/booths')}>
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