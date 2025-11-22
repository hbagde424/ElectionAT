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
import { usePermissions } from 'contexts/PermissionContext';

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
    const { userHierarchy, getUserHighestLevel } = usePermissions();

    const [formData, setFormData] = useState({
        party_id: '',
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
        media: []
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
    const [mediaFiles, setMediaFiles] = useState([]);

    // New location data states
    const [panchayats, setPanchayats] = useState([]);
    const [villages, setVillages] = useState([]);
    const [falliyas, setFalliyas] = useState([]);
    const [filteredVillages, setFilteredVillages] = useState([]);
    const [filteredFalliyas, setFilteredFalliyas] = useState([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Apply hierarchy constraints to base sets
    const getHierarchyConstrained = () => {
        if (!userHierarchy) {
            return { s: states || [], d: divisions || [], p: parliaments || [], a: assemblies || [], b: blocks || [], bt: booths || [] };
        }
        const highest = getUserHighestLevel();
        switch (highest) {
            case 'state':
                return {
                    s: (states || []).filter(x => x._id === userHierarchy.state),
                    d: (divisions || []).filter(x => (x.state_id?._id || x.state_id) === userHierarchy.state),
                    p: (parliaments || []).filter(x => (x.division_id?.state_id?._id) === userHierarchy.state),
                    a: (assemblies || []).filter(x => (x.parliament_id?.division_id?.state_id?._id) === userHierarchy.state),
                    b: (blocks || []).filter(x => (x.assembly_id?.parliament_id?.division_id?.state_id?._id) === userHierarchy.state),
                    bt: (booths || []).filter(x => (x.block_id?.assembly_id?.parliament_id?.division_id?.state_id?._id) === userHierarchy.state)
                };
            case 'division':
                return {
                    s: states || [],
                    d: (divisions || []).filter(x => x._id === userHierarchy.division),
                    p: (parliaments || []).filter(x => (x.division_id?._id || x.division_id) === userHierarchy.division),
                    a: (assemblies || []).filter(x => (x.parliament_id?.division_id?._id) === userHierarchy.division),
                    b: (blocks || []).filter(x => (x.assembly_id?.parliament_id?.division_id?._id) === userHierarchy.division),
                    bt: (booths || []).filter(x => (x.block_id?.assembly_id?.parliament_id?.division_id?._id) === userHierarchy.division)
                };
            case 'parliament':
                return {
                    s: states || [],
                    d: divisions || [],
                    p: (parliaments || []).filter(x => x._id === userHierarchy.parliament),
                    a: (assemblies || []).filter(x => (x.parliament_id?._id || x.parliament_id) === userHierarchy.parliament),
                    b: (blocks || []).filter(x => (x.assembly_id?.parliament_id?._id) === userHierarchy.parliament),
                    bt: (booths || []).filter(x => (x.block_id?.assembly_id?.parliament_id?._id) === userHierarchy.parliament)
                };
            case 'assembly':
                return {
                    s: states || [],
                    d: divisions || [],
                    p: parliaments || [],
                    a: (assemblies || []).filter(x => x._id === userHierarchy.assembly),
                    b: (blocks || []).filter(x => (x.assembly_id?._id || x.assembly_id) === userHierarchy.assembly),
                    bt: (booths || []).filter(x => (x.block_id?.assembly_id?._id) === userHierarchy.assembly)
                };
            case 'block':
                return {
                    s: states || [], d: divisions || [], p: parliaments || [], a: assemblies || [],
                    b: (blocks || []).filter(x => x._id === userHierarchy.block),
                    bt: (booths || []).filter(x => (x.block_id?._id || x.block_id) === userHierarchy.block)
                };
            case 'booth':
                return {
                    s: states || [], d: divisions || [], p: parliaments || [], a: assemblies || [], b: blocks || [],
                    bt: (booths || []).filter(x => x._id === userHierarchy.booth)
                };
            default:
                return { s: states || [], d: divisions || [], p: parliaments || [], a: assemblies || [], b: blocks || [], bt: booths || [] };
        }
    };

    const activityTypes = [
        'rally', 'sabha', 'meeting', 'campaign', 'door_to_door', 'press_conference'
    ];

    const statusOptions = [
        'scheduled', 'completed', 'cancelled', 'postponed'
    ];

    useEffect(() => {
        if (partyActivity && Array.isArray(states) && states.length > 0) {
            setIsInitialLoad(true);
            const state_id = partyActivity.state_id?._id?.toString() || partyActivity.state_id?.toString() || '';
            const division_id = partyActivity.division_id?._id?.toString() || partyActivity.division_id?.toString() || '';
            const parliament_id = partyActivity.parliament_id?._id?.toString() || partyActivity.parliament_id?.toString() || '';
            const assembly_id = partyActivity.assembly_id?._id?.toString() || partyActivity.assembly_id?.toString() || '';
            const block_id = partyActivity.block_id?._id?.toString() || partyActivity.block_id?.toString() || '';
            const booth_id = partyActivity.booth_id?._id?.toString() || partyActivity.booth_id?.toString() || '';
            
            // Pre-populate filtered arrays based on existing data
            if (state_id && divisions) {
                const filteredDivs = divisions.filter(d => {
                    const divStateId = d.state_id?._id || d.state_id;
                    return divStateId?.toString() === state_id;
                });
                setFilteredDivisions(filteredDivs);
            }
            
            if (division_id && parliaments) {
                const filteredParls = parliaments.filter(p => {
                    const parlDivId = p.division_id?._id || p.division_id;
                    return parlDivId?.toString() === division_id;
                });
                setFilteredParliaments(filteredParls);
            }
            
            if (parliament_id && assemblies) {
                const filteredAssems = assemblies.filter(a => {
                    const assemParlId = a.parliament_id?._id || a.parliament_id;
                    return assemParlId?.toString() === parliament_id;
                });
                setFilteredAssemblies(filteredAssems);
            }
            
            if (assembly_id && blocks) {
                const filteredBlks = blocks.filter(b => {
                    const blkAssemId = b.assembly_id?._id || b.assembly_id;
                    return blkAssemId?.toString() === assembly_id;
                });
                setFilteredBlocks(filteredBlks);
            }
            
            if (block_id && booths) {
                const filteredBts = booths.filter(b => {
                    const btBlkId = b.block_id?._id || b.block_id;
                    return btBlkId?.toString() === block_id;
                });
                setFilteredBooths(filteredBts);
            }
            
            // Pre-populate panchayat-village-falliya cascading filters
            const panchayat_id = partyActivity.panchayat_id?._id?.toString() || partyActivity.panchayat_id?.toString() || '';
            const village_id = partyActivity.village_id?._id?.toString() || partyActivity.village_id?.toString() || '';
            
            if (panchayat_id && villages) {
                const filteredVills = villages.filter(v => {
                    const villPanchId = v.panchayat_id?._id || v.panchayat_id;
                    return villPanchId?.toString() === panchayat_id;
                });
                setFilteredVillages(filteredVills);
            }
            
            if (village_id && falliyas) {
                const filteredFalls = falliyas.filter(f => {
                    const fallVillId = f.village_id?._id || f.village_id;
                    return fallVillId?.toString() === village_id;
                });
                setFilteredFalliyas(filteredFalls);
            }
            
            setFormData({
                party_id: partyActivity.party_id?._id?.toString() || partyActivity.party_id?.toString() || '',
                state_id,
                division_id,
                parliament_id,
                assembly_id,
                block_id,
                booth_id,
                panchayat_id: partyActivity.panchayat_id?._id?.toString() || partyActivity.panchayat_id?.toString() || '',
                village_id: partyActivity.village_id?._id?.toString() || partyActivity.village_id?.toString() || '',
                falliya_id: partyActivity.falliya_id?._id?.toString() || partyActivity.falliya_id?.toString() || '',
                year: partyActivity.year || '',
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
                media: partyActivity.media || []
                // Note: created_by and updated_by are handled separately in handleSubmit
            });
            setTimeout(() => setIsInitialLoad(false), 200);
        } else if (!partyActivity) {
            setIsInitialLoad(false);
            setFormData({
                party_id: '',
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
                media: []
                // Note: created_by and updated_by are handled separately in handleSubmit
            });
        }
    }, [partyActivity, states, divisions, parliaments, assemblies, blocks, booths, villages, falliyas]);

    // Fetch panchayats, villages, falliyas on modal open
    useEffect(() => {
        if (open) {
            const token = localStorage.getItem('serviceToken');
            if (!token) {
                console.warn('No authentication token found.');
                return;
            }
            const headers = { Authorization: `Bearer ${token}` };
            Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/panchayats?limit=10000`, { headers }).then(r => r.json()),
                fetch(`${import.meta.env.VITE_APP_API_URL}/villages?limit=10000`, { headers }).then(r => r.json()),
                fetch(`${import.meta.env.VITE_APP_API_URL}/falliyas?limit=10000`, { headers }).then(r => r.json())
            ]).then(([panchayatsRes, villagesRes, falliyasRes]) => {
                if (panchayatsRes.success) setPanchayats(panchayatsRes.data);
                if (villagesRes.success) setVillages(villagesRes.data);
                if (falliyasRes.success) setFalliyas(falliyasRes.data);
            }).catch(err => {
                console.error('Error fetching location data:', err);
                if (err.response?.status === 401) {
                    console.error('Authentication failed. Please log in again.');
                }
            });
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
            
            if (!isInitialLoad && formData.village_id && !filtered.find(v => v._id?.toString() === formData.village_id.toString())) {
                setFormData(prev => ({ ...prev, village_id: '', falliya_id: '' }));
            }
        } else {
            setFilteredVillages([]);
            if (!isInitialLoad) {
                setFormData(prev => ({ ...prev, village_id: '', falliya_id: '' }));
            }
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
            
            if (!isInitialLoad && formData.falliya_id && !filtered.find(f => f._id?.toString() === formData.falliya_id.toString())) {
                setFormData(prev => ({ ...prev, falliya_id: '' }));
            }
        } else {
            setFilteredFalliyas([]);
            if (!isInitialLoad) {
                setFormData(prev => ({ ...prev, falliya_id: '' }));
            }
        }
    }, [formData.village_id, falliyas]);

    // Cascading dropdown logic: State -> Division
    useEffect(() => {
        const base = getHierarchyConstrained();

        if (formData.state_id) {
            // Handle both string IDs and object references
            const filtered = base.d?.filter(division => {
                const divisionStateId = division.state_id?._id || division.state_id;
                return divisionStateId === formData.state_id;
            }) || [];

            setFilteredDivisions(filtered);

            // Only reset dependent fields if current selection is not valid AND not initial load
            if (!isInitialLoad && formData.division_id && !filtered.find(d => d._id === formData.division_id)) {
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
            if (!isInitialLoad) {
                setFormData(prev => ({
                    ...prev,
                    division_id: '',
                    parliament_id: '',
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                }));
            }
        }
    }, [formData.state_id, divisions, userHierarchy]);

    // Division -> Parliament
    useEffect(() => {
        const base = getHierarchyConstrained();

        if (formData.division_id) {
            // Handle both string IDs and object references
            const filtered = base.p?.filter(parliament => {
                const parliamentDivisionId = parliament.division_id?._id || parliament.division_id;
                return parliamentDivisionId === formData.division_id;
            }) || [];

            setFilteredParliaments(filtered);

            if (!isInitialLoad && formData.parliament_id && !filtered.find(p => p._id === formData.parliament_id)) {
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
            if (!isInitialLoad) {
                setFormData(prev => ({
                    ...prev,
                    parliament_id: '',
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                }));
            }
        }
    }, [formData.division_id, parliaments, userHierarchy]);

    // Parliament -> Assembly
    useEffect(() => {
        const base = getHierarchyConstrained();

        if (formData.parliament_id) {
            // Handle both string IDs and object references
            const filtered = base.a?.filter(assembly => {
                const assemblyParliamentId = assembly.parliament_id?._id || assembly.parliament_id;
                return assemblyParliamentId === formData.parliament_id;
            }) || [];

            setFilteredAssemblies(filtered);

            if (!isInitialLoad && formData.assembly_id && !filtered.find(a => a._id === formData.assembly_id)) {
                setFormData(prev => ({
                    ...prev,
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                }));
            }
        } else {
            setFilteredAssemblies([]);
            if (!isInitialLoad) {
                setFormData(prev => ({
                    ...prev,
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                }));
            }
        }
    }, [formData.parliament_id, assemblies, userHierarchy]);

    // Assembly -> Block
    useEffect(() => {
        const base = getHierarchyConstrained();

        if (formData.assembly_id) {
            // Handle both string IDs and object references
            const filtered = base.b?.filter(block => {
                const blockAssemblyId = block.assembly_id?._id || block.assembly_id;
                return blockAssemblyId === formData.assembly_id;
            }) || [];

            setFilteredBlocks(filtered);

            if (!isInitialLoad && formData.block_id && !filtered.find(b => b._id === formData.block_id)) {
                setFormData(prev => ({
                    ...prev,
                    block_id: '',
                    booth_id: ''
                }));
            }
        } else {
            setFilteredBlocks([]);
            if (!isInitialLoad) {
                setFormData(prev => ({
                    ...prev,
                    block_id: '',
                    booth_id: ''
                }));
            }
        }
    }, [formData.assembly_id, blocks, userHierarchy]);

    // Block -> Booth
    useEffect(() => {
        const base = getHierarchyConstrained();

        if (formData.block_id) {
            // Handle both string IDs and object references
            const filtered = base.bt?.filter(booth => {
                const boothBlockId = booth.block_id?._id || booth.block_id;
                return boothBlockId === formData.block_id;
            }) || [];

            setFilteredBooths(filtered);

            if (!isInitialLoad && formData.booth_id && !filtered.find(b => b._id === formData.booth_id)) {
                setFormData(prev => ({ ...prev, booth_id: '' }));
            }
        } else {
            setFilteredBooths([]);
            if (!isInitialLoad) {
                setFormData(prev => ({ ...prev, booth_id: '' }));
            }
        }
    }, [formData.block_id, booths, userHierarchy]);


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

    const handleMediaFileChange = (e) => {
        const files = Array.from(e.target.files);
        setMediaFiles(prevFiles => [...prevFiles, ...files]);
    };

    const handleRemoveMediaFile = (index) => {
        setMediaFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
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

        // Create user tracking object
        const userTracking = partyActivity ? { updated_by: userId } : { created_by: userId };

        // Remove created_by and updated_by from formData to avoid override
        const { created_by, updated_by, ...cleanFormData } = formData;

        // Use FormData for file upload
        const submitData = new FormData();
        
        // Append all form fields
        Object.keys(cleanFormData).forEach(key => {
            if (key !== 'media' && cleanFormData[key] !== '' && cleanFormData[key] !== null && cleanFormData[key] !== undefined) {
                if (key === 'attendance_count') {
                    submitData.append(key, cleanFormData[key] ? parseInt(cleanFormData[key]) : 0);
                } else if (key === 'activity_date') {
                    submitData.append(key, cleanFormData[key].toISOString());
                } else if (key === 'end_date') {
                    submitData.append(key, cleanFormData[key] ? cleanFormData[key].toISOString() : '');
                } else if (key === 'media_links') {
                    submitData.append(key, JSON.stringify(cleanFormData[key]));
                } else {
                    submitData.append(key, cleanFormData[key]);
                }
            }
        });
        
        // Append user tracking
        Object.keys(userTracking).forEach(key => {
            if (userTracking[key]) {
                submitData.append(key, userTracking[key]);
            }
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
                                <InputLabel>Party <span style={{ color: 'red' }}>*</span></InputLabel>
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
                                <InputLabel>State <span style={{ color: 'red' }}>*</span></InputLabel>
                                <FormControl fullWidth required error={submitted && !formData.state_id}>
                                    <Select
                                        name="state_id"
                                        value={formData.state_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <MenuItem value="">Select State</MenuItem>
                                        {getHierarchyConstrained().s?.map((state) => (
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
                                <InputLabel>Division <span style={{ color: 'red' }}>*</span></InputLabel>
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
                                <InputLabel>Parliament <span style={{ color: 'red' }}>*</span></InputLabel>
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
                                <InputLabel>Assembly <span style={{ color: 'red' }}>*</span></InputLabel>
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
                                <InputLabel>Block <span style={{ color: 'red' }}>*</span></InputLabel>
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
                                <InputLabel>Booth <span style={{ color: 'red' }}>*</span></InputLabel>
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

                        {/* New Fields */}
                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}><InputLabel>Panchayat</InputLabel>
                                <FormControl fullWidth><Select name="panchayat_id" value={formData.panchayat_id} onChange={handleChange}>
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {panchayats.map(p => <MenuItem key={p._id} value={p._id}>{p.panchayat_name}</MenuItem>)}
                                </Select></FormControl>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}><InputLabel>Village</InputLabel>
                                <FormControl fullWidth><Select name="village_id" value={formData.village_id} onChange={handleChange} disabled={!formData.panchayat_id}>
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {filteredVillages.map(v => <MenuItem key={v._id} value={v._id}>{v.village_name}</MenuItem>)}
                                </Select></FormControl>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}><InputLabel>Falliya</InputLabel>
                                <FormControl fullWidth><Select name="falliya_id" value={formData.falliya_id} onChange={handleChange} disabled={!formData.village_id}>
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {filteredFalliyas.map(f => <MenuItem key={f._id} value={f._id}>{f.falliya_name}</MenuItem>)}
                                </Select></FormControl>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}><InputLabel>Year</InputLabel>
                                <FormControl fullWidth><Select name="year" value={formData.year} onChange={handleChange}>
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {[2020,2021,2022,2023,2024,2025,2026,2027,2028,2029,2030].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                                </Select></FormControl>
                            </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel>Activity Type <span style={{ color: 'red' }}>*</span></InputLabel>
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
                                <InputLabel>Title <span style={{ color: 'red' }}>*</span></InputLabel>
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
                                <InputLabel>Location <span style={{ color: 'red' }}>*</span></InputLabel>
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
                                <InputLabel>Description <span style={{ color: 'red' }}>*</span></InputLabel>
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
                                <InputLabel>Activity Start Date & Time <span style={{ color: 'red' }}>*</span></InputLabel>
                                <DateTimePicker
                                    value={formData.activity_date}
                                    onChange={handleDateChange}
                                    renderInput={(params) => <TextField {...params} fullWidth required error={submitted && !formData.activity_date} helperText={submitted && !formData.activity_date ? 'Start date is required' : ''} />}
                                />
                            </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Stack spacing={1}>
                                <InputLabel>Activity End Date & Time <span style={{ color: 'red' }}>*</span></InputLabel>
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
                                <InputLabel>Status <span style={{ color: 'red' }}>*</span></InputLabel>
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

                        {/* Row 11: Photos/Videos */}
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
                                    {partyActivity && formData.media && formData.media.length > 0 && (
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
                        {partyActivity ? 'Update' : 'Submit'}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}

