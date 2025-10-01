import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Stack, Typography, Box, Tooltip, Divider, Chip, Avatar, Grid,
    IconButton, Select, MenuItem, FormControl, InputLabel, TextField, Alert
} from '@mui/material';
import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import axiosServices from 'utils/axios';
import { usePermissions } from 'contexts/PermissionContext';
import {
    getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
    useReactTable, flexRender
} from '@tanstack/react-table';
import { CSVLink } from 'react-csv';
import { Add, Edit, Trash, Eye } from 'iconsax-react';
import { useNavigate } from 'react-router-dom';
import { HeaderSort, TablePagination } from 'components/third-party/react-table';
import ScrollX from 'components/ScrollX';
import MainCard from 'components/MainCard';
import EmptyReactTable from 'pages/tables/react-table/empty';
import VisitModal from './VisitModal';
import AlertVisitDelete from './AlertVisitDelete';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';

// Map components
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';

const mapConfiguration = {
    mapboxAccessToken: import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN,
    minZoom: 1
};

const MAPBOX_THEMES = {
    light: 'mapbox://styles/mapbox/light-v10',
    dark: 'mapbox://styles/mapbox/dark-v10',
    streets: 'mapbox://styles/mapbox/streets-v11',
    outdoors: 'mapbox://styles/mapbox/outdoors-v11',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v11'
};

const VisitListPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();
    const [visits, setVisits] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState({ open: false, id: null });
    const [globalFilter, setGlobalFilter] = useState('');
    // Local input for search so we can debounce API/table requests
    const [searchInput, setSearchInput] = useState('');
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [electionYears, setElectionYears] = useState([]);
    const [users, setUsers] = useState([]);

    // Map state
    const [mapVisits, setMapVisits] = useState([]);
    const [popupInfo, setPopupInfo] = useState(null);
    const [selectedTheme, setSelectedTheme] = useState('streets');
    const [routeData, setRouteData] = useState(null);
    const mapRef = useRef(null);

    // Debounce typing in search box before applying to globalFilter used by table
    useEffect(() => {
        const handler = setTimeout(() => {
            setGlobalFilter(searchInput);
        }, 500); // 500ms debounce; adjust as needed

        return () => clearTimeout(handler);
    }, [searchInput]);

    // Keep local input in sync when globalFilter changes from outside (clear, pagination, etc.)
    useEffect(() => {
        setSearchInput(globalFilter || '');
    }, [globalFilter]);

    // Get user's access scope information
    const getUserAccessScope = () => {
        if (!userHierarchy) {
            return { level: 'All', description: 'You have access to all visit data' };
        }

        const highestLevel = getUserHighestLevel();
        if (!highestLevel) {
            return { level: 'All', description: 'You have access to all visit data' };
        }

        const levelNames = {
            state: 'State',
            division: 'Division',
            parliament: 'Parliament',
            assembly: 'Assembly',
            block: 'Block',
            booth: 'Booth'
        };

        const levelName = levelNames[highestLevel] || highestLevel;
        const entityName = userHierarchy[highestLevel]?.name || 'Unknown';

        return {
            level: levelName,
            entity: entityName,
            description: `You have access to visit data for ${entityName} ${levelName} and all areas within it`
        };
    };

    const accessScope = getUserAccessScope();

    // Filter states
    const [filterValues, setFilterValues] = useState({
        candidate: '',
        status: '',
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: '',
        booth: '',
        startDate: '',
        endDate: ''
    });
    const [appliedFilters, setAppliedFilters] = useState({
        candidate: '',
        status: '',
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: '',
        booth: '',
        startDate: '',
        endDate: ''
    });

    // Filtered data for cascading dropdowns
    const filteredDivisions = filterValues.state
        ? divisions.filter(division => {
            const stateId = division.state_id?._id || division.state_id;
            return stateId === filterValues.state;
        })
        : []; // Empty array when no state selected

    const filteredParliaments = filterValues.division
        ? parliaments.filter(parliament => {
            const divisionId = parliament.division_id?._id || parliament.division_id;
            return divisionId === filterValues.division;
        })
        : filterValues.state
            ? parliaments.filter(parliament => {
                const stateId = parliament.state_id?._id || parliament.state_id;
                return stateId === filterValues.state;
            })
            : parliaments;

    const filteredAssemblies = filterValues.parliament
        ? assemblies.filter(assembly => {
            const parliamentId = assembly.parliament_id?._id || assembly.parliament_id;
            return parliamentId === filterValues.parliament;
        })
        : filterValues.division
            ? assemblies.filter(assembly => {
                const divisionId = assembly.division_id?._id || assembly.division_id;
                return divisionId === filterValues.division;
            })
            : []; // Empty array when no division selected

    const filteredBlocks = filterValues.assembly
        ? blocks.filter(block => {
            const assemblyId = block.assembly_id?._id || block.assembly_id;
            return assemblyId === filterValues.assembly;
        })
        : filterValues.division
            ? blocks.filter(block => {
                const divisionId = block.division_id?._id || block.division_id;
                return divisionId === filterValues.division;
            })
            : filterValues.state
                ? blocks.filter(block => {
                    const stateId = block.state_id?._id || block.state_id;
                    return stateId === filterValues.state;
                })
                : blocks;

    const filteredBooths = filterValues.block
        ? booths.filter(booth => {
            const blockId = booth.block_id?._id || booth.block_id;
            return blockId === filterValues.block;
        })
        : filterValues.assembly
            ? booths.filter(booth => {
                const assemblyId = booth.assembly_id?._id || booth.assembly_id;
                return assemblyId === filterValues.assembly;
            })
            : []; // Empty array when no assembly selected

    // CSV functionality
    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef(); const fetchVisits = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            let queryParams = [
                `page=${pageIndex + 1}`,
                `limit=${pageSize}`
            ];

            if (globalFilter) {
                queryParams.push(`search=${encodeURIComponent(globalFilter)}`);
            }

            if (appliedFilters.candidate) {
                queryParams.push(`candidate=${appliedFilters.candidate}`);
            }
            if (appliedFilters.status) {
                queryParams.push(`status=${appliedFilters.status}`);
            }
            if (appliedFilters.state) {
                queryParams.push(`state=${appliedFilters.state}`);
            }
            if (appliedFilters.division) {
                queryParams.push(`division=${appliedFilters.division}`);
            }
            if (appliedFilters.parliament) {
                queryParams.push(`parliament=${appliedFilters.parliament}`);
            }
            if (appliedFilters.assembly) {
                queryParams.push(`assembly=${appliedFilters.assembly}`);
            }
            if (appliedFilters.block) {
                queryParams.push(`block=${appliedFilters.block}`);
            }
            if (appliedFilters.booth) {
                queryParams.push(`booth=${appliedFilters.booth}`);
            }
            if (appliedFilters.startDate) {
                // Convert YYYY-MM-DD to ISO string for proper backend comparison
                const startDate = new Date(appliedFilters.startDate + 'T00:00:00.000Z').toISOString();
                queryParams.push(`startDate=${encodeURIComponent(startDate)}`);
            }
            if (appliedFilters.endDate) {
                // Convert YYYY-MM-DD to end of day ISO string for proper backend comparison
                const endDate = new Date(appliedFilters.endDate + 'T23:59:59.999Z').toISOString();
                queryParams.push(`endDate=${encodeURIComponent(endDate)}`);
            }

            const { data: json } = await axiosServices.get(`/visits?${queryParams.join('&')}`);
            if (json.success) {
                setVisits(json.data);
                setPageCount(json.pages);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMapVisits = async (filters = appliedFilters) => {
        try {
            let queryParams = ['all=true'];

            // Apply all the same filters as the visit list
            if (filters.candidate) {
                queryParams.push(`candidate=${filters.candidate}`);
            }
            if (filters.status) {
                queryParams.push(`status=${filters.status}`);
            }
            if (filters.state) {
                queryParams.push(`state=${filters.state}`);
            }
            if (filters.division) {
                queryParams.push(`division=${filters.division}`);
            }
            if (filters.parliament) {
                queryParams.push(`parliament=${filters.parliament}`);
            }
            if (filters.assembly) {
                queryParams.push(`assembly=${filters.assembly}`);
            }
            if (filters.block) {
                queryParams.push(`block=${filters.block}`);
            }
            if (filters.booth) {
                queryParams.push(`booth=${filters.booth}`);
            }
            if (filters.startDate) {
                // Convert YYYY-MM-DD to ISO string for proper backend comparison
                const startDate = new Date(filters.startDate + 'T00:00:00.000Z').toISOString();
                queryParams.push(`startDate=${encodeURIComponent(startDate)}`);
            }
            if (filters.endDate) {
                // Convert YYYY-MM-DD to end of day ISO string for proper backend comparison
                const endDate = new Date(filters.endDate + 'T23:59:59.999Z').toISOString();
                queryParams.push(`endDate=${encodeURIComponent(endDate)}`);
            }

            const path = `/visits?${queryParams.join('&')}`;

            console.log('Fetching map visits with filters, path:', path, 'filters:', filters);

            // Use axiosServices with a relative path (it already has baseURL configured)
            const { data: json } = await axiosServices.get(path);
            console.log('Map visits API response summary:', json && { success: json.success, count: json.data?.length });

            if (json && json.success) {
                const rawVisits = Array.isArray(json.data) ? json.data : [];
                console.log('Total visits received for map (raw):', rawVisits.length);
                if (rawVisits.length === 0) {
                    setMapVisits([]);
                    setRouteData(null);
                    return;
                }

                // Normalize and coerce coordinates to numbers, then filter out invalid ones
                const visitsWithCoords = rawVisits
                    .map(v => ({
                        ...v,
                        latitude: v.latitude !== undefined && v.latitude !== null && v.latitude !== '' ? Number(v.latitude) : NaN,
                        longitude: v.longitude !== undefined && v.longitude !== null && v.longitude !== '' ? Number(v.longitude) : NaN
                    }))
                    .filter(v => !isNaN(v.latitude) && !isNaN(v.longitude));

                console.log('visitsWithCoords count (numeric):', visitsWithCoords.length);
                if (visitsWithCoords.length > 0) console.log('sample coords:', visitsWithCoords.slice(0, 3).map(v => ({ lat: v.latitude, lon: v.longitude })));

                setMapVisits(visitsWithCoords);

                if (visitsWithCoords.length > 1) {
                    const coordinates = visitsWithCoords.map(v => [v.longitude, v.latitude]);
                    setRouteData({
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: coordinates
                        }
                    });
                } else {
                    setRouteData(null);
                }

                // Center map on first visit if available
                if (visitsWithCoords.length > 0 && mapRef.current) {
                    // react-map-gl's Map ref may expose getMap()
                    const mapInstance = (typeof mapRef.current.getMap === 'function') ? mapRef.current.getMap() : mapRef.current;
                    if (mapInstance && typeof mapInstance.flyTo === 'function') {
                        try {
                            mapInstance.flyTo({
                                center: [visitsWithCoords[0].longitude, visitsWithCoords[0].latitude],
                                zoom: 10
                            });
                        } catch (err) {
                            console.warn('mapInstance.flyTo failed', err);
                        }
                    }
                }
                return;
            }

            // If API didn't return success
            setMapVisits([]);
            setRouteData(null);
        } catch (error) {
            console.error('Error loading visit data:', error);
            setMapVisits([]);
            setRouteData(null);
        }
    };

    // Add this function right before the return statement in your component
    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        try {
            let queryParams = ['all=true'];

            // Apply all the same filters as the visit list for CSV export
            if (appliedFilters.candidate) {
                queryParams.push(`candidate=${appliedFilters.candidate}`);
            }
            if (appliedFilters.status) {
                queryParams.push(`status=${appliedFilters.status}`);
            }
            if (appliedFilters.state) {
                queryParams.push(`state=${appliedFilters.state}`);
            }
            if (appliedFilters.division) {
                queryParams.push(`division=${appliedFilters.division}`);
            }
            if (appliedFilters.parliament) {
                queryParams.push(`parliament=${appliedFilters.parliament}`);
            }
            if (appliedFilters.assembly) {
                queryParams.push(`assembly=${appliedFilters.assembly}`);
            }
            if (appliedFilters.block) {
                queryParams.push(`block=${appliedFilters.block}`);
            }
            if (appliedFilters.booth) {
                queryParams.push(`booth=${appliedFilters.booth}`);
            }
            if (appliedFilters.startDate) {
                const startDate = new Date(appliedFilters.startDate + 'T00:00:00.000Z').toISOString();
                queryParams.push(`startDate=${encodeURIComponent(startDate)}`);
            }
            if (appliedFilters.endDate) {
                const endDate = new Date(appliedFilters.endDate + 'T23:59:59.999Z').toISOString();
                queryParams.push(`endDate=${encodeURIComponent(endDate)}`);
            }

            const path = `/visits?${queryParams.join('&')}`;
            const { data: json } = await axiosServices.get(path);

            if (json.success) {
                // Helper to remove HTML tags and normalize whitespace
                const stripHtml = (input) => {
                    if (input === null || input === undefined) return '';
                    if (typeof input !== 'string') return String(input);
                    // Remove tags and collapse whitespace
                    return input.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                };

                // Helper to render user fields safely (avoid [object Object]).
                // If created_by/updated_by is an id string, try to resolve it
                // from the cached `users` list fetched by `fetchReferenceData`.
                const formatUser = (user) => {
                    if (!user) return '';
                    // If it's a simple id (string/number), try to lookup
                    if (typeof user === 'string' || typeof user === 'number') {
                        const id = String(user);
                        const found = users.find(u => String(u._id) === id || String(u.id) === id);
                        return found ? (found.name || found.displayName || found.email || id) : id;
                    }
                    if (typeof user === 'object') {
                        if (user.name) return user.name;
                        if (user.displayName) return user.displayName;
                        if (user.fullName) return user.fullName;
                        if (user.email) return user.email;
                        const uid = user._id || user.id;
                        if (uid) {
                            const found = users.find(u => String(u._id) === String(uid) || String(u.id) === String(uid));
                            if (found) return found.name || found.displayName || found.email || String(uid);
                            return String(uid);
                        }
                        try {
                            return JSON.stringify(user);
                        } catch (e) {
                            return String(user);
                        }
                    }
                    return String(user);
                };

                const csvData = json.data.map(item => ({
                    'Candidate': stripHtml(item.candidate_id?.name || ''),
                    // 'Candidate ID': item.candidate_id?._id || '',
                    'Post': stripHtml(item.post || ''),
                    'Election Year': item.election_year_id?.year || '',
                    'Election Type': item.election_year_id?.election_type || '',
                    'Date': item.date ? formatDate(item.date) : '',
                    'Status': item.work_status || '',
                    'State': item.state_id?.name || '',
                    'Division': item.division_id?.name || '',
                    'Assembly': item.assembly_id?.name || '',
                    'Parliament': item.parliament_id?.name || '',
                    'Block': item.block_id?.name || '',
                    'Booth': item.booth_id?.name || '',
                    'Location': stripHtml(item.locationName || ''),
                    'Longitude': item.longitude ?? '',
                    'Latitude': item.latitude ?? '',
                    'Coordinates': (item.latitude != null && item.longitude != null) ? `${item.latitude}, ${item.longitude}` : '',
                    'Work Name': stripHtml(item.workName || ''),
                    'Visit Agenda': stripHtml(item.visitAgenda || item.declaration || ''),
                    'Speech (5 lines)': stripHtml(item.speechFiveLines || ''),
                    'Speech Issue': stripHtml(item.speechIssue || ''),
                    'Announcement Date': item.announcementDate ? formatDate(item.announcementDate) : '',
                    'Completion Date': item.completionDate ? formatDate(item.completionDate) : '',
                    'Budget Announced Date': item.budgetAnnouncedDate ? formatDate(item.budgetAnnouncedDate) : '',
                    'Documents': Array.isArray(item.documents) ? item.documents.map(d => d.name || d.filePath || '').filter(Boolean).join('; ') : '',
                    'Description': stripHtml(item.description || ''),
                    'Remark': stripHtml(item.remark || ''),
                    'Created By': formatUser(item.created_by),
                    'Updated By': formatUser(item.updated_by),
                    'Created At': item.created_at ? new Date(item.created_at).toLocaleString('en-IN') : '',
                    'Updated At': item.updated_at ? new Date(item.updated_at).toLocaleString('en-IN') : ''
                }));

                setCsvData(csvData);
                setTimeout(() => {
                    if (csvLinkRef.current) {
                        csvLinkRef.current.link.click();
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Failed to generate CSV:', error);
        } finally {
            setCsvLoading(false);
        }
    };

    const fetchReferenceData = async () => {
        try {
            const [
                statesRes, divisionsRes, parliamentsRes,
                assembliesRes, blocksRes, boothsRes,
                candidatesRes, electionYearsRes
            ] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/booths`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/candidates`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/election-years`)
            ]);

            const [
                statesData, divisionsData, parliamentsData,
                assembliesData, blocksData, boothsData,
                candidatesData, electionYearsData, usersData
            ] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                boothsRes.json(),
                candidatesRes.json(),
                electionYearsRes.json(),
                // users may be used to resolve created_by/updated_by ids -> names
                fetch(`${import.meta.env.VITE_APP_API_URL}/users`).then(r => r.json())
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (blocksData.success) setBlocks(blocksData.data);
            if (boothsData.success) setBooths(boothsData.data);
            if (candidatesData.success) setCandidates(candidatesData.data);
            if (electionYearsData.success) setElectionYears(electionYearsData.data);
            if (usersData && usersData.success) setUsers(usersData.data);
        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    useEffect(() => {
        console.log('useEffect triggered with appliedFilters:', appliedFilters);
        fetchVisits(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchMapVisits(appliedFilters);
        fetchReferenceData();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, appliedFilters]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    const workStatusColor = {
        'announced': 'default',
        'approved': 'info',
        'in progress': 'warning',
        'complete': 'success',
        'other': 'default',
        'speech subject': 'primary'
    };


    const handleApplyFilters = () => {
        setAppliedFilters(filterValues);
        setPagination({ pageIndex: 0, pageSize: 10 });
        fetchVisits(0, 10, globalFilter);
        // Update map with the new filters
        fetchMapVisits(filterValues);
    };

    const handleClearFilters = () => {
        const emptyFilters = {
            candidate: '',
            status: '',
            state: '',
            division: '',
            parliament: '',
            assembly: '',
            block: '',
            booth: '',
            startDate: '',
            endDate: ''
        };
        setFilterValues(emptyFilters);
        setAppliedFilters(emptyFilters);
        setPagination({ pageIndex: 0, pageSize: 10 });
        fetchVisits(0, 10, globalFilter);
        // Update map to show all visits when filters are cleared
        fetchMapVisits(emptyFilters);
    };

    // Handle cascading filter changes
    const handleStateChange = (stateValue) => {
        setFilterValues({
            ...filterValues,
            state: stateValue,
            division: '', // Clear dependent filters
            parliament: '',
            assembly: '',
            block: '',
            booth: ''
        });
    };

    const handleDivisionChange = (divisionValue) => {
        setFilterValues({
            ...filterValues,
            division: divisionValue,
            parliament: '', // Clear dependent filters
            assembly: '',
            block: '',
            booth: ''
        });
    };

    const handleParliamentChange = (parliamentValue) => {
        setFilterValues({
            ...filterValues,
            parliament: parliamentValue,
            assembly: '', // Clear dependent filters
            block: '',
            booth: ''
        });
    };

    const handleAssemblyChange = (assemblyValue) => {
        setFilterValues({
            ...filterValues,
            assembly: assemblyValue,
            block: '', // Clear dependent filters
            booth: ''
        });
    };

    const handleBlockChange = (blockValue) => {
        setFilterValues({
            ...filterValues,
            block: blockValue,
            booth: '' // Clear dependent filters
        });
    };

    const handleMarkerClick = (visit) => {
        // Show only the clicked visit in the popup (not all visits for the candidate)
        setPopupInfo({
            longitude: visit.longitude,
            latitude: visit.latitude,
            candidate: visit.candidate_id,
            visit // single visit object
        });
    };

    const handleThemeChange = (theme) => {
        setSelectedTheme(theme);
    };

    const columns = useMemo(() => [
        {
            header: '#',
            accessorKey: '_id',
            cell: ({ row }) => <Typography>{row.index + 1}</Typography>
        },
        {
            header: 'Candidate',
            accessorKey: 'candidate_id',
            cell: ({ getValue }) => (
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                        src={getValue()?.photo}
                        sx={{ width: 32, height: 32 }}
                    />
                    <Typography fontWeight="medium">
                        {getValue()?.name || 'N/A'}
                    </Typography>
                </Stack>
            )
        },
        {
            header: 'Post',
            accessorKey: 'post',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Election Year',
            accessorKey: 'election_year_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.year ? `${getValue().year} (${getValue().election_type})` : 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Date',
            accessorKey: 'date',
            cell: ({ getValue }) => (
                <Typography>
                    {formatDate(getValue())}
                </Typography>
            )
        },
        {
            header: 'Status',
            accessorKey: 'work_status',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.toUpperCase() || 'N/A'}
                    color={workStatusColor[getValue()] || 'default'}
                    size="small"
                />
            )
        },
        {
            header: 'State',
            accessorKey: 'state_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.name || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Division',
            accessorKey: 'division_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.name || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Assembly',
            accessorKey: 'assembly_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.name || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Parliament',
            accessorKey: 'parliament_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.name || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Block',
            accessorKey: 'block_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.name || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Booth',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.name || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Location',
            accessorKey: 'locationName',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Longitude',
            accessorKey: 'longitude',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Latitude',
            accessorKey: 'latitude',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
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
            header: 'Visit Agenda',
            accessorKey: 'visitAgenda',
            cell: ({ getValue }) => (
                <Typography sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic', color: 'text.secondary' }}>
                    {getValue() ? getValue().slice(0, 100) : ''}
                </Typography>
            )
        },
        {
            header: 'Remark',
            accessorKey: 'remark',
            cell: ({ getValue }) => (
                <Typography sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic', color: 'text.secondary' }}>
                    {getValue() ? getValue().slice(0, 100) : ''}
                </Typography>
            )
        },
        {
            header: 'Actions',
            meta: { className: 'cell-center' },
            cell: ({ row }) => {
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <Tooltip title="View Details">
                            <IconButton
                                color="secondary"
                                onClick={() => navigate(`/visits/${row.original._id}`)}
                            >
                                <Eye />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton color="primary" onClick={(e) => {
                                e.stopPropagation();
                                setEditData(row.original);
                                setOpenModal(true);
                            }}>
                                <Edit />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton color="error" onClick={(e) => {
                                e.stopPropagation();
                                setDeleteAlert({ open: true, id: row.original._id });
                            }}>
                                <Trash />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                );
            }
        }
    ], [theme]);

    const table = useReactTable({
        data: visits,
        columns,
        state: { pagination, globalFilter },
        pageCount,
        manualPagination: true,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel()
    });

    if (loading) return <EmptyReactTable />;

    return (
        <>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <MainCard
                        title="Visit Locations Map"
                    >
                        {/* Access Scope Information */}
                        <Alert
                            severity="info"
                            sx={{ mb: 2 }}
                        >
                            <Typography variant="body2">
                                <strong>Data Access:</strong> {accessScope.description}
                            </Typography>
                        </Alert>

                        <MapContainerStyled>
                            <Map
                                ref={mapRef}
                                initialViewState={{
                                    latitude: 23.4707,
                                    longitude: 77.9455,
                                    zoom: 6
                                }}
                                mapStyle={MAPBOX_THEMES[selectedTheme]}
                                mapboxAccessToken={mapConfiguration.mapboxAccessToken}
                            >
                                <MapControl />

                                {/* India background layer */}
                                <Source id="india-source" type="geojson" data="/india.geojson">
                                    <Layer
                                        id="india-fill"
                                        type="fill"
                                        paint={{
                                            'fill-color': '#e0e0e0',
                                            'fill-opacity': 0.07
                                        }}
                                    />
                                    <Layer
                                        id="india-outline"
                                        type="line"
                                        paint={{
                                            'line-color': '#003366',
                                            'line-width': 1
                                        }}
                                    />
                                </Source>

                                {/* Route line (optional) */}
                                {routeData && (
                                    <Source id="route" type="geojson" data={routeData}>
                                        <Layer
                                            id="route-line"
                                            type="line"
                                            paint={{
                                                'line-color': theme.palette.primary.main,
                                                'line-width': 2
                                            }}
                                        />
                                    </Source>
                                )}

                                {/* Marker for each visit */}
                                {console.log('Rendering markers for mapVisits:', mapVisits.length, 'visits')}
                                {mapVisits.map((visit, idx) => (
                                    <Marker
                                        key={idx}
                                        longitude={visit.longitude}
                                        latitude={visit.latitude}
                                        anchor="bottom"
                                    >
                                        <Avatar
                                            src={visit.candidate_id?.photo}
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                border: `2px solid ${theme.palette.primary.main}`,
                                                cursor: 'pointer'
                                            }}
                                            onClick={(e) => {
                                                // prevent the map from handling the click (which can require a second click)
                                                if (e && e.stopPropagation) e.stopPropagation();
                                                handleMarkerClick(visit);
                                            }}
                                        />
                                    </Marker>
                                ))}

                                {/* Popup when a marker is clicked */}
                                {popupInfo && (
                                    <Popup
                                        longitude={popupInfo.longitude}
                                        latitude={popupInfo.latitude}
                                        closeButton={true}
                                        anchor="bottom"
                                        onClose={() => setPopupInfo(null)}
                                        maxWidth="400px"
                                    >
                                        <Box sx={{ p: 1, minWidth: 300 }}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Avatar src={popupInfo.candidate?.photo} sx={{ width: 48, height: 48 }} />
                                                <Box>
                                                    <Typography fontWeight="bold">{popupInfo.candidate?.name}</Typography>
                                                </Box>
                                            </Stack>
                                            <Divider sx={{ my: 1 }} />
                                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Visit Details:</Typography>
                                            <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                                                {popupInfo.visit ? (
                                                    (() => {
                                                        const v = popupInfo.visit;
                                                        return (
                                                            <Box sx={{ mb: 1, pb: 1, borderBottom: '1px solid #eee' }}>
                                                                <Typography variant="body2"><strong>📅</strong> {formatDate(v.date)}</Typography>
                                                                <Typography variant="body2"><strong>📍</strong> {v.locationName || 'N/A'}</Typography>
                                                                <Typography variant="body2"><strong>📌 Booth:</strong> {v.booth_id?.name || 'N/A'}</Typography>
                                                                <Typography variant="body2"><strong>🔄 Status:</strong> <Chip label={v.work_status?.toUpperCase() || 'N/A'} size="small" sx={{ ml: 1, backgroundColor: workStatusColor[v.work_status] || theme.palette.grey[400], color: 'white' }} /></Typography>
                                                                {v.visitAgenda && (<Typography variant="body2"><strong>🗒️ Agenda:</strong> {v.visitAgenda}</Typography>)}
                                                                {v.remark && (<Typography variant="body2"><strong>📝 Remark:</strong> {v.remark}</Typography>)}
                                                                <Typography variant="caption"><strong>🌐</strong> {v.latitude?.toFixed(4)}, {v.longitude?.toFixed(4)}</Typography>
                                                            </Box>
                                                        );
                                                    })()
                                                ) : (
                                                    <Typography variant="body2">No visit found.</Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Popup>
                                )}
                            </Map>


                            <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
                                <select
                                    value={selectedTheme}
                                    onChange={(e) => handleThemeChange(e.target.value)}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: `1px solid ${theme.palette.divider}`,
                                        backgroundColor: theme.palette.background.paper,
                                        color: theme.palette.text.primary
                                    }}
                                >
                                    {Object.keys(MAPBOX_THEMES).map((theme) => (
                                        <option key={theme} value={theme}>
                                            {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </Box>

                            <Box sx={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1 }}>
                                <Button
                                    variant="contained"
                                    onClick={() => fetchMapVisits(appliedFilters)}
                                    size="small"
                                >
                                    Refresh Map Data
                                </Button>
                            </Box>
                        </MapContainerStyled>
                    </MainCard>
                </Grid>

                <Grid item xs={12}>
                    <MainCard content={false}>
                        <Stack spacing={2} sx={{ padding: 3 }}>
                            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                                <TextField
                                    size="small"
                                    variant="outlined"
                                    placeholder={`Search ${visits.length} records...`}
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    InputProps={{
                                        // optionally you can add a clear button or icon here
                                    }}
                                    sx={{ minWidth: 300 }}
                                />
                                <Stack direction="row" spacing={1}>
                                    <CSVLink
                                        data={csvData}
                                        filename="visits_all.csv"
                                        style={{ display: 'none' }}
                                        ref={csvLinkRef}
                                    />
                                    <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                                        {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                                    </Button>
                                    <Button variant="contained" startIcon={<Add />} onClick={() => { setEditData(null); setOpenModal(true); }}>
                                        Add Visit
                                    </Button>
                                </Stack>
                            </Stack>

                            {/* Access Scope Information */}
                            <Alert
                                severity="info"
                                sx={{ mb: 2 }}
                            >
                                <Typography variant="body2">
                                    <strong>Data Access:</strong> {accessScope.description}
                                </Typography>
                            </Alert>

                            {/* Filters Section */}
                            <Grid container spacing={2}>
                                {/* First Row */}
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Candidate</InputLabel>
                                        <Select
                                            value={filterValues.candidate}
                                            onChange={(e) => setFilterValues(prev => ({ ...prev, candidate: e.target.value }))}
                                            label="Candidate"
                                        >
                                            <MenuItem value="">All Candidates</MenuItem>
                                            {candidates.map((candidate) => (
                                                <MenuItem key={candidate._id} value={candidate._id}>
                                                    {candidate.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={filterValues.status}
                                            onChange={(e) => setFilterValues(prev => ({ ...prev, status: e.target.value }))}
                                            label="Status"
                                        >
                                            <MenuItem value="">All Status</MenuItem>
                                            <MenuItem value="announced">Announced</MenuItem>
                                            <MenuItem value="approved">Approved</MenuItem>
                                            <MenuItem value="in progress">In Progress</MenuItem>
                                            <MenuItem value="complete">Complete</MenuItem>
                                            <MenuItem value="other">Other</MenuItem>
                                            <MenuItem value="speech subject">Speech Subject</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Start Date"
                                        type="date"
                                        value={filterValues.startDate}
                                        onChange={(e) => setFilterValues(prev => ({ ...prev, startDate: e.target.value }))}
                                        InputLabelProps={{ shrink: true }}
                                        variant="outlined"
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="End Date"
                                        type="date"
                                        value={filterValues.endDate}
                                        onChange={(e) => setFilterValues(prev => ({ ...prev, endDate: e.target.value }))}
                                        InputLabelProps={{ shrink: true }}
                                        variant="outlined"
                                    />
                                </Grid>

                                {/* Second Row */}
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>State</InputLabel>
                                        <Select
                                            value={filterValues.state}
                                            onChange={(e) => handleStateChange(e.target.value)}
                                            label="State"
                                        >
                                            <MenuItem value="">All States</MenuItem>
                                            {states.map((state) => (
                                                <MenuItem key={state._id} value={state._id}>
                                                    {state.name}
                                                </MenuItem>
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
                                            <MenuItem value="">
                                                {!filterValues.state ? "Select State First" : "All Divisions"}
                                            </MenuItem>
                                            {filteredDivisions.map((division) => (
                                                <MenuItem key={division._id} value={division._id}>
                                                    {division.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Assembly</InputLabel>
                                        <Select
                                            value={filterValues.assembly}
                                            onChange={(e) => handleAssemblyChange(e.target.value)}
                                            label="Assembly"
                                            disabled={!filterValues.division}
                                        >
                                            <MenuItem value="">
                                                {!filterValues.division ? "Select Division First" : "All Assemblies"}
                                            </MenuItem>
                                            {filteredAssemblies.map((assembly) => (
                                                <MenuItem key={assembly._id} value={assembly._id}>
                                                    {assembly.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Booth</InputLabel>
                                        <Select
                                            value={filterValues.booth}
                                            onChange={(e) => setFilterValues(prev => ({ ...prev, booth: e.target.value }))}
                                            label="Booth"
                                            disabled={!filterValues.assembly}
                                        >
                                            <MenuItem value="">
                                                {!filterValues.assembly ? "Select Assembly First" : "All Booths"}
                                            </MenuItem>
                                            {filteredBooths.map((booth) => (
                                                <MenuItem key={booth._id} value={booth._id}>
                                                    {booth.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {/* Filter Buttons */}
                                <Grid item xs={12}>
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Button
                                            variant="contained"
                                            onClick={handleApplyFilters}
                                            size="small"
                                            color="primary"
                                        >
                                            Apply Filters
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={handleClearFilters}
                                            size="small"
                                        >
                                            Clear Filters
                                        </Button>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Stack>                        <ScrollX>
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
                                            <Fragment key={row.id}>
                                                <TableRow>
                                                    {row.getVisibleCells().map((cell) => (
                                                        <TableCell key={cell.id}>
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            </Fragment>
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
                </Grid>
            </Grid>

            <VisitModal
                open={openModal}
                modalToggler={setOpenModal}
                visit={editData}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                candidates={candidates}
                electionYears={electionYears}
                refresh={() => {
                    fetchVisits(pagination.pageIndex, pagination.pageSize);
                    fetchMapVisits(appliedFilters);
                }}
            />
            <AlertVisitDelete
                open={deleteAlert.open}
                handleClose={() => setDeleteAlert({ open: false, id: null })}
                id={deleteAlert.id}
                refresh={() => {
                    fetchVisits(pagination.pageIndex, pagination.pageSize);
                    fetchMapVisits(appliedFilters);
                }}
            />
        </>
    );
};

export default VisitListPage;
