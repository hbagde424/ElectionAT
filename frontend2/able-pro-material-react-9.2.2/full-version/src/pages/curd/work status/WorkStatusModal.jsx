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

const statusOptions = ['Pending', 'In Progress', 'Completed', 'Halted', 'Cancelled'];

export default function WorkStatusModal({ 
    open, 
    modalToggler, 
    workStatus, 
    divisions,
    parliaments,
    assemblies,
    blocks,
    booths,
    refresh 
}) {
    const [formData, setFormData] = useState({
        work_name: '',
        department: '',
        status: 'Pending',
        approved_fund: 0,
        total_budget: 0,
        falia: '',
        description: '',
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
        if (workStatus) {
            setFormData({
                work_name: workStatus.work_name || '',
                department: workStatus.department || '',
                status: workStatus.status || 'Pending',
                approved_fund: workStatus.approved_fund || 0,
                total_budget: workStatus.total_budget || 0,
                falia: workStatus.falia || '',
                description: workStatus.description || '',
                division_id: workStatus.division_id?._id || '',
                parliament_id: workStatus.parliament_id?._id || '',
                assembly_id: workStatus.assembly_id?._id || '',
                block_id: workStatus.block_id?._id || '',
                booth_id: workStatus.booth_id?._id || ''
            });
        } else {
            setFormData({
                work_name: '',
                department: '',
                status: 'Pending',
                approved_fund: 0,
                total_budget: 0,
                falia: '',
                description: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
            });
        }
        setErrors({});
    }, [workStatus]);

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
        if (!formData.work_name) newErrors.work_name = 'Work name is required';
        if (!formData.department) newErrors.department = 'Department is required';
        if (!formData.division_id) newErrors.division_id = 'Division is required';
        if (!formData.parliament_id) newErrors.parliament_id = 'Parliament is required';
        if (!formData.assembly_id) newErrors.assembly_id = 'Assembly is required';
        if (!formData.block_id) newErrors.block_id = 'Block is required';
        if (!formData.booth_id) newErrors.booth_id = 'Booth is required';
        if (formData.approved_fund < 0) newErrors.approved_fund = 'Approved fund cannot be negative';
        if (formData.total_budget < 0) newErrors.total_budget = 'Total budget cannot be negative';
        if (formData.approved_fund > formData.total_budget) {
            newErrors.approved_fund = 'Approved fund cannot exceed total budget';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const method = workStatus ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = workStatus
            ? `http://localhost:5000/api/work-status/${workStatus._id}`
            : 'http://localhost:5000/api/work-status';

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
            <DialogTitle>{workStatus ? 'Edit Work Status' : 'Add Work Status'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} mt={2}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Work Name *</InputLabel>
                                <TextField 
                                    name="work_name" 
                                    value={formData.work_name} 
                                    onChange={handleChange} 
                                    fullWidth 
                                    error={!!errors.work_name}
                                    helperText={errors.work_name}
                                />
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Department *</InputLabel>
                                <TextField 
                                    name="department" 
                                    value={formData.department} 
                                    onChange={handleChange} 
                                    fullWidth 
                                    error={!!errors.department}
                                    helperText={errors.department}
                                />
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <Stack spacing={1}>
                                <InputLabel>Status</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        {statusOptions.map((status) => (
                                            <MenuItem key={status} value={status}>
                                                {status}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Stack spacing={1}>
                                <InputLabel>Approved Fund (₹) *</InputLabel>
                                <TextField 
                                    name="approved_fund" 
                                    value={formData.approved_fund} 
                                    onChange={handleChange} 
                                    type="number"
                                    fullWidth 
                                    error={!!errors.approved_fund}
                                    helperText={errors.approved_fund}
                                />
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Stack spacing={1}>
                                <InputLabel>Total Budget (₹) *</InputLabel>
                                <TextField 
                                    name="total_budget" 
                                    value={formData.total_budget} 
                                    onChange={handleChange} 
                                    type="number"
                                    fullWidth 
                                    error={!!errors.total_budget}
                                    helperText={errors.total_budget}
                                />
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Falia</InputLabel>
                                <TextField 
                                    name="falia" 
                                    value={formData.falia} 
                                    onChange={handleChange} 
                                    fullWidth 
                                />
                            </Stack>
                        </Grid>
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
                    </Grid>

                    <Grid container spacing={2}>
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
                    </Grid>

                    <Grid container spacing={2}>
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
                        <Grid item xs={12} md={6}>
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

                    <Stack spacing={1}>
                        <InputLabel>Description</InputLabel>
                        <TextField 
                            name="description" 
                            value={formData.description} 
                            onChange={handleChange} 
                            fullWidth 
                            multiline
                            rows={3}
                        />
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {workStatus ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}