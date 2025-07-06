// PartyActivitiesModal.jsx
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    Switch, FormControlLabel, Chip, Box
} from '@mui/material';
import { useEffect, useState } from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export default function PartyActivitiesModal({
    open,
    modalToggler,
    partyActivity,
    states,
    divisions,
    parliaments,
    assemblies,
    blocks,
    booths,
    parties,
    users,
    refresh
}) {
    console.log('divisions', divisions);
    const [formData, setFormData] = useState({
        party_id: '',
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: '',
        activity_type: '',
        title: '',
        description: '',
        activity_date: new Date(),
        end_date: null,
        location: '',
        status: 'scheduled',
        attendance_count: '',
        media_coverage: false,
        media_links: [],
        created_by: '',
        updated_by: ''
    });

    // Filtered arrays for cascading dropdowns
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);
    const [mediaLinkInput, setMediaLinkInput] = useState('');

    const activityTypes = [
        'rally', 'sabha', 'meeting', 'campaign', 'door_to_door', 'press_conference'
    ];

    const statusOptions = [
        'scheduled', 'completed', 'cancelled', 'postponed'
    ];

    useEffect(() => {
        if (partyActivity) {
            setFormData({
                party_id: partyActivity.party_id?._id || '',
                state_id: partyActivity.state_id?._id || '',
                division_id: partyActivity.division_id?._id || '',
                parliament_id: partyActivity.parliament_id?._id || '',
                assembly_id: partyActivity.assembly_id?._id || '',
                block_id: partyActivity.block_id?._id || '',
                booth_id: partyActivity.booth_id?._id || '',
                activity_type: partyActivity.activity_type || '',
                title: partyActivity.title || '',
                description: partyActivity.description || '',
                activity_date: partyActivity.activity_date ? new Date(partyActivity.activity_date) : new Date(),
                end_date: partyActivity.end_date ? new Date(partyActivity.end_date) : null,
                location: partyActivity.location || '',
                status: partyActivity.status || 'scheduled',
                attendance_count: partyActivity.attendance_count || '',
                media_coverage: partyActivity.media_coverage || false,
                media_links: partyActivity.media_links || [],
                created_by: partyActivity.created_by?._id || '',
                updated_by: partyActivity.updated_by?._id || ''
            });
        } else {
            setFormData({
                party_id: '',
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: '',
                activity_type: '',
                title: '',
                description: '',
                activity_date: new Date(),
                end_date: null,
                location: '',
                status: 'scheduled',
                attendance_count: '',
                media_coverage: false,
                media_links: [],
                created_by: '',
                updated_by: ''
            });
        }
    }, [partyActivity]);

    // Cascading dropdown logic: State -> Division
    useEffect(() => {
        if (formData.state_id) {
            console.log('State changed to:', formData.state_id);
            console.log('Divisions:', divisions);
            const filtered = divisions?.filter(division =>
                division.state_id && division.state_id._id === formData.state_id
            ) || [];
            setFilteredDivisions(filtered);

            // Reset dependent fields if current selection is not valid
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
            console.log('Division changed to:', formData.division_id);
            console.log('Parliaments:', parliaments);
            const filtered = parliaments?.filter(parliament =>
                parliament.division_id && parliament.division_id._id === formData.division_id
            ) || [];
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
            console.log('Parliament changed to:', formData.parliament_id);
            console.log('Assemblies:', assemblies);
            const filtered = assemblies?.filter(
                assembly => assembly.parliament_id && assembly.parliament_id._id === formData.parliament_id
            ) || [];
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
            const filtered = blocks?.filter(
                block => block.assembly_id && block.assembly_id._id === formData.assembly_id
            ) || [];
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
            console.log('Block changed to:', formData.block_id);
            console.log('Booths:', booths);
            const filtered = booths?.filter(
                booth => booth.block_id && booth.block_id._id === formData.block_id
            ) || [];
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
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleDateChange = (date) => {
        setFormData((prev) => ({ ...prev, activity_date: date }));
    };

    const handleEndDateChange = (date) => {
        setFormData((prev) => ({ ...prev, end_date: date }));
    };

    const handleAddMediaLink = () => {
        if (mediaLinkInput.trim()) {
            setFormData((prev) => ({
                ...prev,
                media_links: [...prev.media_links, mediaLinkInput.trim()]
            }));
            setMediaLinkInput('');
        }
    };

    const handleRemoveMediaLink = (index) => {
        setFormData((prev) => ({
            ...prev,
            media_links: prev.media_links.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async () => {
        const method = partyActivity ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = partyActivity
            ? `http://localhost:5000/api/party-activities/${partyActivity._id}`
            : 'http://localhost:5000/api/party-activities';

        // Add user tracking
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        // Format the data for submission
        const submitData = {
            ...formData,
            attendance_count: formData.attendance_count ? parseInt(formData.attendance_count) : 0,
            activity_date: formData.activity_date.toISOString(),
            end_date: formData.end_date ? formData.end_date.toISOString() : null,
            ...(partyActivity ? { updated_by: user.id } : { created_by: user.id })
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
                console.error('Failed to submit party activity:', errorData);
                alert('Failed to save party activity. Please check the form data.');
            }
        } catch (error) {
            console.error('Error submitting party activity:', error);
            alert('An error occurred while saving the party activity.');
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
                <DialogTitle>{partyActivity ? 'Edit Party Activity' : 'Add Party Activity'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} mt={1}>
                        {/* Row 1: Party and State */}
                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel>Party</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="party_id"
                                        value={formData.party_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <MenuItem value="">Select Party</MenuItem>
                                        {parties?.map((party) => (
                                            <MenuItem key={party._id} value={party._id}>
                                                {party.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6}>
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
                                        {states?.map((state) => (
                                            <MenuItem key={state._id} value={state._id}>
                                                {state.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>

                        {/* Row 2: Division and Parliament */}
                        <Grid item xs={12} sm={6}>
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

                        <Grid item xs={12} sm={6}>
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

                        {/* Row 3: Assembly and Block */}
                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel>Assembly</InputLabel>
                                <FormControl fullWidth>
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
                            </Stack>
                        </Grid>

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

                        {/* Row 4: Booth and Activity Type */}
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
                                                {booth.name} (No: {booth.booth_number})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel>Activity Type</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="activity_type"
                                        value={formData.activity_type}
                                        onChange={handleChange}
                                        required
                                    >
                                        <MenuItem value="">Select Activity Type</MenuItem>
                                        {activityTypes.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                <Chip label={type.replace('_', ' ').toUpperCase()} size="small" />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>

                        {/* Row 5: Title and Location */}
                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel>Title</InputLabel>
                                <TextField
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    placeholder="Enter activity title"
                                />
                            </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel>Location</InputLabel>
                                <TextField
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    fullWidth
                                    placeholder="Enter activity location"
                                />
                            </Stack>
                        </Grid>

                        {/* Row 6: Description */}
                        <Grid item xs={12}>
                            <Stack spacing={1}>
                                <InputLabel>Description</InputLabel>
                                <TextField
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    placeholder="Enter activity description"
                                />
                            </Stack>
                        </Grid>

                        {/* Row 7: Activity Dates */}
                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel>Activity Start Date & Time</InputLabel>
                                <DateTimePicker
                                    value={formData.activity_date}
                                    onChange={handleDateChange}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                />
                            </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel>Activity End Date & Time</InputLabel>
                                <DateTimePicker
                                    value={formData.end_date}
                                    onChange={handleEndDateChange}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                    minDateTime={formData.activity_date}
                                />
                            </Stack>
                        </Grid>

                        {/* Row 8: Status and Attendance */}
                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel>Status</InputLabel>
                                <FormControl fullWidth>
                                    <Select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        required
                                    >
                                        {statusOptions.map((status) => (
                                            <MenuItem key={status} value={status}>
                                                <Chip
                                                    label={status.toUpperCase()}
                                                    size="small"
                                                    color={
                                                        status === 'scheduled' ? 'info' :
                                                            status === 'completed' ? 'success' :
                                                                status === 'cancelled' ? 'error' :
                                                                    status === 'postponed' ? 'warning' : 'default'
                                                    }
                                                />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel>Attendance Count</InputLabel>
                                <TextField
                                    name="attendance_count"
                                    type="number"
                                    value={formData.attendance_count}
                                    onChange={handleChange}
                                    fullWidth
                                    placeholder="Enter expected/actual attendance"
                                />
                            </Stack>
                        </Grid>

                        {/* Row 9: Media Links */}
                        <Grid item xs={12}>
                            <Stack spacing={1}>
                                <InputLabel>Media Links</InputLabel>
                                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                    <TextField
                                        value={mediaLinkInput}
                                        onChange={(e) => setMediaLinkInput(e.target.value)}
                                        placeholder="Enter media link URL"
                                        fullWidth
                                        size="small"
                                    />
                                    <Button
                                        variant="outlined"
                                        onClick={handleAddMediaLink}
                                        disabled={!mediaLinkInput.trim()}
                                        size="small"
                                    >
                                        Add
                                    </Button>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {formData.media_links.map((link, index) => (
                                        <Chip
                                            key={index}
                                            label={link}
                                            onDelete={() => handleRemoveMediaLink(index)}
                                            size="small"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </Stack>
                        </Grid>

                        {/* Row 10: Media Coverage */}
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        name="media_coverage"
                                        checked={formData.media_coverage}
                                        onChange={handleChange}
                                    />
                                }
                                label="Media Coverage"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => modalToggler(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit}>
                        {partyActivity ? 'Update' : 'Submit'}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}
