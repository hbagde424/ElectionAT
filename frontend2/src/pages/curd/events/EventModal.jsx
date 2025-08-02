import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    Chip, Box, FormHelperText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useEffect, useState, useContext } from 'react';

// project imports
import JWTContext from 'contexts/JWTContext';

export default function EventModal({
    open,
    modalToggler,
    event,
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
        type: 'event',
        status: 'incomplete',
        description: '',
        start_date: null,
        end_date: null,
        location: '',
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

    const eventTypes = ['event', 'campaign', 'activity'];
    const eventStatuses = ['done', 'incomplete', 'cancelled', 'postponed'];

    useEffect(() => {
        if (event) {
            setFormData({
                name: event.name || '',
                type: event.type || 'event',
                status: event.status || 'incomplete',
                description: event.description || '',
                start_date: event.start_date ? new Date(event.start_date) : null,
                end_date: event.end_date ? new Date(event.end_date) : null,
                location: event.location || '',
                state_id: event.state_id?._id?.toString() || event.state_id?.toString() || '',
                division_id: event.division_id?._id?.toString() || event.division_id?.toString() || '',
                parliament_id: event.parliament_id?._id?.toString() || event.parliament_id?.toString() || '',
                assembly_id: event.assembly_id?._id?.toString() || event.assembly_id?.toString() || '',
                block_id: event.block_id?._id?.toString() || event.block_id?.toString() || '',
                booth_id: event.booth_id?._id?.toString() || event.booth_id?.toString() || ''
            });
        } else {
            setFormData({
                name: '',
                type: 'event',
                status: 'incomplete',
                description: '',
                start_date: null,
                end_date: null,
                location: '',
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
            });
        }
    }, [event]);

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

    // Assembly -> Block
    useEffect(() => {
        if (formData.assembly_id) {
            const filtered = blocks?.filter(block => {
                const blockAssemblyId = block.assembly_id?._id || block.assembly_id;
                return blockAssemblyId === formData.assembly_id;
            }) || [];
            setFilteredBlocks(filtered);

            if (formData.block_id && !filtered.find(b => b._id === formData.block_id)) {
                setFormData(prev => ({
                    ...prev,
                    block_id: '',
                    booth_id: ''
                }));
            }
        } else {
            setFilteredBlocks([]);
            setFormData(prev => ({
                ...prev,
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.assembly_id, blocks]);

    // Block -> Booth
    useEffect(() => {
        if (formData.block_id) {
            const filtered = booths?.filter(booth => {
                const boothBlockId = booth.block_id?._id || booth.block_id;
                return boothBlockId === formData.block_id;
            }) || [];
            setFilteredBooths(filtered);

            if (formData.booth_id && !filtered.find(b => b._id === formData.booth_id)) {
                setFormData(prev => ({
                    ...prev,
                    booth_id: ''
                }));
            }
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
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDateChange = (name, date) => {
        setFormData((prev) => ({
            ...prev,
            [name]: date
        }));
    };

    const validateForm = () => {
        const errors = {};
        
        if (!formData.name || formData.name.trim() === '') {
            errors.name = 'Event name is required';
        }
        
        if (!formData.start_date) {
            errors.start_date = 'Start date is required';
        }
        
        if (!formData.end_date) {
            errors.end_date = 'End date is required';
        } else if (formData.start_date && formData.end_date < formData.start_date) {
            errors.end_date = 'End date must be after start date';
        }
        
        if (!formData.location || formData.location.trim() === '') {
            errors.location = 'Location is required';
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

        const method = event ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = event
            ? `http://localhost:5000/api/events/${event._id}`
            : 'http://localhost:5000/api/events';

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

        const userTracking = event ? { updated_by: userId } : { created_by: userId };
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
                console.error('Failed to submit event:', errorData);
                alert('Failed to save event. Please check the form data.');
            }
        } catch (error) {
            console.error('Error submitting event:', error);
            alert('An error occurred while saving the event.');
        }
    };

    return (
        <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
            <DialogTitle>{event ? 'Edit Event' : 'Add Event'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={1}>
                    {/* Row 1: Name and Type */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Event Name</InputLabel>
                            <TextField
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && (!formData.name || formData.name.trim() === '')}
                                helperText={submitted && (!formData.name || formData.name.trim() === '') ? 'Event name is required' : ''}
                                placeholder="Enter event name"
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Event Type</InputLabel>
                            <FormControl fullWidth required>
                                <Select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                >
                                    {eventTypes.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    {/* Row 2: Status and Description */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Status</InputLabel>
                            <FormControl fullWidth>
                                <Select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    {eventStatuses.map((status) => (
                                        <MenuItem key={status} value={status}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
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
                                multiline
                                rows={3}
                                placeholder="Enter event description"
                            />
                        </Stack>
                    </Grid>

                    {/* Row 3: Dates */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Start Date</InputLabel>
                            <DatePicker
                                value={formData.start_date}
                                onChange={(date) => handleDateChange('start_date', date)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        error={submitted && !formData.start_date}
                                        helperText={submitted && !formData.start_date ? 'Start date is required' : ''}
                                    />
                                )}
                            />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>End Date</InputLabel>
                            <DatePicker
                                value={formData.end_date}
                                onChange={(date) => handleDateChange('end_date', date)}
                                minDate={formData.start_date}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        fullWidth
                                        error={submitted && (!formData.end_date || (formData.start_date && formData.end_date < formData.start_date))}
                                        helperText={
                                            submitted && !formData.end_date ? 'End date is required' :
                                            submitted && formData.start_date && formData.end_date < formData.start_date ? 'End date must be after start date' : ''
                                        }
                                    />
                                )}
                            />
                        </Stack>
                    </Grid>

                    {/* Row 4: Location and State */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Location</InputLabel>
                            <TextField
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                fullWidth
                                required
                                error={submitted && (!formData.location || formData.location.trim() === '')}
                                helperText={submitted && (!formData.location || formData.location.trim() === '') ? 'Location is required' : ''}
                                placeholder="Enter event location"
                            />
                        </Stack>
                    </Grid>

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

                    {/* Row 5: Division and Parliament */}
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

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Parliament</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.parliament_id}>
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
                            </FormControl>
                            {submitted && !formData.parliament_id && (
                                <FormHelperText error>Parliament is required</FormHelperText>
                            )}
                        </Stack>
                    </Grid>

                    {/* Row 6: Assembly and Block */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Assembly</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.assembly_id}>
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
                            </FormControl>
                            {submitted && !formData.assembly_id && (
                                <FormHelperText error>Assembly is required</FormHelperText>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Block</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.block_id}>
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
                            {submitted && !formData.block_id && (
                                <FormHelperText error>Block is required</FormHelperText>
                            )}
                        </Stack>
                    </Grid>

                    {/* Row 7: Booth */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel required>Booth</InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.booth_id}>
                                <Select
                                    name="booth_id"
                                    value={formData.booth_id}
                                    onChange={handleChange}
                                    disabled={!formData.block_id}
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
                    {event ? 'Update' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}