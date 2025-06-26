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
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddBoothVolunteerForm() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        phone: '',
        email: '',
        booth_id: '',
        party_id: '',
        assembly_id: '',
        parliament_id: '',
        block_id: '',
        area_responsibility: '',
        activity_level: 'Medium',
        remarks: ''
    });
    
    const [booths, setBooths] = useState([]);
    const [parties, setParties] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch all required data
    useEffect(() => {
        Promise.all([
            fetch('http://localhost:5000/api/booths').then(res => res.json()),
            fetch('http://localhost:5000/api/parties').then(res => res.json()),
            fetch('http://localhost:5000/api/assemblies').then(res => res.json()),
            fetch('http://localhost:5000/api/parliaments').then(res => res.json()),
            fetch('http://localhost:5000/api/blocks').then(res => res.json())
        ])
        .then(([boothsData, partiesData, assembliesData, parliamentsData, blocksData]) => {
            if (boothsData.success) setBooths(boothsData.data || []);
            if (partiesData.success) setParties(partiesData.data || []);
            if (assembliesData.success) setAssemblies(assembliesData.data || []);
            if (parliamentsData.success) setParliaments(parliamentsData.data || []);
            if (blocksData.success) setBlocks(blocksData.data || []);
            setLoading(false);
        })
        .catch(() => setLoading(false));
    }, []);

    // Update related fields when booth changes
    useEffect(() => {
        if (formData.booth_id) {
            const selectedBooth = booths.find(b => b._id === formData.booth_id);
            if (selectedBooth) {
                setFormData(prev => ({
                    ...prev,
                    assembly_id: selectedBooth.assembly_id?._id || '',
                    parliament_id: selectedBooth.parliament_id?._id || '',
                    block_id: selectedBooth.block_id?._id || ''
                }));
            }
        }
    }, [formData.booth_id, booths]);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async () => {
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
            console.error('Failed to add booth volunteer:', err);
        }
    };

    if (loading) return <Typography>Loading data...</Typography>;

    return (
        <>
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                Add New Booth Volunteer
            </Typography>
            <Grid container spacing={3}>
                {[
                    ['Name', 'name', true],
                    ['Role', 'role', false],
                    ['Phone', 'phone', true],
                    ['Email', 'email', false],
                    ['Area Responsibility', 'area_responsibility', false],
                    ['Remarks', 'remarks', false]
                ].map(([label, name, required]) => (
                    <Grid item xs={12} sm={6} key={name}>
                        <Stack spacing={1}>
                            <InputLabel>{label}</InputLabel>
                            <TextField 
                                name={name} 
                                value={formData[name]} 
                                onChange={handleChange} 
                                fullWidth 
                                required={required}
                            />
                        </Stack>
                    </Grid>
                ))}

                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <InputLabel>Booth</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="booth_id"
                                value={formData.booth_id}
                                onChange={handleChange}
                                required
                            >
                                {booths.map((booth) => (
                                    <MenuItem key={booth._id} value={booth._id}>
                                        {booth.name} ({booth.number})
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
                            <Select
                                name="party_id"
                                value={formData.party_id}
                                onChange={handleChange}
                                required
                            >
                                {parties.map((party) => (
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
                        <InputLabel>Assembly</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="assembly_id"
                                value={formData.assembly_id}
                                onChange={handleChange}
                                required
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

                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <InputLabel>Block</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="block_id"
                                value={formData.block_id}
                                onChange={handleChange}
                                required
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

                <Grid item xs={12} sm={6}>
                    <Stack spacing={1}>
                        <InputLabel>Activity Level</InputLabel>
                        <FormControl fullWidth>
                            <Select
                                name="activity_level"
                                value={formData.activity_level}
                                onChange={handleChange}
                            >
                                <MenuItem value="High">High</MenuItem>
                                <MenuItem value="Medium">Medium</MenuItem>
                                <MenuItem value="Low">Low</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                </Grid>

                <Grid item xs={12}>
                    <Stack direction="row" justifyContent="flex-end" spacing={2}>
                        <Button variant="outlined" onClick={() => navigate('/booth-volunteers')}>
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