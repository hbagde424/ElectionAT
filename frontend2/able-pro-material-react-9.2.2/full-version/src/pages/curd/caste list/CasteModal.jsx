import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    TextField,
    InputLabel,
    Select,
    MenuItem,
    FormControl,
    Grid
} from '@mui/material';
import { useEffect, useState } from 'react';

export default function CasteListModal({
    open,
    modalToggler,
    caste,
    states,
    divisions,
    parliaments,
    assemblies,
    blocks,
    booths,
    refresh
}) {
    const [formData, setFormData] = useState({
        category: 'General',
        caste: '',
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: ''
    });

    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);
    useEffect(() => {
        if (caste) {
            setFormData({
                category: caste.category || 'General',
                caste: caste.caste || '',
                state_id: caste.state?._id || caste.state_id || '',
                division_id: caste.division?._id || caste.division_id || '',
                parliament_id: caste.parliament?._id || caste.parliament_id || '',
                assembly_id: caste.assembly?._id || caste.assembly_id || '',
                block_id: caste.block?._id || caste.block_id || '',
                booth_id: caste.booth?._id || caste.booth_id || ''
            });
        } else {
            setFormData({
                category: 'General',
                caste: '',
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
            });
        }
    }, [caste]);


    // Dependent dropdowns logic
    useEffect(() => {
        const filtered = divisions.filter(div => div.state_id?._id === formData.state_id);
        setFilteredDivisions(filtered);
        if (!formData.state_id) resetFields(['division_id', 'parliament_id', 'assembly_id', 'block_id', 'booth_id']);
    }, [formData.state_id]);

    useEffect(() => {
        const filtered = parliaments.filter(par => par.division_id?._id === formData.division_id);
        setFilteredParliaments(filtered);
        if (!formData.division_id) resetFields(['parliament_id', 'assembly_id', 'block_id', 'booth_id']);
    }, [formData.division_id]);

    useEffect(() => {
        const filtered = assemblies.filter(asm => asm.parliament_id?._id === formData.parliament_id);
        setFilteredAssemblies(filtered);
        if (!formData.parliament_id) resetFields(['assembly_id', 'block_id', 'booth_id']);
    }, [formData.parliament_id]);

    useEffect(() => {
        const filtered = blocks.filter(blk => blk.assembly_id?._id === formData.assembly_id);
        setFilteredBlocks(filtered);
        if (!formData.assembly_id) resetFields(['block_id', 'booth_id']);
    }, [formData.assembly_id]);

    useEffect(() => {
        const filtered = booths.filter(booth => booth.block_id?._id === formData.block_id);
        setFilteredBooths(filtered);
        if (!formData.block_id) resetFields(['booth_id']);
    }, [formData.block_id]);

    const resetFields = (fields) => {
        setFormData(prev => {
            const updated = { ...prev };
            fields.forEach(field => updated[field] = '');
            return updated;
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        const method = caste ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = caste
            ? `http://localhost:5000/api/caste-lists/${caste._id}`
            : 'http://localhost:5000/api/caste-lists';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            modalToggler(false);
            refresh();
        }
    };
    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{caste ? 'Edit Caste Entry' : 'Add Caste Entry'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} mt={2}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Category</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        required
                                    >
                                        <MenuItem value="SC">SC</MenuItem>
                                        <MenuItem value="ST">ST</MenuItem>
                                        <MenuItem value="OBC">OBC</MenuItem>
                                        <MenuItem value="General">General</MenuItem>
                                        <MenuItem value="Other">Other</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Caste Name</InputLabel>
                                <TextField
                                    name="caste"
                                    value={formData.caste}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    inputProps={{ maxLength: 100 }}
                                />
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>State</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="state_id"
                                        value={formData.state_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <MenuItem value="">Select State</MenuItem>
                                        {states.map((state) => (
                                            <MenuItem key={state._id} value={state._id}>
                                                {state.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
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
                                        <MenuItem value="">Select Division</MenuItem>
                                        {filteredDivisions.map((division) => (
                                            <MenuItem key={division._id} value={division._id}>
                                                {division.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Parliament</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="parliament_id"
                                        value={formData.parliament_id}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.division_id}
                                    >
                                        <MenuItem value="">Select Parliament</MenuItem>
                                        {filteredParliaments.map((parliament) => (
                                            <MenuItem key={parliament._id} value={parliament._id}>
                                                {parliament.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Assembly</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="assembly_id"
                                        value={formData.assembly_id}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.parliament_id}
                                    >
                                        <MenuItem value="">Select Assembly</MenuItem>
                                        {filteredAssemblies.map((assembly) => (
                                            <MenuItem key={assembly._id} value={assembly._id}>
                                                {assembly.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
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
                                        <MenuItem value="">Select Block</MenuItem>
                                        {filteredBlocks.map((block) => (
                                            <MenuItem key={block._id} value={block._id}>
                                                {block.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Stack spacing={1}>
                                <InputLabel>Booth</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="booth_id"
                                        value={formData.booth_id}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.block_id}
                                    >
                                        <MenuItem value="">Select Booth</MenuItem>
                                        {filteredBooths.map((booth) => (
                                            <MenuItem key={booth._id} value={booth._id}>
                                                {booth.name} (Booth: {booth.booth_number})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                    </Grid>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {caste ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}