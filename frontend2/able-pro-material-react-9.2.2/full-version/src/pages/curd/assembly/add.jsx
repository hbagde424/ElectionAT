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

export default function AddAssemblyForm() {
    const navigate = useNavigate();
    const { user } = useContext(JWTContext);
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        category: 'General',
        state_id: '',
        district_id: '',
        division_id: '',
        parliament_id: '',
        created_by: user?._id || ''
    });

    const [states, setStates] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('serviceToken');

        Promise.all([
            fetch('http://localhost:5000/api/states', {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()),
            fetch('http://localhost:5000/api/districts', {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()),
            fetch('http://localhost:5000/api/divisions', {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()),
            fetch('http://localhost:5000/api/parliaments', {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json())
        ])
            .then(([statesData, districtsData, divisionsData, parliamentsData]) => {
                if (statesData.success) setStates(statesData.data || []);
                if (districtsData.success) setDistricts(districtsData.data || []);
                if (divisionsData.success) setDivisions(divisionsData.data || []);
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
            const res = await fetch('http://localhost:5000/api/assemblies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to add assembly');
            }

            const data = await res.json();
            if (data.success) {
                navigate('/assembly-list');
            }
        } catch (err) {
            console.error('Failed to add assembly:', err);
            setError(err.message);
        }
    };

    if (loading) return <Typography>Loading data...</Typography>;

    return (
        <>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                Add New Assembly
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <InputLabel>Assembly Name</InputLabel>
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
                        <InputLabel>Type</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                required
                            >
                                <MenuItem value="Urban">Urban</MenuItem>
                                <MenuItem value="Rural">Rural</MenuItem>
                                <MenuItem value="Mixed">Mixed</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <InputLabel>Category</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                <MenuItem value="General">General</MenuItem>
                                <MenuItem value="Reserved">Reserved</MenuItem>
                                <MenuItem value="Special">Special</MenuItem>
                            </Select>
                        </FormControl>
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
                        <InputLabel>District</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="district_id"
                                value={formData.district_id}
                                onChange={handleChange}
                                required
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
                        <InputLabel>Parliament</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="parliament_id"
                                value={formData.parliament_id}
                                onChange={handleChange}
                                required
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

                <Grid item xs={12}>
                    <Stack direction="row" justifyContent="flex-end" spacing={2}>
                        <Button variant="outlined" onClick={() => navigate('/assemblies')}>
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