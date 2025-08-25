import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    Chip, Box, FormHelperText
} from '@mui/material';
import { useEffect, useState, useContext, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import JWTContext from 'contexts/JWTContext';

export default function LocalIssueModal({
    open,
    modalToggler,
    localIssue,
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
        issue_name: '',
        department: '',
        description: '',
        status: 'Reported',
        priority: 'Medium',
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

    const statusOptions = ['Reported', 'In Progress', 'Resolved', 'Rejected'];
    const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];

    useEffect(() => {
        if (localIssue) {
            setFormData({
                issue_name: localIssue.issue_name || '',
                department: localIssue.department || '',
                description: localIssue.description || '',
                status: localIssue.status || 'Reported',
                priority: localIssue.priority || 'Medium',
                state_id: localIssue.state_id?._id?.toString() || localIssue.state_id?.toString() || '',
                division_id: localIssue.division_id?._id?.toString() || localIssue.division_id?.toString() || '',
                parliament_id: localIssue.parliament_id?._id?.toString() || localIssue.parliament_id?.toString() || '',
                assembly_id: localIssue.assembly_id?._id?.toString() || localIssue.assembly_id?.toString() || '',
                block_id: localIssue.block_id?._id?.toString() || localIssue.block_id?.toString() || '',
                booth_id: localIssue.booth_id?._id?.toString() || localIssue.booth_id?.toString() || ''
            });
        } else {
            setFormData({
                issue_name: '',
                department: '',
                description: '',
                status: 'Reported',
                priority: 'Medium',
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
            });
        }
    }, [localIssue]);

    // State-based filtering with cascading refinement
    useEffect(() => {
        // Don't run filtering if essential data is not loaded yet
        if (!divisions || !parliaments || !assemblies || !blocks || !booths) {
            return;
        }

        if (formData.state_id) {
            // Filter divisions by state
            const filteredDivs = divisions?.filter(division => {
                const divisionStateId = division.state_id?._id || division.state_id;
                return divisionStateId === formData.state_id;
            }) || [];
            setFilteredDivisions(filteredDivs);

            // Debug: Log when division is selected
            if (formData.division_id) {
            }

            // Filter parliaments by state and optionally by division
            let filteredParls;
            if (formData.division_id) {
                // If division is selected, filter parliaments by that specific division
                filteredParls = parliaments?.filter(parliament => {
                    const divId = parliament.division_id?._id || parliament.division_id;
                    return divId === formData.division_id;
                }) || [];
            } else {
                // If no division selected, show all parliaments in the state
                const stateDivisionIds = filteredDivs.map(div => div._id);
                filteredParls = parliaments?.filter(parliament => {
                    const divId = parliament.division_id?._id || parliament.division_id;
                    return stateDivisionIds.includes(divId);
                }) || [];
            }
            setFilteredParliaments(filteredParls);

            // Filter assemblies by state and optionally by parliament/division
            let filteredAssems;
            if (formData.parliament_id) {
                // If parliament is selected, filter assemblies by that specific parliament
                filteredAssems = assemblies?.filter(assembly => {
                    const parlId = assembly.parliament_id?._id || assembly.parliament_id;
                    return parlId === formData.parliament_id;
                }) || [];
            } else {
                // If no parliament selected, show assemblies based on available parliaments
                const availableParliamentIds = filteredParls.map(parl => parl._id);
                filteredAssems = assemblies?.filter(assembly => {
                    const parlId = assembly.parliament_id?._id || assembly.parliament_id;
                    return availableParliamentIds.includes(parlId);
                }) || [];
            }
            setFilteredAssemblies(filteredAssems);

            // Filter blocks by state and optionally by assembly/parliament/division
            let filteredBlks;
            if (formData.assembly_id) {
                // If assembly is selected, filter blocks by that specific assembly
                filteredBlks = blocks?.filter(block => {
                    const assemId = block.assembly_id?._id || block.assembly_id;
                    return assemId === formData.assembly_id;
                }) || [];
            } else {
                // If no assembly selected, show blocks based on available assemblies
                const availableAssemblyIds = filteredAssems.map(assem => assem._id);
                filteredBlks = blocks?.filter(block => {
                    const assemId = block.assembly_id?._id || block.assembly_id;
                    return availableAssemblyIds.includes(assemId);
                }) || [];
            }
            setFilteredBlocks(filteredBlks);

            // Filter booths by state and optionally by block/assembly/parliament/division
            let filteredBths;
            if (formData.block_id) {
                // If block is selected, filter booths by that specific block
                filteredBths = booths?.filter(booth => {
                    const blockId = booth.block_id?._id || booth.block_id;
                    return blockId === formData.block_id;
                }) || [];
            } else {
                // If no block selected, show booths based on available blocks
                const availableBlockIds = filteredBlks.map(block => block._id);
                filteredBths = booths?.filter(booth => {
                    const blockId = booth.block_id?._id || booth.block_id;
                    return availableBlockIds.includes(blockId);
                }) || [];
            }
            setFilteredBooths(filteredBths);

        } else {
            // If no state selected, clear all dropdown options
            setFilteredDivisions([]);
            setFilteredParliaments([]);
            setFilteredAssemblies([]);
            setFilteredBlocks([]);
            setFilteredBooths([]);
        }
    }, [formData.state_id, formData.division_id, formData.parliament_id, formData.assembly_id, formData.block_id, divisions, parliaments, assemblies, blocks, booths]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updates = { [name]: value };

        // Clear dependent fields based on hierarchy
        if (name === 'state_id') {
            updates.division_id = '';
            updates.parliament_id = '';
            updates.assembly_id = '';
            updates.block_id = '';
            updates.booth_id = '';
        } else if (name === 'division_id') {
            updates.parliament_id = '';
            updates.assembly_id = '';
            updates.block_id = '';
            updates.booth_id = '';
        } else if (name === 'parliament_id') {
            updates.assembly_id = '';
            updates.block_id = '';
            updates.booth_id = '';
        } else if (name === 'assembly_id') {
            updates.block_id = '';
            updates.booth_id = '';
        } else if (name === 'block_id') {
            updates.booth_id = '';
        }

        setFormData((prev) => ({
            ...prev,
            ...updates
        }));
    };

    // For ReactQuill description
    const handleDescriptionChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            description: value
        }));
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.issue_name || formData.issue_name.trim() === '') {
            errors.issue_name = 'Issue name is required';
        }

        if (!formData.department || formData.department.trim() === '') {
            errors.department = 'Department is required';
        }

        if (!formData.state_id) {
            errors.state_id = 'State is required';
        }

        if (!formData.division_id) {
            errors.division_id = 'Division is required';
        }

        if (!formData.parliament_id) {
            errors.parliament_id = 'Parliament is required';
        }

        if (!formData.assembly_id) {
            errors.assembly_id = 'Assembly is required';
        }

        if (!formData.block_id) {
            errors.block_id = 'Block is required';
        }

        if (!formData.booth_id) {
            errors.booth_id = 'Booth is required';
        }

        return errors;
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        const errors = validateForm();

        if (Object.keys(errors).length > 0) {
            return;
        }

        const method = localIssue ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = localIssue
            ? `${import.meta.env.VITE_APP_API_URL}/local-issues/${localIssue._id}`
            : `${import.meta.env.VITE_APP_API_URL}/local-issues`;

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

        const userTracking = localIssue ? { updated_by: userId } : { created_by: userId };
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
                console.error('Failed to submit local issue:', errorData);
                alert('Failed to save local issue. Please check the form data.');
            }
        } catch (error) {
            console.error('Error submitting local issue:', error);
            alert('An error occurred while saving the local issue.');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Low': return 'success';
            case 'Medium': return 'info';
            case 'High': return 'warning';
            case 'Critical': return 'error';
            default: return 'default';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Reported': return 'info';
            case 'In Progress': return 'warning';
            case 'Resolved': return 'success';
            case 'Rejected': return 'error';
            default: return 'default';
        }
    };

    return (
        <Dialog
            open={open}
            onClose={() => modalToggler(false)}
            fullWidth
            maxWidth="md"
            scroll="paper"
        >
            <DialogTitle>{localIssue ? 'Edit Local Issue' : 'Add Local Issue'}</DialogTitle>
            <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <Grid container spacing={2} mt={1}>
                    {/* Row 1: Issue Name and Department */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Issue Name</InputLabel>
                            <TextField
                                name="issue_name"
                                value={formData.issue_name}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && (!formData.issue_name || formData.issue_name.trim() === '')}
                                helperText={submitted && (!formData.issue_name || formData.issue_name.trim() === '') ? 'Issue name is required' : ''}
                                placeholder="Enter issue name"
                            />
                        </Stack>
                    </Grid>
                    {/* style tag removed as it's not needed in JSX */}

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Department</InputLabel>
                            <TextField
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && (!formData.department || formData.department.trim() === '')}
                                helperText={submitted && (!formData.department || formData.department.trim() === '') ? 'Department is required' : ''}
                                placeholder="Enter department name"
                            />
                        </Stack>
                    </Grid>

                    {/* Row 2: Status and Priority */}
                    <Grid item xs={12} sm={6}>
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
                                            <Chip
                                                label={status}
                                                size="small"
                                                color={getStatusColor(status)}
                                                sx={{ minWidth: 100 }}
                                            />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Priority</InputLabel>
                            <FormControl fullWidth>
                                <Select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                >
                                    {priorityOptions.map((priority) => (
                                        <MenuItem key={priority} value={priority}>
                                            <Chip
                                                label={priority}
                                                size="small"
                                                color={getPriorityColor(priority)}
                                                sx={{ minWidth: 100 }}
                                            />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    {/* Row 3: Description (ReactQuill) */}
                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel>Description</InputLabel>
                            <ReactQuill
                                theme="snow"
                                value={formData.description}
                                onChange={handleDescriptionChange}
                                placeholder="Enter issue description"
                                style={{ background: 'white' }}
                            />
                        </Stack>
                    </Grid>

                    {/* Row 4: State and Division */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>State</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.state_id}>
                                <Select
                                    name="state_id"
                                    value={formData.state_id}
                                    onChange={handleChange}
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
                                <FormHelperText error>State is required</FormHelperText>
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
                                <FormHelperText error>Division is required</FormHelperText>
                            )}
                        </Stack>
                    </Grid>

                    {/* Row 5: Parliament and Assembly */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Parliament</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.parliament_id}>
                                <Select
                                    name="parliament_id"
                                    value={formData.parliament_id}
                                    onChange={handleChange}
                                    disabled={!formData.state_id}
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
                                <FormHelperText error>Parliament is required</FormHelperText>
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
                                    disabled={!formData.state_id}
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
                                <FormHelperText error>Assembly is required</FormHelperText>
                            )}
                        </Stack>
                    </Grid>

                    {/* Row 6: Block and Booth */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Block</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.block_id}>
                                <Select
                                    name="block_id"
                                    value={formData.block_id}
                                    onChange={handleChange}
                                    disabled={!formData.state_id}
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
                                <FormHelperText error>Block is required</FormHelperText>
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
                                    disabled={!formData.state_id}
                                >
                                    <MenuItem value="">Select Booth</MenuItem>
                                    {filteredBooths.map((booth) => (
                                        <MenuItem key={booth._id} value={booth._id}>
                                            {booth.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {submitted && !formData.booth_id && (
                                <FormHelperText error>Booth is required</FormHelperText>
                            )}
                        </Stack>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => modalToggler(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit}>
                    {localIssue ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
