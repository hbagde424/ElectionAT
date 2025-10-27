import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Grid, Stack, TextField, InputLabel, Select, MenuItem, FormControl,
    Chip, Box, FormHelperText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useEffect, useState, useContext } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
// project imports
import JWTContext from 'contexts/JWTContext';
import { usePermissions } from 'contexts/PermissionContext';

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
    const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();

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
        booth_id: '',
        panchayat_id: '',
        village_id: '',
        falliya_id: '',
        year: '',
        media: []
    });
    const [submitted, setSubmitted] = useState(false);
    const [mediaFiles, setMediaFiles] = useState([]);

    // Filtered arrays for cascading dropdowns
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    // New state for panchayat, village, falliya
    const [panchayats, setPanchayats] = useState([]);
    const [villages, setVillages] = useState([]);
    const [falliyas, setFalliyas] = useState([]);
    const [filteredVillages, setFilteredVillages] = useState([]);
    const [filteredFalliyas, setFilteredFalliyas] = useState([]);

    // Filtered data based on user hierarchy permissions
    const [hierarchyFilteredStates, setHierarchyFilteredStates] = useState([]);
    const [hierarchyFilteredDivisions, setHierarchyFilteredDivisions] = useState([]);
    const [hierarchyFilteredParliaments, setHierarchyFilteredParliaments] = useState([]);
    const [hierarchyFilteredAssemblies, setHierarchyFilteredAssemblies] = useState([]);
    const [hierarchyFilteredBlocks, setHierarchyFilteredBlocks] = useState([]);
    const [hierarchyFilteredBooths, setHierarchyFilteredBooths] = useState([]);

    const eventTypes = ['event', 'campaign', 'activity'];
    const eventStatuses = ['done', 'incomplete', 'cancelled', 'postponed'];

    // Filter data based on user hierarchy permissions
    useEffect(() => {
        if (!userHierarchy) {
            // No hierarchy restrictions - show all data
            setHierarchyFilteredStates(states);
            setHierarchyFilteredDivisions(divisions);
            setHierarchyFilteredParliaments(parliaments);
            setHierarchyFilteredAssemblies(assemblies);
            setHierarchyFilteredBlocks(blocks);
            setHierarchyFilteredBooths(booths);
            return;
        }

        const highest = getUserHighestLevel();
        if (!highest) {
            // No specific level - show all data
            setHierarchyFilteredStates(states);
            setHierarchyFilteredDivisions(divisions);
            setHierarchyFilteredParliaments(parliaments);
            setHierarchyFilteredAssemblies(assemblies);
            setHierarchyFilteredBlocks(blocks);
            setHierarchyFilteredBooths(booths);
            return;
        }

        // Filter based on user's highest access level
        switch (highest) {
            case 'state':
                setHierarchyFilteredStates(states.filter(s => s._id === userHierarchy.state));
                setHierarchyFilteredDivisions(divisions.filter(d => (d.state_id?._id || d.state_id) === userHierarchy.state));
                setHierarchyFilteredParliaments(parliaments.filter(p => (p.state_id?._id || p.state_id) === userHierarchy.state));
                setHierarchyFilteredAssemblies(assemblies.filter(a => (a.state_id?._id || a.state_id) === userHierarchy.state));
                setHierarchyFilteredBlocks(blocks.filter(b => (b.state_id?._id || b.state_id) === userHierarchy.state));
                setHierarchyFilteredBooths(booths.filter(booth => (booth.state_id?._id || booth.state_id) === userHierarchy.state));
                break;
            case 'division':
                setHierarchyFilteredStates(states.filter(s => s._id === userHierarchy.state));
                setHierarchyFilteredDivisions(divisions.filter(d => d._id === userHierarchy.division));
                setHierarchyFilteredParliaments(parliaments.filter(p => (p.division_id?._id || p.division_id) === userHierarchy.division));
                setHierarchyFilteredAssemblies(assemblies.filter(a => (a.division_id?._id || a.division_id) === userHierarchy.division));
                setHierarchyFilteredBlocks(blocks.filter(b => (b.division_id?._id || b.division_id) === userHierarchy.division));
                setHierarchyFilteredBooths(booths.filter(booth => (booth.division_id?._id || booth.division_id) === userHierarchy.division));
                break;
            case 'parliament':
                setHierarchyFilteredStates(states.filter(s => s._id === userHierarchy.state));
                setHierarchyFilteredDivisions(divisions.filter(d => d._id === userHierarchy.division));
                setHierarchyFilteredParliaments(parliaments.filter(p => p._id === userHierarchy.parliament));
                setHierarchyFilteredAssemblies(assemblies.filter(a => (a.parliament_id?._id || a.parliament_id) === userHierarchy.parliament));
                setHierarchyFilteredBlocks(blocks.filter(b => (b.parliament_id?._id || b.parliament_id) === userHierarchy.parliament));
                setHierarchyFilteredBooths(booths.filter(booth => (booth.parliament_id?._id || booth.parliament_id) === userHierarchy.parliament));
                break;
            case 'assembly':
                setHierarchyFilteredStates(states.filter(s => s._id === userHierarchy.state));
                setHierarchyFilteredDivisions(divisions.filter(d => d._id === userHierarchy.division));
                setHierarchyFilteredParliaments(parliaments.filter(p => p._id === userHierarchy.parliament));
                setHierarchyFilteredAssemblies(assemblies.filter(a => a._id === userHierarchy.assembly));
                setHierarchyFilteredBlocks(blocks.filter(b => (b.assembly_id?._id || b.assembly_id) === userHierarchy.assembly));
                setHierarchyFilteredBooths(booths.filter(booth => (booth.assembly_id?._id || booth.assembly_id) === userHierarchy.assembly));
                break;
            case 'block':
                setHierarchyFilteredStates(states.filter(s => s._id === userHierarchy.state));
                setHierarchyFilteredDivisions(divisions.filter(d => d._id === userHierarchy.division));
                setHierarchyFilteredParliaments(parliaments.filter(p => p._id === userHierarchy.parliament));
                setHierarchyFilteredAssemblies(assemblies.filter(a => a._id === userHierarchy.assembly));
                setHierarchyFilteredBlocks(blocks.filter(b => b._id === userHierarchy.block));
                setHierarchyFilteredBooths(booths.filter(booth => (booth.block_id?._id || booth.block_id) === userHierarchy.block));
                break;
            case 'booth':
                setHierarchyFilteredStates(states.filter(s => s._id === userHierarchy.state));
                setHierarchyFilteredDivisions(divisions.filter(d => d._id === userHierarchy.division));
                setHierarchyFilteredParliaments(parliaments.filter(p => p._id === userHierarchy.parliament));
                setHierarchyFilteredAssemblies(assemblies.filter(a => a._id === userHierarchy.assembly));
                setHierarchyFilteredBlocks(blocks.filter(b => b._id === userHierarchy.block));
                setHierarchyFilteredBooths(booths.filter(booth => booth._id === userHierarchy.booth));
                break;
            default:
                setHierarchyFilteredStates(states);
                setHierarchyFilteredDivisions(divisions);
                setHierarchyFilteredParliaments(parliaments);
                setHierarchyFilteredAssemblies(assemblies);
                setHierarchyFilteredBlocks(blocks);
                setHierarchyFilteredBooths(booths);
        }
    }, [userHierarchy, states, divisions, parliaments, assemblies, blocks, booths, getUserHighestLevel]);

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
                booth_id: event.booth_id?._id?.toString() || event.booth_id?.toString() || '',
                panchayat_id: event.panchayat_id?._id?.toString() || event.panchayat_id?.toString() || '',
                village_id: event.village_id?._id?.toString() || event.village_id?.toString() || '',
                falliya_id: event.falliya_id?._id?.toString() || event.falliya_id?.toString() || '',
                year: event.year || '',
                media: event.media || []
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
                booth_id: '',
                panchayat_id: '',
                village_id: '',
                falliya_id: '',
                year: '',
                media: []
            });
        }
    }, [event]);

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
    }, [formData.parliament_id, hierarchyFilteredAssemblies]);

    // Assembly -> Block
    useEffect(() => {
        if (formData.assembly_id) {
            const filtered = hierarchyFilteredBlocks?.filter(block => {
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
    }, [formData.assembly_id, hierarchyFilteredBlocks]);

    // Block -> Booth
    useEffect(() => {
        if (formData.block_id) {
            const filtered = hierarchyFilteredBooths?.filter(booth => {
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
    }, [formData.block_id, hierarchyFilteredBooths]);

    // Fetch all panchayats, villages, and falliyas (no dependencies)
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const token = localStorage.getItem('serviceToken');
                const headers = { Authorization: `Bearer ${token}` };

                const [panchayatRes, villageRes, falliyaRes] = await Promise.all([
                    fetch('http://localhost:5000/api/panchayats?limit=10000', { headers }),
                    fetch('http://localhost:5000/api/villages?limit=10000', { headers }),
                    fetch('http://localhost:5000/api/falliyas?limit=10000', { headers })
                ]);

                const panchayatData = await panchayatRes.json();
                const villageData = await villageRes.json();
                const falliyaData = await falliyaRes.json();

                if (panchayatData.success) setPanchayats(panchayatData.data || []);
                if (villageData.success) setVillages(villageData.data || []);
                if (falliyaData.success) setFalliyas(falliyaData.data || []);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        if (open) {
            fetchAllData();
        }
    }, [open]);

    // Cascading filter: Panchayat -> Village
    useEffect(() => {
        if (formData.panchayat_id) {
            const filtered = villages.filter(v => {
                const villagePanchayatId = v.panchayat_id?._id || v.panchayat_id;
                return villagePanchayatId?.toString() === formData.panchayat_id.toString();
            });
            setFilteredVillages(filtered);
            
            if (formData.village_id && !filtered.find(v => v._id?.toString() === formData.village_id.toString())) {
                setFormData(prev => ({ ...prev, village_id: '', falliya_id: '' }));
            }
        } else {
            setFilteredVillages([]);
            setFormData(prev => ({ ...prev, village_id: '', falliya_id: '' }));
        }
    }, [formData.panchayat_id, villages]);

    // Cascading filter: Village -> Falliya
    useEffect(() => {
        if (formData.village_id) {
            const filtered = falliyas.filter(f => {
                const falliyaVillageId = f.village_id?._id || f.village_id;
                return falliyaVillageId?.toString() === formData.village_id.toString();
            });
            setFilteredFalliyas(filtered);
            
            if (formData.falliya_id && !filtered.find(f => f._id?.toString() === formData.falliya_id.toString())) {
                setFormData(prev => ({ ...prev, falliya_id: '' }));
            }
        } else {
            setFilteredFalliyas([]);
            setFormData(prev => ({ ...prev, falliya_id: '' }));
        }
    }, [formData.village_id, falliyas]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // For ReactQuill description
    const handleDescriptionChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            description: value
        }));
    };

    const handleDateChange = (name, date) => {
        setFormData((prev) => ({
            ...prev,
            [name]: date
        }));
    };

    const handleMediaFileChange = (e) => {
        const files = Array.from(e.target.files);
        setMediaFiles(prev => [...prev, ...files]);
    };

    const handleRemoveMediaFile = (index) => {
        setMediaFiles(prev => prev.filter((_, i) => i !== index));
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
            ? `${import.meta.env.VITE_APP_API_URL}/events/${event._id}`
            : `${import.meta.env.VITE_APP_API_URL}/events`;

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
        
        // Use FormData for file upload
        const submitData = new FormData();
        
        // Append all form fields
        Object.keys(formData).forEach(key => {
            if (key !== 'media' && formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
                submitData.append(key, formData[key]);
            }
        });
        
        // Append user tracking
        Object.keys(userTracking).forEach(key => {
            submitData.append(key, userTracking[key]);
        });
        
        // Append media files
        mediaFiles.forEach(file => {
            submitData.append('media', file);
        });

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: submitData
            });

            if (res.ok) {
                modalToggler(false);
                refresh();
                setMediaFiles([]); // Clear media files after successful submit
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
                            <InputLabel>Event Name <span style={{ color: 'red' }}>*</span></InputLabel>
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
                            <InputLabel>Event Type <span style={{ color: 'red' }}>*</span></InputLabel>
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
                            <ReactQuill
                                theme="snow"
                                value={formData.description}
                                onChange={handleDescriptionChange}
                                placeholder="Enter event description"
                                style={{ background: 'white' }}
                            />
                        </Stack>
                    </Grid>

                    {/* Row 3: Dates */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Start Date <span style={{ color: 'red' }}>*</span></InputLabel>
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
                            <InputLabel>End Date <span style={{ color: 'red' }}>*</span></InputLabel>
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
                            <InputLabel>Location <span style={{ color: 'red' }}>*</span></InputLabel>
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
                            <InputLabel>State <span style={{ color: 'red' }}>*</span></InputLabel>
                            <FormControl fullWidth required error={submitted && !formData.state_id}>
                                <Select
                                    name="state_id"
                                    value={formData.state_id}
                                    onChange={handleChange}
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
                                <FormHelperText error>State is required</FormHelperText>
                            )}
                        </Stack>
                    </Grid>

                    {/* Row 5: Division and Parliament */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Division <span style={{ color: 'red' }}>*</span></InputLabel>
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
                            <InputLabel>Parliament <span style={{ color: 'red' }}>*</span></InputLabel>
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
                            <InputLabel>Assembly <span style={{ color: 'red' }}>*</span></InputLabel>
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
                            <InputLabel>Block <span style={{ color: 'red' }}>*</span></InputLabel>
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
                            <InputLabel>Booth <span style={{ color: 'red' }}>*</span></InputLabel>
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

                    {/* Row 8: Panchayat and Village */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Panchayat</InputLabel>
                            <FormControl fullWidth>
                                <Select
                                    name="panchayat_id"
                                    value={formData.panchayat_id}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="">Select Panchayat</MenuItem>
                                    {panchayats.map((panchayat) => (
                                        <MenuItem key={panchayat._id} value={panchayat._id}>
                                            {panchayat.panchayat_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Village</InputLabel>
                            <FormControl fullWidth>
                                <Select
                                    name="village_id"
                                    value={formData.village_id}
                                    onChange={handleChange}
                                    disabled={!formData.panchayat_id}
                                >
                                    <MenuItem value="">Select Village</MenuItem>
                                    {filteredVillages.map((village) => (
                                        <MenuItem key={village._id} value={village._id}>
                                            {village.village_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    {/* Row 9: Falliya and Year */}
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Falliya</InputLabel>
                            <FormControl fullWidth>
                                <Select
                                    name="falliya_id"
                                    value={formData.falliya_id}
                                    onChange={handleChange}
                                    disabled={!formData.village_id}
                                >
                                    <MenuItem value="">Select Falliya</MenuItem>
                                    {filteredFalliyas.map((falliya) => (
                                        <MenuItem key={falliya._id} value={falliya._id}>
                                            {falliya.falliya_name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <InputLabel>Year</InputLabel>
                            <FormControl fullWidth>
                                <Select
                                    name="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                >
                                    <MenuItem value="">Select Year</MenuItem>
                                    <MenuItem value={2020}>2020</MenuItem>
                                    <MenuItem value={2021}>2021</MenuItem>
                                    <MenuItem value={2022}>2022</MenuItem>
                                    <MenuItem value={2023}>2023</MenuItem>
                                    <MenuItem value={2024}>2024</MenuItem>
                                    <MenuItem value={2025}>2025</MenuItem>
                                    <MenuItem value={2026}>2026</MenuItem>
                                    <MenuItem value={2027}>2027</MenuItem>
                                    <MenuItem value={2028}>2028</MenuItem>
                                    <MenuItem value={2029}>2029</MenuItem>
                                    <MenuItem value={2030}>2030</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Grid>

                    {/* Row 10: Photos/Videos */}
                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <InputLabel>Photos / Videos</InputLabel>
                            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 2 }}>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    fullWidth
                                    sx={{ mb: 2 }}
                                >
                                    Select Photos/Videos to Upload
                                    <input
                                        type="file"
                                        hidden
                                        multiple
                                        accept="image/*,video/*"
                                        onChange={handleMediaFileChange}
                                    />
                                </Button>

                                {/* Display Selected Files */}
                                {mediaFiles && mediaFiles.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <InputLabel sx={{ mb: 1 }}>Selected Files ({mediaFiles.length})</InputLabel>
                                        <Stack spacing={1}>
                                            {mediaFiles.map((file, index) => (
                                                <Chip
                                                    key={index}
                                                    label={`${file.type.startsWith('image/') ? '📷' : '🎥'} ${file.name} (${(file.size / 1024).toFixed(2)} KB)`}
                                                    onDelete={() => handleRemoveMediaFile(index)}
                                                    sx={{ justifyContent: 'space-between' }}
                                                />
                                            ))}
                                        </Stack>
                                    </Box>
                                )}

                                {/* Display existing media for edit mode */}
                                {event && formData.media && formData.media.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <InputLabel sx={{ mb: 1 }}>Existing Media ({formData.media.length})</InputLabel>
                                        <Stack spacing={1}>
                                            {formData.media.map((item, index) => (
                                                <Chip
                                                    key={index}
                                                    label={`${item.type === 'photo' ? '📷' : '🎥'} ${item.originalname || item.filename}`}
                                                    color="success"
                                                    size="small"
                                                />
                                            ))}
                                        </Stack>
                                    </Box>
                                )}
                            </Box>
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
