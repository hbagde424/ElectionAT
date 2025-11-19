import Grid from '@mui/material/Grid';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import ChangeTheme from 'sections/maps/change-theme copy';
import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, Drawer, Paper,
    TextField,
    Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash } from 'iconsax-react';
import {
    getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
    useReactTable, flexRender
} from '@tanstack/react-table';
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';
import EmptyReactTable from 'pages/tables/react-table/empty';
import { CSVLink } from 'react-csv';
import { usePermissions } from 'contexts/PermissionContext';
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';

import WinningCandidateModal from './WinningCandidatesModal';
import AlertWinningCandidateDelete from './AlertWinningCandidatesDelete';
import WinningCandidateView from './WinningCandidatesView';

// Beautiful details modal for State, Division, Parliament, Assembly, Party
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const EntityDetailsModal = ({ open, onClose, details, title }) => {
    if (!details) return null;

    // Helper to show name if value is object with name, else string
    const renderValue = (value) => {
        if (value && typeof value === 'object') {
            if (value.name) return value.name;
            if (value.username) return value.username;
            if (value.year) return value.year;
            return JSON.stringify(value);
        }
        return String(value);
    };

    

    // Pick main fields to highlight at top
    const mainField = details.name || details.abbreviation || details.title || '';
    const subField = details.abbreviation && details.abbreviation !== details.name ? details.abbreviation : '';

    // Fields to show in grid (skip _id, __v, etc)
    const skipFields = ['_id', '__v', 'photo', 'symbol'];
    const fields = Object.entries(details).filter(([key]) => !skipFields.includes(key));

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 0 }}>
                <InfoOutlinedIcon color="primary" />
                <Box sx={{ flexGrow: 1 }}>{title} Details</Box>
            </DialogTitle>
            <DialogContent dividers sx={{ background: '#f7f9fa', pt: 2 }}>
                <Stack spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h5" fontWeight={700} color="primary.main" gutterBottom>
                        {mainField}
                    </Typography>
                    {subField && (
                        <Chip label={subField} color="secondary" size="small" />
                    )}
                </Stack>
                {/* Show description if present */}
                {details.description && (
                    <Box mb={2} sx={{ width: '100%' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Description</Typography>
                        <Box sx={{ border: '1px solid #eee', borderRadius: 1, p: 2, bgcolor: 'background.default', minHeight: 60 }}>
                            <div dangerouslySetInnerHTML={{ __html: details.description }} />
                        </Box>
                    </Box>
                )}
                <Grid container spacing={2}>
                    {Array.isArray(fields) && fields.map(([key, value]) => (
                        key === 'name' || key === 'abbreviation' || key === 'description' ? null : (
                            <Grid item xs={12} sm={6} key={key}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: 13 }}>
                                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, fontSize: 15 }}>
                                    {renderValue(value)}
                                </Typography>
                            </Grid>
                        )
                    ))}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary" variant="contained">Close</Button>
            </DialogActions>
        </Dialog>
    );
};

const mapConfiguration = {
    mapboxAccessToken: import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN,
    minZoom: 1
};

const MAPBOX_THEMES = {
    //   light: 'mapbox://styles/mapbox/light-v10',
    //   dark: 'mapbox://styles/mapbox/dark-v10',
    //   streets: 'mapbox://styles/mapbox/streets-v11',
    outdoors: 'mapbox://styles/mapbox/outdoors-v11',
    //   satellite: 'mapbox://styles/mapbox/satellite-v9',
    //   satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v11'
};

export default function WinningCandidateListPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel } = usePermissions();

    // Helper to render values (object with name/username/year -> readable, else stringify)
    const renderValue = (value) => {
        if (value && typeof value === 'object') {
            if (value.name) return value.name;
            if (value.username) return value.username;
            if (value.year) return value.year;
            try { return JSON.stringify(value); } catch (e) { return String(value); }
        }
        return value !== undefined && value !== null ? String(value) : 'N/A';
    };

    // Render a full assembly details block for the assembly drawer
    const renderAssemblyDetails = (assembly) => {
        if (!assembly) return null;

        // Helper: compute last 3 years winning parties from allCandidateList
        const computeLast3Years = () => {
            try {
                if (!Array.isArray(allCandidateList) || allCandidateList.length === 0) return [];
                const acId = assembly._id || assembly.AC_NO;
                // Build map year -> party (prefer year_id.year or year_id)
                const map = {};
                allCandidateList.forEach(item => {
                    const itemAssembly = item.assembly_id || {};
                    const matches = (assembly._id && itemAssembly._id && String(itemAssembly._id) === String(assembly._id)) || (assembly.AC_NO && (String(itemAssembly.AC_NO) === String(assembly.AC_NO)));
                    if (!matches) return;
                    let year = '';
                    if (item.year_id) {
                        if (typeof item.year_id === 'object' && item.year_id.year) year = String(item.year_id.year);
                        else year = String(item.year_id);
                    }
                    if (year) {
                        map[year] = item.party_id?.name || 'Unknown';
                    }
                });
                const years = Object.keys(map).sort((a, b) => b.localeCompare(a));
                return years.slice(0, 3).map(y => ({ year: y, party: map[y] }));
            } catch (e) {
                return [];
            }
        };

        const last3 = computeLast3Years();

        // Access possible map-provided props or the fetched winning info
        const acNo = assembly.AC_NO || assembly.ac_no || assembly.AC_No || renderValue(assembly.AC_NO || assembly.ac_no || assembly.AC_No);
        const acName = assembly.name || assembly.AC_NAME || assembly.AC_Name || assembly.title || '';
        const winningCandidate = (assemblyWinningInfo && (assemblyWinningInfo.candidate_id?.name || assemblyWinningInfo.name)) || assembly.winningCandidate || assembly.winning_candidate || assembly.winning || '';
        const winningParty = (assemblyWinningInfo && (assemblyWinningInfo.party_id?.name || assemblyWinningInfo.party)) || assembly.winningParty || assembly.winning_party || assembly.party || '';
        const electionYear = (assemblyWinningInfo && (assemblyWinningInfo.year_id?.year || assemblyWinningInfo.year_id || assemblyWinningInfo.election_year)) || assembly.electionYear || assembly.election_year || '';
        const margin = (assemblyWinningInfo && (assemblyWinningInfo.margin || assemblyWinningInfo.total_margin)) || assembly.margin || assembly.total_margin || '';
        const totalVotes = (assemblyWinningInfo && (assemblyWinningInfo.total_votes || assemblyWinningInfo.totalVotes || assemblyWinningInfo.electors)) || assembly.total_votes || assembly.totalVotes || assembly.total_electors || '';

        return (
            <Box>
                {/* Header card with AC number and party */}
                <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.primary.lighter, mb: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: 'orange', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 22 }}>
                            {acNo || 'NA'}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight={700} color="primary">{acName || 'N/A'}</Typography>
                            {winningParty && <Chip label={winningParty} size="small" sx={{ mt: 1, bgcolor: 'orange', color: 'white' }} />}
                        </Box>
                    </Stack>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">AC Number</Typography>
                        <Typography variant="h6" fontWeight={700}>{acNo || 'N/A'}</Typography>
                    </Box>
                </Paper>

                {/* Winning Candidate card */}
                <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.success.lighter, mb: 2 }}>
                    <Stack spacing={1}>
                        <Typography variant="h6" fontWeight={700} color="success.dark"><EmojiEventsIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Winning Candidate</Typography>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Candidate Name</Typography>
                            <Typography variant="h6" fontWeight={700}>{winningCandidate || assembly.candidate || 'N/A'}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 4, mt: 1 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Election Year</Typography>
                                <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 700 }}>{electionYear || 'N/A'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">Margin</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 700 }}>{margin ? Number(margin).toLocaleString() : 'N/A'}</Typography>
                            </Box>
                        </Box>
                    </Stack>
                </Paper>

                {/* Voting statistics */}
                <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.info.lighter, mb: 2 }}>
                    <Typography variant="h6" fontWeight={700} color="info.dark"><HowToVoteIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Voting Statistics</Typography>
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">Total Votes</Typography>
                        <Typography variant="h5" fontWeight={700} color="primary">{totalVotes ? Number(totalVotes).toLocaleString() : 'N/A'}</Typography>
                    </Box>
                </Paper>

                {/* Location info */}
                <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.warning.lighter, mb: 2 }}>
                    <Typography variant="h6" fontWeight={700} color="warning.dark"><AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} /> Location Information</Typography>
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">Parliament Constituency</Typography>
                        <Typography variant="body1" fontWeight={700}>{assembly.parliament_id?.name || assembly.PC_NAME || 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">State</Typography>
                        <Typography variant="body1" fontWeight={700}>{assembly.state_id?.name || assembly.ST_NAME || assembly.state || 'N/A'}</Typography>
                    </Box>
                </Paper>

                {/* Last 3 years winning parties */}
                <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.grey[100] }}>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Last 3 Years Winning Parties</Typography>
                    <Stack spacing={1}>
                        {last3.length > 0 ? last3.map(item => (
                            <Box key={item.year} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, bgcolor: 'background.paper' }}>
                                <Typography variant="body2" fontWeight={600}>{item.year}</Typography>
                                <Chip label={item.party} size="small" sx={{ bgcolor: 'primary.main', color: 'white' }} />
                            </Box>
                        )) : (
                            <Typography variant="body2" color="text.secondary">No historical data available</Typography>
                        )}
                    </Stack>
                </Paper>
            </Box>
        );
    };

    const [selectedCandidate, setSelectedCandidate] = useState(null); // for edit modal
    const [openModal, setOpenModal] = useState(false); // for edit modal
    const [candidateDetails, setCandidateDetails] = useState(null); // for details modal
    const [openDetailsModal, setOpenDetailsModal] = useState(false); // for details modal
    const [openDelete, setOpenDelete] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false); // Side panel drawer
    const [selectedCandidateForDrawer, setSelectedCandidateForDrawer] = useState(null); // Full candidate details for drawer
    const [candidateDeleteId, setCandidateDeleteId] = useState('');
    const [candidateList, setCandidateList] = useState([]);
    const [allCandidateList, setAllCandidateList] = useState([]);
    const [selectedAssemblyFromMap, setSelectedAssemblyFromMap] = useState(null); // Assembly selected from map
    const [assemblyDrawerOpen, setAssemblyDrawerOpen] = useState(false);
    const [selectedAssemblyDetails, setSelectedAssemblyDetails] = useState(null); // full assembly record from API
    const [assemblyWinningInfo, setAssemblyWinningInfo] = useState(null); // winning candidate record for selected assembly
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [parties, setParties] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [years, setYears] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const searchDebounceRef = useRef(null);

    // Filter states
    const [filterValues, setFilterValues] = useState({
        party: '',
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        candidate: '',
        electionYear: ''
    });

    const [appliedFilters, setAppliedFilters] = useState({
        party: '',
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        candidate: '',
        electionYear: ''
    });

    // Filtered data for cascading dropdowns
    const filteredDivisions = filterValues.state && Array.isArray(divisions)
        ? divisions.filter(division => {
            // Handle both populated and non-populated state_id
            const stateId = division.state_id?._id || division.state_id;
            const matches = stateId === filterValues.state;
            if (process.env.NODE_ENV === 'development') {

            }
            return matches;
        })
        : (Array.isArray(divisions) ? divisions : []);

    const filteredParliaments = filterValues.division && Array.isArray(parliaments)
        ? parliaments.filter(parliament => {
            const divisionId = parliament.division_id?._id || parliament.division_id;
            return divisionId === filterValues.division;
        })
        : filterValues.state && Array.isArray(parliaments)
            ? parliaments.filter(parliament => {
                const stateId = parliament.state_id?._id || parliament.state_id;
                return stateId === filterValues.state;
            })
            : (Array.isArray(parliaments) ? parliaments : []);

    const filteredAssemblies = filterValues.parliament && Array.isArray(assemblies)
        ? assemblies.filter(assembly => {
            const parliamentId = assembly.parliament_id?._id || assembly.parliament_id;
            return parliamentId === filterValues.parliament;
        })
        : filterValues.division && Array.isArray(assemblies)
            ? assemblies.filter(assembly => {
                const divisionId = assembly.division_id?._id || assembly.division_id;
                return divisionId === filterValues.division;
            })
            : filterValues.state && Array.isArray(assemblies)
                ? assemblies.filter(assembly => {
                    const stateId = assembly.state_id?._id || assembly.state_id;
                    return stateId === filterValues.state;
                })
                : (Array.isArray(assemblies) ? assemblies : []);

    const handleApplyFilters = () => {
        setAppliedFilters(filterValues);
        setPagination({ pageIndex: 0, pageSize: 10 });
        // Immediately fetch with the current staged filterValues
        fetchCandidateList(0, 10, globalFilter, filterValues);
    };

    const handleClearFilters = () => {
        const emptyFilters = {
            party: '',
            state: '',
            division: '',
            parliament: '',
            assembly: '',
            candidate: '',
            electionYear: ''
        };
        setFilterValues(emptyFilters);
        setAppliedFilters(emptyFilters);
        setPagination({ pageIndex: 0, pageSize: 10 });
        // Fetch the candidate list with no filters
        fetchCandidateList(0, 10, globalFilter, emptyFilters);
    };

    // Handle cascading filter changes
    const handleStateChange = (stateValue) => {
        setFilterValues({
            ...filterValues,
            state: stateValue,
            division: '', // Clear dependent filters
            parliament: '',
            assembly: ''
        });
    };

    const handleDivisionChange = (divisionValue) => {
        setFilterValues({
            ...filterValues,
            division: divisionValue,
            parliament: '', // Clear dependent filters
            assembly: ''
        });
    };

    const handleParliamentChange = (parliamentValue) => {
        setFilterValues({
            ...filterValues,
            parliament: parliamentValue,
            assembly: '' // Clear dependent filter
        });
    };

    // Handle assembly selection from map
    const handleAssemblySelectFromMap = async (assemblyInfo) => {
        if (!assemblyInfo) return;

        
        setSelectedAssemblyFromMap(assemblyInfo);
        // open the assembly side drawer on the WinningCandidates page so user sees details + filter option
        setAssemblyDrawerOpen(true);

        try {
            // Find the assembly in the assemblies list by AC_NO (compare as strings to avoid type mismatch)
            let assembly = assemblies.find(a => String(a.AC_NO) === String(assemblyInfo.AC_NO));
            
            // If assembly not found in current list, try direct API lookup by AC_NO first
            const acNoFromMap = assemblyInfo.AC_NO !== undefined && assemblyInfo.AC_NO !== null ? String(assemblyInfo.AC_NO).trim() : '';
            if (!assembly && acNoFromMap) {
                    try {
                    const headers = getAuthHeaders();
                    // Try a direct query first (if backend supports ac_no filter)
                    const directRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies?ac_no=${encodeURIComponent(acNoFromMap)}`, { headers });
                    if (directRes.ok) {
                        const directJson = await directRes.json();
                        if (directJson.success && Array.isArray(directJson.data) && directJson.data.length > 0) {
                            assembly = directJson.data[0];
                            
                            if (assembly && !assemblies.find(a => a._id === assembly._id)) setAssemblies(prev => [...prev, assembly]);
                        }
                    }
                } catch (err) {
                    console.warn('Direct AC_NO lookup failed, will fallback to full assemblies list:', err);
                }

                // Fallback to fetching all assemblies and searching by AC_NO
                if (!assembly) {
                    const headers = getAuthHeaders();
                    const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies?all=true`, { headers });
                    const json = await response.json();
                    if (json.success && Array.isArray(json.data)) {
                        assembly = json.data.find(a => String(a.AC_NO).trim() === acNoFromMap);
                        // Update assemblies state if found
                        if (assembly && !assemblies.find(a => a._id === assembly._id)) {
                            setAssemblies(prev => [...prev, assembly]);
                        }
                    }
                }
            }
            
                if (assembly) {
                // Try to fetch full assembly details by its _id
                try {
                    if (assembly._id) {
                        const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies/${assembly._id}`, { headers: getAuthHeaders() });
                        const asmJson = await res.json();
                        if (asmJson.success) {
                            setSelectedAssemblyDetails(asmJson.data);
                        } else {
                            // fallback to storing the assembly object we have
                            setSelectedAssemblyDetails(assembly);
                        }
                    } else {
                        setSelectedAssemblyDetails(assembly);
                    }
                } catch (err) {
                    console.error('Failed to fetch full assembly details:', err);
                    setSelectedAssemblyDetails(assembly);
                }
                // After resolving assembly, try to fetch the winning candidate info for this assembly
                try {
                    const winRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/winning-candidates?assembly=${assembly._id}&all=true`, { headers: getAuthHeaders() });
                    const winJson = await winRes.json();
                    if (winJson.success && Array.isArray(winJson.data) && winJson.data.length > 0) {
                        // Pick latest year if multiple
                        const sorted = winJson.data.slice().sort((a, b) => {
                            const ay = a.year_id?.year || a.year_id || '';
                            const by = b.year_id?.year || b.year_id || '';
                            return String(by).localeCompare(String(ay));
                        });
                        setAssemblyWinningInfo(sorted[0]);
                    } else {
                        setAssemblyWinningInfo(null);
                    }
                } catch (err) {
                    console.warn('Failed to fetch winning candidate for assembly:', err);
                    setAssemblyWinningInfo(null);
                }

                // Create new filters with assembly and its parent hierarchy
                const newFilterValues = {
                    party: '',
                    state: assembly.state_id?._id || assembly.state_id || '',
                    division: assembly.division_id?._id || assembly.division_id || '',
                    parliament: assembly.parliament_id?._id || assembly.parliament_id || '',
                    assembly: assembly._id,
                    candidate: '',
                    electionYear: ''
                };
                
                // Update filter values
                setFilterValues(newFilterValues);
                setAppliedFilters(newFilterValues);

                // Reset pagination to first page
                const newPageIndex = 0;
                setPagination(prev => ({ ...prev, pageIndex: newPageIndex }));

                // Fetch using the shared fetchCandidateList helper so behavior is consistent
                const tempAppliedFilters = { ...newFilterValues };
                await fetchCandidateList(newPageIndex, pagination.pageSize, globalFilter, tempAppliedFilters);
            } else {
                console.warn('Assembly not found by AC_NO after fetching assemblies. assemblyInfo:', assemblyInfo);
            }
            
            // Scroll to table
            setTimeout(() => {
                const tableElement = document.querySelector('[role="table"]');
                if (tableElement) {
                    tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
        } catch (error) {
            console.error('Error handling assembly selection:', error);
        }
    };

    // Apply the assembly filter from the assembly drawer (moved here so it has access to component state)
    const applyAssemblyFilterFromDrawer = async () => {
        // Close drawer first for better UX
        setAssemblyDrawerOpen(false);

        // If we have fetched full assembly details, use its _id to set filters immediately
        if (selectedAssemblyDetails && selectedAssemblyDetails._id) {
            const assembly = selectedAssemblyDetails;
            const newFilterValues = {
                party: '',
                state: assembly.state_id?._id || assembly.state_id || '',
                division: assembly.division_id?._id || assembly.division_id || '',
                parliament: assembly.parliament_id?._id || assembly.parliament_id || '',
                assembly: assembly._id,
                candidate: '',
                electionYear: ''
            };
            setFilterValues(newFilterValues);
            setAppliedFilters(newFilterValues);
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
            console.info('Applying assembly filter from drawer with:', newFilterValues);
            await fetchCandidateList(0, pagination.pageSize, globalFilter, newFilterValues);
            return;
        }

        // Fallback: call the existing handler which will resolve assembly and fetch
        if (selectedAssemblyFromMap) {
            await handleAssemblySelectFromMap(selectedAssemblyFromMap);
        }
    };

    // Helper to return Authorization header when a token exists in localStorage
    const getAuthHeaders = () => {
        try {
            const token = localStorage.serviceToken;
            return token ? { Authorization: `Bearer ${token}` } : {};
        } catch (err) {
            return {};
        }
    };

    // For entity popups
    const [entityDetails, setEntityDetails] = useState(null);
    const [openEntityModal, setOpenEntityModal] = useState(false);
    const [entityTitle, setEntityTitle] = useState('');

    const fetchAllCandidateListForFilters = async () => {
        const hierarchyFilters = {};
        if (userHierarchy?.state?._id) hierarchyFilters.state_id = userHierarchy.state._id;
        if (userHierarchy?.division?._id) hierarchyFilters.division_id = userHierarchy.division._id;
        if (userHierarchy?.parliament?._id) hierarchyFilters.parliament_id = userHierarchy.parliament._id;
        if (userHierarchy?.assembly?._id) hierarchyFilters.assembly_id = userHierarchy.assembly._id;
        const data = await fetchAllDataForFilters('/winning-candidates', hierarchyFilters);
        setAllCandidateList(data);
    };

    const filterOptions = useFilterOptionsFromData(allCandidateList, {
        parties: { field: 'party_id', nameField: 'name' },
        states: { field: 'state_id', nameField: 'name' },
        divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
        parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
        assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
        candidatesData: { field: 'candidate_id', nameField: 'name' },
        electionYears: { field: 'election_year_id', nameField: 'year' }
    });

    const fetchReferenceData = async () => {
        try {
            const [
                statesRes,
                partiesRes,
                candidatesRes,
                yearsRes
            ] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parties?all=true`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/candidates`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/election-years`, { headers: getAuthHeaders() })
            ]);

            const [
                statesData,
                partiesData,
                candidatesData,
                yearsData
            ] = await Promise.all([
                statesRes.json(),
                partiesRes.json(),
                candidatesRes.json(),
                yearsRes.json()
            ]);

            if (statesData.success && Array.isArray(statesData.data)) {
                setStates(statesData.data);
            } else {
                setStates([]);
            }

            if (partiesData.success && Array.isArray(partiesData.data)) {
                setParties(partiesData.data);
            } else {
                setParties([]);
            }

            if (candidatesData.success && Array.isArray(candidatesData.data)) {
                setCandidates(candidatesData.data);
            } else {
                setCandidates([]);
            }

            if (yearsData.success && Array.isArray(yearsData.data)) {
                setYears(yearsData.data);
                if (process.env.NODE_ENV === 'development') {
                }
            } else {
                setYears([]);
            }

            // Fetch all divisions, parliaments, and assemblies initially
            const [divisionsRes, parliamentsRes, assembliesRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`, { headers: getAuthHeaders() })
            ]);

            const [divisionsData, parliamentsData, assembliesData] = await Promise.all([
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json()
            ]);

            if (divisionsData.success && Array.isArray(divisionsData.data)) {
                setDivisions(divisionsData.data);
            } else {
                setDivisions([]);
            }

            if (parliamentsData.success && Array.isArray(parliamentsData.data)) {
                setParliaments(parliamentsData.data);
            } else {
                setParliaments([]);
            }

            if (assembliesData.success && Array.isArray(assembliesData.data)) {
                setAssemblies(assembliesData.data);
            } else {
                setAssemblies([]);
            }

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
            // Ensure arrays are initialized even if API calls fail
            setStates([]);
            setParties([]);
            setCandidates([]);
            setYears([]);
            setDivisions([]);
            setParliaments([]);
            setAssemblies([]);
        }
    };

    const fetchCandidateList = async (pageIndex, pageSize, globalFilter = '', filtersArg = null) => {
        setLoading(true);
        try {
            // Use provided filtersArg for immediate fetch, otherwise use appliedFilters from state
            const filtersToUse = filtersArg || appliedFilters || {};

            

            let queryParams = [
                `page=${pageIndex + 1}`,
                `limit=${pageSize}`
            ];

            if (globalFilter) {
                queryParams.push(`search=${encodeURIComponent(globalFilter)}`);
            }

            if (filtersToUse.party) {
                queryParams.push(`party=${filtersToUse.party}`);
            }
            if (filtersToUse.state) {
                queryParams.push(`state=${filtersToUse.state}`);
            }
            if (filtersToUse.division) {
                queryParams.push(`division=${filtersToUse.division}`);
            }
            if (filtersToUse.parliament) {
                queryParams.push(`parliament=${filtersToUse.parliament}`);
            }
            if (filtersToUse.assembly) {
                queryParams.push(`assembly=${filtersToUse.assembly}`);
            }
            if (filtersToUse.candidate) {
                queryParams.push(`candidate=${filtersToUse.candidate}`);
            }
            if (filtersToUse.electionYear) {
                queryParams.push(`electionYear=${filtersToUse.electionYear}`);
            }

            // hierarchy-based filtering
            if (userHierarchy) {
                const highest = getUserHighestLevel();
                if (highest) {
                    switch (highest) {
                        case 'state':
                            queryParams.push(`state_id=${userHierarchy.state}`);
                            break;
                        case 'division':
                            queryParams.push(`division_id=${userHierarchy.division}`);
                            break;
                        case 'parliament':
                            queryParams.push(`parliament_id=${userHierarchy.parliament}`);
                            break;
                        case 'assembly':
                            queryParams.push(`assembly_id=${userHierarchy.assembly}`);
                            break;
                        case 'block':
                            queryParams.push(`block_id=${userHierarchy.block}`);
                            break;
                        case 'booth':
                            queryParams.push(`booth_id=${userHierarchy.booth}`);
                            break;
                    }
                }
            }

            const url = `${import.meta.env.VITE_APP_API_URL}/winning-candidates?${queryParams.join('&')}`;
            const res = await fetch(url, { headers: getAuthHeaders() });
            const json = await res.json();
            if (json.success) {
                setCandidateList(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch winning candidate list:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCandidateList(pagination.pageIndex, pagination.pageSize, globalFilter);
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, appliedFilters]);

    useEffect(() => {
        fetchReferenceData();
        fetchAllCandidateListForFilters();
    }, []);

    const handleDeleteOpen = (id) => {
        setCandidateDeleteId(id);
        setOpenDelete(true);
    };

    const handleDeleteClose = () => setOpenDelete(false);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Candidate Details Modal (moved above columns for correct scope)
    // Dedicated modal for full candidate details (fetched from API)
    const CandidateDetailsModal = ({ open, onClose, details }) => {
        if (!details) return null;
        return (
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>Candidate Details</Box>
                </DialogTitle>
                <DialogContent dividers sx={{ background: '#f7f9fa' }}>
                    <Stack spacing={3} alignItems="center">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                            {details.photo ? (
                                <Box
                                    component="img"
                                    src={details.photo}
                                    alt="Candidate"
                                    sx={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', boxShadow: 2, mb: 1 }}
                                />
                            ) : (
                                <Box sx={{ width: 110, height: 110, borderRadius: '50%', bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'grey.500', mb: 1 }}>
                                    {details.name?.[0] || '?'}
                                </Box>
                            )}
                            <Typography variant="h5" fontWeight={700} gutterBottom>{details.name}</Typography>
                            <Chip label={details.is_active ? 'Active' : 'Inactive'} color={details.is_active ? 'success' : 'default'} size="small" sx={{ mt: 0.5 }} />
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Caste</Typography>
                                <Typography variant="body1" fontWeight={500}>{details.caste || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Criminal Cases</Typography>
                                <Typography variant="body1" fontWeight={500}>{details.criminal_cases || 0}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Assets</Typography>
                                <Typography variant="body1" fontWeight={500}>{details.assets || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Liabilities</Typography>
                                <Typography variant="body1" fontWeight={500}>{details.liabilities || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary">Education</Typography>
                                <Typography variant="body1" fontWeight={500}>{details.education || 'N/A'}</Typography>
                            </Grid>
                        </Grid>
                        <Divider sx={{ width: '100%', my: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                                <Typography variant="body2">{formatDate(details.created_at)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                                <Typography variant="body2">{formatDate(details.updated_at)}</Typography>
                            </Grid>
                        </Grid>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="primary" variant="contained">Close</Button>
                </DialogActions>
            </Dialog>
        );
    };

    const handleEntityClick = async (type, id) => {
        if (!id) return;
        let url = '';
        let title = '';
        switch (type) {
            case 'state':
                url = `${import.meta.env.VITE_APP_API_URL}/states/${id}`;
                title = 'State';
                break;
            case 'division':
                url = `${import.meta.env.VITE_APP_API_URL}/divisions/${id}`;
                title = 'Division';
                break;
            case 'parliament':
                url = `${import.meta.env.VITE_APP_API_URL}/parliaments/${id}`;
                title = 'Parliament';
                break;
            case 'assembly':
                url = `${import.meta.env.VITE_APP_API_URL}/assemblies/${id}`;
                title = 'Assembly';
                break;
            case 'party':
                url = `${import.meta.env.VITE_APP_API_URL}/parties/${id}`;
                title = 'Party';
                break;
            default:
                return;
        }
        try {
            const res = await fetch(url, { headers: getAuthHeaders() });
            const json = await res.json();
            if (json.success) {
                setEntityDetails(json.data);
                setEntityTitle(title);
                setOpenEntityModal(true);
            }
        } catch (err) {
            console.error(`Error fetching ${title} details:`, err);
        }
    };

    const columns = useMemo(() => [
        {
            header: '#',
            accessorKey: '_id',
            cell: ({ row, table }) => {
                const { pageIndex, pageSize } = table.getState().pagination;
                const serialNumber = pageIndex * pageSize + row.index + 1;
                return <Typography>{serialNumber}</Typography>;
            }
        },
        {
            header: 'Candidate',
            accessorKey: 'candidate_id',
            cell: ({ getValue }) => {
                const candidate = getValue();
                return (
                    <Typography
                        fontWeight="medium"
                        sx={{ cursor: candidate ? 'pointer' : 'default', color: candidate ? 'primary.main' : 'inherit', textDecoration: candidate ? 'underline' : 'none' }}
                        onClick={async () => {
                            if (candidate && candidate._id) {
                                try {
                                    const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/candidates/${candidate._id}`, { headers: getAuthHeaders() });
                                    const json = await res.json();
                                    if (json.success) {
                                        setCandidateDetails(json.data);
                                        setOpenDetailsModal(true);
                                    } else {
                                        console.error('API did not return success for candidate details:', json);
                                    }
                                } catch (err) {
                                    console.error('Error fetching candidate details:', err);
                                }
                            }
                        }}
                    >
                        {candidate?.name || 'N/A'}
                    </Typography>
                );
            }
        },
        {
            header: 'Party',
            accessorKey: 'party_id',
            cell: ({ getValue }) => {
                const party = getValue();
                return (
                    <Chip
                        label={party?.name || 'N/A'}
                        color="primary"
                        size="small"
                        variant="outlined"
                        sx={{ cursor: party?._id ? 'pointer' : 'default', textDecoration: party?._id ? 'underline' : 'none' }}
                        onClick={() => party?._id && handleEntityClick('party', party._id)}
                    />
                );
            }
        },
        {
            header: 'Year',
            accessorKey: 'year_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.year || 'N/A'}
                    color="primary"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Assembly No',
            accessorKey: 'assembly_id',
            cell: ({ getValue }) => {
                const assembly = getValue();
                return (
                    <Typography fontWeight="medium">
                        {assembly?.AC_NO || 'N/A'}
                    </Typography>
                );
            }
        },
        {
            header: 'Election Type',
            accessorKey: 'type',
            cell: ({ getValue }) => (
                <Stack direction="row" spacing={0.5}>
                    {(Array.isArray(getValue()) ? getValue() : []).map((type, index) => (
                        <Chip
                            key={index}
                            label={type}
                            size="small"
                            color="info"
                            variant="outlined"
                        />
                    ))}
                </Stack>
            )
        },
        {
            header: 'Poll %',
            accessorKey: 'poll_percentage',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {((getValue() || 0) * 100).toFixed(2)}%
                </Typography>
            )
        },
        {
            header: 'Total Votes',
            accessorKey: 'total_votes',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'Voting %',
            accessorKey: 'voting_percentage',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue()}%
                </Typography>
            )
        },
        {
            header: 'Margin',
            accessorKey: 'margin',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'Margin %',
            accessorKey: 'margin_percentage',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {((getValue() || 0) * 100).toFixed(2)}%
                </Typography>
            )
        },
        {
            header: 'Electors',
            accessorKey: 'electors',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Male Electors',
            accessorKey: 'male_electors',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Female Electors',
            accessorKey: 'female_electors',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'NOTA Votes',
            accessorKey: 'nota_votes',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'State',
            accessorKey: 'state_id',
            cell: ({ getValue }) => {
                const state = getValue();
                return (
                    <Chip
                        label={state?.name || 'N/A'}
                        color="primary"
                        size="small"
                        variant="outlined"
                        sx={{ cursor: state?._id ? 'pointer' : 'default', textDecoration: state?._id ? 'underline' : 'none' }}
                        onClick={() => state?._id && handleEntityClick('state', state._id)}
                    />
                );
            }
        },
        {
            header: 'Division',
            accessorKey: 'division_id',
            cell: ({ getValue }) => {
                const division = getValue();
                return (
                    <Chip
                        label={division?.name || 'N/A'}
                        color="warning"
                        size="small"
                        variant="outlined"
                        sx={{ cursor: division?._id ? 'pointer' : 'default', textDecoration: division?._id ? 'underline' : 'none' }}
                        onClick={() => division?._id && handleEntityClick('division', division._id)}
                    />
                );
            }
        },
        {
            header: 'Parliament',
            accessorKey: 'parliament_id',
            cell: ({ getValue }) => {
                const parliament = getValue();
                return (
                    <Chip
                        label={parliament?.name || 'N/A'}
                        color="secondary"
                        size="small"
                        variant="outlined"
                        sx={{ cursor: parliament?._id ? 'pointer' : 'default', textDecoration: parliament?._id ? 'underline' : 'none' }}
                        onClick={() => parliament?._id && handleEntityClick('parliament', parliament._id)}
                    />
                );
            }
        },
        {
            header: 'Assembly',
            accessorKey: 'assembly_id',
            cell: ({ getValue }) => {
                const assembly = getValue();
                return (
                    <Chip
                        label={assembly?.name || 'N/A'}
                        color="info"
                        size="small"
                        variant="outlined"
                        sx={{ cursor: assembly?._id ? 'pointer' : 'default', textDecoration: assembly?._id ? 'underline' : 'none' }}
                        onClick={() => assembly?._id && handleEntityClick('assembly', assembly._id)}
                    />
                );
            }
        },
        {
            header: 'Description',
            accessorKey: 'description',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 250,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontStyle: 'italic',
                    color: 'text.secondary'
                }}>
                    {/* Strip HTML tags for table preview */}
                    {getValue() ? getValue().replace(/<[^>]+>/g, '').slice(0, 100) : ''}
                </Typography>
            )
        },
        {
            header: 'Created By',
            accessorKey: 'created_by',
            cell: ({ getValue }) => (
                (() => {
                    const val = getValue();
                    const name = val?.username || val?.name || (typeof val === 'string' ? val : null);
                    return <Typography>{name || 'N/A'}</Typography>;
                })()
            )
        },
        {
            header: 'Updated By',
            accessorKey: 'updated_by',
            cell: ({ getValue }) => (
                (() => {
                    const val = getValue();
                    const name = val?.username || val?.name || (typeof val === 'string' ? val : null);
                    return <Typography>{name || 'N/A'}</Typography>;
                })()
            )
        },
        {
            header: 'Created At',
            accessorKey: 'created_at',
            cell: ({ getValue }) => {
                const v = getValue();
                return <Typography>{formatDate(v)}</Typography>;
            }
        },
        {
            header: 'Updated At',
            accessorKey: 'updated_at',
            cell: ({ getValue }) => {
                const v = getValue();
                return <Typography>{formatDate(v)}</Typography>;
            }
        },
        {
            header: 'Actions',
            meta: { className: 'cell-center' },
            cell: ({ row }) => {
                const handleViewDetails = async () => {
                    try {
                        const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/winning-candidates/${row.original._id}`, {
                            headers: getAuthHeaders()
                        });
                        if (response.ok) {
                            const res = await response.json();
                            setSelectedCandidateForDrawer(res.data || row.original);
                            setDrawerOpen(true);
                        } else {
                            setSelectedCandidateForDrawer(row.original);
                            setDrawerOpen(true);
                        }
                    } catch (error) {
                        console.error('Error fetching candidate details:', error);
                        setSelectedCandidateForDrawer(row.original);
                        setDrawerOpen(true);
                    }
                };
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <IconButton
                            color="info"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails();
                            }}
                        >
                            <Eye />
                        </IconButton>
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedCandidate(row.original); setOpenModal(true); }}>
                            <Edit />
                        </IconButton>
                        <IconButton color="error" onClick={(e) => { e.stopPropagation(); handleDeleteOpen(row.original._id); }}>
                            <Trash />
                        </IconButton>
                    </Stack>
                );
            }
        }
    ], [theme]);

    const table = useReactTable({
        data: candidateList,
        columns,
        state: { pagination, globalFilter },
        pageCount,
        manualPagination: true,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel()
    });

    const fetchAllCandidatesForCsv = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/winning-candidates?all=true`, { headers: getAuthHeaders() });
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all winning candidates for CSV:', error);
        }
        return [];
    };


    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    // Import states
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const importInputRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        try {
            
            const allData = await fetchAllCandidatesForCsv();
            

            if (!allData || allData.length === 0) {
                console.error('No data available for CSV download.');
                setCsvLoading(false);
                return;
            }

            const formattedData = allData.map(item => ({
                'Candidate': item.candidate_id?.name || 'N/A',
                'Party': item.party_id?.name || 'N/A',
                'Year': item.year_id?.year || 'N/A',
                'Assembly No': item.assembly_id?.AC_NO || 'N/A',
                'Election Type': item.type?.join(', ') || 'N/A',
                'Poll Percentage': ((item.poll_percentage || 0) * 100).toFixed(2),
                'Total Votes': item.total_votes || 'N/A',
                'Voting Percentage': ((item.voting_percentage || 0) * 100).toFixed(2),
                'Margin': item.margin || 'N/A',
                'Margin Percentage': ((item.margin_percentage || 0) * 100).toFixed(2),
                'Electors': item.electors || 'N/A',
                'Male Electors': item.male_electors || 'N/A',
                'Female Electors': item.female_electors || 'N/A',
                'NOTA Votes': item.nota_votes || 'N/A',
                'State': item.state_id?.name || 'N/A',
                'Division': item.division_id?.name || 'N/A',
                'Parliament': item.parliament_id?.name || 'N/A',
                'Assembly': item.assembly_id?.name || 'N/A',
                'Created By': item.created_by?.username || 'N/A',
                'Created At': formatDate(item.created_at)
            }));

            

            setCsvData(formattedData);
            setTimeout(() => {
                
                if (csvLinkRef.current) {
                    csvLinkRef.current.link.click();
                } else {
                    console.error('CSVLink reference is null or undefined. Ensure the CSVLink component is rendered correctly.');
                }
            }, 500);
        } catch (error) {
            console.error('Error preparing CSV data:', error);
        } finally {
            setCsvLoading(false);
        }
    };

    const handleDownloadExcelTemplate = async () => {
        const XLSX = await import('xlsx');
        const headers = ['candidate_name', 'party', 'year', 'total_votes', 'vote_percentage', 'margin', 'state', 'division_code', 'parliament_no', 'assembly_no'];
        const exampleData = [['Rahul Gandhi', 'INC', '2024', '500000', '52.5', '50000', 'Maharashtra', 'DIV001', 'PC01', 'AC001']];
        const worksheetData = [headers, ...exampleData];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Winning Candidates');
        XLSX.writeFile(workbook, 'winning_candidates_template.xlsx');
    };

    const handleImportFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        setImportResult(null);
        try {
            const XLSX = await import('xlsx');
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            const normalizedData = jsonData.map((row) => {
                const normalized = {};
                Object.keys(row).forEach((key) => {
                    const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
                    normalized[normalizedKey] = row[key];
                });
                return normalized;
            });
            const filteredRows = normalizedData.filter((r) => r.candidate_name);
            const token = localStorage.getItem('serviceToken');
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/api/winning-candidates/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
                body: JSON.stringify({ rows: filteredRows })
            });
            const result = await response.json();
            if (response.ok) {
                setImportResult({ success: true, imported: result.imported || 0, total: result.total || 0, errors: result.errors || [] });
                fetchCandidates();
            } else {
                setImportResult({ success: false, message: result.message || 'Import failed' });
            }
        } catch (error) {
            setImportResult({ success: false, message: error.message || 'Import failed' });
        } finally {
            setImporting(false);
            if (importInputRef.current) importInputRef.current.value = '';
        }
    };

    // Side Panel Component
    const renderSidePanel = () => (
        <Box
            sx={{
                position: 'fixed',
                right: drawerOpen ? 0 : '-480px',
                top: 0,
                width: 480,
                height: '100vh',
                backgroundColor: 'background.paper',
                boxShadow: drawerOpen ? 24 : 0,
                transition: 'right 0.3s ease-in-out',
                zIndex: 1300,
                overflowY: 'auto',
                p: 3
            }}
        >
            {selectedCandidateForDrawer && (
                <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5" fontWeight={700}>
                            Candidate Details
                        </Typography>
                        <IconButton onClick={() => setDrawerOpen(false)} size="small">
                            <InfoOutlinedIcon />
                        </IconButton>
                    </Box>
                    <Divider />

                    {/* Candidate Basic Info */}
                    <Box sx={{ p: 2.5, backgroundColor: theme.palette.primary.lighter, borderRadius: 2 }}>
                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: '50%',
                                        bgcolor: theme.palette.primary.main,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2rem',
                                        color: 'white',
                                        fontWeight: 700
                                    }}
                                >
                                    {selectedCandidateForDrawer.candidate_id?.name?.charAt(0) || 'C'}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h6" fontWeight={700} color="primary">
                                        {selectedCandidateForDrawer.candidate_id?.name || 'N/A'}
                                    </Typography>
                                    <Chip
                                        label={selectedCandidateForDrawer.party_id?.name || 'N/A'}
                                        color="secondary"
                                        size="small"
                                        sx={{ mt: 0.5 }}
                                    />
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    Election Year
                                </Typography>
                                <Typography variant="h6" fontWeight={700} color="primary">
                                    {selectedCandidateForDrawer.year_id?.year || 'N/A'}
                                </Typography>
                            </Box>

                            {selectedCandidateForDrawer.type && selectedCandidateForDrawer.type.length > 0 && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Election Type
                                    </Typography>
                                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                                        {selectedCandidateForDrawer.type.map((type, index) => (
                                            <Chip key={index} label={type} size="small" color="info" variant="outlined" />
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </Stack>
                    </Box>

                    {/* Voting Statistics */}
                    <Box sx={{ p: 2.5, backgroundColor: theme.palette.success.lighter, borderRadius: 2 }}>
                        <Stack spacing={2}>
                            <Typography variant="h6" fontWeight={700} color="success.dark">
                                <HowToVoteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Voting Statistics
                            </Typography>

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Total Votes
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} color="primary">
                                        {selectedCandidateForDrawer.total_votes?.toLocaleString() || 'N/A'}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Poll %
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} color="info.main">
                                        {selectedCandidateForDrawer.poll_percentage || 'N/A'}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Voting %
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} color="secondary.main">
                                        {selectedCandidateForDrawer.voting_percentage || 'N/A'}%
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Margin
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} color="success.main">
                                        {selectedCandidateForDrawer.margin?.toLocaleString() || 'N/A'}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Margin %
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700}>
                                        {selectedCandidateForDrawer.margin_percentage || 'N/A'}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        NOTA Votes
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700}>
                                        {selectedCandidateForDrawer.nota_votes || 'N/A'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Stack>
                    </Box>

                    {/* Electors Information */}
                    <Box sx={{ p: 2.5, backgroundColor: theme.palette.info.lighter, borderRadius: 2 }}>
                        <Stack spacing={2}>
                            <Typography variant="h6" fontWeight={700} color="info.dark">
                                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Electors Information
                            </Typography>

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Total Electors
                                    </Typography>
                                    <Typography variant="h5" fontWeight={700} color="primary">
                                        {selectedCandidateForDrawer.electors?.toLocaleString() || selectedCandidateForDrawer.total_electors || 'N/A'}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Male Electors
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700} color="info.main">
                                        {selectedCandidateForDrawer.male_electors?.toLocaleString() || 'N/A'}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        Female Electors
                                    </Typography>
                                    <Typography variant="h6" fontWeight={700} color="secondary.main">
                                        {selectedCandidateForDrawer.female_electors?.toLocaleString() || 'N/A'}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Gender Distribution */}
                            {selectedCandidateForDrawer.male_electors && selectedCandidateForDrawer.female_electors && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                                        Gender Distribution
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                                Male: {((selectedCandidateForDrawer.male_electors / (selectedCandidateForDrawer.male_electors + selectedCandidateForDrawer.female_electors)) * 100).toFixed(1)}%
                                            </Typography>
                                            <Box sx={{
                                                height: 8,
                                                backgroundColor: theme.palette.info.main,
                                                borderRadius: 1,
                                                width: `${(selectedCandidateForDrawer.male_electors / (selectedCandidateForDrawer.male_electors + selectedCandidateForDrawer.female_electors)) * 100}%`
                                            }} />
                                        </Box>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                                Female: {((selectedCandidateForDrawer.female_electors / (selectedCandidateForDrawer.male_electors + selectedCandidateForDrawer.female_electors)) * 100).toFixed(1)}%
                                            </Typography>
                                            <Box sx={{
                                                height: 8,
                                                backgroundColor: theme.palette.secondary.main,
                                                borderRadius: 1,
                                                width: `${(selectedCandidateForDrawer.female_electors / (selectedCandidateForDrawer.male_electors + selectedCandidateForDrawer.female_electors)) * 100}%`
                                            }} />
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                        </Stack>
                    </Box>

                    {/* Location Hierarchy */}
                    <Box sx={{ p: 2.5, backgroundColor: theme.palette.warning.lighter, borderRadius: 2 }}>
                        <Stack spacing={2}>
                            <Typography variant="h6" fontWeight={700} color="warning.dark">
                                <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Location Hierarchy
                            </Typography>

                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    State
                                </Typography>
                                <Typography variant="body1" fontWeight={600}>
                                    {selectedCandidateForDrawer.state_id?.name || 'N/A'}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    Division
                                </Typography>
                                <Typography variant="body1" fontWeight={600}>
                                    {selectedCandidateForDrawer.division_id?.name || 'N/A'}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    Parliament
                                </Typography>
                                <Typography variant="body1" fontWeight={600}>
                                    {selectedCandidateForDrawer.parliament_id?.name || 'N/A'}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    Assembly
                                </Typography>
                                <Typography variant="body1" fontWeight={600}>
                                    {selectedCandidateForDrawer.assembly_id?.name || 'N/A'}
                                    {selectedCandidateForDrawer.assembly_id?.AC_NO && (
                                        <Chip
                                            label={`AC No: ${selectedCandidateForDrawer.assembly_id.AC_NO}`}
                                            size="small"
                                            sx={{ ml: 1 }}
                                        />
                                    )}
                                </Typography>
                            </Box>
                        </Stack>
                    </Box>

                    {/* Description */}
                    {selectedCandidateForDrawer.description && (
                        <Box sx={{ p: 2, backgroundColor: theme.palette.grey[100], borderRadius: 2 }}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                Description
                            </Typography>
                            <Box sx={{ border: '1px solid #eee', borderRadius: 1, p: 2, bgcolor: 'background.default' }}>
                                <div dangerouslySetInnerHTML={{ __html: selectedCandidateForDrawer.description }} />
                            </Box>
                        </Box>
                    )}

                    {/* Record Information */}
                    {(selectedCandidateForDrawer.created_at || selectedCandidateForDrawer.updated_at) && (
                        <Box sx={{ p: 2, backgroundColor: theme.palette.grey[100], borderRadius: 2 }}>
                            <Stack spacing={1}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary">
                                    Record Information
                                </Typography>
                                {selectedCandidateForDrawer.created_by && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Created By: {typeof selectedCandidateForDrawer.created_by === 'object' ? selectedCandidateForDrawer.created_by.username : selectedCandidateForDrawer.created_by}
                                        </Typography>
                                    </Box>
                                )}
                                {selectedCandidateForDrawer.created_at && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Created: {new Date(selectedCandidateForDrawer.created_at).toLocaleString()}
                                        </Typography>
                                    </Box>
                                )}
                                {selectedCandidateForDrawer.updated_by && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Updated By: {typeof selectedCandidateForDrawer.updated_by === 'object' ? selectedCandidateForDrawer.updated_by.username : selectedCandidateForDrawer.updated_by}
                                        </Typography>
                                    </Box>
                                )}
                                {selectedCandidateForDrawer.updated_at && (
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">
                                            Last Updated: {new Date(selectedCandidateForDrawer.updated_at).toLocaleString()}
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>
                        </Box>
                    )}
                </Stack>
            )}
        </Box>
    );

    if (loading) return <EmptyReactTable />;

    return (
        <>
            {/* Candidate Details Modal */}
            {openDetailsModal && (
                <CandidateDetailsModal
                    open={openDetailsModal}
                    onClose={() => setOpenDetailsModal(false)}
                    details={candidateDetails}
                />
            )}

            {/* Entity Details Modal (State, Division, Parliament, Assembly) */}
            {openEntityModal && (
                <EntityDetailsModal
                    open={openEntityModal}
                    onClose={() => setOpenEntityModal(false)}
                    details={entityDetails}
                    title={entityTitle}
                />
            )}

            <Grid item xs={12}>
                <MainCard title="Theme Variants">
                    <MapContainerStyled>
                        <ChangeTheme 
                            {...mapConfiguration} 
                            themes={MAPBOX_THEMES} 
                            onAssemblySelect={handleAssemblySelectFromMap}
                        />
                    </MapContainerStyled>
                </MainCard>
            </Grid>
            <MainCard content={false}>
                {/* Access Scope Information */}
                <Alert severity="info" sx={{ m: 2 }}>
                    <Typography variant="body2">
                        <strong>Data Access:</strong> {(() => {
                            if (!userHierarchy) return 'You have access to all Winning Candidates data';
                            const highest = getUserHighestLevel();
                            const labelMap = { state: 'State', division: 'Division', parliament: 'Parliament', assembly: 'Assembly', block: 'Block', booth: 'Booth' };
                            const idMap = { state: userHierarchy.state, division: userHierarchy.division, parliament: userHierarchy.parliament, assembly: userHierarchy.assembly, block: userHierarchy.block, booth: userHierarchy.booth };
                            const label = labelMap[highest] || 'Unknown';
                            const id = idMap[highest];
                            return `You have access to Winning Candidates data for ${label}${id ? ` (ID: ${id})` : ''}`;
                        })()}
                    </Typography>
                </Alert>
                <Stack spacing={2} sx={{ padding: 3 }}>
                    {/* Selected Assembly from Map */}
                    {selectedAssemblyFromMap && (
                        <Alert 
                            severity="info" 
                            onClose={() => {
                                setSelectedAssemblyFromMap(null);
                                setFilterValues(prev => ({ ...prev, assembly: '' }));
                                setAppliedFilters(prev => ({ ...prev, assembly: '' }));
                            }}
                            sx={{ mb: 1 }}
                        >
                            <Typography variant="body2">
                                <strong>Filtered by Assembly:</strong> {selectedAssemblyFromMap.AC_NAME} (AC No: {selectedAssemblyFromMap.AC_NO})
                            </Typography>
                        </Alert>
                    )}
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                        <TextField
                            size="small"
                            variant="outlined"
                            placeholder={`Search ${candidateList.length} winning candidate entries...`}
                            value={searchInput}
                            onChange={(e) => {
                                const v = e.target.value;
                                setSearchInput(v);
                                if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                                searchDebounceRef.current = setTimeout(() => {
                                    setGlobalFilter(String(v));
                                }, 500);
                            }}
                            sx={{ minWidth: 300 }}
                        />
                        <Stack direction="row" spacing={1}>
                            <CSVLink
                                data={csvData}
                                filename="winning_candidates_list_all.csv"
                                style={{ display: 'none' }}
                                ref={csvLinkRef}
                            />
                            <Button
                                variant="outlined"
                                onClick={handleDownloadExcelTemplate}
                                size="small"
                            >
                                Download Excel Template
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => importInputRef.current?.click()}
                                disabled={importing}
                                size="small"
                            >
                                {importing ? 'Importing...' : 'Import Excel'}
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={handleDownloadCsv}
                                disabled={csvLoading}
                                size="small"
                            >
                                {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                            </Button>
                            <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedCandidate(null); setOpenModal(true); }}>
                                Add Winning Candidate
                            </Button>
                        </Stack>
                    </Stack>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Party</InputLabel>
                                <Select
                                    value={filterValues.party}
                                    onChange={(e) => setFilterValues({ ...filterValues, party: e.target.value })}
                                    label="Party"
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {filterOptions.parties?.map((party) => (
                                        <MenuItem key={party._id} value={party._id}>{party.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>State</InputLabel>
                                <Select
                                    value={filterValues.state}
                                    onChange={(e) => handleStateChange(e.target.value)}
                                    label="State"
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {filterOptions.states?.map((state) => (
                                        <MenuItem key={state._id} value={state._id}>{state.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Division</InputLabel>
                                <Select
                                    value={filterValues.division}
                                    onChange={(e) => handleDivisionChange(e.target.value)}
                                    label="Division"
                                    disabled={!filterValues.state}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {filterOptions.divisions?.filter(division => {
                                        const stateId = division.state_id?._id || division.state_id;
                                        return stateId === filterValues.state;
                                    }).map((division) => (
                                        <MenuItem key={division._id} value={division._id}>{division.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Parliament</InputLabel>
                                <Select
                                    value={filterValues.parliament}
                                    onChange={(e) => handleParliamentChange(e.target.value)}
                                    label="Parliament"
                                    disabled={!filterValues.division}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {filterOptions.parliaments?.filter(parliament => {
                                        const divisionId = parliament.division_id?._id || parliament.division_id;
                                        return divisionId === filterValues.division;
                                    }).map((parliament) => (
                                        <MenuItem key={parliament._id} value={parliament._id}>{parliament.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Assembly</InputLabel>
                                <Select
                                    value={filterValues.assembly}
                                    onChange={(e) => setFilterValues({ ...filterValues, assembly: e.target.value })}
                                    label="Assembly"
                                    disabled={!filterValues.parliament}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {filterOptions.assemblies?.filter(assembly => {
                                        const parliamentId = assembly.parliament_id?._id || assembly.parliament_id;
                                        return parliamentId === filterValues.parliament;
                                    }).map((assembly) => (
                                        <MenuItem key={assembly._id} value={assembly._id}>{assembly.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Candidate</InputLabel>
                                <Select
                                    value={filterValues.candidate}
                                    onChange={(e) => setFilterValues({ ...filterValues, candidate: e.target.value })}
                                    label="Candidate"
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {filterOptions.candidatesData?.map((candidate) => (
                                        <MenuItem key={candidate._id} value={candidate._id}>{candidate.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Election Year</InputLabel>
                                <Select
                                    value={filterValues.electionYear}
                                    onChange={(e) => setFilterValues({ ...filterValues, electionYear: e.target.value })}
                                    label="Election Year"
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {filterOptions.electionYears?.map((year) => (
                                        <MenuItem key={year._id} value={year._id}>{year.year}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Stack direction="row" spacing={1}>
                                <Button variant="contained" onClick={handleApplyFilters} sx={{ width: '50%' }}>
                                    Apply
                                </Button>
                                <Button variant="outlined" onClick={handleClearFilters} sx={{ width: '50%' }}>
                                    Clear
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </Stack>

                <ScrollX>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ backgroundColor: 'primary.main' }}>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableCell
                                                key={header.id}
                                                onClick={header.column.getToggleSortingHandler()}
                                                sx={{
                                                    cursor: header.column.getCanSort() ? 'pointer' : 'default',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    backgroundColor: 'primary.main'
                                                }}
                                            >
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box>{flexRender(header.column.columnDef.header, header.getContext())}</Box>
                                                    {header.column.getCanSort() && <HeaderSort column={header.column} />}
                                                </Stack>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHead>
                            <TableBody>
                                {table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Divider />
                    <Box sx={{ p: 2 }}>
                        <TablePagination
                            setPageSize={(size) => setPagination((prev) => ({ ...prev, pageSize: size }))}
                            setPageIndex={(index) => setPagination((prev) => ({ ...prev, pageIndex: index }))}
                            getState={table.getState}
                            getPageCount={() => pageCount}
                        />
                    </Box>
                </ScrollX>
            </MainCard>

            <input
                type="file"
                accept=".xlsx,.xls,.csv"
                ref={importInputRef}
                style={{ display: 'none' }}
                onChange={handleImportFile}
            />

            {importResult && (
                <Alert
                    severity={importResult.success ? 'success' : 'error'}
                    onClose={() => setImportResult(null)}
                    sx={{ m: 2 }}
                >
                    {importResult.success ? (
                        <>
                            Successfully imported {importResult.imported} out of {importResult.total} records.
                            {importResult.errors && importResult.errors.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" fontWeight="bold">Errors:</Typography>
                                    {importResult.errors.slice(0, 5).map((err, idx) => (
                                        <Typography key={idx} variant="caption" display="block">
                                            Row {err.row}: {err.error}
                                        </Typography>
                                    ))}
                                    {importResult.errors.length > 5 && (
                                        <Typography variant="caption" display="block">
                                            ... and {importResult.errors.length - 5} more errors
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </>
                    ) : (
                        importResult.message
                    )}
                </Alert>
            )}

            <WinningCandidateModal
                open={openModal}
                modalToggler={setOpenModal}
                candidateEntry={selectedCandidate}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                parties={parties}
                candidates={candidates}
                years={years}
                refresh={() => fetchCandidateList(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertWinningCandidateDelete
                id={candidateDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchCandidateList(pagination.pageIndex, pagination.pageSize)}
            />

            {/* Side Panel */}
            {renderSidePanel()}

            {/* Assembly Drawer (opened when clicking a polygon on the map) */}
            <Drawer
                anchor="right"
                open={assemblyDrawerOpen}
                onClose={() => setAssemblyDrawerOpen(false)}
                sx={{ '& .MuiDrawer-paper': { width: 380, boxSizing: 'border-box', p: 3 } }}
            >
                {selectedAssemblyFromMap ? (
                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" fontWeight={700}>Assembly</Typography>
                                <IconButton onClick={() => setAssemblyDrawerOpen(false)} size="small"><InfoOutlinedIcon /></IconButton>
                            </Box>
                            <Divider />

                            {/* Render the full assembly details (prefer full API record) */}
                            {renderAssemblyDetails(selectedAssemblyDetails || selectedAssemblyFromMap)}

                            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                <Button variant="contained" onClick={applyAssemblyFilterFromDrawer}>
                                    Apply Filter
                                </Button>
                                <Button variant="outlined" onClick={() => { setSelectedAssemblyFromMap(null); setSelectedAssemblyDetails(null); setAppliedFilters(prev => ({ ...prev, assembly: '' })); setFilterValues(prev => ({ ...prev, assembly: '' })); setAssemblyDrawerOpen(false); }}>
                                    Clear
                                </Button>
                            </Stack>
                        </Stack>
                    ) : (
                        <Typography>No assembly selected</Typography>
                    )}
            </Drawer>

            {/* Backdrop */}
            {drawerOpen && (
                <Box
                    onClick={() => setDrawerOpen(false)}
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 1200
                    }}
                />
            )}
        </>
    );
}
