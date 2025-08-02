import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    Chip, Box
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import JWTContext from 'contexts/JWTContext';

export default function InfluencerModal({
    open,
    modalToggler,
    influencer,
    states,
    divisions,
    parliaments,
    assemblies,
    blocks,
    booths,
    refresh
}) {
    const contextValue = useContext(JWTContext);
    const { user } = contextValue || {};

    const [formData, setFormData] = useState({
        name: '',
        contact_number: '',
        alternate_number: '',
        email: '',
        full_address: '',
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    useEffect(() => {
        if (influencer) {
            setFormData({
                name: influencer.name || '',
                contact_number: influencer.contact_number || '',
                alternate_number: influencer.alternate_number || '',
                email: influencer.email || '',
                full_address: influencer.full_address || '',
                state_id: influencer.state_id?._id?.toString() || influencer.state_id?.toString() || '',
                division_id: influencer.division_id?._id?.toString() || influencer.division_id?.toString() || '',
                parliament_id: influencer.parliament_id?._id?.toString() || influencer.parliament_id?.toString() || '',
                assembly_id: influencer.assembly_id?._id?.toString() || influencer.assembly_id?.toString() || '',
                block_id: influencer.block_id?._id?.toString() || influencer.block_id?.toString() || '',
                booth_id: influencer.booth_id?._id?.toString() || influencer.booth_id?.toString() || ''
            });
        } else {
            setFormData({
                name: '',
                contact_number: '',
                alternate_number: '',
                email: '',
                full_address: '',
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
            });
        }
    }, [influencer]);

    // State -> Division
    useEffect(() => {
        if (formData.state_id) {
            const filtered = divisions?.filter(division => {
                const divisionStateId = division.state_id?._id || division.state_id;
                return divisionStateId === formData.state_id;
            }) || [];
            setFilteredDivisions(filtered);

            if (formData.division_id && !filtered.find(d => d._id === formData.division_id)) {
                setFormData(prev => ({
                    ...prev,
                    division_id: '',
                    parliament_id: '',
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                }));
            }
        } else {
            setFilteredDivisions([]);
            setFormData(prev => ({
                ...prev,
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.state_id, divisions]);

    // Division -> Parliament
    useEffect(() => {
        if (formData.division_id) {
            const filtered = parliaments?.filter(parliament => {
                const parliamentDivisionId = parliament.division_id?._id || parliament.division_id;
                return parliamentDivisionId === formData.division_id;
            }) || [];
            setFilteredParliaments(filtered);

            if (formData.parliament_id && !filtered.find(p => p._id === formData.parliament_id)) {
                setFormData(prev => ({
                    ...prev,
                    parliament_id: '',
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                }));
            }
        } else {
            setFilteredParliaments([]);
            setFormData(prev => ({
                ...prev,
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.division_id, parliaments]);

    // Parliament -> Assembly
    useEffect(() => {
        if (formData.parliament_id) {
            const filtered = assemblies?.filter(assembly => {
                const assemblyParliamentId = assembly.parliament_id?._id || assembly.parliament_id;
                return assemblyParliamentId === formData.parliament_id;
            }) || [];
            setFilteredAssemblies(filtered);

            if (formData.assembly_id && !filtered.find(a => a._id === formData.assembly_id)) {
                setFormData(prev => ({
                    ...prev,
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                }));
            }
        } else {
            setFilteredAssemblies([]);
            setFormData(prev => ({
                ...prev,
                assembly_id: '',
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.parliament_id, assemblies]);

    // Assembly -> Blocks
    useEffect(() => {
        if (formData.assembly_id) {
            const filtered = blocks?.filter(block => {
                const blockAssemblyId = block.assembly_id?._id || block.assembly_id;
                return blockAssemblyId === formData.assembly_id;
            }) || [];
            setFilteredBlocks(filtered);

            if (formData.block_id && !filtered.find(b => b._id === formData.block_id)) {
                setFormData(prev => ({ ...prev, block_id: '', booth_id: '' }));
            }
        } else {
            setFilteredBlocks([]);
            setFormData(prev => ({ ...prev, block_id: '', booth_id: '' }));
        }
    }, [formData.assembly_id, blocks]);

    // Block -> Booths
    useEffect(() => {
        if (formData.block_id) {
            const filtered = booths?.filter(booth => {
                const boothBlockId = booth.block_id?._id || booth.block_id;
                return boothBlockId === formData.block_id;
            }) || [];
            setFilteredBooths(filtered);

            if (formData.booth_id && !filtered.find(b => b._id === formData.booth_id)) {
                setFormData(prev => ({ ...prev, booth_id: '' }));
            }
        } else {
            setFilteredBooths([]);
            setFormData(prev => ({ ...prev, booth_id: '' }));
        }
    }, [formData.block_id, booths]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        const requiredFields = [
            'name', 'contact_number', 'full_address',
            'state_id', 'division_id', 'parliament_id',
            'assembly_id', 'block_id', 'booth_id'
        ];
        
        for (const field of requiredFields) {
            if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
                return;
            }
        }

        const method = influencer ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = influencer
            ? `http://localhost:5000/api/influencers/${influencer._id}`
            : 'http://localhost:5000/api/influencers';

        let userId = user?._id || user?.id;
        if (!userId) {
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                userId = localUser._id || localUser.id;
            } catch (e) {
                console.error('Failed to parse localStorage user:', e);
            }
        }

        const userTracking = influencer ? { updated_by: userId } : { created_by: userId };
        const submitData = {
            ...formData,
            ...userTracking
        };

        try {
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
            } else {
                const errorData = await res.json();
                console.error('Failed to submit influencer:', errorData);
                alert('Failed to save influencer. Please check the form data.');
            }
        } catch (error) {
            console.error('Error submitting influencer:', error);
            alert('An error occurred while saving the influencer.');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} maxWidth="md" fullWidth>
            <DialogTitle>{influencer ? 'Edit Influencer' : 'Add Influencer'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            error={submitted && !formData.name}
                            helperText={submitted && !formData.name ? 'Name is required' : ''}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Contact Number"
                            name="contact_number"
                            value={formData.contact_number}
                            onChange={handleChange}
                            error={submitted && !formData.contact_number}
                            helperText={submitted && !formData.contact_number ? 'Contact number is required' : ''}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Alternate Number"
                            name="alternate_number"
                            value={formData.alternate_number}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Full Address"
                            name="full_address"
                            value={formData.full_address}
                            onChange={handleChange}
                            multiline
                            rows={3}
                            error={submitted && !formData.full_address}
                            helperText={submitted && !formData.full_address ? 'Address is required' : ''}
                        />
                    </Grid>

                    {/* Location Hierarchy */}
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={submitted && !formData.state_id}>
                            <InputLabel>State</InputLabel>
                            <Select
                                name="state_id"
                                value={formData.state_id}
                                label="State"
                                onChange={handleChange}
                            >
                                {states?.map((state) => (
                                    <MenuItem key={state._id} value={state._id}>
                                        {state.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {submitted && !formData.state_id && (
                                <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 1 }}>
                                    State is required
                                </Box>
                            )}
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={submitted && !formData.division_id}>
                            <InputLabel>Division</InputLabel>
                            <Select
                                name="division_id"
                                value={formData.division_id}
                                label="Division"
                                onChange={handleChange}
                                disabled={!formData.state_id}
                            >
                                {filteredDivisions?.map((division) => (
                                    <MenuItem key={division._id} value={division._id}>
                                        {division.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {submitted && !formData.division_id && (
                                <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 1 }}>
                                    Division is required
                                </Box>
                            )}
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={submitted && !formData.parliament_id}>
                            <InputLabel>Parliament</InputLabel>
                            <Select
                                name="parliament_id"
                                value={formData.parliament_id}
                                label="Parliament"
                                onChange={handleChange}
                                disabled={!formData.division_id}
                            >
                                {filteredParliaments?.map((parliament) => (
                                    <MenuItem key={parliament._id} value={parliament._id}>
                                        {parliament.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {submitted && !formData.parliament_id && (
                                <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 1 }}>
                                    Parliament is required
                                </Box>
                            )}
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={submitted && !formData.assembly_id}>
                            <InputLabel>Assembly</InputLabel>
                            <Select
                                name="assembly_id"
                                value={formData.assembly_id}
                                label="Assembly"
                                onChange={handleChange}
                                disabled={!formData.parliament_id}
                            >
                                {filteredAssemblies?.map((assembly) => (
                                    <MenuItem key={assembly._id} value={assembly._id}>
                                        {assembly.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {submitted && !formData.assembly_id && (
                                <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 1 }}>
                                    Assembly is required
                                </Box>
                            )}
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={submitted && !formData.block_id}>
                            <InputLabel>Block</InputLabel>
                            <Select
                                name="block_id"
                                value={formData.block_id}
                                label="Block"
                                onChange={handleChange}
                                disabled={!formData.assembly_id}
                            >
                                {filteredBlocks?.map((block) => (
                                    <MenuItem key={block._id} value={block._id}>
                                        {block.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {submitted && !formData.block_id && (
                                <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 1 }}>
                                    Block is required
                                </Box>
                            )}
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={submitted && !formData.booth_id}>
                            <InputLabel>Booth</InputLabel>
                            <Select
                                name="booth_id"
                                value={formData.booth_id}
                                label="Booth"
                                onChange={handleChange}
                                disabled={!formData.block_id}
                            >
                                {filteredBooths?.map((booth) => (
                                    <MenuItem key={booth._id} value={booth._id}>
                                        {booth.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {submitted && !formData.booth_id && (
                                <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 1 }}>
                                    Booth is required
                                </Box>
                            )}
                        </FormControl>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained">
                    {influencer ? 'Update' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}