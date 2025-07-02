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
    Grid,
    FormHelperText
} from '@mui/material';
import { useEffect, useState } from 'react';

const categoryOptions = ['SC', 'ST', 'OBC', 'General', 'Other'];

export default function CasteListModal({ 
    open, 
    modalToggler, 
    caste, 
    divisions,
    parliaments,
    assemblies,
    blocks,
    booths,
    refresh 
}) {
    const [formData, setFormData] = useState({
        category: 'SC',
        caste: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: ''
    });

    const [errors, setErrors] = useState({});
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    useEffect(() => {
        if (caste) {
            setFormData({
                category: caste.category || 'SC',
                caste: caste.caste || '',
                division_id: caste.division_id?._id || '',
                parliament_id: caste.parliament_id?._id || '',
                assembly_id: caste.assembly_id?._id || '',
                block_id: caste.block_id?._id || '',
                booth_id: caste.booth_id?._id || ''
            });
        } else {
            setFormData({
                category: 'SC',
                caste: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
            });
        }
        setErrors({});
    }, [caste]);

    // Filter parliaments by division
    useEffect(() => {
        if (formData.division_id) {
            const filtered = parliaments.filter(par => par.division_id?._id === formData.division_id);
            setFilteredParliaments(filtered);
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

    // Filter assemblies by parliament
    useEffect(() => {
        if (formData.parliament_id) {
            const filtered = assemblies.filter(asm => asm.parliament_id?._id === formData.parliament_id);
            setFilteredAssemblies(filtered);
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

    // Filter blocks by assembly
    useEffect(() => {
        if (formData.assembly_id) {
            const filtered = blocks.filter(blk => blk.assembly_id?._id === formData.assembly_id);
            setFilteredBlocks(filtered);
        } else {
            setFilteredBlocks([]);
            setFormData(prev => ({ 
                ...prev, 
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.assembly_id, blocks]);

    // Filter booths by block
    useEffect(() => {
        if (formData.block_id) {
            const filtered = booths.filter(booth => booth.block_id?._id === formData.block_id);
            setFilteredBooths(filtered);
        } else {
            setFilteredBooths([]);
            setFormData(prev => ({ 
                ...prev, 
                booth_id: ''
            }));
        }
    }, [formData.block_id, booths]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            // Reset dependent fields when parent changes
            if (name === 'division_id') {
                return { 
                    ...prev, 
                    [name]: value, 
                    parliament_id: '', 
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                };
            }
            if (name === 'parliament_id') {
                return { 
                    ...prev, 
                    [name]: value, 
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                };
            }
            if (name === 'assembly_id') {
                return { 
                    ...prev, 
                    [name]: value, 
                    block_id: '',
                    booth_id: ''
                };
            }
            if (name === 'block_id') {
                return { 
                    ...prev, 
                    [name]: value, 
                    booth_id: ''
                };
            }
            return { ...prev, [name]: value };
        });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.caste) newErrors.caste = 'Caste name is required';
        if (!formData.division_id) newErrors.division_id = 'Division is required';
        if (!formData.parliament_id) newErrors.parliament_id = 'Parliament is required';
        if (!formData.assembly_id) newErrors.assembly_id = 'Assembly is required';
        if (!formData.block_id) newErrors.block_id = 'Block is required';
        if (!formData.booth_id) newErrors.booth_id = 'Booth is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

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
        } else {
            const data = await res.json();
            console.error('Operation failed:', data);
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
                                <InputLabel>Category *</InputLabel>
                                <FormControl fullWidth error={!!errors.category}>
                                    <Select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                    >
                                        {categoryOptions.map((category) => (
                                            <MenuItem key={category} value={category}>
                                                {category}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.category && <FormHelperText>{errors.category}</FormHelperText>}
                                </FormControl>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Caste Name *</InputLabel>
                                <TextField 
                                    name="caste" 
                                    value={formData.caste} 
                                    onChange={handleChange} 
                                    fullWidth 
                                    error={!!errors.caste}
                                    helperText={errors.caste}
                                />
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Division *</InputLabel>
                                <FormControl fullWidth error={!!errors.division_id}>
                                    <Select
                                        name="division_id"
                                        value={formData.division_id}
                                        onChange={handleChange}
                                    >
                                        <MenuItem value="">Select Division</MenuItem>
                                        {divisions.map((division) => (
                                            <MenuItem key={division._id} value={division._id}>
                                                {division.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.division_id && <FormHelperText>{errors.division_id}</FormHelperText>}
                                </FormControl>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Parliament *</InputLabel>
                                <FormControl fullWidth error={!!errors.parliament_id}>
                                    <Select
                                        name="parliament_id"
                                        value={formData.parliament_id}
                                        onChange={handleChange}
                                        disabled={!formData.division_id}
                                    >
                                        <MenuItem value="">Select Parliament</MenuItem>
                                        {filteredParliaments.map((parliament) => (
                                            <MenuItem key={parliament._id} value={parliament._id}>
                                                {parliament.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.parliament_id && <FormHelperText>{errors.parliament_id}</FormHelperText>}
                                </FormControl>
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Assembly *</InputLabel>
                                <FormControl fullWidth error={!!errors.assembly_id}>
                                    <Select
                                        name="assembly_id"
                                        value={formData.assembly_id}
                                        onChange={handleChange}
                                        disabled={!formData.parliament_id}
                                    >
                                        <MenuItem value="">Select Assembly</MenuItem>
                                        {filteredAssemblies.map((assembly) => (
                                            <MenuItem key={assembly._id} value={assembly._id}>
                                                {assembly.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.assembly_id && <FormHelperText>{errors.assembly_id}</FormHelperText>}
                                </FormControl>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Block *</InputLabel>
                                <FormControl fullWidth error={!!errors.block_id}>
                                    <Select
                                        name="block_id"
                                        value={formData.block_id}
                                        onChange={handleChange}
                                        disabled={!formData.assembly_id}
                                    >
                                        <MenuItem value="">Select Block</MenuItem>
                                        {filteredBlocks.map((block) => (
                                            <MenuItem key={block._id} value={block._id}>
                                                {block.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.block_id && <FormHelperText>{errors.block_id}</FormHelperText>}
                                </FormControl>
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Stack spacing={1}>
                                <InputLabel>Booth *</InputLabel>
                                <FormControl fullWidth error={!!errors.booth_id}>
                                    <Select
                                        name="booth_id"
                                        value={formData.booth_id}
                                        onChange={handleChange}
                                        disabled={!formData.block_id}
                                    >
                                        <MenuItem value="">Select Booth</MenuItem>
                                        {filteredBooths.map((booth) => (
                                            <MenuItem key={booth._id} value={booth._id}>
                                                {booth.name} (Booth: {booth.booth_number})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.booth_id && <FormHelperText>{errors.booth_id}</FormHelperText>}
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