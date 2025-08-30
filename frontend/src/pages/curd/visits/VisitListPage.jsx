import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Stack, Typography, Box, Tooltip, Divider, Chip, Avatar, Grid,
    IconButton, Select, MenuItem, FormControl, InputLabel, TextField
} from '@mui/material';
import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import {
    getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
    useReactTable, flexRender
} from '@tanstack/react-table';
import { CSVLink } from 'react-csv';
import { Add, Edit, Trash, Eye } from 'iconsax-react';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import ScrollX from 'components/ScrollX';
import MainCard from 'components/MainCard';
import EmptyReactTable from 'pages/tables/react-table/empty';
import VisitModal from './VisitModal';
import VisitView from './VisitView';
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
    // light: 'mapbox://styles/mapbox/light-v10',
    // dark: 'mapbox://styles/mapbox/dark-v10',
    // streets: 'mapbox://styles/mapbox/streets-v11',
    outdoors: 'mapbox://styles/mapbox/outdoors-v11',
    // satellite: 'mapbox://styles/mapbox/satellite-v9',
    // satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v11'
};

const VisitListPage = () => {
    const theme = useTheme();
    const [visits, setVisits] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState({ open: false, id: null });
    const [globalFilter, setGlobalFilter] = useState('');
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [candidates, setCandidates] = useState([]);

    // Map state
    const [mapVisits, setMapVisits] = useState([]);
    const [popupInfo, setPopupInfo] = useState(null);
    const [selectedTheme, setSelectedTheme] = useState('streets');
    const [routeData, setRouteData] = useState(null);
    const [selectedCandidate, setSelectedCandidate] = useState('');
    const mapRef = useRef(null);

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
                queryParams.push(`startDate=${appliedFilters.startDate}`);
            }
            if (appliedFilters.endDate) {
                queryParams.push(`endDate=${appliedFilters.endDate}`);
            }

            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/visits?${queryParams.join('&')}`);
            const json = await res.json();
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

    const fetchMapVisits = async (candidateId = null) => {
        try {
            const url = candidateId
                ? `${import.meta.env.VITE_APP_API_URL}/visits?all=true&candidate=${candidateId}`
                : `${import.meta.env.VITE_APP_API_URL}/visits?all=true`;

            const res = await fetch(url);
            const json = await res.json();
            if (json.success) {
                const visitsWithCoords = json.data.filter(v => v.latitude && v.longitude);
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
                    mapRef.current.flyTo({
                        center: [visitsWithCoords[0].longitude, visitsWithCoords[0].latitude],
                        zoom: 12
                    });
                }
            }
        } catch (error) {
            console.error('Error loading visit data:', error);
        }
    };

    // Add this function right before the return statement in your component
    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        try {
            const url = selectedCandidate
                ? `${import.meta.env.VITE_APP_API_URL}/visits?all=true&candidate=${selectedCandidate}`
                : `${import.meta.env.VITE_APP_API_URL}/visits?all=true`;

            const res = await fetch(url);
            const json = await res.json();

            if (json.success) {
                const csvData = json.data.map(item => ({
                    'Candidate': item.candidate_id?.name || '',
                    'Post': item.post || '',
                    'Date': formatDate(item.date),
                    'Status': item.work_status || '',
                    'State': item.state_id?.name || '',
                    'Division': item.division_id?.name || '',
                    'Assembly': item.assembly_id?.name || '',
                    'Parliament': item.parliament_id?.name || '',
                    'Block': item.block_id?.name || '',
                    'Booth': item.booth_id?.name || '',
                    'Location': item.locationName || '',
                    'Coordinates': item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : '',
                    'Declaration': item.declaration || '',
                    'Remark': item.remark || '',
                    'Created At': item.created_at,
                    'Updated At': item.updated_at
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
                candidatesRes
            ] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/booths`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/candidates`)
            ]);

            const [
                statesData, divisionsData, parliamentsData,
                assembliesData, blocksData, boothsData,
                candidatesData
            ] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                boothsRes.json(),
                candidatesRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (blocksData.success) setBlocks(blocksData.data);
            if (boothsData.success) setBooths(boothsData.data);
            if (candidatesData.success) setCandidates(candidatesData.data);
        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    useEffect(() => {
        fetchVisits(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchMapVisits(selectedCandidate || null);
        fetchReferenceData();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, selectedCandidate, appliedFilters]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    const workStatusColor = {
        'announced': 'default',
        'approved': 'info',
        'in progress': 'warning',
        'complete': 'success'
    };

    const handleCandidateChange = (event) => {
        setSelectedCandidate(event.target.value);
    };

    const handleApplyFilters = () => {
        setAppliedFilters(filterValues);
        setPagination({ pageIndex: 0, pageSize: 10 });
        fetchVisits(0, 10, globalFilter);
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
        setPopupInfo({
            longitude: visit.longitude,
            latitude: visit.latitude,
            visit: visit
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
            header: 'Actions',
            meta: { className: 'cell-center' },
            cell: ({ row }) => {
                const isExpanded = row.getIsExpanded();
                const expandIcon = isExpanded
                    ? <Add style={{ transform: 'rotate(45deg)', color: theme.palette.error.main }} />
                    : <Eye />;
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <Tooltip title="View">
                            <IconButton color="secondary" onClick={row.getToggleExpandedHandler()}>
                                {expandIcon}
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
        getPaginationRowModel: getPaginationRowModel(),
        getRowCanExpand: () => true
    });

    if (loading) return <EmptyReactTable />;

    return (
        <>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <MainCard
                        title="Visit Locations Map"
                        secondary={
                            <FormControl sx={{ minWidth: 200 }} size="small">
                                <InputLabel id="candidate-select-label">Filter by Candidate</InputLabel>
                                <Select
                                    labelId="candidate-select-label"
                                    value={selectedCandidate}
                                    onChange={handleCandidateChange}
                                    label="Filter by Candidate"
                                >
                                    <MenuItem value="">
                                        <em>All Candidates</em>
                                    </MenuItem>
                                    {candidates.map((candidate) => (
                                        <MenuItem key={candidate._id} value={candidate._id}>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Avatar src={candidate.photo} sx={{ width: 24, height: 24 }} />
                                                <Typography>{candidate.name}</Typography>
                                            </Stack>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        }
                    >
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
                                {mapVisits.map((visit, idx) => (
                                    <Marker
                                        key={idx}
                                        longitude={visit.longitude}
                                        latitude={visit.latitude}
                                        anchor="bottom"
                                        onClick={() => {
                                            setPopupInfo({
                                                longitude: visit.longitude,
                                                latitude: visit.latitude,
                                                visit: visit
                                            });
                                        }}
                                    >
                                        <Avatar
                                            src={visit.candidate_id?.photo}
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                border: `2px solid ${theme.palette.primary.main}`,
                                                cursor: 'pointer'
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
                                    >
                                        <Box sx={{ p: 1 }}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Avatar src={popupInfo.visit.candidate_id?.photo} sx={{ width: 48, height: 48 }} />
                                                <Box>
                                                    <Typography fontWeight="bold">{popupInfo.visit.candidate_id?.name}</Typography>
                                                    <Typography variant="body2" color="text.secondary">{popupInfo.visit.post || 'N/A'}</Typography>
                                                </Box>
                                            </Stack>

                                            <Divider sx={{ my: 1 }} />

                                            <Typography variant="body2"><strong>📅 Visit Date:</strong> {formatDate(popupInfo.visit.date)}</Typography>
                                            <Typography variant="body2"><strong>📍 Location:</strong> {popupInfo.visit.locationName || 'N/A'}</Typography>
                                            <Typography variant="body2"><strong>📌 Booth:</strong> {popupInfo.visit.booth_id?.name || 'N/A'}</Typography>
                                            <Typography variant="body2"><strong>🔄 Status:</strong>
                                                <Chip
                                                    label={popupInfo.visit.work_status?.toUpperCase() || 'N/A'}
                                                    size="small"
                                                    sx={{
                                                        ml: 1,
                                                        backgroundColor: workStatusColor[popupInfo.visit.work_status] || theme.palette.grey[400],
                                                        color: 'white'
                                                    }}
                                                />
                                            </Typography>
                                            {popupInfo.visit.declaration && (
                                                <Typography variant="body2"><strong>🗒️ Declaration:</strong> {popupInfo.visit.declaration}</Typography>
                                            )}
                                            {popupInfo.visit.remark && (
                                                <Typography variant="body2"><strong>📝 Remark:</strong> {popupInfo.visit.remark}</Typography>
                                            )}
                                            <Typography variant="caption"><strong>🌐 Coordinates:</strong> {popupInfo.visit.latitude?.toFixed(4)}, {popupInfo.visit.longitude?.toFixed(4)}</Typography>
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
                                    onClick={() => fetchMapVisits(selectedCandidate || null)}
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
                                <DebouncedInput
                                    value={globalFilter}
                                    onFilterChange={setGlobalFilter}
                                    placeholder={`Search ${visits.length} records...`}
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
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Start Date</InputLabel>
                                        <TextField
                                            type="date"
                                            value={filterValues.startDate}
                                            onChange={(e) => setFilterValues(prev => ({ ...prev, startDate: e.target.value }))}
                                            size="small"
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>End Date</InputLabel>
                                        <TextField
                                            type="date"
                                            value={filterValues.endDate}
                                            onChange={(e) => setFilterValues(prev => ({ ...prev, endDate: e.target.value }))}
                                            size="small"
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </FormControl>
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
                                    <TableHead>
                                        {table.getHeaderGroups().map((headerGroup) => (
                                            <TableRow key={headerGroup.id}>
                                                {headerGroup.headers.map((header) => (
                                                    <TableCell
                                                        key={header.id}
                                                        onClick={header.column.getToggleSortingHandler()}
                                                        sx={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
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
                                                {row.getIsExpanded() && (
                                                    <TableRow>
                                                        <TableCell colSpan={row.getVisibleCells().length}>
                                                            <VisitView data={row.original} />
                                                        </TableCell>
                                                    </TableRow>
                                                )}
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
                refresh={() => {
                    fetchVisits(pagination.pageIndex, pagination.pageSize);
                    fetchMapVisits(selectedCandidate || null);
                }}
            />
            <AlertVisitDelete
                open={deleteAlert.open}
                handleClose={() => setDeleteAlert({ open: false, id: null })}
                id={deleteAlert.id}
                refresh={() => {
                    fetchVisits(pagination.pageIndex, pagination.pageSize);
                    fetchMapVisits(selectedCandidate || null);
                }}
            />
        </>
    );
};

export default VisitListPage;
