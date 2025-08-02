import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    Switch, FormControlLabel, Chip, Box, Typography, Autocomplete
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import { DatePicker } from '@mui/x-date-pickers';
import JWTContext from 'contexts/JWTContext';

export default function WorkStatusModal({
    open,
    modalToggler,
    workStatus,
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
        work_name: '',
        department: '',
        status: 'Pending',
        approved_fund_from: '',
        total_budget: '',
        spent_amount: '',
        falia: '',
        description: '',
        start_date: null,
        expected_end_date: null,
        actual_end_date: null,
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: '',
        documents: []
    });
    const [submitted, setSubmitted] = useState(false);

    // Filtered arrays for cascading dropdowns
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    const statusOptions = ['Pending', 'In Progress', 'Completed', 'Halted', 'Cancelled'];
    const fundSourceOptions = ['vidhayak nidhi', 'swechcha nidhi'];

    useEffect(() => {
        if (workStatus) {
            setFormData({
                work_name: workStatus.work_name || '',
                department: workStatus.department || '',
                status: workStatus.status || 'Pending',
                approved_fund_from: workStatus.approved_fund_from || '',
                total_budget: workStatus.total_budget || '',
                spent_amount: workStatus.spent_amount || '',
                falia: workStatus.falia || '',
                description: workStatus.description || '',
                start_date: workStatus.start_date ? new Date(workStatus.start_date) : null,
                expected_end_date: workStatus.expected_end_date ? new Date(workStatus.expected_end_date) : null,
                actual_end_date: workStatus.actual_end_date ? new Date(workStatus.actual_end_date) : null,
                state_id: workStatus.state_id?._id?.toString() || workStatus.state_id?.toString() || '',
                division_id: workStatus.division_id?._id?.toString() || workStatus.division_id?.toString() || '',
                parliament_id: workStatus.parliament_id?._id?.toString() || workStatus.parliament_id?.toString() || '',
                assembly_id: workStatus.assembly_id?._id?.toString() || workStatus.assembly_id?.toString() || '',
                block_id: workStatus.block_id?._id?.toString() || workStatus.block_id?.toString() || '',
                booth_id: workStatus.booth_id?._id?.toString() || workStatus.booth_id?.toString() || '',
                documents: workStatus.documents || []
            });
        } else {
            setFormData({
                work_name: '',
                department: '',
                status: 'Pending',
                approved_fund_from: '',
                total_budget: '',
                spent_amount: '',
                falia: '',
                description: '',
                start_date: null,
                expected_end_date: null,
                actual_end_date: null,
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: '',
                documents: []
            });
        }
    }, [workStatus]);

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
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDateChange = (name, date) => {
        setFormData(prev => ({
            ...prev,
            [name]: date
        }));
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        
        // Validation
        const requiredFields = [
            'work_name', 'department', 'status', 'approved_fund_from',
            'total_budget', 'start_date', 'expected_end_date',
            'state_id', 'division_id', 'parliament_id',
            'assembly_id', 'block_id', 'booth_id'
        ];
        
        for (const field of requiredFields) {
            if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
                return;
            }
        }

        // Validate dates
        if (formData.expected_end_date < formData.start_date) {
            alert('Expected end date must be after start date');
            return;
        }

        if (formData.actual_end_date && formData.actual_end_date < formData.start_date) {
            alert('Actual end date must be after start date');
            return;
        }

        // Validate budget
        if (parseFloat(formData.spent_amount) > parseFloat(formData.total_budget)) {
            alert('Spent amount cannot exceed total budget');
            return;
        }

        const method = workStatus ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = workStatus
            ? `http://localhost:5000/api/work-status/${workStatus._id}`
            : 'http://localhost:5000/api/work-status';

        // Get user ID from context or localStorage
        let userId = user?._id || user?.id;
        if (!userId) {
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                userId = localUser._id || localUser.id;
            } catch (e) {
                console.error('Failed to parse localStorage user:', e);
            }
        }

        const userTracking = workStatus ? { updated_by: userId } : { created_by: userId };
        const submitData = {
            ...formData,
            ...userTracking,
            total_budget: parseFloat(formData.total_budget),
            spent_amount: parseFloat(formData.spent_amount || 0),
            start_date: formData.start_date.toISOString(),
            expected_end_date: formData.expected_end_date.toISOString(),
            actual_end_date: formData.actual_end_date ? formData.actual_end_date.toISOString() : null
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
                console.error('Failed to submit work status:', errorData);
                alert('Failed to save work status. Please check the form data.');
            }
        } catch (error) {
            console.error('Error submitting work status:', error);
            alert('An error occurred while saving the work status.');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{workStatus ? 'Edit Work Status' : 'Add Work Status'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    {/* Row 1: Work Name and Department */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Work Name</InputLabel>
                            <TextField
                                name="work_name"
                                value={formData.work_name}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.work_name}
                                helperText={submitted && !formData.work_name ? 'Work name is required' : ''}
                                placeholder="Enter work name"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Department</InputLabel>
                            <TextField
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.department}
                                helperText={submitted && !formData.department ? 'Department is required' : ''}
                                placeholder="Enter department name"
                            />
                        </Stack>
                    </Grid>

                    {/* Row 2: Status and Approved Fund From */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Status</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.status}>
                                <Select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    required
                                >
                                    {statusOptions.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Approved Fund From</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.approved_fund_from}>
                                <Select
                                    name="approved_fund_from"
                                    value={formData.approved_fund_from}
                                    onChange={handleChange}
                                    required
                                >
                                    <MenuItem value="">Select Fund Source</MenuItem>
                                    {fundSourceOptions.map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    {/* Row 3: Budget and Spent Amount */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Total Budget</InputLabel>
                            <TextField
                                name="total_budget"
                                value={formData.total_budget}
                                onChange={handleChange}
                                fullWidth
                                required
                                type="number"
                                error={submitted && !formData.total_budget}
                                helperText={submitted && !formData.total_budget ? 'Total budget is required' : ''}
                                placeholder="Enter total budget amount"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Spent Amount</InputLabel>
                            <TextField
                                name="spent_amount"
                                value={formData.spent_amount}
                                onChange={handleChange}
                                fullWidth
                                type="number"
                                placeholder="Enter spent amount"
                            />
                        </Stack>
                    </Grid>

                    {/* Row 4: Falia and Description */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Falia</InputLabel>
                            <TextField
                                name="falia"
                                value={formData.falia}
                                onChange={handleChange}
                                fullWidth
                                placeholder="Enter falia name"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Description</InputLabel>
                            <TextField
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                fullWidth
                                placeholder="Enter description"
                            />
                        </Stack>
                    </Grid>

                    {/* Row 5: Dates */}
                    <Grid item xs={12} sm={4}>
                        <Stack spacing={1}>
                            <InputLabel required>Start Date</InputLabel>
                            <DatePicker
                                value={formData.start_date}
                                onChange={(date) => handleDateChange('start_date', date)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        required
                                        error={submitted && !formData.start_date}
                                        helperText={submitted && !formData.start_date ? 'Start date is required' : ''}
                                    />
                                )}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <Stack spacing={1}>
                            <InputLabel required>Expected End Date</InputLabel>
                            <DatePicker
                                value={formData.expected_end_date}
                                onChange={(date) => handleDateChange('expected_end_date', date)}
                                minDate={formData.start_date}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        required
                                        error={submitted && !formData.expected_end_date}
                                        helperText={submitted && !formData.expected_end_date ? 'Expected end date is required' : ''}
                                    />
                                )}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                        <Stack spacing={1}>
                            <InputLabel>Actual End Date</InputLabel>
                            <DatePicker
                                value={formData.actual_end_date}
                                onChange={(date) => handleDateChange('actual_end_date', date)}
                                minDate={formData.start_date}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                    />
                                )}
                            />
                        </Stack>
                    </Grid>

                    {/* Row 6: State and Division */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>State</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.state_id}>
                                <Select
                                    name="state_id"
                                    value={formData.state_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <MenuItem value="">Select State</MenuItem>
                                    {states?.map((state) => (
                                        <MenuItem key={state._id} value={state._id}>
                                            {state.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.state_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>State is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Division</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.division_id}>
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
                            {submitted && !formData.division_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Division is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    {/* Row 7: Parliament and Assembly */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Parliament</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.parliament_id}>
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
                            {submitted && !formData.parliament_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Parliament is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Assembly</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.assembly_id}>
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
                            {submitted && !formData.assembly_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Assembly is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    {/* Row 8: Block and Booth */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Block</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.block_id}>
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
                            {submitted && !formData.block_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Block is required</Box>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Booth</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.booth_id}>
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
                                            {booth.name} (Booth #{booth.booth_number})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.booth_id && (
                                <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Booth is required</Box>
                            )}
                        </Stack>
                    </Grid>
                </Grid>
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