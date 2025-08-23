// PartyActivitiesModal.jsx
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    Switch, FormControlLabel, Chip, Box
} from '@mui/material';
import { useEffect, useState, useContext } from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
// project imports
import JWTContext from 'contexts/JWTContext';

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
    // Get logged-in user from context
    const contextValue = useContext(JWTContext);
    const { user, isLoggedIn, isInitialized } = contextValue || {};

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
        media_links: []
        // Note: created_by and updated_by are handled separately in handleSubmit
    });
    const [submitted, setSubmitted] = useState(false);

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
        if (partyActivity && Array.isArray(states) && states.length > 0) {
            const state_id = partyActivity.state_id?._id?.toString() || partyActivity.state_id?.toString() || '';
            const division_id = partyActivity.division_id?._id?.toString() || partyActivity.division_id?.toString() || '';
            setFormData({
                party_id: partyActivity.party_id?._id?.toString() || partyActivity.party_id?.toString() || '',
                state_id,
                division_id,
                parliament_id: partyActivity.parliament_id?._id?.toString() || partyActivity.parliament_id?.toString() || '',
                assembly_id: partyActivity.assembly_id?._id?.toString() || partyActivity.assembly_id?.toString() || '',
                block_id: partyActivity.block_id?._id?.toString() || partyActivity.block_id?.toString() || '',
                booth_id: partyActivity.booth_id?._id?.toString() || partyActivity.booth_id?.toString() || '',
                activity_type: partyActivity.activity_type || '',
                title: partyActivity.title || '',
                description: partyActivity.description || '',
                activity_date: partyActivity.activity_date ? new Date(partyActivity.activity_date) : new Date(),
                end_date: partyActivity.end_date ? new Date(partyActivity.end_date) : null,
                location: partyActivity.location || '',
                status: partyActivity.status || 'scheduled',
                attendance_count: partyActivity.attendance_count || '',
                media_coverage: partyActivity.media_coverage || false,
                media_links: partyActivity.media_links || []
                // Note: created_by and updated_by are handled separately in handleSubmit
            });
        } else if (!partyActivity) {
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
                media_links: []
                // Note: created_by and updated_by are handled separately in handleSubmit
            });
        }
    }, [partyActivity, states]);

    // Cascading dropdown logic: State -> Division
    useEffect(() => {
        if (formData.state_id) {
            // Handle both string IDs and object references
            const filtered = divisions?.filter(division => {
                const divisionStateId = division.state_id?._id || division.state_id;
                return divisionStateId === formData.state_id;
            }) || [];

            setFilteredDivisions(filtered);

            // Only reset dependent fields if current selection is not valid
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
            // Handle both string IDs and object references
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
            // Handle both string IDs and object references
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
            // Handle both string IDs and object references
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
            // Handle both string IDs and object references
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
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // For ReactQuill description
    const handleDescriptionChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            description: value
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
        setSubmitted(true);
        // Validation: check all required fields (excluding end_date and attendance_count which are optional)
        const requiredFields = [
            'party_id', 'state_id', 'division_id', 'parliament_id', 'assembly_id', 'block_id', 'booth_id',
            'activity_type', 'title', 'description', 'activity_date', 'location', 'status'
        ];
        for (const field of requiredFields) {
            if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
                // Do not alert, just show errors in UI
                return;
            }
        }

        const method = partyActivity ? 'PUT' : 'POST';
        const token = localStorage.getItem('serviceToken');
        const url = partyActivity
            ? `${import.meta.env.VITE_APP_API_URL}/party-activities/${partyActivity._id}`
            : `${import.meta.env.VITE_APP_API_URL}/party-activities`;

        // Try to get user ID from different possible fields or fallback to localStorage
        let userId = user?._id || user?.id;

        // Fallback: try to get user from localStorage if context fails
        if (!userId) {
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                userId = localUser._id || localUser.id;
            } catch (e) {
                console.error('Failed to parse localStorage user:', e);
            }
        }

        // Ensure userId is always set
        if (!userId) {
            //  alert('User not logged in. Please login again.');
            //  return;
        }

        // Create user tracking object
        const userTracking = partyActivity ? { updated_by: userId } : { created_by: userId };

        // Remove created_by and updated_by from formData to avoid override
        const { created_by, updated_by, ...cleanFormData } = formData;

        const submitData = {
            ...cleanFormData,
            attendance_count: formData.attendance_count ? parseInt(formData.attendance_count) : 0,
            activity_date: formData.activity_date.toISOString(),
            end_date: formData.end_date ? formData.end_date.toISOString() : null,
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
                                <InputLabel required>Party</InputLabel>
                                <FormControl fullWidth required error={submitted && !formData.party_id}>
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
                                {submitted && !formData.party_id && (
                                    <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Party is required</Box>
                                )}
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


                        {/* Row 2: Division and Parliament */}
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

                        {/* Row 3: Assembly and Block */}
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

                        {/* Row 4: Booth and Activity Type */}
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
                                                {booth.name} (No: {booth.booth_number})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                {submitted && !formData.booth_id && (
                                    <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Booth is required</Box>
                                )}
                            </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel required>Activity Type</InputLabel>
                                <FormControl fullWidth required error={submitted && !formData.activity_type}>
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
                                {submitted && !formData.activity_type && (
                                    <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Activity Type is required</Box>
                                )}
                            </Stack>
                        </Grid>

                        {/* Row 5: Title and Location */}
                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel required>Title</InputLabel>
                                <TextField
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    error={submitted && !formData.title}
                                    helperText={submitted && !formData.title ? 'Title is required' : ''}
                                    placeholder="Enter activity title"
                                />
                            </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel required>Location</InputLabel>
                                <TextField
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    error={submitted && !formData.location}
                                    helperText={submitted && !formData.location ? 'Location is required' : ''}
                                    placeholder="Enter activity location"
                                />
                            </Stack>
                        </Grid>

                        {/* Row 6: Description (ReactQuill) */}
                        <Grid item xs={12}>
                            <Stack spacing={1}>
                                <InputLabel required>Description</InputLabel>
                                <ReactQuill
                                    theme="snow"
                                    value={formData.description}
                                    onChange={handleDescriptionChange}
                                    placeholder="Enter activity description"
                                    style={{ background: 'white' }}
                                />
                                {submitted && !formData.description && (
                                    <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Description is required</Box>
                                )}
                            </Stack>
                        </Grid>

                        {/* Row 7: Activity Dates */}
                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel required>Activity Start Date & Time</InputLabel>
                                <DateTimePicker
                                    value={formData.activity_date}
                                    onChange={handleDateChange}
                                    renderInput={(params) => <TextField {...params} fullWidth required error={submitted && !formData.activity_date} helperText={submitted && !formData.activity_date ? 'Start date is required' : ''} />}
                                />
                            </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel required>Activity End Date & Time</InputLabel>
                                <DateTimePicker
                                    value={formData.end_date}
                                    onChange={handleEndDateChange}
                                    renderInput={(params) => <TextField {...params} fullWidth required error={submitted && !formData.end_date} helperText={submitted && !formData.end_date ? 'End date is required' : ''} />}
                                    minDateTime={formData.activity_date}
                                />
                            </Stack>
                        </Grid>

                        {/* Row 8: Status and Attendance */}
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
                                {submitted && !formData.status && (
                                    <Box sx={{ color: 'error.main', fontSize: 12, mt: 0.5 }}>Status is required</Box>
                                )}
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

