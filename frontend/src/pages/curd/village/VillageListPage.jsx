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
import VillageModal from './VillageModal';
import AlertVillageDelete from './AlertVillageDelete';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';

const VillageListPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();
    const [villages, setVillages] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [selectedVillage, setSelectedVillage] = useState(null);
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

    // Filters
    const [filters, setFilters] = useState({
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: '',
        panchayat_id: '',
        village_name: '',
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
    const [boothsWithVillage, setBoothsWithVillage] = useState(new Set());
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    const columns = useMemo(() => [
        {
            header: 'Village Name',
            accessorKey: 'village_name',
            cell: ({ getValue }) => (
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {getValue()}
                </Typography>
            )
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
            header: 'Block',
            accessorKey: 'block_id',
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
                            onClick={() => navigate(`/village/${row.original._id}`)}
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
        data: villages,
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
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes, panchayatsRes] = await Promise.all([
                axiosServices.get('/states?all=true'),
                axiosServices.get('/divisions?all=true'),
                axiosServices.get('/parliaments?all=true'),
                axiosServices.get('/assemblies?all=true'),
                axiosServices.get('/blocks?all=true'),
                axiosServices.get('/booths?all=true'),
                axiosServices.get('/panchayats?all=true')
            ]);

            setStates(statesRes.data.data || []);
            setDivisions(divisionsRes.data.data || []);
            setParliaments(parliamentsRes.data.data || []);
            setAssemblies(assembliesRes.data.data || []);
            setBlocks(blocksRes.data.data || []);
            setBooths(boothsRes.data.data || []);
            setPanchayats(panchayatsRes.data.data || []);
        } catch (error) {
            console.error('Error fetching hierarchy data:', error);
        }
    };

    // Fetch villages data
    useEffect(() => {
        fetchVillages();
    }, [pagination, sorting, globalFilter, filters, yearFilter]);

    const fetchVillages = async () => {
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

            const response = await axiosServices.get(`/villages?${params}`);
            const { data, total, pages } = response.data;

            setVillages(data || []);
            setPageCount(pages || 0);
        } catch (error) {
            console.error('Error fetching villages:', error);
            setVillages([]);
        }
        setLoading(false);
    };

    const handleAdd = () => {
        setSelectedVillage(null);
        setOpenModal(true);
    };

    const handleEdit = (village) => {
        setSelectedVillage(village);
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
            village_name: '',
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

            const response = await axiosServices.get(`/villages?${params}`);
            const exportData = response.data.data.map(village => ({
                'Village Name': village.village_name,
                'Panchayat': village.panchayat_id?.panchayat_name || '',
                'State': village.state_id?.name || '',
                'Division': village.division_id?.name || '',
                'Parliament': village.parliament_id?.name || '',
                'Assembly': village.assembly_id?.name || '',
                'Block': village.block_id?.name || '',
                'Booth': village.booth_id?.name || '',
                'Location': village.location || '',
                'Latitude': village.latitude || '',
                'Longitude': village.longitude || '',
                'Male Count': village.male_count || 0,
                'Female Count': village.female_count || 0,
                'Others Count': village.others_count || 0,
                'Total Count': village.total_count || 0,
                'Created At': new Date(village.created_at).toLocaleDateString(),
                'Updated At': new Date(village.updated_at).toLocaleDateString()
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

    const villageBoothNumberSet = useMemo(() => {
        const set = new Set();
        try {
            Array.from(boothsWithVillage || []).forEach((id) => {
                const booth = booths?.find((b) => String(b._id) === String(id));
                const num = booth && String(booth.booth_number).trim().toLowerCase();
                if (num) set.add(num);
            });
        } catch { }
        return set;
    }, [boothsWithVillage, booths]);

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
            const hasVillage = boothNumNorm && villageBoothNumberSet.has(boothNumNorm);

            features.push({
                type: 'Feature',
                geometry: { type: 'Point', coordinates },
                properties: { ...props, hasVillage, boothNumber: boothNoRaw }
            });
        }

        return { type: 'FeatureCollection', features };
    }, [boothGeoJSON, villageBoothNumberSet]);

    const fetchBoothsWithVillage = async (selectedYear = yearFilter) => {
        try {
            console.log('Fetching booths with villages (Year: ' + (selectedYear || 'All') + ')');
            const headers = getAuthHeaders();
            let url = `${import.meta.env.VITE_APP_API_URL}/villages?all=true`;
            if (selectedYear) url += `&year=${selectedYear}`;

            const resp = await fetch(url, { headers });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            const villageItems = data.data || [];

            const boothIdSet = new Set();
            villageItems.forEach((v) => {
                if (v.booth_id && v.booth_id._id) boothIdSet.add(String(v.booth_id._id));
                else if (v.booth_id) boothIdSet.add(String(v.booth_id));
            });

            setBoothsWithVillage(boothIdSet);
            console.log('Booths with villages:', boothIdSet.size);
        } catch (error) {
            console.error('Error fetching booths with villages:', error);
            setBoothsWithVillage(new Set());
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
            fetchBoothsWithVillage(yearFilter);

            if (blockNumberVal === 'ALL') {
                const apiUrl = import.meta.env.VITE_APP_API_URL || '';
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
                const geoJSON = {
                    type: 'FeatureCollection',
                    features: features.map((f) => ({
                        type: 'Feature',
                        geometry: f.geometry || f,
                        properties: f.properties || {}
                    }))
                };
                setBoothGeoJSON(geoJSON);

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
                        console.error('Error fitting bounds:', error);
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
            const resp = await fetch(url, { headers });

            if (!resp.ok) {
                if (resp.status === 404) {
                    setMapError(`No polygons found for block number: ${blockNum}`);
                } else {
                    setMapError(`HTTP Error ${resp.status}`);
                }
                setBoothGeoJSON(null);
                return;
            }

            const data = await resp.json();
            let features = [];
            if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
                features = data.features;
            } else if (Array.isArray(data.booths)) {
                features = data.booths;
            } else if (Array.isArray(data)) {
                features = data;
            }

            if (features.length === 0) {
                setMapError(`No booth polygons found for block: ${blockNum}`);
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
                    console.error('Error fitting bounds:', error);
                }
            }
        } catch (error) {
            console.error('Error loading booth polygons:', error);
            setMapError(error.message || 'Error loading polygons');
            setBoothGeoJSON(null);
        }
    };

    const fetchBoothDetailsByPolygon = async (booth) => {
        try {
            const headers = getAuthHeaders();
            if (booth && booth._id) {
                let villageUrl = `${import.meta.env.VITE_APP_API_URL}/villages?booth_id=${encodeURIComponent(booth._id)}`;
                if (yearFilter) villageUrl += `&year=${yearFilter}`;

                const villageResp = await fetch(villageUrl, { headers });
                if (!villageResp.ok) throw new Error(`HTTP ${villageResp.status}`);
                const villageData = await villageResp.json();

                setDrawerData({
                    booth,
                    villages: villageData.data || []
                });
                setDrawerOpen(true);
            }
        } catch (error) {
            console.error('Error fetching booth details:', error);
            setDrawerData({ booth, villages: [] });
            setDrawerOpen(true);
        }
    };

    useEffect(() => {
        if (mapboxToken) {
            try {
                loadBoothPolygonsByBlockNumber('ALL');
            } catch (e) {
                console.error('Error auto-loading polygons:', e);
            }
        }
    }, [mapboxToken]);

    useEffect(() => {
        if (boothGeoJSON && yearFilter !== undefined) {
            fetchBoothsWithVillage(yearFilter);
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
        }
    }, [yearFilter]);

    return (
        <MainCard content={false}>
            <Stack spacing={2} sx={{ p: 2 }}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4">Village Management</Typography>
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
                            Add Village
                        </Button>
                    </Stack>
                </Stack>

                <Divider />

                {/* Filters */}
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            placeholder="Search villages..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                        />
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
                        <FormControl fullWidth>
                            <InputLabel>State</InputLabel>
                            <Select
                                value={filters.state_id}
                                onChange={(e) => handleFilterChange('state_id', e.target.value)}
                                label="State"
                            >
                                <MenuItem value="">All States</MenuItem>
                                {states.map(state => (
                                    <MenuItem key={state._id} value={state._id}>
                                        {state.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            placeholder="Village Name"
                            value={filters.village_name}
                            onChange={(e) => handleFilterChange('village_name', e.target.value)}
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
                    <Grid item xs={12} md={1}>
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
                                                    ['get', 'hasVillage'],
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
                                <Typography variant="caption">Has Village</Typography>
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
                                <Typography variant="caption">No Village</Typography>
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
                    filename={`villages-export-${new Date().toISOString().split('T')[0]}.csv`}
                    style={{ display: 'none' }}
                />
            </Stack>

            {/* Modals */}
            <VillageModal
                open={openModal}
                modalToggler={() => setOpenModal(false)}
                village={selectedVillage}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                panchayats={panchayats}
                refresh={() => {
                    fetchVillages();
                    fetchBoothsWithVillage(yearFilter);
                }}
            />

            <AlertVillageDelete
                id={deleteAlert.id}
                title={selectedVillage?.village_name}
                open={deleteAlert.open}
                handleClose={() => setDeleteAlert({ open: false, id: null })}
                refresh={() => {
                    fetchVillages();
                    fetchBoothsWithVillage(yearFilter);
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
                                    Villages ({drawerData.villages?.length || 0})
                                </Typography>
                                {drawerData.villages && drawerData.villages.length > 0 ? (
                                    <Stack spacing={1.5}>
                                        {drawerData.villages.map((village, idx) => (
                                            <Paper key={idx} elevation={1} sx={{ p: 2 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                                    {village.village_name}
                                                </Typography>
                                                <Grid container spacing={1}>
                                                    <Grid item xs={12}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Panchayat
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {village.panchayat_id?.panchayat_name || 'N/A'}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Location
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {village.location || 'N/A'}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <Stack direction="row" spacing={1}>
                                                            <Chip label={`Total: ${village.total_count || 0}`} size="small" color="primary" />
                                                            <Chip label={`M: ${village.male_count || 0}`} size="small" color="info" />
                                                            <Chip label={`F: ${village.female_count || 0}`} size="small" color="secondary" />
                                                            <Chip label={`O: ${village.others_count || 0}`} size="small" color="warning" />
                                                        </Stack>
                                                    </Grid>
                                                </Grid>
                                            </Paper>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Alert severity="info">No villages found for this booth</Alert>
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

export default VillageListPage;