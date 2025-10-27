import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, TextField, MenuItem,
    Grid, Tooltip, Drawer, Paper, Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
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
import CloseIcon from '@mui/icons-material/Close';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import { CSVLink } from 'react-csv';

import AssemblyModal from './AssemblyModal';
import AlertAssemblyDelete from './AlertAssemblyDelete';
import AssemblyView from './AssemblyView';

export default function AssemblyListPage() {
    const theme = useTheme();
    const navigate = useNavigate();

    const [selectedAssembly, setSelectedAssembly] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [assemblyDeleteId, setAssemblyDeleteId] = useState('');
    const [assemblies, setAssemblies] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [users, setUsers] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState({
        type: '',
        category: '',
        state_id: '',
        division_id: '',
        parliament_id: ''
    });

    // Map state
    const [assemblyGeoJSON, setAssemblyGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    const typeOptions = ['Urban', 'Rural', 'Mixed'];
    const categoryOptions = ['General', 'Reserved', 'Special'];

    const fetchReferenceData = async () => {
        try {
            const [statesRes, divisionsRes, parliamentsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`)
            ]);

            const token = localStorage.getItem('serviceToken');
            const [usersRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/users`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            ]);

            const usersData = await usersRes.json();
            if (usersData.success) setUsers(usersData.data);

            const [statesData, divisionsData, parliamentsData] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    const fetchAssemblies = async (pageIndex, pageSize, globalFilter = '', currentFilters = filters) => {
        setLoading(true);
        try {
            const queryParams = [];
            if (globalFilter) queryParams.push(`search=${encodeURIComponent(globalFilter)}`);
            if (currentFilters.type) queryParams.push(`type=${encodeURIComponent(currentFilters.type)}`);
            if (currentFilters.category) queryParams.push(`category=${encodeURIComponent(currentFilters.category)}`);
            if (currentFilters.state_id) queryParams.push(`state_id=${encodeURIComponent(currentFilters.state_id)}`);
            if (currentFilters.division_id) queryParams.push(`division=${encodeURIComponent(currentFilters.division_id)}`);
            if (currentFilters.parliament_id) queryParams.push(`parliament=${encodeURIComponent(currentFilters.parliament_id)}`);

            const queryString = queryParams.length > 0 ? `&${queryParams.join('&')}` : '';
            const url = `${import.meta.env.VITE_APP_API_URL}/assemblies?page=${pageIndex + 1}&limit=${pageSize}${queryString}`;

            const token = localStorage.getItem('serviceToken');
            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const json = await res.json();

            if (json.success) {
                setAssemblies(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch assemblies:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial load
        fetchAssemblies(0, 10); // Default values for first load
        fetchReferenceData();
        // Load assembly polygons for map
        (async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/assembly-polygons`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                let features = [];
                if (Array.isArray(data?.features)) features = data.features;
                else if (Array.isArray(data?.data?.[0]?.features)) features = data.data[0].features;
                else if (Array.isArray(data) && Array.isArray(data[0]?.features)) features = data[0].features;
                if (!features.length) {
                    setMapError('No assembly polygons found');
                    setAssemblyGeoJSON(null);
                } else {
                    setAssemblyGeoJSON({ type: 'FeatureCollection', features });
                }
            } catch (e) {
                console.error('Failed to load assembly polygons:', e);
                setMapError(`Failed to load assembly polygons: ${e.message}`);
                setAssemblyGeoJSON(null);
            }
        })();
    }, []); // Empty dependency array for initial load only

    useEffect(() => {
        // Runs when pagination or filters change
        if (pagination.pageIndex !== undefined && pagination.pageSize !== undefined) {
            fetchAssemblies(pagination.pageIndex, pagination.pageSize, globalFilter);
        }
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    const handleDeleteOpen = (id) => {
        setAssemblyDeleteId(id);
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
            header: 'Name',
            accessorKey: 'name',
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
            header: 'Assembly NO',
            accessorKey: 'AC_NO',
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
            header: 'Type',
            accessorKey: 'type',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.toUpperCase() || 'N/A'}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Category',
            accessorKey: 'category',
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
            header: 'Description',
            accessorKey: 'description',
            cell: ({ getValue }) => {
                const html = getValue() || '';
                // Strip HTML tags for preview, show first 40 chars
                const text = html.replace(/<[^>]+>/g, '').slice(0, 40);
                return (
                    <Typography sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={text}>
                        {text || 'N/A'}
                    </Typography>
                );
            }
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
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'Updated At',
            accessorKey: 'updated_at',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
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
                                onClick={() => navigate(`/assembly/${row.original._id}`)}
                            >
                                <Eye />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton color="primary" onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAssembly(row.original);
                                setOpenModal(true);
                            }}>
                                <Edit />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton color="error" onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteOpen(row.original._id);
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
        data: assemblies,
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

    const fetchAllAssembliesForCsv = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies?all=true`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all assemblies for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllAssembliesForCsv();
        setCsvData(allData.map(item => ({
            Name: item.name,
            Description: item.description || '',
            Type: item.type,
            Category: item.category,
            State: item.state_id?.name || '',
            Division: item.division_id?.name || '',
            Parliament: item.parliament_id?.name || '',
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

    const handleFilterApply = () => {
        setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page
        fetchAssemblies(0, pagination.pageSize, globalFilter, filters); // Use page index 0
    };

    const handleClearFilter = () => {
        setFilters({
            type: '',
            category: '',
            state_id: '',
            division_id: '',
            parliament_id: ''
        });
        setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page
        fetchAssemblies(0, pagination.pageSize, globalFilter, {
            type: '',
            category: '',
            state_id: '',
            division_id: '',
            parliament_id: ''
        });
    };

    const fetchAssemblyDetailsByPolygon = async (acNo, acName) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Find the assembly by AC_NO or name
            let assembly = null;
            try {
                const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies?all=true&limit=10000`, { headers });
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    const acNoStr = String(acNo || '').trim();
                    const nameStr = String(acName || '').trim().toLowerCase();
                    assembly = json.data.find(a => String(a.AC_NO || '').trim() === acNoStr)
                        || json.data.find(a => String(a.name || '').trim().toLowerCase() === nameStr);
                }
            } catch (e) {
                console.warn('Failed to fetch all assemblies for matching:', e);
            }

            let blocks = [];
            let booths = [];
            let visits = [];
            let workStatuses = [];
            let winners = [];

            if (assembly && assembly._id) {
                const assemblyId = assembly._id;
                const fetches = [
                    fetch(`${import.meta.env.VITE_APP_API_URL}/blocks?assembly=${encodeURIComponent(assemblyId)}&all=true&limit=1000`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/booths?assembly=${encodeURIComponent(assemblyId)}&all=true&limit=10000`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/visits?assembly=${encodeURIComponent(assemblyId)}&all=true`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/work-status?assembly=${encodeURIComponent(assemblyId)}&all=true`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/winning-candidates?assembly=${encodeURIComponent(assemblyId)}&all=true`, { headers })
                ];
                const [bRes, boothRes, vRes, wsRes, wcRes] = await Promise.allSettled(fetches);
                const tryJson = async (r) => { try { const j = await r.json(); return j; } catch { return null; } };
                if (bRes.status === 'fulfilled' && bRes.value.ok) { const j = await tryJson(bRes.value); if (j?.success && Array.isArray(j.data)) blocks = j.data; }
                if (boothRes.status === 'fulfilled' && boothRes.value.ok) { const j = await tryJson(boothRes.value); if (j?.success && Array.isArray(j.data)) booths = j.data; }
                if (vRes.status === 'fulfilled' && vRes.value.ok) { const j = await tryJson(vRes.value); if (j?.success && Array.isArray(j.data)) visits = j.data; }
                if (wsRes.status === 'fulfilled' && wsRes.value.ok) { const j = await tryJson(wsRes.value); if (j?.success && Array.isArray(j.data)) workStatuses = j.data; }
                if (wcRes.status === 'fulfilled' && wcRes.value.ok) { const j = await tryJson(wcRes.value); if (j?.success && Array.isArray(j.data)) winners = j.data; }

                // Fallback for winners by AC_NO
                if ((!winners || winners.length === 0) && acNo) {
                    try {
                        const wr = await fetch(`${import.meta.env.VITE_APP_API_URL}/winning-candidates?ac_no=${encodeURIComponent(acNo)}&all=true`, { headers });
                        const wj = await wr.json();
                        if (wj?.success && Array.isArray(wj.data)) winners = wj.data;
                    } catch {}
                }

                // Narrow winners to only those belonging to this assembly (by assembly id or AC No).
                if (Array.isArray(winners) && winners.length > 0) {
                    const matchesAssembly = (w) => {
                        try {
                            // assembly id checks
                            const wa = w.assembly_id || w.assembly || (w._source && (w._source.assembly_id || w._source.assembly));
                            if (wa) {
                                if (typeof wa === 'object' && (wa._id || wa.id)) {
                                    if (String(wa._id || wa.id) === String(assembly._id)) return true;
                                } else if (String(wa) === String(assembly._id)) return true;
                            }
                            // candidate nested assembly
                            if (w.candidate_id && (w.candidate_id.assembly_id || w.candidate_id.assembly)) {
                                const ca = w.candidate_id.assembly_id || w.candidate_id.assembly;
                                if (typeof ca === 'object' && (ca._id || ca.id)) {
                                    if (String(ca._id || ca.id) === String(assembly._id)) return true;
                                } else if (String(ca) === String(assembly._id)) return true;
                            }
                            // AC/AC_NO checks
                            const acField = w.ac_no || w.AC_NO || w.acNo || (w._source && (w._source.ac_no || w._source.AC_NO)) || w.constituency_no || w.constituency?.AC_NO;
                            if (acField && String(acField) === String(acNo)) return true;
                            // candidate nested ac_no
                            if (w.candidate_id && (w.candidate_id.ac_no || w.candidate_id.AC_NO || w.candidate_id.acNo)) {
                                const caNo = w.candidate_id.ac_no || w.candidate_id.AC_NO || w.candidate_id.acNo;
                                if (String(caNo) === String(acNo)) return true;
                            }
                        } catch (err) {
                            // ignore
                        }
                        return false;
                    };

                    const narrowed = winners.filter(matchesAssembly);
                    if (narrowed.length > 0) winners = narrowed;
                    else winners = []; // don't show a global list for this assembly if none match

                    // Normalize and deduplicate winners by candidate + year to avoid duplicate display
                    if (Array.isArray(winners) && winners.length > 0) {
                        winners = winners.map(w => {
                            const yearLabel = (w.year_id && typeof w.year_id === 'object') ? (w.year_id.year || w.year_id.name) : w.year_id;
                            const yearStr = yearLabel != null ? String(yearLabel) : '';
                            const candidateLabel = w.name || (w.candidate_id && (w.candidate_id.name || w.candidate_id._id)) || w.candidate || '';
                            return { ...w, _yearLabel: yearStr, _candidateLabel: candidateLabel };
                        });

                        const seen = new Set();
                        const deduped = [];
                        for (const w of winners) {
                            const key = `${w._candidateLabel}::${w._yearLabel}`;
                            if (!seen.has(key)) {
                                seen.add(key);
                                deduped.push(w);
                            }
                        }

                        deduped.sort((a, b) => {
                            const ay = parseInt(a._yearLabel) || 0;
                            const by = parseInt(b._yearLabel) || 0;
                            if (by !== ay) return by - ay;
                            return (a._candidateLabel || '').localeCompare(b._candidateLabel || '');
                        });

                        winners = deduped;
                    }
                }

                setDrawerData({
                    loading: false,
                    acNo,
                    acName,
                    details: {
                        assembly,
                        blocks,
                        booths,
                        visits,
                        workStatuses,
                        winners
                    }
                });
                setDrawerOpen(true);
            } else {
                setDrawerData({ loading: false, acNo, acName, details: null, error: 'Assembly not found' });
                setDrawerOpen(true);
            }
        } catch (err) {
            console.error('Failed to fetch assembly details by polygon:', err);
            setDrawerData({ loading: false, acNo, acName, details: null, error: err.message });
            setDrawerOpen(true);
        }
    };

    return (
        <>
            <MainCard content={false}>
                {/* Map section above the table */}
                <Box sx={{ p: 2, pb: 0 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Assembly Map</Typography>
                    {mapError && <Alert severity="warning" sx={{ mb: 1 }}>{mapError}</Alert>}
                    <MapContainerStyled>
                        <Map
                            ref={mapRef}
                            mapboxAccessToken={mapboxToken}
                            initialViewState={{ longitude: 77.0, latitude: 23.5, zoom: 6 }}
                            mapStyle="mapbox://styles/mapbox/streets-v12"
                            interactiveLayerIds={assemblyGeoJSON ? ['assembly-fill'] : []}
                            onClick={(e) => {
                                if (!assemblyGeoJSON) return;
                                try {
                                    const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                                    const point = e.point || { x: e.originalEvent?.clientX, y: e.originalEvent?.clientY };
                                    let features = e.features || [];
                                    if ((!features || features.length === 0) && map && point) {
                                        features = map.queryRenderedFeatures([point.x, point.y], { layers: ['assembly-fill'] }) || [];
                                    }
                                    const assemblyFeature = features.find(f => f.layer && f.layer.id === 'assembly-fill') || features[0];
                                    if (assemblyFeature) {
                                        const props = assemblyFeature.properties || {};
                                        const acNo = props.AC_NO || props.ac_no || props.acNo || '';
                                        const acName = props.AC_NAME || props.name || '';
                                        setDrawerData({ loading: true, acNo, acName, details: null });
                                        setDrawerOpen(true);
                                        fetchAssemblyDetailsByPolygon(acNo, acName);
                                    }
                                } catch (err) {
                                    console.warn('Map click handler error:', err);
                                }
                            }}
                        >
                            <MapControl />
                            {assemblyGeoJSON && (
                                <Source id="assembly-polygons" type="geojson" data={assemblyGeoJSON}>
                                    <Layer
                                        id="assembly-fill"
                                        type="fill"
                                        paint={{ 'fill-color': '#8BC34A', 'fill-opacity': 0.25 }}
                                    />
                                    <Layer id="assembly-outline" type="line" paint={{ 'line-color': '#4CAF50', 'line-width': 2 }} />
                                    <Layer
                                        id="assembly-label"
                                        type="symbol"
                                        layout={{ 'text-field': ['concat', ['get', 'AC_NO'], '\n', ['get', 'AC_NAME']], 'text-size': 10, 'text-allow-overlap': true }}
                                        paint={{ 'text-color': '#333', 'text-halo-color': '#fff', 'text-halo-width': 1 }}
                                    />
                                </Source>
                            )}
                        </Map>
                    </MapContainerStyled>
                </Box>
                {/* Header: Search + Actions */}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    justifyContent="space-between"
                    sx={{ p: 2, gap: 2 }}
                >
                    {/* Search Box */}
                    <DebouncedInput
                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={`Search ${assemblies.length} assemblies...`}
                        sx={{ width: { xs: '100%', sm: 250 } }}
                    />

                    {/* Action Buttons */}
                    <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        justifyContent="flex-end"
                    >
                        <CSVLink
                            data={csvData}
                            filename="assemblies_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
                        <Button
                            variant="outlined"
                            onClick={handleDownloadCsv}
                            disabled={csvLoading}
                            size="small"
                        >
                            {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => { setSelectedAssembly(null); setOpenModal(true); }}
                            size="small"
                        >
                            Add Assembly
                        </Button>
                    </Stack>
                </Stack>

                {/* Filters */}
                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ p: 2, flexWrap: 'wrap', gap: 2 }}
                >
                    <TextField
                        select
                        label="Type"
                        value={filters.type}
                        onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                        sx={{ minWidth: 120 }}
                        size="small"
                    >
                        <MenuItem value="">All Types</MenuItem>
                        {typeOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Category"
                        value={filters.category}
                        onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                        sx={{ minWidth: 120 }}
                        size="small"
                    >
                        <MenuItem value="">All Categories</MenuItem>
                        {categoryOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="State"
                        value={filters.state_id}
                        onChange={(e) => {
                            const newStateId = e.target.value;
                            setFilters((prev) => ({
                                ...prev,
                                state_id: newStateId,
                                division_id: '',
                                parliament_id: ''
                            }));
                        }}
                        sx={{ minWidth: 120 }}
                        size="small"
                    >
                        <MenuItem value="">All States</MenuItem>
                        {states.map((state) => (
                            <MenuItem key={state._id} value={state._id}>
                                {state.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Division"
                        value={filters.division_id}
                        onChange={(e) => {
                            const newDivisionId = e.target.value;
                            setFilters((prev) => ({
                                ...prev,
                                division_id: newDivisionId,
                                parliament_id: ''
                            }));
                        }}
                        sx={{ minWidth: 120 }}
                        size="small"
                        disabled={!filters.state_id}
                    >
                        <MenuItem value="">All Divisions</MenuItem>
                        {divisions
                            .filter(d => !filters.state_id || d.state_id?._id === filters.state_id)
                            .map((d) => (
                                <MenuItem key={d._id} value={d._id}>
                                    {d.name}
                                </MenuItem>
                            ))}
                    </TextField>

                    <TextField
                        select
                        label="Parliament"
                        value={filters.parliament_id}
                        onChange={(e) => setFilters((prev) => ({ ...prev, parliament_id: e.target.value }))}
                        sx={{ minWidth: 120 }}
                        size="small"
                        disabled={!filters.division_id}
                    >
                        <MenuItem value="">All Parliaments</MenuItem>
                        {parliaments
                            .filter(p => !filters.division_id || p.division_id?._id === filters.division_id)
                            .map((p) => (
                                <MenuItem key={p._id} value={p._id}>
                                    {p.name}
                                </MenuItem>
                            ))}
                    </TextField>

                    <Button variant="contained" onClick={handleFilterApply} size="small">
                        Apply
                    </Button>
                    <Button variant="outlined" onClick={handleClearFilter} size="small">
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
                                                    <AssemblyView data={row.original} />
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

            {/* Right-side Drawer for clicked assembly info */}
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ width: { xs: 340, sm: 480 }, p: 0, height: '100%' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper }}>
                        <Box>
                            <Typography variant="h6">Assembly Details</Typography>
                            <Typography variant="caption" color="text.secondary">Click an assembly polygon to view more information</Typography>
                        </Box>
                        <IconButton color="secondary" onClick={() => setDrawerOpen(false)} sx={{ p: 0.5 }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Box sx={{ p: 2, overflowY: 'auto', height: 'calc(100% - 72px)' }}>
                        {!drawerData && <Typography variant="body2">Click an assembly polygon to view details.</Typography>}
                        {drawerData?.loading && <Typography variant="body2">Loading...</Typography>}

                        {drawerData?.details && (
                            <Stack spacing={2}>
                                <Paper elevation={1} sx={{ p: 2, borderRadius: 1 }}>
                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Basic</Typography>
                                    <Typography variant="body2"><strong>Name:</strong> {drawerData.details.assembly?.name || drawerData.acName || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>AC No:</strong> {drawerData.details.assembly?.AC_NO || drawerData.acNo || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Division:</strong> {drawerData.details.assembly?.division_id?.name || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Parliament:</strong> {drawerData.details.assembly?.parliament_id?.name || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>State:</strong> {drawerData.details.assembly?.state_id?.name || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Type:</strong> {drawerData.details.assembly?.type || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Category:</strong> {drawerData.details.assembly?.category || 'N/A'}</Typography>
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Blocks ({drawerData.details.blocks?.length || 0})</Typography>
                                    {drawerData.details.blocks?.length ? drawerData.details.blocks.slice(0,8).map(b => (
                                        <Typography key={b._id} variant="body2">• {b.name}</Typography>
                                    )) : <Typography variant="body2">No blocks found.</Typography>}
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Booths ({drawerData.details.booths?.length || 0})</Typography>
                                    {drawerData.details.booths?.length ? drawerData.details.booths.slice(0,8).map(bt => (
                                        <Typography key={bt._id} variant="body2">• #{bt.booth_number} — {bt.name}</Typography>
                                    )) : <Typography variant="body2">No booths found.</Typography>}
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Visits ({drawerData.details.visits?.length || 0})</Typography>
                                    {drawerData.details.visits?.length ? drawerData.details.visits.slice(0,5).map(v => (
                                        <Box key={v._id} sx={{ mb: 0.5 }}>
                                            <Typography variant="body2">• {v.date ? new Date(v.date).toLocaleDateString('en-IN') : ''} - {v.candidate_id?.name || ''}</Typography>
                                            <Typography variant="caption" color="text.secondary">{v.locationName || ''}</Typography>
                                        </Box>
                                    )) : <Typography variant="body2">No visits found.</Typography>}
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Work Status ({drawerData.details.workStatuses?.length || 0})</Typography>
                                    {drawerData.details.workStatuses?.length ? drawerData.details.workStatuses.slice(0,5).map(ws => (
                                        <Box key={ws._id} sx={{ mb: 0.5 }}>
                                            <Typography variant="body2">• {ws.work_name || 'Work'} — {ws.status || ''}</Typography>
                                            <Typography variant="caption" color="text.secondary">Budget: {ws.total_budget ?? 'N/A'} | Spent: {ws.spent_amount ?? 0}</Typography>
                                        </Box>
                                    )) : <Typography variant="body2">No work status records.</Typography>}
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Winning Candidates ({drawerData.details.winners?.length || 0})</Typography>
                                    {drawerData.details.winners?.length ? drawerData.details.winners.slice(0,5).map(w => (
                                        <Box key={w._id} sx={{ mb: 0.5 }}>
                                            <Typography variant="body2">• {w.name || w.candidate_id?.name || 'Candidate'} — {w.party_id?.name || w.party || 'Party'}</Typography>
                                            <Typography variant="caption" color="text.secondary">Year: {typeof w.year_id === 'object' ? (w.year_id?.year || w.year_id?.name) : w.year_id}</Typography>
                                        </Box>
                                    )) : <Typography variant="body2">No winners data.</Typography>}
                                </Paper>
                            </Stack>
                        )}
                    </Box>
                </Box>
            </Drawer>

            <AssemblyModal
                open={openModal}
                modalToggler={setOpenModal}
                assembly={selectedAssembly}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                refresh={() => fetchAssemblies(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertAssemblyDelete
                id={assemblyDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchAssemblies(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}
