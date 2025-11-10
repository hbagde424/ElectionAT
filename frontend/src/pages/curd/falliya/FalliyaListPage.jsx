import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Stack, Typography, Box, Tooltip, Divider, Chip, Avatar, Grid,
    IconButton, Select, MenuItem, FormControl, InputLabel, TextField, Alert, Drawer
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
import FalliyaModal from './FalliyaModal';
import AlertFalliyaDelete from './AlertFalliyaDelete';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';

const FalliyaListPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();
    const [falliyas, setFalliyas] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [selectedFalliya, setSelectedFalliya] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState({ open: false, id: null });
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState([]);

    // Hierarchy data
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [panchayats, setPanchayats] = useState([]);
    const [villages, setVillages] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: '',
        panchayat_id: '',
        village_id: '',
        falliya_name: '',
        location: ''
    });

    // CSV export
    const csvLinkRef = useRef(null);
    const [csvData, setCsvData] = useState([]);
    const [exportLoading, setExportLoading] = useState(false);

    // Map state
    const [blockNumberInput, setBlockNumberInput] = useState('ALL');
    const [yearFilter, setYearFilter] = useState('');
    const [boothGeoJSON, setBoothGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const [boothsWithFalliya, setBoothsWithFalliya] = useState(new Set());
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    const columns = useMemo(() => [
        {
            header: 'Falliya Name',
            accessorKey: 'falliya_name',
            cell: ({ getValue }) => (
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'Village',
            accessorKey: 'village_id',
            cell: ({ getValue }) => getValue()?.village_name || 'N/A'
        },
        {
            header: 'Panchayat',
            accessorKey: 'panchayat_id',
            cell: ({ getValue }) => getValue()?.panchayat_name || 'N/A'
        },
        {
            header: 'State',
            accessorKey: 'state_id',
            cell: ({ getValue }) => getValue()?.name || 'N/A'
        },
        {
            header: 'Division',
            accessorKey: 'division_id',
            cell: ({ getValue }) => getValue()?.name || 'N/A'
        },
        {
            header: 'Parliament',
            accessorKey: 'parliament_id',
            cell: ({ getValue }) => getValue()?.name || 'N/A'
        },
        {
            header: 'Assembly',
            accessorKey: 'assembly_id',
            cell: ({ getValue }) => getValue()?.name || 'N/A'
        },
        {
            header: 'Location',
            accessorKey: 'location',
            cell: ({ getValue }) => (
                <Typography variant="body2" sx={{ maxWidth: 200 }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Population',
            accessorKey: 'total_count',
            cell: ({ row }) => {
                const { male_count, female_count, others_count, total_count } = row.original;
                return (
                    <Stack direction="row" spacing={1}>
                        <Chip label={`Total: ${total_count || 0}`} color="primary" size="small" />
                        <Chip label={`M: ${male_count || 0}`} color="info" size="small" />
                        <Chip label={`F: ${female_count || 0}`} color="secondary" size="small" />
                        <Chip label={`O: ${others_count || 0}`} color="warning" size="small" />
                    </Stack>
                );
            }
        },
        {
            header: 'Actions',
            accessorKey: 'actions',
            enableSorting: false,
            cell: ({ row }) => (
                <Stack direction="row" spacing={1}>
                    <Tooltip title="View Details">
                            <IconButton 
                            onClick={() => navigate(`/falliya/${row.original._id}`)}
                            color="primary"
                        >
                            <Eye />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <IconButton 
                            onClick={() => handleEdit(row.original)}
                            color="secondary"
                        >
                            <Edit />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton 
                            onClick={() => handleDelete(row.original._id)}
                            color="error"
                        >
                            <Trash />
                        </IconButton>
                    </Tooltip>
                </Stack>
            )
        }
    ], [navigate]);

    const table = useReactTable({
        data: falliyas,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            pagination,
            sorting,
            globalFilter
        },
        pageCount,
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true
    });

    // Fetch hierarchy data
    useEffect(() => {
        fetchHierarchyData();
    }, []);

    const fetchHierarchyData = async () => {
        try {
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes, panchayatsRes, villagesRes] = await Promise.all([
                axiosServices.get('/states?all=true'),
                axiosServices.get('/divisions?all=true'),
                axiosServices.get('/parliaments?all=true'),
                axiosServices.get('/assemblies?all=true'),
                axiosServices.get('/blocks?all=true'),
                axiosServices.get('/booths?all=true'),
                axiosServices.get('/panchayats?all=true'),
                axiosServices.get('/villages?all=true')
            ]);

            setStates(statesRes.data.data || []);
            setDivisions(divisionsRes.data.data || []);
            setParliaments(parliamentsRes.data.data || []);
            setAssemblies(assembliesRes.data.data || []);
            setBlocks(blocksRes.data.data || []);
            setBooths(boothsRes.data.data || []);
            setPanchayats(panchayatsRes.data.data || []);
            setVillages(villagesRes.data.data || []);
        } catch (error) {
            console.error('Error fetching hierarchy data:', error);
        }
    };

    // Fetch falliyas data
    useEffect(() => {
        fetchFalliyas();
    }, [pagination, sorting, globalFilter, filters, yearFilter]);

    const fetchFalliyas = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
                ...(globalFilter && { search: globalFilter }),
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            });

            if (yearFilter) {
                params.append('year', yearFilter);
            }

            if (sorting.length > 0) {
                params.append('sort', `${sorting[0].desc ? '-' : ''}${sorting[0].id}`);
            }

            const response = await axiosServices.get(`/falliyas?${params}`);
            const { data, total, pages } = response.data;

            setFalliyas(data || []);
            setPageCount(pages || 0);
        } catch (error) {
            console.error('Error fetching falliyas:', error);
            setFalliyas([]);
        }
        setLoading(false);
    };

    const handleAdd = () => {
        setSelectedFalliya(null);
        setOpenModal(true);
    };

    const handleEdit = (falliya) => {
        setSelectedFalliya(falliya);
        setOpenModal(true);
    };

    const handleDelete = (id) => {
        setDeleteAlert({ open: true, id });
    };

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    };

    const clearFilters = () => {
        setFilters({
            state_id: '',
            division_id: '',
            parliament_id: '',
            assembly_id: '',
            block_id: '',
            booth_id: '',
            panchayat_id: '',
            village_id: '',
            falliya_name: '',
            location: ''
        });
        setGlobalFilter('');
    };

    // CSV Export
    const handleExport = async () => {
        setExportLoading(true);
        try {
            const params = new URLSearchParams({
                all: 'true',
                ...(globalFilter && { search: globalFilter }),
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            });

            if (yearFilter) {
                params.append('year', yearFilter);
            }

            const response = await axiosServices.get(`/falliyas?${params}`);
            const exportData = response.data.data.map(falliya => ({
                'Falliya Name': falliya.falliya_name,
                'Village': falliya.village_id?.village_name || '',
                'Panchayat': falliya.panchayat_id?.panchayat_name || '',
                'State': falliya.state_id?.name || '',
                'Division': falliya.division_id?.name || '',
                'Parliament': falliya.parliament_id?.name || '',
                'Assembly': falliya.assembly_id?.name || '',
                'Block': falliya.block_id?.name || '',
                'Booth': falliya.booth_id?.name || '',
                'Location': falliya.location || '',
                'Latitude': falliya.latitude || '',
                'Longitude': falliya.longitude || '',
                'Male Count': falliya.male_count || 0,
                'Female Count': falliya.female_count || 0,
                'Others Count': falliya.others_count || 0,
                'Total Count': falliya.total_count || 0,
                'Created At': new Date(falliya.created_at).toLocaleDateString(),
                'Updated At': new Date(falliya.updated_at).toLocaleDateString()
            }));

            setCsvData(exportData);
            setTimeout(() => csvLinkRef.current?.link.click(), 100);
        } catch (error) {
            console.error('Error exporting data:', error);
        }
        setExportLoading(false);
    };

    // Map Functions
    const getAuthHeaders = () => {
        const token = localStorage.getItem('serviceToken');
        return { Authorization: `Bearer ${token}` };
    };

    // Build a set of booth IDs that have falliyas
    const falliyaBoothNumberSet = useMemo(() => {
        const set = new Set();
        try {
            Array.from(boothsWithFalliya || []).forEach((id) => {
                const booth = booths?.find((b) => String(b._id) === String(id));
                const num = booth && String(booth.booth_number).trim().toLowerCase();
                if (num) set.add(num);
            });
        } catch { }
        return set;
    }, [boothsWithFalliya, booths]);

    // Dedupe markers: 1 dot per booth number
    const boothMarkersGeoJSON = useMemo(() => {
        if (!boothGeoJSON?.features) return null;
        const seen = new Set();
        const features = [];

        const centroidFromGeom = (geometry) => {
            try {
                if (geometry?.type === 'Polygon' && geometry.coordinates?.[0]) {
                    const coords = geometry.coordinates[0];
                    const lngs = coords.map((c) => c[0]);
                    const lats = coords.map((c) => c[1]);
                    return [lngs.reduce((a, b) => a + b, 0) / lngs.length, lats.reduce((a, b) => a + b, 0) / lats.length];
                }
                if (geometry?.type === 'MultiPolygon' && geometry.coordinates?.[0]?.[0]) {
                    const coords = geometry.coordinates[0][0];
                    const lngs = coords.map((c) => c[0]);
                    const lats = coords.map((c) => c[1]);
                    return [lngs.reduce((a, b) => a + b, 0) / lngs.length, lats.reduce((a, b) => a + b, 0) / lats.length];
                }
            } catch { }
            return [0, 0];
        };

        for (const feature of boothGeoJSON.features) {
            const props = feature.properties || {};
            const boothNoRaw = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth;
            const coordinates = centroidFromGeom(feature.geometry);
            const coordKey = `coord:${coordinates[0].toFixed(5)},${coordinates[1].toFixed(5)}`;
            const boothKeyNorm = boothNoRaw !== undefined && boothNoRaw !== null ? `booth:${String(boothNoRaw).trim().toLowerCase()}` : '';

            const key = boothKeyNorm || coordKey;
            if (seen.has(key)) continue;
            seen.add(key);

            const boothNumNorm = boothNoRaw !== undefined && boothNoRaw !== null ? String(boothNoRaw).trim().toLowerCase() : '';
            const hasFalliya = boothNumNorm && falliyaBoothNumberSet.has(boothNumNorm);

            features.push({
                type: 'Feature',
                geometry: { type: 'Point', coordinates },
                properties: { ...props, hasFalliya, boothNumber: boothNoRaw }
            });
        }

        return { type: 'FeatureCollection', features };
    }, [boothGeoJSON, falliyaBoothNumberSet]);

    const fetchBoothsWithFalliya = async (selectedYear = yearFilter) => {
        try {
            console.log('Fetching booths with falliyas (Year: ' + (selectedYear || 'All') + ')');
            const headers = getAuthHeaders();
            let url = `${import.meta.env.VITE_APP_API_URL}/falliyas?all=true`;
            if (selectedYear) url += `&year=${selectedYear}`;

            const resp = await fetch(url, { headers });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            const falliyaItems = data.data || [];

            const boothIdSet = new Set();
            falliyaItems.forEach((f) => {
                if (f.booth_id && f.booth_id._id) boothIdSet.add(String(f.booth_id._id));
                else if (f.booth_id) boothIdSet.add(String(f.booth_id));
            });

            setBoothsWithFalliya(boothIdSet);
            console.log('Booths with falliyas:', boothIdSet.size);
        } catch (error) {
            console.error('Error fetching booths with falliyas:', error);
            setBoothsWithFalliya(new Set());
        }
    };

    const loadBoothPolygonsByBlockNumber = async (blockNumberVal) => {
        if (!blockNumberVal) {
            setMapError('Please enter Block Number');
            return;
        }
        setMapError('');
        try {
            const headers = getAuthHeaders();
            fetchBoothsWithFalliya(yearFilter);

            if (blockNumberVal === 'ALL') {
                const apiUrl = import.meta.env.VITE_APP_API_URL || '';
                const url = `${apiUrl}/booth-polygons?limit=50000&page=1`;
                console.log('[Falliya] Loading ALL booth polygons from', url);
                const resp = await fetch(url, { headers });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const j = await resp.json();
                let features = j.features || j.data || [];
                console.log('[Falliya] ALL polygons response features length:', (features && features.length) || 0);
                if (features.length === 1 && features[0] && features[0].features && Array.isArray(features[0].features)) {
                    features = features[0].features;
                }
                if (!features || !Array.isArray(features) || features.length === 0) {
                    setMapError('No booth polygons found or invalid response structure');
                    setBoothGeoJSON(null);
                    return;
                }
                const geoJSON = {
                    type: 'FeatureCollection',
                    features: features.map((f) => ({
                        type: 'Feature',
                        geometry: f.geometry || f,
                        properties: f.properties || {}
                    }))
                };
                setBoothGeoJSON(geoJSON);
                console.log('[Falliya] Loaded ALL polygons, count:', geoJSON.features.length);

                if (mapRef.current && geoJSON.features.length > 0) {
                    try {
                        const bounds = geoJSON.features.reduce(
                            (acc, f) => {
                                const coords = f.geometry.type === 'Polygon'
                                    ? f.geometry.coordinates[0]
                                    : f.geometry.coordinates[0][0];
                                coords.forEach(([lng, lat]) => {
                                    acc[0] = Math.min(acc[0], lng);
                                    acc[1] = Math.min(acc[1], lat);
                                    acc[2] = Math.max(acc[2], lng);
                                    acc[3] = Math.max(acc[3], lat);
                                });
                                return acc;
                            },
                            [Infinity, Infinity, -Infinity, -Infinity]
                        );
                        mapRef.current.fitBounds(bounds, { padding: 50, duration: 1000 });
                    } catch (error) {
                        console.error('[Falliya] Error fitting bounds:', error);
                    }
                }
                return;
            }

            const blockNum = blockNumberVal.trim();
            if (!blockNum) {
                setMapError('Block number is empty');
                setBoothGeoJSON(null);
                return;
            }

            const apiUrl = import.meta.env.VITE_APP_API_URL || '';
            const url = `${apiUrl}/booth-polygons/block/${encodeURIComponent(blockNum)}`;
            console.log('[Falliya] Fetching booth polygons for block:', blockNum, 'URL:', url);
            const resp = await fetch(url, { headers });

            if (!resp.ok) {
                if (resp.status === 404) {
                    setMapError(`No polygons found for block number: ${blockNum}`);
                } else {
                    setMapError(`HTTP Error ${resp.status} while loading polygons`);
                }
                setBoothGeoJSON(null);
                return;
            }

            const data = await resp.json();
            console.log('[Falliya] Booth polygon response:', data);

            let features = [];
            if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
                features = data.features;
            } else if (Array.isArray(data.booths)) {
                features = data.booths;
            } else if (Array.isArray(data)) {
                features = data;
            }

            console.log('[Falliya] Extracted features count:', features.length);

            if (features.length === 0) {
                setMapError(`No booth polygons found for block number: ${blockNum}`);
                setBoothGeoJSON(null);
                return;
            }

            const geoJSON = {
                type: 'FeatureCollection',
                features: features.map((f) => ({
                    type: 'Feature',
                    geometry: f.geometry || f,
                    properties: f.properties || {}
                }))
            };

            setBoothGeoJSON(geoJSON);
            setMapError('');

            if (mapRef.current) {
                try {
                    const bounds = geoJSON.features.reduce(
                        (acc, f) => {
                            const coords = f.geometry.type === 'Polygon'
                                ? f.geometry.coordinates[0]
                                : f.geometry.coordinates[0][0];
                            coords.forEach(([lng, lat]) => {
                                acc[0] = Math.min(acc[0], lng);
                                acc[1] = Math.min(acc[1], lat);
                                acc[2] = Math.max(acc[2], lng);
                                acc[3] = Math.max(acc[3], lat);
                            });
                            return acc;
                        },
                        [Infinity, Infinity, -Infinity, -Infinity]
                    );
                    mapRef.current.fitBounds(bounds, { padding: 50, duration: 1000 });
                } catch (error) {
                    console.error('[Falliya] Error fitting bounds:', error);
                }
            }
        } catch (error) {
            console.error('[Falliya] Error loading booth polygons:', error);
            setMapError(error.message || 'Error loading polygons');
            setBoothGeoJSON(null);
        }
    };

    const fetchBoothDetailsByPolygon = async (booth) => {
        try {
            const headers = getAuthHeaders();
            if (booth && booth._id) {
                let falliyaUrl = `${import.meta.env.VITE_APP_API_URL}/falliyas?booth_id=${encodeURIComponent(booth._id)}`;
                if (yearFilter) falliyaUrl += `&year=${yearFilter}`;

                const falliyaResp = await fetch(falliyaUrl, { headers });
                if (!falliyaResp.ok) throw new Error(`HTTP ${falliyaResp.status}`);
                const falliyaData = await falliyaResp.json();

                setDrawerData({
                    booth,
                    falliyas: falliyaData.data || []
                });
                setDrawerOpen(true);
            }
        } catch (error) {
            console.error('Error fetching booth details:', error);
            setDrawerData({ booth, falliyas: [] });
            setDrawerOpen(true);
        }
    };

    // Auto-load ALL booth polygons on mount
    useEffect(() => {
        if (mapboxToken) {
            try {
                loadBoothPolygonsByBlockNumber('ALL');
            } catch (e) {
                console.error('Error auto-loading polygons:', e);
            }
        }
    }, [mapboxToken]);

    // Refresh markers when year filter changes
    useEffect(() => {
        if (boothGeoJSON && yearFilter !== undefined) {
            fetchBoothsWithFalliya(yearFilter);
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
        }
    }, [yearFilter]);

    return (
        <MainCard content={false}>
            <Stack spacing={2} sx={{ p: 2 }}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4">Falliya Management</Typography>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            onClick={handleExport}
                            disabled={exportLoading}
                        >
                            {exportLoading ? 'Exporting...' : 'Export CSV'}
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleAdd}
                        >
                            Add Falliya
                        </Button>
                    </Stack>
                </Stack>

                <Divider />

                {/* Filters */}
                <Grid container spacing={2}>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            placeholder="Search falliyas..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Village</InputLabel>
                            <Select
                                value={filters.village_id}
                                onChange={(e) => handleFilterChange('village_id', e.target.value)}
                                label="Village"
                            >
                                <MenuItem value="">All Villages</MenuItem>
                                {villages.map(village => (
                                    <MenuItem key={village._id} value={village._id}>
                                        {village.village_name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Panchayat</InputLabel>
                            <Select
                                value={filters.panchayat_id}
                                onChange={(e) => handleFilterChange('panchayat_id', e.target.value)}
                                label="Panchayat"
                            >
                                <MenuItem value="">All Panchayats</MenuItem>
                                {panchayats.map(panchayat => (
                                    <MenuItem key={panchayat._id} value={panchayat._id}>
                                        {panchayat.panchayat_name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            placeholder="Falliya Name"
                            value={filters.falliya_name}
                            onChange={(e) => handleFilterChange('falliya_name', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            placeholder="Location"
                            value={filters.location}
                            onChange={(e) => handleFilterChange('location', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Button fullWidth variant="outlined" onClick={clearFilters}>
                            Clear
                        </Button>
                    </Grid>
                </Grid>

                <Divider />

                {/* Map Section */}
                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <TextField
                            label="Block Number"
                            value={blockNumberInput}
                            onChange={(e) => setBlockNumberInput(e.target.value)}
                            size="small"
                            sx={{ width: 200 }}
                        />
                        <Button variant="contained" size="small" onClick={() => loadBoothPolygonsByBlockNumber(blockNumberInput)}>
                            Load Map
                        </Button>
                        <TextField
                            label="Filter by Year"
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            size="small"
                            placeholder="e.g., 2024"
                            sx={{ width: 150 }}
                        />
                    </Stack>

                    {mapError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {mapError}
                        </Alert>
                    )}

                    {mapboxToken ? (
                        <MapContainerStyled>
                            <Map
                                ref={mapRef}
                                initialViewState={{ longitude: 78.9629, latitude: 20.5937, zoom: 5 }}
                                style={{ width: '100%', height: '500px' }}
                                mapStyle="mapbox://styles/mapbox/streets-v11"
                                mapboxAccessToken={mapboxToken}
                                onClick={(e) => {
                                    if (e.features && e.features.length > 0) {
                                        const feature = e.features[0];
                                        if (feature.layer.id === 'booth-polygons-layer') {
                                            const props = feature.properties;
                                            const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number;
                                            const booth = booths?.find((b) => String(b.booth_number) === String(boothNo));
                                            if (booth) {
                                                fetchBoothDetailsByPolygon(booth);
                                            }
                                        }
                                    }
                                }}
                                interactiveLayerIds={['booth-polygons-layer']}
                            >
                                <MapControl />
                                {boothGeoJSON && (
                                    <Source id="booth-polygons-source" type="geojson" data={boothGeoJSON}>
                                        <Layer
                                            id="booth-polygons-layer"
                                            type="fill"
                                            paint={{
                                                'fill-color': '#3b82f6',
                                                'fill-opacity': 0.3
                                            }}
                                        />
                                        <Layer
                                            id="booth-polygons-outline"
                                            type="line"
                                            paint={{
                                                'line-color': '#1e40af',
                                                'line-width': 1
                                            }}
                                        />
                                    </Source>
                                )}
                                {boothMarkersGeoJSON && (
                                    <Source id="booth-markers-source" type="geojson" data={boothMarkersGeoJSON}>
                                        <Layer
                                            id="booth-markers-layer"
                                            type="circle"
                                            paint={{
                                                'circle-radius': 6,
                                                'circle-color': [
                                                    'case',
                                                    ['get', 'hasFalliya'],
                                                    '#22c55e',
                                                    '#ef4444'
                                                ],
                                                'circle-stroke-width': 2,
                                                'circle-stroke-color': '#ffffff'
                                            }}
                                        />
                                    </Source>
                                )}
                            </Map>
                        </MapContainerStyled>
                    ) : (
                        <Alert severity="warning">Mapbox token not configured</Alert>
                    )}

                    {/* Map Legend */}
                    <Paper elevation={2} sx={{ mt: 1, p: 1.5, display: 'inline-block' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                            Map Legend {yearFilter ? `(Year: ${yearFilter})` : '(All Years)'}
                        </Typography>
                        <Stack direction="row" spacing={3}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Box sx={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    backgroundColor: '#22c55e',
                                    border: '2px solid #ffffff',
                                    boxShadow: 1
                                }} />
                                <Typography variant="caption">Has Falliya</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Box sx={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: '50%',
                                    backgroundColor: '#ef4444',
                                    border: '2px solid #ffffff',
                                    boxShadow: 1
                                }} />
                                <Typography variant="caption">No Falliya</Typography>
                            </Stack>
                        </Stack>
                    </Paper>
                </Box>

                <Divider />

                {/* Table */}
                <ScrollX>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableCell key={header.id}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box>{flexRender(header.column.columnDef.header, header.getContext())}</Box>
                                                    {header.column.getCanSort() && (
                                                        <HeaderSort column={header.column} />
                                                    )}
                                                </Stack>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} align="center">
                                            <Typography>Loading...</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : table.getRowModel().rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length}>
                                            <EmptyReactTable />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow key={row.id}>
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </ScrollX>

                {/* Pagination */}
                <TablePagination table={table} />

                {/* Hidden CSV export link */}
                <CSVLink
                    ref={csvLinkRef}
                    data={csvData}
                    filename={`falliyas-export-${new Date().toISOString().split('T')[0]}.csv`}
                    style={{ display: 'none' }}
                />
            </Stack>

            {/* Modals */}
            <FalliyaModal
                open={openModal}
                modalToggler={() => setOpenModal(false)}
                falliya={selectedFalliya}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                panchayats={panchayats}
                villages={villages}
                refresh={() => {
                    fetchFalliyas();
                    fetchBoothsWithFalliya(yearFilter);
                }}
            />

            <AlertFalliyaDelete
                id={deleteAlert.id}
                title={selectedFalliya?.falliya_name}
                open={deleteAlert.open}
                handleClose={() => setDeleteAlert({ open: false, id: null })}
                refresh={() => {
                    fetchFalliyas();
                    fetchBoothsWithFalliya(yearFilter);
                }}
            />

            {/* Booth Details Drawer */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{ sx: { width: { xs: '100%', sm: 500 } } }}
            >
                {drawerData && (
                    <Box sx={{ p: 3 }}>
                        <Typography variant="h5" sx={{ mb: 2 }}>
                            Booth Details
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Booth Name
                                </Typography>
                                <Typography variant="body1">
                                    {drawerData.booth?.name || 'N/A'}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Booth Number
                                </Typography>
                                <Typography variant="body1">
                                    {drawerData.booth?.booth_number || 'N/A'}
                                </Typography>
                            </Box>

                            <Divider />

                            <Box>
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    Falliyas ({drawerData.falliyas?.length || 0})
                                </Typography>
                                {drawerData.falliyas && drawerData.falliyas.length > 0 ? (
                                    <Stack spacing={1.5}>
                                        {drawerData.falliyas.map((falliya, idx) => (
                                            <Paper key={idx} elevation={1} sx={{ p: 2 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                                    {falliya.falliya_name}
                                                </Typography>
                                                <Grid container spacing={1}>
                                                    <Grid item xs={6}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Village
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {falliya.village_id?.village_name || 'N/A'}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Panchayat
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {falliya.panchayat_id?.panchayat_name || 'N/A'}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Location
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {falliya.location || 'N/A'}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <Stack direction="row" spacing={1}>
                                                            <Chip label={`Total: ${falliya.total_count || 0}`} size="small" color="primary" />
                                                            <Chip label={`M: ${falliya.male_count || 0}`} size="small" color="info" />
                                                            <Chip label={`F: ${falliya.female_count || 0}`} size="small" color="secondary" />
                                                            <Chip label={`O: ${falliya.others_count || 0}`} size="small" color="warning" />
                                                        </Stack>
                                                    </Grid>
                                                </Grid>
                                            </Paper>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Alert severity="info">No falliyas found for this booth</Alert>
                                )}
                            </Box>
                        </Stack>

                        <Button
                            fullWidth
                            variant="outlined"
                            sx={{ mt: 3 }}
                            onClick={() => setDrawerOpen(false)}
                        >
                            Close
                        </Button>
                    </Box>
                )}
            </Drawer>
        </MainCard>
    );
};

export default FalliyaListPage;