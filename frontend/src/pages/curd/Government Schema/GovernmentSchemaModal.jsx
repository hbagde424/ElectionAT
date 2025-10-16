import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    Box, FormControlLabel, RadioGroup, Radio, Typography
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { DatePicker } from '@mui/x-date-pickers';
import JWTContext from 'contexts/JWTContext';
import { usePermissions } from 'contexts/PermissionContext';

export default function GovernmentModal({
    open,
    modalToggler,
    government,
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
    const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();

    const [formData, setFormData] = useState({
        name: '',
        type: 'new',
        project_complete_date: null,
        amount: '',
        description: '',
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: ''
    });
    const [submitted, setSubmitted] = useState(false);

    // Filtered arrays for cascading dropdowns
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    // Filtered data based on user hierarchy permissions
    const [hierarchyFilteredStates, setHierarchyFilteredStates] = useState([]);
    const [hierarchyFilteredDivisions, setHierarchyFilteredDivisions] = useState([]);
    const [hierarchyFilteredParliaments, setHierarchyFilteredParliaments] = useState([]);
    const [hierarchyFilteredAssemblies, setHierarchyFilteredAssemblies] = useState([]);

    // Filter data based on user hierarchy permissions
    useEffect(() => {
        if (!userHierarchy) {
            // No hierarchy restrictions - show all data
            setHierarchyFilteredStates(states);
            setHierarchyFilteredDivisions(divisions);
            setHierarchyFilteredParliaments(parliaments);
            setHierarchyFilteredAssemblies(assemblies);
            return;
        }

        const highest = getUserHighestLevel();
        if (!highest) {
            // No specific level - show all data
            setHierarchyFilteredStates(states);
            setHierarchyFilteredDivisions(divisions);
            setHierarchyFilteredParliaments(parliaments);
            setHierarchyFilteredAssemblies(assemblies);
            return;
        }

        // Filter based on user's highest access level
        switch (highest) {
            case 'state':
                setHierarchyFilteredStates(states.filter(s => s._id === userHierarchy.state));
                setHierarchyFilteredDivisions(divisions.filter(d => (d.state_id?._id || d.state_id) === userHierarchy.state));
                setHierarchyFilteredParliaments(parliaments.filter(p => (p.state_id?._id || p.state_id) === userHierarchy.state));
                setHierarchyFilteredAssemblies(assemblies.filter(a => (a.state_id?._id || a.state_id) === userHierarchy.state));
                break;
            case 'division':
                setHierarchyFilteredStates(states.filter(s => s._id === userHierarchy.state));
                setHierarchyFilteredDivisions(divisions.filter(d => d._id === userHierarchy.division));
                setHierarchyFilteredParliaments(parliaments.filter(p => (p.division_id?._id || p.division_id) === userHierarchy.division));
                setHierarchyFilteredAssemblies(assemblies.filter(a => (a.division_id?._id || a.division_id) === userHierarchy.division));
                break;
            case 'parliament':
                setHierarchyFilteredStates(states.filter(s => s._id === userHierarchy.state));
                setHierarchyFilteredDivisions(divisions.filter(d => d._id === userHierarchy.division));
                setHierarchyFilteredParliaments(parliaments.filter(p => p._id === userHierarchy.parliament));
                setHierarchyFilteredAssemblies(assemblies.filter(a => (a.parliament_id?._id || a.parliament_id) === userHierarchy.parliament));
                break;
            case 'assembly':
                setHierarchyFilteredStates(states.filter(s => s._id === userHierarchy.state));
                setHierarchyFilteredDivisions(divisions.filter(d => d._id === userHierarchy.division));
                setHierarchyFilteredParliaments(parliaments.filter(p => p._id === userHierarchy.parliament));
                setHierarchyFilteredAssemblies(assemblies.filter(a => a._id === userHierarchy.assembly));
                break;
            case 'block':
                setHierarchyFilteredStates(states.filter(s => s._id === userHierarchy.state));
                setHierarchyFilteredDivisions(divisions.filter(d => d._id === userHierarchy.division));
                setHierarchyFilteredParliaments(parliaments.filter(p => p._id === userHierarchy.parliament));
                setHierarchyFilteredAssemblies(assemblies.filter(a => a._id === userHierarchy.assembly));
                break;
            case 'booth':
                setHierarchyFilteredStates(states.filter(s => s._id === userHierarchy.state));
                setHierarchyFilteredDivisions(divisions.filter(d => d._id === userHierarchy.division));
                setHierarchyFilteredParliaments(parliaments.filter(p => p._id === userHierarchy.parliament));
                setHierarchyFilteredAssemblies(assemblies.filter(a => a._id === userHierarchy.assembly));
                break;
            default:
                setHierarchyFilteredStates(states);
                setHierarchyFilteredDivisions(divisions);
                setHierarchyFilteredParliaments(parliaments);
                setHierarchyFilteredAssemblies(assemblies);
        }
    }, [userHierarchy, states, divisions, parliaments, assemblies, getUserHighestLevel]);

    useEffect(() => {
        if (government) {
            // Helper function to validate and parse date
            const parseDate = (dateValue) => {
                if (!dateValue) return null;
                const date = new Date(dateValue);
                return isNaN(date.getTime()) ? null : date;
            };

            setFormData({
                name: government.name || '',
                type: government.type || 'new',
                project_complete_date: parseDate(government.project_complete_date),
                amount: government.amount || '',
                description: government.description || '',
                state_id: government.state_id?._id?.toString() || government.state_id?.toString() || '',
                division_id: government.division_id?._id?.toString() || government.division_id?.toString() || '',
                parliament_id: government.parliament_id?._id?.toString() || government.parliament_id?.toString() || '',
                assembly_id: government.assembly_id?._id?.toString() || government.assembly_id?.toString() || ''
                ,
                block_id: government.block_id?._id?.toString() || government.block_id?.toString() || '',
                booth_id: government.booth_id?._id?.toString() || government.booth_id?.toString() || ''
            });
        } else {
            setFormData({
                name: '',
                type: 'new',
                project_complete_date: null,
                amount: '',
                description: '',
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
            });
        }
    }, [government]);
    // For ReactQuill description
    const handleDescriptionChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            description: value
        }));
    };

    // State -> Division
    useEffect(() => {
        if (formData.state_id) {
            const filtered = hierarchyFilteredDivisions?.filter(division => {
                const divisionStateId = division.state_id?._id || division.state_id;
                return divisionStateId === formData.state_id;
            }) || [];
            setFilteredDivisions(filtered);

            if (formData.division_id && !filtered.find(d => d._id === formData.division_id)) {
                setFormData(prev => ({
                    ...prev,
                    division_id: '',
                    parliament_id: '',
                    assembly_id: ''
                }));
            }
        } else {
            setFilteredDivisions([]);
            setFormData(prev => ({
                ...prev,
                division_id: '',
                parliament_id: '',
                assembly_id: ''
            }));
        }
    }, [formData.state_id, hierarchyFilteredDivisions]);

    // Division -> Parliament
    useEffect(() => {
        if (formData.division_id) {
            const filtered = hierarchyFilteredParliaments?.filter(parliament => {
                const parliamentDivisionId = parliament.division_id?._id || parliament.division_id;
                return parliamentDivisionId === formData.division_id;
            }) || [];
            setFilteredParliaments(filtered);

            if (formData.parliament_id && !filtered.find(p => p._id === formData.parliament_id)) {
                setFormData(prev => ({
                    ...prev,
                    parliament_id: '',
                    assembly_id: ''
                }));
            }
        } else {
            setFilteredParliaments([]);
            setFormData(prev => ({
                ...prev,
                parliament_id: '',
                assembly_id: ''
            }));
        }
    }, [formData.division_id, hierarchyFilteredParliaments]);

    // Parliament -> Assembly
    useEffect(() => {
        if (formData.parliament_id) {
            const filtered = hierarchyFilteredAssemblies?.filter(assembly => {
                const assemblyParliamentId = assembly.parliament_id?._id || assembly.parliament_id;
                return assemblyParliamentId === formData.parliament_id;
            }) || [];
            setFilteredAssemblies(filtered);

            if (formData.assembly_id && !filtered.find(a => a._id === formData.assembly_id)) {
                setFormData(prev => ({
                    ...prev,
                    assembly_id: ''
                }));
            }
        } else {
            setFilteredAssemblies([]);
            setFormData(prev => ({
                ...prev,
                assembly_id: ''
            }));
        }
    }, [formData.parliament_id, hierarchyFilteredAssemblies]);

    // Assembly -> Blocks
    useEffect(() => {
        if (formData.assembly_id) {
            const filtered = blocks?.filter(b => (b.assembly_id?._id || b.assembly_id) === formData.assembly_id) || [];
            setFilteredBlocks(filtered);
            if (formData.block_id && !filtered.find(x => x._id === formData.block_id)) {
                setFormData(prev => ({ ...prev, block_id: '', booth_id: '' }));
            }
        } else {
            setFilteredBlocks([]);
            setFormData(prev => ({ ...prev, block_id: '', booth_id: '' }));
        }
    }, [formData.assembly_id, blocks]);

    // Block -> Booth
    useEffect(() => {
        if (formData.block_id) {
            const filtered = booths?.filter(b => (b.block_id?._id || b.block_id) === formData.block_id) || [];
            setFilteredBooths(filtered);
            if (formData.booth_id && !filtered.find(x => x._id === formData.booth_id)) {
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

    const handleDateChange = (date) => {
        setFormData((prev) => ({
            ...prev,
            project_complete_date: date
        }));
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        // Validation
        const requiredFields = [
            'name', 'type', 'amount',
            'state_id', 'division_id',
            'parliament_id', 'assembly_id',
            // block/booth optional depending on hierarchy, not required by default
            // 'block_id', 'booth_id'
        ];

        for (const field of requiredFields) {
            if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
                return;
            }
        }

        const method = government ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = government
            ? `${import.meta.env.VITE_APP_API_URL}/governments/${government._id}`
            : `${import.meta.env.VITE_APP_API_URL}/governments`;

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

        const userTracking = government ? { updated_by: userId } : { created_by: userId };
        const submitData = {
            ...formData,
            ...userTracking,
            amount: parseFloat(formData.amount)
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
                console.error('Failed to submit government:', errorData);

                // Show specific error message from backend
                const errorMessage = errorData.message || errorData.error || 'Failed to save government. Please check the form data.';
                alert(`Error: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error submitting government:', error);
            alert('An error occurred while saving the government.');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{government ? 'Edit Government' : 'Add Government'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    {/* Row 0: Description (ReactQuill) */}

                    {/* Row 1: Name and Type */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Name</InputLabel>
                            <TextField
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && !formData.name}
                                helperText={submitted && !formData.name ? 'Name is required' : ''}
                                placeholder="Enter government name"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Type</InputLabel>
                            <RadioGroup
                                row
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                            >
                                <FormControlLabel value="new" control={<Radio />} label="New" />
                                <FormControlLabel value="old" control={<Radio />} label="Old" />
                            </RadioGroup>
                        </Stack>
                    </Grid>

                    {/* Row 2: Amount and Project Date */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Amount (₹)</InputLabel>
                            <TextField
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                fullWidth
                                required
                                type="number"
                                error={submitted && !formData.amount}
                                helperText={submitted && !formData.amount ? 'Amount is required' : ''}
                                placeholder="Enter amount"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Project Completion Date</InputLabel>
                            <DatePicker
                                value={formData.project_complete_date}
                                onChange={handleDateChange}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                            />
                        </Stack>
                    </Grid>

                    {/* Row 3: State and Division */}
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
                                    {hierarchyFilteredStates?.map((state) => (
                                        <MenuItem key={state._id} value={state._id}>
                                            {state.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.state_id && (
                                <Typography variant="caption" color="error">State is required</Typography>
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
                                <Typography variant="caption" color="error">Division is required</Typography>
                            )}
                        </Stack>
                    </Grid>

                    {/* Row 4: Parliament and Assembly */}
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
                                <Typography variant="caption" color="error">Parliament is required</Typography>
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
                                <Typography variant="caption" color="error">Assembly is required</Typography>
                            )}
                        </Stack>
                    </Grid>
                    {/* Row 5: Block and Booth */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Block</InputLabel>
                            <FormControl fullWidth>
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
                            </FormControl>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Booth</InputLabel>
                            <FormControl fullWidth>
                                <Select
                                    name="booth_id"
                                    value={formData.booth_id}
                                    onChange={handleChange}
                                    disabled={!formData.block_id}
                                >
                                    <MenuItem value="">Select Booth</MenuItem>
                                    {filteredBooths.map((booth) => (
                                        <MenuItem key={booth._id} value={booth._id}>
                                            {booth.name || booth.booth_number || booth._id}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>
                    <Grid item xs={12}>
                        <InputLabel>Description</InputLabel>
                        <ReactQuill
                            theme="snow"
                            value={formData.description}
                            onChange={handleDescriptionChange}
                            placeholder="Enter government scheme description"
                            style={{ background: 'white' }}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {government ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
