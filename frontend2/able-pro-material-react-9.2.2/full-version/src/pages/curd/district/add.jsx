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

export default function AddDistrictForm() {
    const navigate = useNavigate();
    const { user } = useContext(JWTContext);
    const [formData, setFormData] = useState({
        name: '',
        state_id: '',
        division_id: '',
        assembly_id: '',
        parliament_id: '',
        created_by: user?._id || ''
    });
    
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('serviceToken');
        
        Promise.all([
            fetch('http://localhost:5000/api/states', {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => {
                if (!res.ok) throw new Error('Failed to fetch states');
                return res.json();
            }),
            fetch('http://localhost:5000/api/divisions', {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => {
                if (!res.ok) throw new Error('Failed to fetch divisions');
                return res.json();
            }),
            fetch('http://localhost:5000/api/assemblies', {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => {
                if (!res.ok) throw new Error('Failed to fetch assemblies');
                return res.json();
            }),
            fetch('http://localhost:5000/api/parliaments', {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => {
                if (!res.ok) throw new Error('Failed to fetch parliaments');
                return res.json();
            })
        ])
        .then(([statesData, divisionsData, assembliesData, parliamentsData]) => {
            if (statesData.success) setStates(statesData.data || []);
            if (divisionsData.success) setDivisions(divisionsData.data || []);
            if (assembliesData.success) setAssemblies(assembliesData.data || []);
            if (parliamentsData.success) setParliaments(parliamentsData.data || []);
            setLoading(false);
        })
        .catch(err => {
            console.error('Error loading data:', err);
            setError('Failed to load required data');
            setLoading(false);
        });
    }, []);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const res = await fetch('http://localhost:5000/api/districts', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to add district');
            }
            
            const data = await res.json();
            if (data.success) {
                navigate('/district-list');
            }
        } catch (err) {
            console.error('Failed to add district:', err);
            setError(err.message);
        }
    };

    if (loading) return <Typography>Loading data...</Typography>;

    return (
        <>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                Add New District
            </Typography>
            
            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    Error: {error}
                </Typography>
            )}
            
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
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
                        <InputLabel>Assembly (Optional)</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="assembly_id"
                                value={formData.assembly_id}
                                onChange={handleChange}
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
                </Grid>

                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <InputLabel>Parliament (Optional)</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="parliament_id"
                                value={formData.parliament_id}
                                onChange={handleChange}
                            >
                                <MenuItem value="">None</MenuItem>
                                {parliaments.map((parliament) => (
                                    <MenuItem key={parliament._id} value={parliament._id}>
                                        {parliament.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </Grid>

                <Grid item xs={12}>
                    <Stack direction="row" justifyContent="flex-end" spacing={2}>
                        <Button variant="outlined" onClick={() => navigate('/districts')}>
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