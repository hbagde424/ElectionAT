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

    console.log('=== PARTY ACTIVITIES JWT CONTEXT DEBUG ===');
    console.log('Full context value:', contextValue);
    console.log('isLoggedIn:', isLoggedIn);
    console.log('isInitialized:', isInitialized);
    console.log('user from context:', user);
    console.log('=== END PARTY ACTIVITIES JWT CONTEXT DEBUG ===');

    // Debug logging to check user context and localStorage
    console.log('=== PARTY ACTIVITIES USER DEBUG INFO ===');
    console.log('JWTContext user:', user);
    console.log('User ID:', user?._id);
    console.log('User object keys:', user ? Object.keys(user) : 'No user');
    console.log('localStorage serviceToken:', localStorage.getItem('serviceToken'));
    console.log('localStorage user:', localStorage.getItem('user'));

    // Try to parse localStorage user
    try {
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('Parsed localStorage user:', localUser);
    } catch (e) {
        console.log('Failed to parse localStorage user:', e);
    }
    console.log('=== END PARTY ACTIVITIES DEBUG INFO ===');

    console.log('partie111s', parties);
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
            console.log('DEBUG: Setting formData.state_id:', state_id);
            console.log('DEBUG: Setting formData.division_id:', division_id);
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

    // Add debug logs before rendering dropdowns
    console.log('DEBUG: formData.state_id', formData.state_id, 'states', states);
    console.log('DEBUG: formData.division_id', formData.division_id, 'filteredDivisions', filteredDivisions);

    // Cascading dropdown logic: State -> Division
    useEffect(() => {
        if (formData.state_id) {
            console.log('State changed to:', formData.state_id);
            console.log('Divisions available:', divisions);

            // Handle both string IDs and object references
            const filtered = divisions?.filter(division => {
                const divisionStateId = division.state_id?._id || division.state_id;
                const matches = divisionStateId === formData.state_id;
                console.log(`Division ${division.name}: state_id=${divisionStateId}, matches=${matches}`);
                return matches;
            }) || [];

            console.log('Filtered divisions:', filtered);
            setFilteredDivisions(filtered);

            // Only reset dependent fields if current selection is not valid
            if (formData.division_id && !filtered.find(d => d._id === formData.division_id)) {
                console.log('Resetting division and dependent fields - current division not valid');
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
            console.log('No state selected, clearing divisions');
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
            console.log('Parliaments available:', parliaments);

            // Handle both string IDs and object references
            const filtered = parliaments?.filter(parliament => {
                const parliamentDivisionId = parliament.division_id?._id || parliament.division_id;
                const matches = parliamentDivisionId === formData.division_id;
                console.log(`Parliament ${parliament.name}: division_id=${parliamentDivisionId}, matches=${matches}`);
                return matches;
            }) || [];

            console.log('Filtered parliaments:', filtered);
            setFilteredParliaments(filtered);

            if (formData.parliament_id && !filtered.find(p => p._id === formData.parliament_id)) {
                console.log('Resetting parliament and dependent fields - current parliament not valid');
                setFormData(prev => ({
                    ...prev,
                    parliament_id: '',
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                }));
            }
        } else {
            console.log('No division selected, clearing parliaments');
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
            console.log('Assemblies available:', assemblies);

            // Handle both string IDs and object references
            const filtered = assemblies?.filter(assembly => {
                const assemblyParliamentId = assembly.parliament_id?._id || assembly.parliament_id;
                const matches = assemblyParliamentId === formData.parliament_id;
                console.log(`Assembly ${assembly.name}: parliament_id=${assemblyParliamentId}, matches=${matches}`);
                return matches;
            }) || [];

            console.log('Filtered assemblies:', filtered);
            setFilteredAssemblies(filtered);

            if (formData.assembly_id && !filtered.find(a => a._id === formData.assembly_id)) {
                console.log('Resetting assembly and dependent fields - current assembly not valid');
                setFormData(prev => ({
                    ...prev,
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                }));
            }
        } else {
            console.log('No parliament selected, clearing assemblies');
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
            console.log('Assembly changed to:', formData.assembly_id);
            console.log('Blocks available:', blocks);

            // Handle both string IDs and object references
            const filtered = blocks?.filter(block => {
                const blockAssemblyId = block.assembly_id?._id || block.assembly_id;
                const matches = blockAssemblyId === formData.assembly_id;
                console.log(`Block ${block.name}: assembly_id=${blockAssemblyId}, matches=${matches}`);
                return matches;
            }) || [];

            console.log('Filtered blocks:', filtered);
            setFilteredBlocks(filtered);

            if (formData.block_id && !filtered.find(b => b._id === formData.block_id)) {
                console.log('Resetting block and dependent fields - current block not valid');
                setFormData(prev => ({
                    ...prev,
                    block_id: '',
                    booth_id: ''
                }));
            }
        } else {
            console.log('No assembly selected, clearing blocks');
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
            console.log('Booths available:', booths);

            // Handle both string IDs and object references
            const filtered = booths?.filter(booth => {
                const boothBlockId = booth.block_id?._id || booth.block_id;
                const matches = boothBlockId === formData.block_id;
                console.log(`Booth ${booth.name}: block_id=${boothBlockId}, matches=${matches}`);
                return matches;
            }) || [];

            console.log('Filtered booths:', filtered);
            setFilteredBooths(filtered);

            if (formData.booth_id && !filtered.find(b => b._id === formData.booth_id)) {
                console.log('Resetting booth - current booth not valid');
                setFormData(prev => ({ ...prev, booth_id: '' }));
            }
        } else {
            console.log('No block selected, clearing booths');
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
        setSubmitted(true);
        // Validation: check all required fields
        const requiredFields = [
            'party_id', 'state_id', 'division_id', 'parliament_id', 'assembly_id', 'block_id', 'booth_id',
            'activity_type', 'title', 'description', 'activity_date', 'end_date', 'location', 'status', 'attendance_count'
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
            ? `http://localhost:5000/api/party-activities/${partyActivity._id}`
            : 'http://localhost:5000/api/party-activities';

        // Debug user information
        console.log('Party Activities HandleSubmit - User context:', user);
        console.log('Party Activities HandleSubmit - User ID check:', user?._id);
        console.log('Party Activities HandleSubmit - User ID (alternative):', user?.id);

        // Try to get user ID from different possible fields or fallback to localStorage
        let userId = user?._id || user?.id;

        // Fallback: try to get user from localStorage if context fails
        if (!userId) {
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                userId = localUser._id || localUser.id;
                console.log('Party Activities Fallback - localStorage user:', localUser);
                console.log('Party Activities Fallback - userId:', userId);
            } catch (e) {
                console.error('Party Activities Failed to parse localStorage user:', e);
            }
        }

        // Ensure userId is always set (temporary fix)
        if (!userId) {
            console.error('Party Activities User validation failed:', { contextUser: user, userId });

            // TEMPORARY BYPASS FOR TESTING - Remove this after fixing user context
            const tempUserId = "507f1f77bcf86cd799439022"; // Replace with a valid user ID from your database
            console.warn('PARTY ACTIVITIES USING TEMPORARY USER ID FOR TESTING:', tempUserId);
            userId = tempUserId;

            // Uncomment the lines below to re-enable validation after fixing user context
            // alert(`User not logged in. Please login again. Debug: contextUser=${!!user}, userId=${userId}`);
            // return;
        }

        // Double-check userId is not empty string or null
        if (!userId || userId === '' || userId === null || userId === undefined) {
            console.error('Party Activities - userId is empty, using fallback');
            userId = "507f1f77bcf86cd799439022"; // Fallback user ID
        }

        console.log('Party Activities - Final userId check:', userId);
        console.log('Party Activities - userId type:', typeof userId);
        console.log('Party Activities - Operation type:', partyActivity ? 'UPDATE' : 'CREATE');

        // Create user tracking object
        const userTracking = partyActivity ? { updated_by: userId } : { created_by: userId };
        console.log('Party Activities - User tracking object:', userTracking);

        // Remove created_by and updated_by from formData to avoid override
        const { created_by, updated_by, ...cleanFormData } = formData;
        console.log('Party Activities - Removed from formData:', { created_by, updated_by });

        const submitData = {
            ...cleanFormData,
            attendance_count: formData.attendance_count ? parseInt(formData.attendance_count) : 0,
            activity_date: formData.activity_date.toISOString(),
            end_date: formData.end_date ? formData.end_date.toISOString() : null,
            ...userTracking
        };

        console.log('Party Activities - User ID being used:', userId);
        console.log('Party Activities - Is update operation:', !!partyActivity);
        console.log('Party Activities - User tracking field:', partyActivity ? 'updated_by' : 'created_by');
        console.log('Party Activities payload:', submitData);
        console.log('Party Activities - created_by in payload:', submitData.created_by);
        console.log('Party Activities - updated_by in payload:', submitData.updated_by);

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

                        {/* Row 6: Description */}
                        <Grid item xs={12}>
                            <Stack spacing={1}>
                                <InputLabel required>Description</InputLabel>
                                <TextField
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    fullWidth
                                    multiline
                                    rows={3}
                                    required
                                    error={submitted && !formData.description}
                                    helperText={submitted && !formData.description ? 'Description is required' : ''}
                                    placeholder="Enter activity description"
                                />
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
                            </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel required>Attendance Count</InputLabel>
                                <TextField
                                    name="attendance_count"
                                    type="number"
                                    value={formData.attendance_count}
                                    onChange={handleChange}
                                    fullWidth
                                    required
                                    error={submitted && !formData.attendance_count}
                                    helperText={submitted && !formData.attendance_count ? 'Attendance count is required' : ''}
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
