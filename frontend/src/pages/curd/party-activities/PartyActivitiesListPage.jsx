// PartyActivitiesListPage.jsx
import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, TextField,
    FormControl, InputLabel, Select, MenuItem, Grid, Drawer, Paper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash } from 'iconsax-react';
import {
    getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
    useReactTable, flexRender
} from '@tanstack/react-table';
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';
import EmptyReactTable from 'pages/tables/react-table/empty';
import { CSVLink } from 'react-csv';
import { Alert } from '@mui/material';
import { usePermissions } from 'contexts/PermissionContext';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import CloseIcon from '@mui/icons-material/Close';

import PartyActivitiesModal from './PartyActivitiesModal';
import AlertPartyActivitiesDelete from './AlertPartyActivitiesDelete';
import PartyActivitiesView from './PartyActivitiesView';

export default function PartyActivitiesListPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel } = usePermissions();

    const [selectedPartyActivity, setSelectedPartyActivity] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [partyActivityDeleteId, setPartyActivityDeleteId] = useState('');
    const [partyActivities, setPartyActivities] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [parties, setParties] = useState([]);
    const [users, setUsers] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState({});
    const [appliedFilters, setAppliedFilters] = useState({});

    // Map state
    const [blockNumberInput, setBlockNumberInput] = useState('ALL');
    const [yearFilter, setYearFilter] = useState('');
    const [boothGeoJSON, setBoothGeoJSON] = useState(null);
    const [mapTheme, setMapTheme] = useState('streets');
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    // Handle filter changes
    const handleFilterChange = (field, value) => {
        const newFilters = { ...filters, [field]: value };

        // Clear dependent fields when parent field changes
        switch (field) {
            case 'state_id':
                newFilters.division_id = '';
                newFilters.parliament_id = '';
                newFilters.assembly_id = '';
                newFilters.block_id = '';
                newFilters.booth_id = '';
                break;
            case 'division_id':
                newFilters.parliament_id = '';
                newFilters.assembly_id = '';
                newFilters.block_id = '';
                newFilters.booth_id = '';
                break;
            case 'parliament_id':
                newFilters.assembly_id = '';
                newFilters.block_id = '';
                newFilters.booth_id = '';
                break;
            case 'assembly_id':
                newFilters.block_id = '';
                newFilters.booth_id = '';
                break;
            case 'block_id':
                newFilters.booth_id = '';
                break;
            default:
                break;
        }

        setFilters(newFilters);
    };

    const fetchReferenceData = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const fetchOpts = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes, partiesRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states?limit=10000`, fetchOpts),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions?limit=10000`, fetchOpts),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments?limit=10000`, fetchOpts),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies?limit=10000`, fetchOpts),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks?limit=10000`, fetchOpts),
                fetch(`${import.meta.env.VITE_APP_API_URL}/booths?limit=10000`, fetchOpts),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parties?limit=10000`, fetchOpts)
            ]);


            const [usersRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/users?limit=10000`, fetchOpts)
            ]);

            const usersData = await usersRes.json();
            if (usersData.success) setUsers(usersData.data);

            const [statesData, divisionsData, parliamentsData, assembliesData, blocksData, boothsData, partiesData] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                boothsRes.json(),
                partiesRes.json()
            ]);


            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (blocksData.success) setBlocks(blocksData.data);
            if (boothsData.success) setBooths(boothsData.data);
            if (partiesData.success) setParties(partiesData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    // Load booth polygons by block name or id (tries multiple backend endpoints)
    const loadBoothPolygons = async (blockInput) => {
        if (!blockInput) {
            setMapError('Please select a Block');
            return;
        }
        setMapError('');
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // If user selected ALL blocks, fetch all polygons (large result)
            if (blockInput === 'ALL') {
                const apiUrl = import.meta.env.VITE_APP_API_URL || 'https://myhostmanager.co.in/backend/api';
                const url = `${apiUrl}/booth-polygons?limit=50000&page=1`;
                const resp = await fetch(url, { headers });

                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const j = await resp.json();

                let features = j.features || j.data || [];
                if (features.length === 1 && features[0] && features[0].features && Array.isArray(features[0].features)) {
                    features = features[0].features;
                }
                if (!features || !Array.isArray(features) || features.length === 0) {
                    setMapError('No booth polygons found');
                    setBoothGeoJSON(null);
                    return;
                }
                const fc = { type: 'FeatureCollection', features };
                setBoothGeoJSON(fc);
                setTimeout(() => {
                    try {
                        const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                        if (!map || !fc.features?.length) return;
                        const coords = [];
                        fc.features.forEach(f => {
                            const geom = f.geometry;
                            if (!geom) return;
                            const collect = (arr) => arr.forEach(pt => Array.isArray(pt[0]) ? collect(pt) : coords.push(pt));
                            if (geom.type === 'Polygon') collect(geom.coordinates);
                            if (geom.type === 'MultiPolygon') geom.coordinates.forEach(poly => collect(poly));
                        });
                        if (coords.length) {
                            const lons = coords.map(c => c[0]);
                            const lats = coords.map(c => c[1]);
                            const bounds = [
                                [Math.min(...lons), Math.min(...lats)],
                                [Math.max(...lons), Math.max(...lats)]
                            ];
                            map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
                        }
                    } catch { }
                }, 0);
                return;
            }

            // Try multiple endpoints in order until we get features
            const candidates = [
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons/block/${encodeURIComponent(blockInput)}`,
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons/block-number/${encodeURIComponent(blockInput)}`,
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons?block=${encodeURIComponent(blockInput)}`
            ];

            let json = null;
            for (const url of candidates) {
                try {
                    const resp = await fetch(url, { headers });
                    if (!resp.ok) {
                        console.warn('Non-ok response from', url, resp.status);
                        continue;
                    }
                    const j = await resp.json();
                    const features = j.features || (Array.isArray(j) ? j : (j.data || null));
                    if (features && Array.isArray(features) && features.length > 0) {
                        json = { type: 'FeatureCollection', features };
                        break;
                    }
                } catch (innerErr) {
                    console.warn('Error fetching booth polygons from candidate url:', innerErr);
                }
            }

            if (!json) {
                setMapError(`No booth polygons found for block '${blockInput}'`);
                setBoothGeoJSON(null);
                return;
            }

            const fc = { type: 'FeatureCollection', features: json.features };
            setBoothGeoJSON(fc);
            setTimeout(() => {
                try {
                    const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                    if (!map || !fc.features?.length) return;
                    const coords = [];
                    fc.features.forEach(f => {
                        const geom = f.geometry;
                        if (!geom) return;
                        const collect = (arr) => arr.forEach(pt => Array.isArray(pt[0]) ? collect(pt) : coords.push(pt));
                        if (geom.type === 'Polygon') collect(geom.coordinates);
                        if (geom.type === 'MultiPolygon') geom.coordinates.forEach(poly => collect(poly));
                    });
                    if (coords.length) {
                        const lons = coords.map(c => c[0]);
                        const lats = coords.map(c => c[1]);
                        const bounds = [
                            [Math.min(...lons), Math.min(...lats)],
                            [Math.max(...lons), Math.max(...lats)]
                        ];
                        map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
                    }
                } catch { }
            }, 0);
        } catch (e) {
            console.error('Failed to load booth polygons:', e);
            setMapError(`Failed to load booth polygons: ${e.message}`);
            setBoothGeoJSON(null);
        }
    };

    // Auto-load ALL blocks map on component mount
    useEffect(() => {
        if (mapboxToken && blocks && blocks.length > 0) {
            loadBoothPolygons('ALL');
        }
    }, [blocks, mapboxToken]);

    // Fetch booth details and party activities when a polygon is clicked
    const fetchBoothDetailsByPolygon = async (boothNo) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?all=true&limit=10000`, { headers });
            const json = await res.json();
            let booth = null;

            if (json.success && Array.isArray(json.data)) {
                const boothNoStr = String(boothNo).trim();
                booth = json.data.find(b => String(b.booth_number).trim() === boothNoStr);
                if (!booth) {
                    booth = json.data.find(b => String(b.booth_number).trim().toLowerCase() === boothNoStr.toLowerCase());
                }
                if (!booth) {
                    booth = json.data.find(b => String(b.booth_number).trim().includes(boothNoStr) || boothNoStr.includes(String(b.booth_number).trim()));
                }
                if (!booth) {
                    console.warn(`No booth found for BoothNo: "${boothNoStr}"`);
                }
            } else {
                console.error('Failed to fetch booths:', json);
            }

            // Get party activities for this booth
            let partyActivities = [];
            if (booth && booth._id) {
                try {
                    const activitiesRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/party-activities?booth=${encodeURIComponent(booth._id)}&all=true`, { headers });
                    const activitiesJson = await activitiesRes.json();
                    if (activitiesJson.success && Array.isArray(activitiesJson.data)) {
                        partyActivities = activitiesJson.data;
                    }
                } catch (e) {
                    console.warn('Failed to fetch party activities for booth:', e);
                }
            }

            setDrawerData({
                loading: false,
                boothNo,
                details: {
                    booth,
                    partyActivities
                }
            });
        } catch (e) {
            console.error('Failed to load booth details by polygon:', e);
            setDrawerData({ loading: false, boothNo, details: { booth: null, partyActivities: [] }, error: e.message });
        }
    };

    const fetchPartyActivities = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            // When searching, fetch all results on first page
            let currentPage = pageIndex + 1;
            let currentLimit = pageSize;
            if (globalFilter) {
                currentPage = 1;
                currentLimit = 10000;
            }
            // Build query parameters
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: currentLimit,
                ...(globalFilter && { search: globalFilter }),
                // Filters
                ...(appliedFilters.state_id && { state_id: appliedFilters.state_id }),
                ...(appliedFilters.division_id && { division_id: appliedFilters.division_id }),
                ...(appliedFilters.parliament_id && { parliament_id: appliedFilters.parliament_id }),
                ...(appliedFilters.assembly_id && { assembly_id: appliedFilters.assembly_id }),
                ...(appliedFilters.block_id && { block_id: appliedFilters.block_id }),
                ...(appliedFilters.booth_id && { booth_id: appliedFilters.booth_id }),
                ...(appliedFilters.activity_type && { activity_type: appliedFilters.activity_type }),
                ...(appliedFilters.status && { status: appliedFilters.status })
            });

            // hierarchy-based filtering
            if (userHierarchy) {
                const highest = getUserHighestLevel();
                if (highest) {
                    switch (highest) {
                        case 'state':
                            queryParams.append('state_id', userHierarchy.state);
                            break;
                        case 'division':
                            queryParams.append('division_id', userHierarchy.division);
                            break;
                        case 'parliament':
                            queryParams.append('parliament_id', userHierarchy.parliament);
                            break;
                        case 'assembly':
                            queryParams.append('assembly_id', userHierarchy.assembly);
                            break;
                        case 'block':
                            queryParams.append('block_id', userHierarchy.block);
                            break;
                        case 'booth':
                            queryParams.append('booth_id', userHierarchy.booth);
                            break;
                        default:
                            break;
                    }
                }
            }

            const token = localStorage.getItem('serviceToken');
            const fetchOpts = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/party-activities?${queryParams}`, fetchOpts);
            const json = await res.json();
            if (json.success) {
                setPartyActivities(json.data);
                if (globalFilter) {
                    setPageCount(1);
                    if (pageIndex !== 0) {
                        setPagination(prev => ({ ...prev, pageIndex: 0 }));
                    }
                } else {
                    setPageCount(json.pages);
                }
            }
        } catch (error) {
            console.error('Failed to fetch party activities:', error);
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchPartyActivities(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, appliedFilters]);

    const handleDeleteOpen = (id) => {
        setPartyActivityDeleteId(id);
        setOpenDelete(true);
    };

    const handleDeleteClose = () => setOpenDelete(false);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'scheduled':
                return 'info';
            case 'ongoing':
                return 'warning';
            case 'completed':
                return 'success';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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
            header: 'Title',
            accessorKey: 'title',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'Activity Type',
            accessorKey: 'activity_type',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.toUpperCase() || 'N/A'}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'State',
            accessorKey: 'state_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="primary"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Division',
            accessorKey: 'division_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="warning"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Parliament',
            accessorKey: 'parliament_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="secondary"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Assembly',
            accessorKey: 'assembly_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="info"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Block',
            accessorKey: 'block_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="primary"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Booth',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() ? `${getValue().name} (${getValue().booth_number})` : 'N/A'}
                    color="success"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Panchayat',
            accessorKey: 'panchayat_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.panchayat_name || 'N/A'}
                    color="info"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Village',
            accessorKey: 'village_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.village_name || 'N/A'}
                    color="success"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Falliya',
            accessorKey: 'falliya_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.falliya_name || 'N/A'}
                    color="warning"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Year',
            accessorKey: 'year',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 'N/A'}
                    color="primary"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Description',
            accessorKey: 'description',
            cell: ({ getValue }) => (
                <Typography sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Activity Date',
            accessorKey: 'activity_date',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'End Date',
            accessorKey: 'end_date',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'Location',
            accessorKey: 'location',
            cell: ({ getValue }) => <Typography>{getValue() || 'N/A'}</Typography>
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.toUpperCase() || 'N/A'}
                    color={getStatusColor(getValue())}
                    size="small"
                />
            )
        },
        {
            header: 'Attendance',
            accessorKey: 'attendance_count',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() ? getValue().toLocaleString() : 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Media Coverage',
            accessorKey: 'media_coverage',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() ? 'Yes' : 'No'}
                    color={getValue() ? 'success' : 'default'}
                    size="small"
                />
            )
        },
        {
            header: 'Media Links',
            accessorKey: 'media_links',
            cell: ({ getValue }) => (
                Array.isArray(getValue()) && getValue().length > 0
                    ? getValue().map((link, idx) => (
                        <img key={idx} src={link} alt={`media-link-${idx}`} style={{ maxWidth: '100px', display: 'block', marginBottom: '4px' }} />
                    ))
                    : 'N/A'
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
            header: 'Created By',
            accessorKey: 'created_by',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.username || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Updated By',
            accessorKey: 'updated_by',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.username || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Created At',
            accessorKey: 'created_at',
            cell: ({ getValue }) => {
                const value = getValue();
                if (!value) return <Typography>N/A</Typography>;
                const date = new Date(value);
                const formatted = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                return <Typography>{formatted}</Typography>;
            }
        },
        {
            header: 'Updated At',
            accessorKey: 'updated_at',
            cell: ({ getValue }) => {
                const value = getValue();
                if (!value) return <Typography>N/A</Typography>;
                const date = new Date(value);
                const formatted = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                return <Typography>{formatted}</Typography>;
            }
        },

        {
            header: 'Actions',
            meta: { className: 'cell-center' },
            cell: ({ row }) => {
                const isExpanded = row.getIsExpanded();
                const expandIcon = isExpanded ? <Add style={{ transform: 'rotate(45deg)', color: theme.palette.error.main }} /> : <Eye />;
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>

                        <IconButton
                            color="info"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/party-activities/${row.original._id}`);
                            }}
                        >
                            <Eye />
                        </IconButton>
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedPartyActivity(row.original); setOpenModal(true); }}>
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
        data: partyActivities,
        columns,
        state: { pagination, globalFilter },
        pageCount,
        manualPagination: true,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getRowCanExpand: () => true
    });

    // Helper to fetch all party activities for CSV
    const fetchAllPartyActivitiesForCsv = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/party-activities?all=true`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all party activities for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllPartyActivitiesForCsv();
        setCsvData(allData.map(item => ({
            Title: item.title,
            'Activity Type': item.activity_type,
            State: item.state_id?.name || '',
            Division: item.division_id?.name || '',
            Parliament: item.parliament_id?.name || '',
            Assembly: item.assembly_id?.name || '',
            Block: item.block_id?.name || '',
            Booth: item.booth_id ? `${item.booth_id.name} (${item.booth_id.booth_number})` : '',
            Description: item.description,
            'Activity Date': item.activity_date,
            'End Date': item.end_date,
            Location: item.location,
            Status: item.status,
            Attendance: item.attendance_count,
            'Media Coverage': item.media_coverage ? 'Yes' : 'No',
            'Media Links': Array.isArray(item.media_links) ? item.media_links.join(', ') : '',
            'Created By': item.created_by?.username || '',
            'Updated By': item.updated_by?.username || '',
            'Created At': item.created_at,
            'Updated At': item.updated_at
        })));
        setCsvLoading(false);
        setTimeout(() => {
            if (csvLinkRef.current) {
                csvLinkRef.current.link.click();
            }
        }, 100);
    };

    if (loading) return <EmptyReactTable />;

    return (
        <>
            <MainCard content={false}>
                {/* Mapbox Booth Polygons */}
                <Grid container spacing={2} sx={{ p: 2 }}>
                    <Grid item xs={12}>
                        <Typography variant="h5" sx={{ mb: 1 }}>Party Activities Map</Typography>
                        {!mapboxToken && (
                            <Alert severity="warning" sx={{ mb: 1 }}>Mapbox token missing. Set VITE_APP_MAPBOX_ACCESS_TOKEN.</Alert>
                        )}
                        {mapError && (
                            <Alert severity="error" sx={{ mb: 1 }}>{mapError}</Alert>
                        )}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }}>
                            <TextField
                                select
                                size="small"
                                label="Block"
                                value={blockNumberInput}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setBlockNumberInput(value);
                                }}
                                sx={{ width: { xs: '100%', sm: 260 } }}
                            >
                                <MenuItem value="">Select Block</MenuItem>
                                <MenuItem value="ALL">All Blocks</MenuItem>
                                {blocks?.map((b) => (
                                    <MenuItem key={b._id} value={b.name}>{b.name}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                size="small"
                                label="Year"
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                                sx={{ width: { xs: '100%', sm: 150 } }}
                            >
                                <MenuItem value="">All Years</MenuItem>
                                {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
                                    <MenuItem key={year} value={year}>{year}</MenuItem>
                                ))}
                            </TextField>
                            <Button variant="contained" size="small" onClick={() => loadBoothPolygons(blockNumberInput)}>
                                Load Polygons
                            </Button>
                            <TextField
                                select
                                size="small"
                                label="Map Theme"
                                value={mapTheme}
                                onChange={(e) => setMapTheme(e.target.value)}
                                sx={{ width: { xs: '100%', sm: 180 } }}
                            >
                                <MenuItem value="streets">Streets</MenuItem>
                                <MenuItem value="satellite">Satellite</MenuItem>
                                <MenuItem value="light">Light</MenuItem>
                                <MenuItem value="dark">Dark</MenuItem>
                            </TextField>
                        </Stack>

                        <MapContainerStyled>
                            <Map
                                ref={mapRef}
                                initialViewState={{ latitude: 23.4707, longitude: 77.9455, zoom: 6 }}
                                mapStyle={
                                    mapTheme === 'satellite' ? 'mapbox://styles/mapbox/satellite-v9' :
                                        mapTheme === 'light' ? 'mapbox://styles/mapbox/light-v10' :
                                            mapTheme === 'dark' ? 'mapbox://styles/mapbox/dark-v10' :
                                                'mapbox://styles/mapbox/streets-v11'
                                }
                                mapboxAccessToken={mapboxToken}
                                interactiveLayerIds={boothGeoJSON ? ['booth-fill'] : []}
                                onClick={(e) => {
                                    if (!boothGeoJSON) return;
                                    try {
                                        const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                                        let features = e.features || [];
                                        if ((!features || features.length === 0) && map && map.queryRenderedFeatures) {
                                            const point = e.point || { x: e.x, y: e.y };
                                            if (point) {
                                                features = map.queryRenderedFeatures([point.x, point.y], { layers: ['booth-fill'] }) || [];
                                            }
                                        }

                                        const boothFeature = features.find(f => f.layer && f.layer.id === 'booth-fill') || features[0];
                                        if (boothFeature) {
                                            const props = boothFeature.properties || {};
                                            const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth || (props.properties && (props.properties.BoothNo || props.properties.booth_number));
                                            setDrawerOpen(true);
                                            setDrawerData({ loading: true, boothNo, details: null });
                                            fetchBoothDetailsByPolygon(boothNo);
                                        }
                                    } catch (err) {
                                        console.error('Error handling map click:', err);
                                    }
                                }}
                            >
                                <MapControl />
                                {boothGeoJSON && (
                                    <Source id="booth-source" type="geojson" data={boothGeoJSON}>
                                        <Layer id="booth-fill" type="fill" paint={{ 'fill-color': '#1e88e5', 'fill-opacity': 0.25 }} />
                                        <Layer id="booth-outline" type="line" paint={{ 'line-color': '#1565c0', 'line-width': 1 }} />
                                        <Layer
                                            id="booth-label"
                                            type="symbol"
                                            layout={{
                                                'text-field': ['format', ['coalesce', ['get', 'BoothNo'], ['get', 'BoothNumber'], ['get', 'boothNo'], ['get', 'booth_number'], ['get', 'Booth_Name'], ['get', 'BoothName'], ['get', 'name'], ['literal', '']], { 'font-scale': 1 }, '\n', { 'font-scale': 0.85 }, ['coalesce', ['get', 'BoothName'], ['get', 'Booth_Name'], ['get', 'name'], ['literal', '']]],
                                                'text-size': 12,
                                                'text-offset': [0, 0.6],
                                                'text-anchor': 'top',
                                                'text-allow-overlap': true,
                                                'text-ignore-placement': true
                                            }}
                                            paint={{
                                                'text-color': '#000000',
                                                'text-halo-color': '#ffffff',
                                                'text-halo-width': 1
                                            }}
                                        />
                                    </Source>
                                )}
                            </Map>
                        </MapContainerStyled>
                    </Grid>
                </Grid>

                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
                    <DebouncedInput

                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={`Search ${partyActivities.length} party activities...`}
                    />

                    <Stack direction="row" spacing={1}>
                        <CSVLink
                            data={csvData}
                            filename="party_activities_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
                        <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                            {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedPartyActivity(null); setOpenModal(true); }}>
                            Add Party Activity
                        </Button>

                    </Stack>
                </Stack>

                {/* Access Scope Information */}
                <Alert severity="info" sx={{ m: 2 }}>
                    <Typography variant="body2">
                        <strong>Data Access:</strong> {(() => {
                            if (!userHierarchy) return 'You have access to all Party Activities data';
                            const highest = getUserHighestLevel();
                            const labelMap = { state: 'State', division: 'Division', parliament: 'Parliament', assembly: 'Assembly', block: 'Block', booth: 'Booth' };
                            const idMap = { state: userHierarchy.state, division: userHierarchy.division, parliament: userHierarchy.parliament, assembly: userHierarchy.assembly, block: userHierarchy.block, booth: userHierarchy.booth };
                            return `You have access to Party Activities data for ${labelMap[highest] || 'Unknown'}: ${idMap[highest] || 'Unknown'}`;
                        })()}
                    </Typography>
                </Alert>

                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ p: 2, flexWrap: "wrap", gap: 2 }}
                >

                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Activity Type</InputLabel>
                        <Select
                            value={filters?.activity_type || ''}
                            onChange={(e) => handleFilterChange('activity_type', e.target.value)}
                            label="Activity Type"
                            size="small"
                        >
                            <MenuItem value="">All Types</MenuItem>
                            <MenuItem value="rally">Rally</MenuItem>
                            <MenuItem value="sabha">Sabha</MenuItem>
                            <MenuItem value="meeting">Meeting</MenuItem>
                            <MenuItem value="campaign">Campaign</MenuItem>
                            <MenuItem value="door_to_door">Door to Door</MenuItem>
                            <MenuItem value="press_conference">Press Conference</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Status Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filters?.status || ''}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            label="Status"
                            size="small"
                        >
                            <MenuItem value="">All Status</MenuItem>
                            <MenuItem value="scheduled">Scheduled</MenuItem>
                            <MenuItem value="ongoing">Ongoing</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                    </FormControl>

                    {/* State Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>State</InputLabel>
                        <Select
                            value={filters?.state_id || ''}
                            onChange={(e) => handleFilterChange('state_id', e.target.value)}
                            label="State"
                            size="small"
                        >
                            <MenuItem value="">All States</MenuItem>
                            {states?.map((state) => (
                                <MenuItem key={state._id} value={state._id}>{state.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Division Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Division</InputLabel>
                        <Select
                            value={filters?.division_id || ''}
                            onChange={(e) => handleFilterChange('division_id', e.target.value)}
                            label="Division"
                            size="small"
                            disabled={!filters?.state_id}
                        >
                            <MenuItem value="">All Divisions</MenuItem>
                            {divisions?.filter(d => {
                                const stateId = d.state_id?._id || d.state_id;
                                return stateId === filters?.state_id;
                            }).map((division) => (
                                <MenuItem key={division._id} value={division._id}>{division.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Parliament Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Parliament</InputLabel>
                        <Select
                            value={filters?.parliament_id || ''}
                            onChange={(e) => handleFilterChange('parliament_id', e.target.value)}
                            label="Parliament"
                            size="small"
                            disabled={!filters?.division_id}
                        >
                            <MenuItem value="">All Parliaments</MenuItem>
                            {parliaments?.filter(p => {
                                const divisionId = p.division_id?._id || p.division_id;
                                return divisionId === filters?.division_id;
                            }).map((parliament) => (
                                <MenuItem key={parliament._id} value={parliament._id}>{parliament.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Assembly Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Assembly</InputLabel>
                        <Select
                            value={filters?.assembly_id || ''}
                            onChange={(e) => handleFilterChange('assembly_id', e.target.value)}
                            label="Assembly"
                            size="small"
                            disabled={!filters?.parliament_id}
                        >
                            <MenuItem value="">All Assemblies</MenuItem>
                            {assemblies?.filter(a => {
                                const parliamentId = a.parliament_id?._id || a.parliament_id;
                                return parliamentId === filters?.parliament_id;
                            }).map((assembly) => (
                                <MenuItem key={assembly._id} value={assembly._id}>{assembly.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Block Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Block</InputLabel>
                        <Select
                            value={filters?.block_id || ''}
                            onChange={(e) => handleFilterChange('block_id', e.target.value)}
                            label="Block"
                            size="small"
                            disabled={!filters?.assembly_id}
                        >
                            <MenuItem value="">All Blocks</MenuItem>
                            {blocks?.filter(b => {
                                const assemblyId = b.assembly_id?._id || b.assembly_id;
                                return assemblyId === filters?.assembly_id;
                            }).map((block) => (
                                <MenuItem key={block._id} value={block._id}>{block.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Booth Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Booth</InputLabel>
                        <Select
                            value={filters?.booth_id || ''}
                            onChange={(e) => handleFilterChange('booth_id', e.target.value)}
                            label="Booth"
                            size="small"
                            disabled={!filters?.block_id}
                        >
                            <MenuItem value="">All Booths</MenuItem>
                            {booths?.filter(b => {
                                const blockId = b.block_id?._id || b.block_id;
                                return blockId === filters?.block_id;
                            }).map((booth) => (
                                <MenuItem key={booth._id} value={booth._id}>
                                    {booth.name} (No: {booth.booth_number})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        onClick={() => {
                            setAppliedFilters(filters);
                            setPagination(prev => ({ ...prev, pageIndex: 0 }));
                        }}
                    >
                        Apply
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setFilters({});
                            setAppliedFilters({});
                            setPagination(prev => ({ ...prev, pageIndex: 0 }));
                        }}
                    >
                        Clear
                    </Button>
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
                                                    <PartyActivitiesView data={row.original} />
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
            </MainCard >

            {/* Right-side Drawer for clicked booth info */}
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ width: { xs: 340, sm: 480 }, p: 0, height: '100%' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper }}>
                        <Box>
                            <Typography variant="h6">Booth Details</Typography>
                            <Typography variant="caption" color="text.secondary">Click a booth polygon to view party activities</Typography>
                        </Box>
                        <IconButton color="secondary" onClick={() => setDrawerOpen(false)} sx={{ p: 0.5 }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Box sx={{ p: 2, overflowY: 'auto', height: 'calc(100% - 72px)' }}>
                        {!drawerData && <Typography variant="body2">Click a booth polygon to view details.</Typography>}
                        {drawerData?.loading && <Typography variant="body2">Loading...</Typography>}

                        {drawerData?.details && (
                            <Stack spacing={2}>
                                <Paper elevation={1} sx={{ p: 2, borderRadius: 1 }}>
                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Booth Information</Typography>
                                    <Typography variant="body2"><strong>Name:</strong> {drawerData.details.booth?.name || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Booth No:</strong> {drawerData.details.booth?.booth_number || drawerData.details.boothNo || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Block:</strong> {drawerData.details.booth?.block_id?.name || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Assembly:</strong> {drawerData.details.booth?.assembly_id?.name || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Parliament:</strong> {drawerData.details.booth?.parliament_id?.name || 'N/A'}</Typography>
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Party Activities ({drawerData.details.partyActivities?.length || 0})</Typography>
                                    {drawerData.details.partyActivities?.length ? drawerData.details.partyActivities.slice(0, 10).map(activity => (
                                        <Box key={activity._id} sx={{ mb: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{activity.title}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {activity.activity_type} • {activity.status}
                                            </Typography>
                                            <Box sx={{ mt: 0.5 }}>
                                                <Chip
                                                    label={activity.activity_type?.toUpperCase() || 'N/A'}
                                                    size="small"
                                                    color="primary"
                                                    sx={{ mr: 0.5 }}
                                                />
                                                <Chip
                                                    label={activity.status?.toUpperCase() || 'N/A'}
                                                    size="small"
                                                    color={activity.status === 'completed' ? 'success' : activity.status === 'ongoing' ? 'warning' : 'error'}
                                                />
                                            </Box>
                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                📅 {activity.activity_date ? new Date(activity.activity_date).toLocaleDateString() : 'N/A'} - {activity.end_date ? new Date(activity.end_date).toLocaleDateString() : 'N/A'}
                                            </Typography>
                                            {activity.location && (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                    📍 {activity.location}
                                                </Typography>
                                            )}
                                            {activity.attendance_count && (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                    👥 Attendance: {activity.attendance_count.toLocaleString()}
                                                </Typography>
                                            )}
                                            {activity.media_coverage && (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                    📺 Media Coverage: Yes
                                                </Typography>
                                            )}
                                            {activity.description && (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                    {activity.description.slice(0, 100)}...
                                                </Typography>
                                            )}
                                        </Box>
                                    )) : (
                                        <Typography variant="body2">No party activities found for this booth.</Typography>
                                    )}
                                </Paper>
                            </Stack>
                        )}
                    </Box>
                </Box>
            </Drawer>

            <PartyActivitiesModal
                open={openModal}
                modalToggler={setOpenModal}
                partyActivity={selectedPartyActivity}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                parties={parties}
                users={users}
                refresh={() => fetchPartyActivities(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertPartyActivitiesDelete
                id={partyActivityDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchPartyActivities(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}

