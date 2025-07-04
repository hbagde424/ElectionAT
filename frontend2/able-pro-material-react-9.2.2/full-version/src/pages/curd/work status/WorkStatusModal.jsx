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
    IconButton,
    Typography,
    Divider,
    Link
} from '@mui/material';
import { useEffect, useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Add, Trash } from 'iconsax-react';

export default function WorkStatusModal({
    open,
    modalToggler,
    work,
    divisions,
    parliaments,
    assemblies,
    blocks,
    booths,
    refresh
}) {
    console.log('parliaments', parliaments)
    const [formData, setFormData] = useState({
        work_name: '',
        department: '',
        status: 'Pending',
        approved_fund_from: 'vidhayak nidhi',
        total_budget: 0,
        spent_amount: 0,
        falia: '',
        description: '',
        start_date: new Date(),
        expected_end_date: new Date(),
        actual_end_date: null,
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: '',
        documents: []
    });

    const [newDocument, setNewDocument] = useState({
        name: '',
        url: ''
    });

    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    useEffect(() => {
        if (work) {
            setFormData({
                work_name: work.work_name || '',
                department: work.department || '',
                status: work.status || 'Pending',
                approved_fund_from: work.approved_fund_from || 'vidhayak nidhi',
                total_budget: work.total_budget || 0,
                spent_amount: work.spent_amount || 0,
                falia: work.falia || '',
                description: work.description || '',
                start_date: new Date(work.start_date) || new Date(),
                expected_end_date: new Date(work.expected_end_date) || new Date(),
                actual_end_date: work.actual_end_date ? new Date(work.actual_end_date) : null,
                division_id: work.division_id?._id || '',
                parliament_id: work.parliament_id?._id || '',
                assembly_id: work.assembly_id?._id || '',
                block_id: work.block_id?._id || '',
                booth_id: work.booth_id?._id || '',
                documents: work.documents || []
            });
        } else {
            setFormData({
                work_name: '',
                department: '',
                status: 'Pending',
                approved_fund_from: 'vidhayak nidhi',
                total_budget: 0,
                spent_amount: 0,
                falia: '',
                description: '',
                start_date: new Date(),
                expected_end_date: new Date(),
                actual_end_date: null,
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: '',
                documents: []
            });
        }
    }, [work]);

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

    const handleDateChange = (name, date) => {
        setFormData(prev => ({ ...prev, [name]: date }));
    };

    const handleDocumentChange = (e) => {
        const { name, value } = e.target;
        setNewDocument(prev => ({ ...prev, [name]: value }));
    };

    const addDocument = () => {
        if (newDocument.name && newDocument.url) {
            setFormData(prev => ({
                ...prev,
                documents: [...prev.documents, { ...newDocument, uploaded_at: new Date() }]
            }));
            setNewDocument({ name: '', url: '' });
        }
    };

    const removeDocument = (index) => {
        setFormData(prev => ({
            ...prev,
            documents: prev.documents.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async () => {
        try {
            const method = work ? 'PUT' : 'POST';
            const token = localStorage.getItem('serviceToken');
            const url = work
                ? `http://localhost:5000/api/work-statuses/${work._id}`
                : 'http://localhost:5000/api/work-statuses';

            const payload = {
                ...formData,
                start_date: formData.start_date.toISOString(),
                expected_end_date: formData.expected_end_date.toISOString(),
                actual_end_date: formData.actual_end_date ? formData.actual_end_date.toISOString() : null
            };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                modalToggler(false);
                refresh();
            } else {
                const errorData = await res.json();
                console.error('Failed to save work status:', errorData);
            }
        } catch (error) {
            console.error('Error saving work status:', error);
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{work ? 'Edit Work Status' : 'Add Work Status'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} mt={2}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Work Name</InputLabel>
                                <TextField
                                    name="work_name"
                                    value={formData.work_name}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    inputProps={{ maxLength: 200 }}
                                />
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Department</InputLabel>
                                <TextField
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    inputProps={{ maxLength: 100 }}
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
                                        required
                                    >
                                        <MenuItem value="Pending">Pending</MenuItem>
                                        <MenuItem value="In Progress">In Progress</MenuItem>
                                        <MenuItem value="Completed">Completed</MenuItem>
                                        <MenuItem value="Halted">Halted</MenuItem>
                                        <MenuItem value="Cancelled">Cancelled</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Stack spacing={1}>
                                <InputLabel>Fund Source</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="approved_fund_from"
                                        value={formData.approved_fund_from}
                                        onChange={handleChange}
                                        required
                                    >
                                        <MenuItem value="vidhayak nidhi">Vidhayak Nidhi</MenuItem>
                                        <MenuItem value="swechcha nidhi">Swechcha Nidhi</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Stack spacing={1}>
                                <InputLabel>Falia</InputLabel>
                                <TextField
                                    name="falia"
                                    value={formData.falia}
                                    onChange={handleChange}
                                    fullWidth
                                    inputProps={{ maxLength: 200 }}
                                />
                            </Stack>
                        </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                            <Stack spacing={1}>
                                <InputLabel>Total Budget (₹)</InputLabel>
                                <TextField
                                    name="total_budget"
                                    type="number"
                                    value={formData.total_budget}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    inputProps={{ min: 0 }}
                                />
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Stack spacing={1}>
                                <InputLabel>Spent Amount (₹)</InputLabel>
                                <TextField
                                    name="spent_amount"
                                    type="number"
                                    value={formData.spent_amount}
                                    onChange={handleChange}
                                    fullWidth
                                    inputProps={{ min: 0, max: formData.total_budget }}
                                />
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Stack spacing={1}>
                                <InputLabel>Remaining (₹)</InputLabel>
                                <TextField
                                    value={formData.total_budget - formData.spent_amount}
                                    fullWidth
                                    disabled
                                />
                            </Stack>
                        </Grid>
                    </Grid>

                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                                <Stack spacing={1}>
                                    <InputLabel>Start Date</InputLabel>
                                    <DatePicker
                                        value={formData.start_date}
                                        onChange={(date) => handleDateChange('start_date', date)}
                                        slotProps={{ textField: { fullWidth: true } }}
                                    />
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Stack spacing={1}>
                                    <InputLabel>Expected End Date</InputLabel>
                                    <DatePicker
                                        value={formData.expected_end_date}
                                        onChange={(date) => handleDateChange('expected_end_date', date)}
                                        slotProps={{ textField: { fullWidth: true } }}
                                        minDate={formData.start_date}
                                    />
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Stack spacing={1}>
                                    <InputLabel>Actual End Date</InputLabel>
                                    <DatePicker
                                        value={formData.actual_end_date}
                                        onChange={(date) => handleDateChange('actual_end_date', date)}
                                        slotProps={{ textField: { fullWidth: true } }}
                                        minDate={formData.start_date}
                                        disabled={formData.status !== 'Completed'}
                                    />
                                </Stack>
                            </Grid>
                        </Grid>
                    </LocalizationProvider>

                    <Stack spacing={1}>
                        <InputLabel>Description</InputLabel>
                        <TextField
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={4}
                            inputProps={{ maxLength: 1000 }}
                        />
                    </Stack>

                    <Typography variant="h6">Documents</Typography>
                    <Divider />

                    {formData.documents.map((doc, index) => (
                        <Stack key={index} direction="row" spacing={2} alignItems="center">
                            <Typography sx={{ flex: 1 }}>{doc.name}</Typography>
                            <Link href={doc.url} target="_blank" rel="noopener">View Document</Link>
                            <IconButton color="error" onClick={() => removeDocument(index)}>
                                <Trash />
                            </IconButton>
                        </Stack>
                    ))}

                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={5}>
                            <TextField
                                name="name"
                                value={newDocument.name}
                                onChange={handleDocumentChange}
                                fullWidth
                                placeholder="Document Name"
                                inputProps={{ maxLength: 200 }}
                            />
                        </Grid>
                        <Grid item xs={5}>
                            <TextField
                                name="url"
                                value={newDocument.url}
                                onChange={handleDocumentChange}
                                fullWidth
                                placeholder="Document URL"
                            />
                        </Grid>
                        <Grid item xs={2}>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={addDocument}
                                disabled={!newDocument.name || !newDocument.url}
                            >
                                Add
                            </Button>
                        </Grid>
                    </Grid>

                    <Typography variant="h6">Location Details</Typography>
                    <Divider />

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Stack spacing={1}>
                                <InputLabel>Division</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="division_id"
                                        value={formData.division_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <MenuItem value="">Select Division</MenuItem>
                                        {divisions.map((division) => (
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
                    {work ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}