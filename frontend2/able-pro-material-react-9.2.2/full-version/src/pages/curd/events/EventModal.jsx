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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

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
    const [formData, setFormData] = useState({
        name: '',
        type: 'event',
        status: 'incomplete',
        description: '',
        start_date: new Date(),
        end_date: new Date(),
        location: '',
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
        if (event) {
            setFormData({
                name: event.name || '',
                type: event.type || 'event',
                status: event.status || 'incomplete',
                description: event.description || '',
                start_date: new Date(event.start_date) || new Date(),
                end_date: new Date(event.end_date) || new Date(),
                location: event.location || '',
                state_id: event.state_id?._id || '',
                division_id: event.division_id?._id || '',
                parliament_id: event.parliament_id?._id || '',
                assembly_id: event.assembly_id?._id || '',
                block_id: event.block_id?._id || '',
                booth_id: event.booth_id?._id || ''
            });
        } else {
            setFormData({
                name: '',
                type: 'event',
                status: 'incomplete',
                description: '',
                start_date: new Date(),
                end_date: new Date(),
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

    // Filter divisions by state
    useEffect(() => {
        if (formData.state_id) {
            const filtered = divisions.filter(div => div.state_id?._id === formData.state_id);
            setFilteredDivisions(filtered);
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
            if (name === 'state_id') {
                return {
                    ...prev,
                    [name]: value,
                    division_id: '',
                    parliament_id: '',
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                };
            }
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

    const handleSubmit = async () => {
        try {
            const method = event ? 'PUT' : 'POST';
            const token = localStorage.getItem('serviceToken');
            const url = event
                ? `http://localhost:5000/api/events/${event._id}`
                : 'http://localhost:5000/api/events';

            const payload = {
                ...formData,
                start_date: formData.start_date.toISOString(),
                end_date: formData.end_date.toISOString()
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
                console.error('Failed to save event:', errorData);
            }
        } catch (error) {
            console.error('Error saving event:', error);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
                <DialogTitle>{event ? 'Edit Event' : 'Add Event'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={2}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>Event Name</InputLabel>
                                    <TextField
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                        inputProps={{ maxLength: 100 }}
                                    />
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>Location</InputLabel>
                                    <TextField
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                        inputProps={{ maxLength: 200 }}
                                    />
                                </Stack>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>Type</InputLabel>
                                    <FormControl fullWidth>
                                        <Select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleChange}
                                            required
                                        >
                                            <MenuItem value="event">Event</MenuItem>
                                            <MenuItem value="campaign">Campaign</MenuItem>
                                            <MenuItem value="activity">Activity</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>Status</InputLabel>
                                    <FormControl fullWidth>
                                        <Select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            required
                                        >
                                            <MenuItem value="incomplete">Incomplete</MenuItem>
                                            <MenuItem value="done">Done</MenuItem>
                                            <MenuItem value="cancelled">Cancelled</MenuItem>
                                            <MenuItem value="postponed">Postponed</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Stack>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>Start Date</InputLabel>
                                    <DatePicker
                                        value={formData.start_date}
                                        onChange={(date) => handleDateChange('start_date', date)}
                                        slotProps={{ textField: { fullWidth: true } }}
                                    />
                                </Stack>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Stack spacing={1}>
                                    <InputLabel>End Date</InputLabel>
                                    <DatePicker
                                        value={formData.end_date}
                                        onChange={(date) => handleDateChange('end_date', date)}
                                        slotProps={{ textField: { fullWidth: true } }}
                                        minDate={formData.start_date}
                                    />
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
                                rows={4}
                                inputProps={{ maxLength: 500 }}
                            />
                        </Stack>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
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
                        </Grid>

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
                        {event ? 'Update' : 'Submit'}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}