import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, TextField, MenuItem,
    Tooltip, Grid, Drawer, Paper
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

import LocalIssueModal from './LocalModal';
import AlertLocalIssueDelete from './AlertLocalDelete';
import LocalIssueView from './LocalView';

export default function LocalIssueListPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel } = usePermissions();

    const [selectedIssue, setSelectedIssue] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [issueDeleteId, setIssueDeleteId] = useState('');
    const [localIssues, setLocalIssues] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');

    // Filter states
    const [selectedState, setSelectedState] = useState('');
    const [selectedDivision, setSelectedDivision] = useState('');
    const [selectedParliament, setSelectedParliament] = useState('');
    const [selectedAssembly, setSelectedAssembly] = useState('');
    const [selectedBlock, setSelectedBlock] = useState('');
    const [selectedBooth, setSelectedBooth] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedPriority, setSelectedPriority] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    // Temporary filter states
    const [tempFilters, setTempFilters] = useState({
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: '',
        booth: '',
        status: '',
        priority: '',
        department: '',
        category: ''
    });

    // Status and Priority options
    const statusOptions = ['Reported', 'In Progress', 'Resolved', 'Rejected'];
    const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];
    const departmentOptions = ['Education', 'Healthcare', 'Infrastructure', 'Transportation', 'Water Supply', 'Sanitation', 'Power Supply', 'Agriculture', 'Others'];
    const categoryOptions = [
        'Social Issue',
        'Crime Issue',
        'Political Issue',
        'Farmer Issue',
        'Youth Issue',
        'Women Issue',
        'Business Issue'
    ];

    // Filtered arrays for cascading dropdowns
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    // Map state
    const [blockNumberInput, setBlockNumberInput] = useState('');
    const [boothGeoJSON, setBoothGeoJSON] = useState(null);
    const [mapTheme, setMapTheme] = useState('streets');
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    // State -> Enable all dropdowns and filter by state
    useEffect(() => {
        if (tempFilters.state) {
            // Filter divisions by state
            const filteredDivs = divisions?.filter(division =>
                division.state_id?._id === tempFilters.state ||
                division.state_id === tempFilters.state
            ) || [];
            setFilteredDivisions(filteredDivs);

            // Filter parliaments by state (through divisions)
            const stateDivisionIds = filteredDivs.map(div => div._id);
            const filteredParls = parliaments?.filter(parliament => {
                const divId = parliament.division_id?._id || parliament.division_id;
                return stateDivisionIds.includes(divId);
            }) || [];
            setFilteredParliaments(filteredParls);

            // Filter assemblies by state (through parliaments)
            const stateParliamentIds = filteredParls.map(parl => parl._id);
            const filteredAssems = assemblies?.filter(assembly => {
                const parlId = assembly.parliament_id?._id || assembly.parliament_id;
                return stateParliamentIds.includes(parlId);
            }) || [];
            setFilteredAssemblies(filteredAssems);

            // Filter blocks by state (through assemblies)
            const stateAssemblyIds = filteredAssems.map(assem => assem._id);
            const filteredBlks = blocks?.filter(block => {
                const assemId = block.assembly_id?._id || block.assembly_id;
                return stateAssemblyIds.includes(assemId);
            }) || [];
            setFilteredBlocks(filteredBlks);

            // Filter booths by state (through blocks)
            const stateBlockIds = filteredBlks.map(block => block._id);
            const filteredBths = booths?.filter(booth => {
                const blockId = booth.block_id?._id || booth.block_id;
                return stateBlockIds.includes(blockId);
            }) || [];
            setFilteredBooths(filteredBths);

        } else {
            // If no state selected, show all options
            setFilteredDivisions(divisions || []);
            setFilteredParliaments(parliaments || []);
            setFilteredAssemblies(assemblies || []);
            setFilteredBlocks(blocks || []);
            setFilteredBooths(booths || []);
        }
    }, [tempFilters.state, divisions, parliaments, assemblies, blocks, booths]);

    const fetchReferenceData = async () => {
        try {
            const token = localStorage.serviceToken;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/booths`, { headers })
            ]);

            const [statesData, divisionsData, parliamentsData, assembliesData, blocksData, boothsData] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                boothsRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (blocksData.success) setBlocks(blocksData.data);
            if (boothsData.success) setBooths(boothsData.data);

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
                // Remove pagination and get all results by setting a very high limit
                const url = `${apiUrl}/booth-polygons?limit=50000&page=1`;
                const resp = await fetch(url, { headers });

                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const j = await resp.json();

                // Handle nested features structure - check if features[0] has nested features
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
                // auto-fit handled below
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
                    // Normalize response shape: either { type, features } or { features: [...] } or { success, features }
                    const features = j.features || (Array.isArray(j) ? j : (j.data || null));
                    if (features && Array.isArray(features) && features.length > 0) {
                        json = { type: 'FeatureCollection', features };
                        break;
                    }
                    // Some endpoints respond with empty features but valid structure; keep trying
                } catch (innerErr) {
                    console.warn('Error fetching booth polygons from candidate url:', innerErr);
                }
            }

            if (!json) {
                // No data found from any endpoint
                setMapError(`No booth polygons found for block '${blockInput}'`);
                setBoothGeoJSON(null);
                return;
            }

            // Normalize to a valid FeatureCollection
            const fc = { type: 'FeatureCollection', features: json.features };
            setBoothGeoJSON(fc);
            // Auto-fit on first render
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

    // Fetch booth details and recent visits when a polygon is clicked
    const fetchBoothDetailsByPolygon = async (boothNo) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Get all booths to find exact booth number match
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?all=true&limit=10000`, { headers });
            const json = await res.json();
            let booth = null;

            if (json.success && Array.isArray(json.data)) {
                const boothNoStr = String(boothNo).trim();

                // Try exact match first
                booth = json.data.find(b => String(b.booth_number).trim() === boothNoStr);

                if (!booth) {
                    // Try case-insensitive match
                    booth = json.data.find(b => String(b.booth_number).trim().toLowerCase() === boothNoStr.toLowerCase());
                }

                if (!booth) {
                    // Try partial match if booth number is contained
                    booth = json.data.find(b => String(b.booth_number).trim().includes(boothNoStr) || boothNoStr.includes(String(b.booth_number).trim()));
                }

                if (!booth) {
                    console.warn(`No booth found for BoothNo: "${boothNoStr}"`);
                }
            } else {
                console.error('Failed to fetch booths:', json);
            }

            // Get local issues for this booth
            let localIssues = [];
            if (booth && booth._id) {
                try {
                    const issuesRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/local-issues?booth=${encodeURIComponent(booth._id)}&all=true`, { headers });
                    const issuesJson = await issuesRes.json();
                    if (issuesJson.success && Array.isArray(issuesJson.data)) {
                        localIssues = issuesJson.data;
                    }
                } catch (e) {
                    console.warn('Failed to fetch local issues for booth:', e);
                }
            }

            setDrawerData({
                loading: false,
                boothNo,
                details: {
                    booth,
                    localIssues
                }
            });
        } catch (e) {
            console.error('Failed to load booth details by polygon:', e);
            setDrawerData({ loading: false, boothNo, details: { booth: null, localIssues: [] }, error: e.message });
        }
    };

    const fetchLocalIssues = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            let query = globalFilter ? `&search=${encodeURIComponent(globalFilter)}` : '';
            if (selectedState) query += `&state=${selectedState}`;
            if (selectedDivision) query += `&division=${selectedDivision}`;
            if (selectedParliament) query += `&parliament=${selectedParliament}`;
            if (selectedAssembly) query += `&assembly=${selectedAssembly}`;
            if (selectedBlock) query += `&block=${selectedBlock}`;
            if (selectedBooth) query += `&booth=${selectedBooth}`;
            if (selectedStatus) query += `&status=${encodeURIComponent(selectedStatus)}`;
            if (selectedPriority) query += `&priority=${encodeURIComponent(selectedPriority)}`;
            if (selectedDepartment) query += `&department=${encodeURIComponent(selectedDepartment)}`;
            if (selectedCategory) query += `&category=${encodeURIComponent(selectedCategory)}`;

            // hierarchy-based filtering
            if (userHierarchy) {
                const highest = getUserHighestLevel();
                if (highest) {
                    switch (highest) {
                        case 'state':
                            query += `&state_id=${userHierarchy.state}`;
                            break;
                        case 'division':
                            query += `&division_id=${userHierarchy.division}`;
                            break;
                        case 'parliament':
                            query += `&parliament_id=${userHierarchy.parliament}`;
                            break;
                        case 'assembly':
                            query += `&assembly_id=${userHierarchy.assembly}`;
                            break;
                        case 'block':
                            query += `&block_id=${userHierarchy.block}`;
                            break;
                        case 'booth':
                            query += `&booth_id=${userHierarchy.booth}`;
                            break;
                        default:
                            break;
                    }
                }
            }

            // When searching, fetch all results on first page
            let currentPage = pageIndex + 1;
            let currentLimit = pageSize;
            if (globalFilter) {
                currentPage = 1;
                currentLimit = 10000; // Get all results when searching
            }

            const token = localStorage.serviceToken;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/local-issues?page=${currentPage}&limit=${currentLimit}${query}`, { headers });
            const json = await res.json();

            if (json.success) {
                setLocalIssues(json.data);
                // When searching, set pageCount to 1 to show all results on single page
                if (globalFilter) {
                    setPageCount(1);
                    // Reset pagination to first page when searching
                    if (pageIndex !== 0) {
                        setPagination(prev => ({ ...prev, pageIndex: 0 }));
                    }
                } else {
                    setPageCount(json.pages);
                }
            }
        } catch (error) {
            console.error('Failed to fetch local issues:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocalIssues(pagination.pageIndex, pagination.pageSize, globalFilter);
    }, [
        pagination.pageIndex,
        pagination.pageSize,
        globalFilter,
        selectedState,
        selectedDivision,
        selectedParliament,
        selectedAssembly,
        selectedBlock,
        selectedBooth,
        selectedStatus,
        selectedPriority,
        selectedDepartment,
        selectedCategory
    ]);

    useEffect(() => {
        fetchReferenceData();
    }, []);

    const handleDeleteOpen = (id) => {
        setIssueDeleteId(id);
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

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Low': return 'success';
            case 'Medium': return 'info';
            case 'High': return 'warning';
            case 'Critical': return 'error';
            default: return 'default';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Reported': return 'info';
            case 'In Progress': return 'warning';
            case 'Resolved': return 'success';
            case 'Rejected': return 'error';
            default: return 'default';
        }
    };

    const columns = useMemo(() => [
        {
            header: '#',
            accessorKey: '_id',
            cell: ({ row, table }) => {
                const { pageIndex, pageSize } = table.getState().pagination;
                const serialNumber = pageIndex * pageSize + row.index + 1;
                return (
                    <Box sx={{ py: 1 }}>
                        <Typography>{serialNumber}</Typography>
                    </Box>
                );
            },
            size: 50
        },
        {
            header: 'Issue Name',
            accessorKey: 'issue_name',
            cell: ({ getValue }) => (
                <Box sx={{
                    minWidth: 250,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    py: 1,
                    px: 0.5
                }}>
                    <Typography sx={{
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        fontWeight: 500,
                        color: 'text.primary'
                    }}>
                        {getValue() || 'N/A'}
                    </Typography>
                </Box>
            ),
            size: 250
        },
        {
            header: 'Department',
            accessorKey: 'department',
            cell: ({ getValue }) => (
                <Box sx={{ width: 100, py: 1 }}>
                    <Tooltip title={getValue() || ''} arrow placement="top">
                        <Typography sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem',
                            lineHeight: 1.5
                        }}>
                            {getValue()}
                        </Typography>
                    </Tooltip>
                </Box>
            ),
            size: 100
        },
        {
            header: 'Category',
            accessorKey: 'category',
            cell: ({ getValue }) => (
                <Box sx={{ width: 120, py: 1 }}>
                    <Tooltip title={getValue() || ''} arrow placement="top">
                        <Typography sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem',
                            lineHeight: 1.5
                        }}>
                            {getValue()}
                        </Typography>
                    </Tooltip>
                </Box>
            ),
            size: 120
        },
        {
            header: 'Description',
            accessorKey: 'description',
            cell: ({ getValue }) => {
                const description = getValue() || '';
                // Remove HTML tags and decode entities
                const cleanText = description.replace(/<[^>]*>?/gm, '')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .trim();
                return (
                    <Box sx={{ width: 150, py: 1 }}>
                        <Tooltip title={cleanText || 'N/A'} arrow placement="top">
                            <Typography sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: '0.875rem',
                                lineHeight: 1.5
                            }}>
                                {cleanText || 'N/A'}
                            </Typography>
                        </Tooltip>
                    </Box>
                );
            },
            size: 150
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: ({ getValue }) => (
                <Box sx={{ py: 1 }}>
                    <Chip
                        label={getValue()}
                        color={getStatusColor(getValue())}
                        size="small"
                        sx={{ maxWidth: '100%' }}
                    />
                </Box>
            ),
            size: 90
        },
        {
            header: 'Priority',
            accessorKey: 'priority',
            cell: ({ getValue }) => (
                <Box sx={{ py: 1 }}>
                    <Chip
                        label={getValue()}
                        color={getPriorityColor(getValue())}
                        size="small"
                        variant="outlined"
                        sx={{ maxWidth: '100%' }}
                    />
                </Box>
            ),
            size: 90
        },
        {
            header: 'State',
            accessorKey: 'state_id',
            cell: ({ getValue }) => (
                <Box sx={{ py: 1 }}>
                    <Tooltip title={getValue()?.name || 'N/A'} arrow placement="top">
                        <Chip
                            label={getValue()?.name || 'N/A'}
                            color="primary"
                            size="small"
                            variant="outlined"
                            sx={{ maxWidth: '100%' }}
                        />
                    </Tooltip>
                </Box>
            ),
            size: 90
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
            ),
            size: 120
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
            ),
            size: 120
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
            ),
            size: 150
        },
        {
            header: 'Block',
            accessorKey: 'block_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="success"
                    size="small"
                    variant="outlined"
                />
            ),
            size: 150
        },
        {
            header: 'Booth',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="error"
                    size="small"
                    variant="outlined"
                />
            ),
            size: 150
        },
        {
            header: 'Booth Number',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.booth_number || 'N/A'}
                    color="error"
                    size="small"
                    variant="outlined"
                />
            ),
            size: 150
        },
        {
            header: 'Created By',
            accessorKey: 'created_by',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.username || 'N/A'}
                </Typography>
            ),
            size: 150
        },
        {
            header: 'Updated By',
            accessorKey: 'updated_by',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.username || 'N/A'}
                </Typography>
            ),
            size: 150
        },
        {
            header: 'Created At',
            accessorKey: 'created_at',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>,
            size: 120
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
                                navigate(`/Local-Issue/${row.original._id}`);
                            }}
                        >
                            <Eye />
                        </IconButton>
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedIssue(row.original); setOpenModal(true); }}>
                            <Edit />
                        </IconButton>
                        <IconButton color="error" onClick={(e) => { e.stopPropagation(); handleDeleteOpen(row.original._id); }}>
                            <Trash />
                        </IconButton>
                    </Stack>
                );
            },
            size: 150
        }
    ], [theme]);

    const table = useReactTable({
        data: localIssues,
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

    const fetchAllLocalIssuesForCsv = async () => {
        try {
            const token = localStorage.serviceToken;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/local-issues?all=true`, { headers });
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all local issues for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllLocalIssuesForCsv();
        setCsvData(allData.map(item => ({
            'Issue Name': item.issue_name,
            'Department': item.department,
            'Category': item.category,
            'Description': item.description ? item.description.replace(/<[^>]+>/g, '') : '',
            'Status': item.status,
            'Priority': item.priority,
            'State': item.state_id?.name || '',
            'Division': item.division_id?.name || '',
            'Parliament': item.parliament_id?.name || '',
            'Assembly': item.assembly_id?.name || '',
            'Block': item.block_id?.name || '',
            'Booth': item.booth_id?.name || '',
            'Booth Number': item.booth_id?.booth_number || '',
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
                        <Typography variant="h5" sx={{ mb: 1 }}>Local Issues Map</Typography>
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
                                        // Fallback: queryRenderedFeatures on map if e.features is empty
                                        if ((!features || features.length === 0) && map && map.queryRenderedFeatures) {
                                            const point = e.point || { x: e.x, y: e.y };
                                            if (point) {
                                                features = map.queryRenderedFeatures([point.x, point.y], { layers: ['booth-fill'] }) || [];
                                            }
                                        }

                                        const boothFeature = features.find(f => f.layer && f.layer.id === 'booth-fill') || features[0];
                                        if (boothFeature) {
                                            const props = boothFeature.properties || {};
                                            // try multiple property names and nested structures
                                            const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth || (props.properties && (props.properties.BoothNo || props.properties.booth_number));
                                            // Open drawer and start loading details
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
                                        {/* Symbol layer for booth labels (BoothNo and BoothName) */}
                                        <Layer
                                            id="booth-label"
                                            type="symbol"
                                            layout={{
                                                // Try various property names for booth number/name
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
                        placeholder={`Search ${localIssues.length} issues...`}
                    />

                    <Stack direction="row" spacing={1}>
                        <CSVLink
                            data={csvData}
                            filename="local_issues_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
                        <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                            {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedIssue(null); setOpenModal(true); }}>
                            Add Local Issue
                        </Button>
                    </Stack>
                </Stack>

                {/* Access Scope Information */}
                <Alert severity="info" sx={{ m: 2 }}>
                    <Typography variant="body2">
                        <strong>Data Access:</strong> {(() => {
                            if (!userHierarchy) return 'You have access to all Local Issues data';
                            const highest = getUserHighestLevel();
                            const labelMap = { state: 'State', division: 'Division', parliament: 'Parliament', assembly: 'Assembly', block: 'Block', booth: 'Booth' };
                            const idMap = { state: userHierarchy.state, division: userHierarchy.division, parliament: userHierarchy.parliament, assembly: userHierarchy.assembly, block: userHierarchy.block, booth: userHierarchy.booth };
                            return `You have access to Local Issues data for ${labelMap[highest] || 'Unknown'}: ${idMap[highest] || 'Unknown'}`;
                        })()}
                    </Typography>
                </Alert>

                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ p: 2, flexWrap: "wrap", gap: 2 }}
                >
                    <TextField
                        select
                        label="State"
                        size="small"
                        value={tempFilters.state}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, state: e.target.value }))}
                        sx={{ width: 200, mb: 2 }}
                    >
                        <MenuItem value="">Select State</MenuItem>
                        {states.map(state => (
                            <MenuItem key={state._id} value={state._id}>{state.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Division"
                        size="small"
                        value={tempFilters.division}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, division: e.target.value }))}
                        sx={{ width: 200, mb: 2 }}
                        disabled={!tempFilters.state}
                    >
                        <MenuItem value="">Select Division</MenuItem>
                        {filteredDivisions.map(division => (
                            <MenuItem key={division._id} value={division._id}>{division.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Parliament"
                        size="small"
                        value={tempFilters.parliament}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, parliament: e.target.value }))}
                        sx={{ width: 200, mb: 2 }}
                        disabled={!tempFilters.state}
                    >
                        <MenuItem value="">Select Parliament</MenuItem>
                        {filteredParliaments.map(parliament => (
                            <MenuItem key={parliament._id} value={parliament._id}>{parliament.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Assembly"
                        size="small"
                        value={tempFilters.assembly}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, assembly: e.target.value }))}
                        sx={{ width: 200, mb: 2 }}
                        disabled={!tempFilters.state}
                    >
                        <MenuItem value="">Select Assembly</MenuItem>
                        {filteredAssemblies.map(assembly => (
                            <MenuItem key={assembly._id} value={assembly._id}>{assembly.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Block"
                        size="small"
                        value={tempFilters.block}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, block: e.target.value }))}
                        sx={{ width: 200, mb: 2 }}
                        disabled={!tempFilters.state}
                    >
                        <MenuItem value="">Select Block</MenuItem>
                        {filteredBlocks.map(block => (
                            <MenuItem key={block._id} value={block._id}>{block.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Booth"
                        size="small"
                        value={tempFilters.booth}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, booth: e.target.value }))}
                        sx={{ width: 200, mb: 2 }}
                        disabled={!tempFilters.state}
                    >
                        <MenuItem value="">Select Booth</MenuItem>
                        {filteredBooths.map(booth => (
                            <MenuItem key={booth._id} value={booth._id}>{booth.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Status"
                        size="small"
                        value={tempFilters.status}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, status: e.target.value }))}
                        sx={{ width: 200, mb: 2 }}
                    >
                        <MenuItem value="">Select Status</MenuItem>
                        {statusOptions.map(status => (
                            <MenuItem key={status} value={status}>{status}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Priority"
                        size="small"
                        value={tempFilters.priority}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, priority: e.target.value }))}
                        sx={{ width: 200, mb: 2 }}
                    >
                        <MenuItem value="">Select Priority</MenuItem>
                        {priorityOptions.map(priority => (
                            <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Department"
                        size="small"
                        value={tempFilters.department}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, department: e.target.value }))}
                        sx={{ width: 200, mb: 2 }}
                    >
                        <MenuItem value="">Select Department</MenuItem>
                        {departmentOptions.map(dept => (
                            <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Category"
                        size="small"
                        value={tempFilters.category}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, category: e.target.value }))}
                        sx={{ width: 200, mb: 2 }}
                    >
                        <MenuItem value="">Select Category</MenuItem>
                        {categoryOptions.map(category => (
                            <MenuItem key={category} value={category}>{category}</MenuItem>
                        ))}
                    </TextField>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            // Apply filters
                            setSelectedState(tempFilters.state);
                            setSelectedDivision(tempFilters.division);
                            setSelectedParliament(tempFilters.parliament);
                            setSelectedAssembly(tempFilters.assembly);
                            setSelectedBlock(tempFilters.block);
                            setSelectedBooth(tempFilters.booth);
                            setSelectedStatus(tempFilters.status);
                            setSelectedPriority(tempFilters.priority);
                            setSelectedDepartment(tempFilters.department);
                            setSelectedCategory(tempFilters.category);

                            // Reset pagination to first page
                            setPagination(prev => ({ ...prev, pageIndex: 0 }));
                        }}
                        sx={{ height: 40, alignSelf: 'flex-start' }}
                    >
                        Apply
                    </Button>

                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => {
                            // Reset all filters
                            setTempFilters({
                                state: '',
                                division: '',
                                parliament: '',
                                assembly: '',
                                block: '',
                                booth: '',
                                status: '',
                                priority: '',
                                department: '',
                                category: ''
                            });
                            setSelectedState('');
                            setSelectedDivision('');
                            setSelectedParliament('');
                            setSelectedAssembly('');
                            setSelectedBlock('');
                            setSelectedBooth('');
                            setSelectedStatus('');
                            setSelectedPriority('');
                            setSelectedDepartment('');
                            setSelectedCategory('');

                            // Reset pagination to first page
                            setPagination(prev => ({ ...prev, pageIndex: 0 }));
                        }}
                        sx={{ height: 40, alignSelf: 'flex-start' }}
                    >
                        Clear
                    </Button>
                </Stack>

                <ScrollX>
                    <TableContainer>
                        <Table sx={{
                            minWidth: 750,
                            '& .MuiTableRow-root': {
                                height: '60px',
                                '&:hover': {
                                    backgroundColor: 'action.hover'
                                }
                            },
                            '& .MuiTableCell-root': {
                                p: 1,
                                '&:nth-of-type(2)': {  // Issue Name column
                                    pl: 2
                                }
                            }
                        }}>
                            <TableHead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableCell
                                                key={header.id}
                                                onClick={header.column.getToggleSortingHandler()}
                                                sx={{
                                                    cursor: header.column.getCanSort() ? 'pointer' : 'default',
                                                    width: header.getSize(),
                                                    minWidth: header.getSize(),
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
                                                <TableCell
                                                    key={cell.id}
                                                    sx={{
                                                        width: cell.column.getSize(),
                                                        minWidth: cell.column.getSize()
                                                    }}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                        {row.getIsExpanded() && (
                                            <TableRow>
                                                <TableCell colSpan={row.getVisibleCells().length}>
                                                    <LocalIssueView data={row.original} />
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
                            <Typography variant="caption" color="text.secondary">Click a booth polygon to view local issues</Typography>
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
                                    <Typography variant="subtitle2">Local Issues ({drawerData.details.localIssues?.length || 0})</Typography>
                                    {drawerData.details.localIssues?.length ? drawerData.details.localIssues.slice(0, 10).map(issue => (
                                        <Box key={issue._id} sx={{ mb: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{issue.issue_name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {issue.department} • {issue.category}
                                            </Typography>
                                            <Box sx={{ mt: 0.5 }}>
                                                <Chip
                                                    label={issue.status}
                                                    size="small"
                                                    color={issue.status === 'Resolved' ? 'success' : issue.status === 'In Progress' ? 'warning' : 'info'}
                                                    sx={{ mr: 0.5 }}
                                                />
                                                <Chip
                                                    label={issue.priority}
                                                    size="small"
                                                    variant="outlined"
                                                    color={issue.priority === 'High' ? 'error' : issue.priority === 'Medium' ? 'warning' : 'success'}
                                                />
                                            </Box>
                                            {issue.description && (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                    {issue.description.replace(/<[^>]*>/g, '').slice(0, 100)}...
                                                </Typography>
                                            )}
                                        </Box>
                                    )) : (
                                        <Typography variant="body2">No local issues found for this booth.</Typography>
                                    )}
                                </Paper>
                            </Stack>
                        )}
                    </Box>
                </Box>
            </Drawer>

            <LocalIssueModal
                open={openModal}
                modalToggler={setOpenModal}
                localIssue={selectedIssue}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                refresh={() => fetchLocalIssues(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertLocalIssueDelete
                id={issueDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchLocalIssues(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}
