import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Stack, Typography, Box, Tooltip, Divider, Chip, Avatar, Grid,
    IconButton, Select, MenuItem, FormControl, InputLabel, TextField, Alert,
    Drawer
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import axiosServices from 'utils/axios';
import { usePermissions } from 'contexts/PermissionContext';
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';
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
import BLOModal from './BLOModal';
import AlertBLODelete from './AlertBLODelete';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';

const BLOListPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();
    const [BLOs, setBLOs] = useState([]);
    const [allBLOs, setAllBLOs] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [selectedBLO, setSelectedBLO] = useState(null);
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

    // Map related state (similar to Coding page)
    const [blockNumberInput, setBlockNumberInput] = useState('ALL');
    const [mapTheme, setMapTheme] = useState('streets');
    const [boothGeoJSON, setBoothGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;
    
    // Helper: fit map to GeoJSON feature collection bounds with retries (same logic as booths page)
    const fitGeoJSONBounds = (fc, attempt = 0) => {
        try {
            const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
            if (!map) {
                if (attempt < 6) {
                    setTimeout(() => fitGeoJSONBounds(fc, attempt + 1), 300);
                }
                return;
            }

            if (!fc || !Array.isArray(fc.features) || fc.features.length === 0) return;

            const coords = [];
            fc.features.forEach(f => {
                const geom = f.geometry;
                if (!geom) return;
                const collect = (arr) => arr.forEach(pt => Array.isArray(pt[0]) ? collect(pt) : coords.push(pt));
                if (geom.type === 'Polygon') collect(geom.coordinates);
                if (geom.type === 'MultiPolygon') geom.coordinates.forEach(poly => collect(poly));
            });

            if (!coords.length) return;

            const lons = coords.map(c => c[0]);
            const lats = coords.map(c => c[1]);
            const bounds = [
                [Math.min(...lons), Math.min(...lats)],
                [Math.max(...lons), Math.max(...lats)]
            ];

            try {
                map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
            } catch (err) {
                if (attempt < 6) {
                    setTimeout(() => fitGeoJSONBounds(fc, attempt + 1), 300);
                } else {
                    console.warn('fitBounds failed after retries:', err);
                }
            }
        } catch (err) {
            if (attempt < 6) {
                setTimeout(() => fitGeoJSONBounds(fc, attempt + 1), 300);
            } else {
                console.warn('fitGeoJSONBounds unexpected error:', err);
            }
        }
    };
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const [boothsWithBLO, setBoothsWithBLO] = useState(new Set());

    // Filters
    const [filters, setFilters] = useState({
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: '',
        blo_name: '',
        contact_number: ''
    });

    const fetchAllBLOsForFilters = async () => {
        try {
            const hierarchyFilters = {};
            if (userHierarchy?.state) hierarchyFilters.state = userHierarchy.state._id || userHierarchy.state;
            if (userHierarchy?.division) hierarchyFilters.division = userHierarchy.division._id || userHierarchy.division;
            if (userHierarchy?.parliament) hierarchyFilters.parliament = userHierarchy.parliament._id || userHierarchy.parliament;
            if (userHierarchy?.assembly) hierarchyFilters.assembly = userHierarchy.assembly._id || userHierarchy.assembly;
            if (userHierarchy?.block) hierarchyFilters.block = userHierarchy.block._id || userHierarchy.block;
            if (userHierarchy?.booth) hierarchyFilters.booth = userHierarchy.booth._id || userHierarchy.booth;

            const data = await fetchAllDataForFilters('/blo', hierarchyFilters);
            setAllBLOs(data);
        } catch (error) {
            console.error('Failed to fetch all BLOs for filters:', error);
        }
    };

    const filterOptions = useFilterOptionsFromData(allBLOs, {
        states: { field: 'state_id', nameField: 'name' },
        divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
        parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
        assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
        blocks: { field: 'block_id', nameField: 'name', parentField: 'assembly_id' },
        booths: { field: 'booth_id', nameField: 'name', parentField: 'block_id' }
    });

    // derive filtered lists for top-level filters so dropdowns cascade
    const filteredDivisions = filterOptions.divisions?.filter(d => (filters.state_id ? (d.state_id?._id || d.state_id) === filters.state_id : true)) || [];
    const filteredParliaments = filterOptions.parliaments?.filter(p => (filters.division_id ? (p.division_id?._id || p.division_id) === filters.division_id : true)) || [];
    const filteredAssemblies = filterOptions.assemblies?.filter(a => (filters.parliament_id ? (a.parliament_id?._id || a.parliament_id) === filters.parliament_id : true)) || [];
    const filteredBlocks = filterOptions.blocks?.filter(b => (filters.assembly_id ? (b.assembly_id?._id || b.assembly_id) === filters.assembly_id : true)) || [];
    const filteredBooths = filterOptions.booths?.filter(b => (filters.block_id ? (b.block_id?._id || b.block_id) === filters.block_id : true)) || [];

    // CSV export
    const csvLinkRef = useRef(null);
    const [csvData, setCsvData] = useState([]);
    const [exportLoading, setExportLoading] = useState(false);

    const columns = useMemo(() => [
        {
            header: 'BLO Name',
            accessorKey: 'blo_name',
            cell: ({ getValue }) => (
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {getValue()}
                </Typography>
            )
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
            header: 'Booth',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => getValue()?.name || 'N/A'
        },
        {
            header: 'Contact Number',
            accessorKey: 'contact_number',
            cell: ({ getValue }) => (
                <Typography variant="body2">
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Actions',
            accessorKey: 'actions',
            enableSorting: false,
            cell: ({ row }) => (
                <Stack direction="row" spacing={1}>
                    <Tooltip title="View Details">
                            <IconButton 
                            onClick={() => navigate(`/blo/${row.original._id}`)}
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
        data: BLOs,
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
        fetchAllBLOsForFilters();
    }, []);

    const fetchHierarchyData = async () => {
        try {
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes] = await Promise.all([
                axiosServices.get('/states?all=true'),
                axiosServices.get('/divisions?all=true'),
                axiosServices.get('/parliaments?all=true'),
                axiosServices.get('/assemblies?all=true'),
                axiosServices.get('/blocks?all=true'),
                axiosServices.get('/booths?all=true')
            ]);

            setStates(statesRes.data.data || []);
            setDivisions(divisionsRes.data.data || []);
            setParliaments(parliamentsRes.data.data || []);
            setAssemblies(assembliesRes.data.data || []);
            setBlocks(blocksRes.data.data || []);
            setBooths(boothsRes.data.data || []);
        } catch (error) {
            console.error('Error fetching hierarchy data:', error);
        }
    };

    // Fetch BLOs data
    useEffect(() => {
        fetchBLOs();
    }, [pagination, sorting, globalFilter, filters]);

    const fetchBLOs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
                ...(globalFilter && { search: globalFilter }),
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            });

            if (sorting.length > 0) {
                params.append('sort', `${sorting[0].desc ? '-' : ''}${sorting[0].id}`);
            }

            const response = await axiosServices.get(`/blos?${params}`);
            const { data, total, pages } = response.data;

            setBLOs(data || []);
            setPageCount(pages || 0);
        } catch (error) {
            console.error('Error fetching BLOs:', error);
            setBLOs([]);
        }
        setLoading(false);
    };

    const handleAdd = () => {
        setSelectedBLO(null);
        setOpenModal(true);
    };

    const handleEdit = (BLO) => {
        setSelectedBLO(BLO);
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
            blo_name: '',
            contact_number: ''
        });
        setGlobalFilter('');
    };

    // Map helpers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('serviceToken');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // Fetch list of booths that already have a BLO
    const fetchBoothsWithBLO = async () => {
        try {
            const res = await axiosServices.get('/blos?all=true&limit=50000');
            const list = res?.data?.data || [];
            const ids = new Set();
            list.forEach(b => {
                const booth = b.booth_id;
                const id = typeof booth === 'string' ? booth : booth?._id;
                if (id) ids.add(String(id));
            });
            setBoothsWithBLO(ids);
        } catch (e) {
            console.warn('Failed to fetch booths with BLO:', e);
        }
    };

    // Load booth polygons like Coding page
    const loadBoothPolygons = async (blockInput) => {
        if (!blockInput) {
            setMapError('Please select a Block');
            return;
        }
        setMapError('');
        try {
            // Fetch booths with BLO markers in parallel
            fetchBoothsWithBLO();

            if (blockInput === 'ALL') {
                const apiUrl = import.meta.env.VITE_APP_API_URL || '';
                const url = `${apiUrl}/booth-polygons?limit=50000&page=1`;
                const resp = await fetch(url, { headers: getAuthHeaders() });
                if (!resp.ok) throw new Error(`Failed to load polygons (${resp.status})`);
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
                // Auto-fit map to polygons
                fitGeoJSONBounds(fc);
                return;
            }

            const candidates = [
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons/block/${encodeURIComponent(blockInput)}`,
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons/block-number/${encodeURIComponent(blockInput)}`,
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons?block=${encodeURIComponent(blockInput)}`
            ];
            let json = null;
            for (const url of candidates) {
                try {
                    const r = await fetch(url, { headers: getAuthHeaders() });
                    if (r.ok) { json = await r.json(); if (json) break; }
                } catch {}
            }
            if (!json) {
                setMapError(`No booth polygons found for block '${blockInput}'`);
                setBoothGeoJSON(null);
                return;
            }
            const fc = { type: 'FeatureCollection', features: json.features || json.data || [] };
            setBoothGeoJSON(fc);
            // Auto-fit map to polygons
            fitGeoJSONBounds(fc);
        } catch (e) {
            setMapError(`Failed to load booth polygons: ${e.message}`);
            setBoothGeoJSON(null);
        }
    };

    // Auto-load ALL polygons when blocks/token ready
    useEffect(() => {
        if (mapboxToken && blocks && blocks.length > 0) {
            loadBoothPolygons('ALL');
        }
    }, [blocks, mapboxToken]);

    // When clicking a polygon, fetch booth + BLO details for drawer
    const fetchBoothDetailsByPolygon = async (boothNo) => {
        try {
            const headers = getAuthHeaders();
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?all=true&limit=10000`, { headers });
            const json = await res.json();
            let booth = null;
            if (json.success && Array.isArray(json.data)) {
                const boothNoStr = String(boothNo || '').trim();
                booth = json.data.find(b => String(b.booth_number).trim() === boothNoStr) ||
                        json.data.find(b => String(b.booth_number).includes(boothNoStr));
            }

            // fetch BLOs for this booth
            let blosForBooth = [];
            if (booth && booth._id) {
                const resB = await fetch(`${import.meta.env.VITE_APP_API_URL}/blos?all=true&booth_id=${encodeURIComponent(booth._id)}`, { headers });
                const jb = await resB.json();
                if (jb && jb.success && Array.isArray(jb.data)) {
                    blosForBooth = jb.data;
                }
            }

            setDrawerData({ loading: false, boothNo, details: { booth, blos: blosForBooth } });
        } catch (e) {
            setDrawerData({ loading: false, boothNo, details: { booth: null, blos: [] }, error: e.message });
        }
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

            const response = await axiosServices.get(`/blos?${params}`);
            const exportData = response.data.data.map(BLO => ({
                'BLO Name': BLO.blo_name,
                'State': BLO.state_id?.name || '',
                'Division': BLO.division_id?.name || '',
                'Parliament': BLO.parliament_id?.name || '',
                'Assembly': BLO.assembly_id?.name || '',
                'Block': BLO.block_id?.name || '',
                'Booth': BLO.booth_id?.name || '',
                'Contact Number': BLO.contact_number || '',
                'Created At': new Date(BLO.created_at).toLocaleDateString(),
                'Updated At': new Date(BLO.updated_at).toLocaleDateString()
            }));

            setCsvData(exportData);
            setTimeout(() => csvLinkRef.current?.link.click(), 100);
        } catch (error) {
            console.error('Error exporting data:', error);
        }
        setExportLoading(false);
    };

    return (
        <MainCard content={false}>
            <Stack spacing={2} sx={{ p: 2 }}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4">BLO Officers Management</Typography>
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
                            Add BLO Officer
                        </Button>
                    </Stack>
                </Stack>

                <Divider />

                {/* Map Section (similar to Coding CRUD) */}
                <Box sx={{ p: 2, pb: 0 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>BLO Coverage Map</Typography>
                    {mapError && (
                        <Alert severity="warning" sx={{ mb: 1 }}>{mapError}</Alert>
                    )}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }}>
                        <TextField
                            select
                            size="small"
                            label="Block"
                            value={blockNumberInput}
                            onChange={(e) => setBlockNumberInput(e.target.value)}
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

                    <Box sx={{ height: 520, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
                        <Map
                            ref={mapRef}
                            mapboxAccessToken={mapboxToken}
                            initialViewState={{ longitude: 75.8577, latitude: 22.7196, zoom: 8 }}
                            mapStyle={
                                mapTheme === 'satellite' ? 'mapbox://styles/mapbox/satellite-v9' :
                                    mapTheme === 'light' ? 'mapbox://styles/mapbox/light-v10' :
                                        mapTheme === 'dark' ? 'mapbox://styles/mapbox/dark-v10' :
                                            'mapbox://styles/mapbox/streets-v11'
                            }
                            interactiveLayerIds={boothGeoJSON ? ['blo-booth-fill'] : []}
                            onClick={async (e) => {
                                if (!boothGeoJSON) return;
                                try {
                                    const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                                    let features = e.features || [];
                                    if ((!features || features.length === 0) && map && map.queryRenderedFeatures) {
                                        features = map.queryRenderedFeatures(e.point);
                                    }
                                    const boothFeature = features.find(f => f.layer && f.layer.id === 'blo-booth-fill') || features[0];
                                    if (boothFeature) {
                                        const props = boothFeature.properties || {};
                                        const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth;
                                        setDrawerOpen(true);
                                        setDrawerData({ loading: true, boothNo });
                                        await fetchBoothDetailsByPolygon(boothNo);
                                    }
                                } catch (err) {
                                    console.error('Error handling map click:', err);
                                }
                            }}
                        >
                            <MapControl />
                            {boothGeoJSON && (
                                <Source id="blo-booth-source" type="geojson" data={boothGeoJSON}>
                                    <Layer id="blo-booth-fill" type="fill" paint={{ 'fill-color': '#1E90FF', 'fill-opacity': 0.25 }} />
                                    <Layer id="blo-booth-outline" type="line" paint={{ 'line-color': '#1E90FF', 'line-width': 2 }} />
                                    <Layer
                                        id="blo-booth-label"
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

                            {/* BLO Markers Layer */}
                            {boothGeoJSON && (
                                <Source
                                    id="blo-booth-markers"
                                    type="geojson"
                                    data={{
                                        type: 'FeatureCollection',
                                        features: boothGeoJSON.features.map(feature => {
                                            const props = feature.properties || {};
                                            const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth;
                                            let coordinates = [0, 0];
                                            if (feature.geometry?.type === 'Polygon' && feature.geometry.coordinates?.[0]) {
                                                const coords = feature.geometry.coordinates[0];
                                                const lngs = coords.map(c => c[0]);
                                                const lats = coords.map(c => c[1]);
                                                coordinates = [
                                                    lngs.reduce((a, b) => a + b, 0) / lngs.length,
                                                    lats.reduce((a, b) => a + b, 0) / lats.length
                                                ];
                                            } else if (feature.geometry?.type === 'MultiPolygon' && feature.geometry.coordinates?.[0]?.[0]) {
                                                const coords = feature.geometry.coordinates[0][0];
                                                const lngs = coords.map(c => c[0]);
                                                const lats = coords.map(c => c[1]);
                                                coordinates = [
                                                    lngs.reduce((a, b) => a + b, 0) / lngs.length,
                                                    lats.reduce((a, b) => a + b, 0) / lats.length
                                                ];
                                            }

                                            const hasBLO = (() => {
                                                // Try to map booth number to booth id from loaded booths
                                                const boothEntry = booths.find(b => String(b.booth_number) === String(boothNo));
                                                const id = boothEntry?._id && String(boothEntry._id);
                                                return id ? boothsWithBLO.has(id) : false;
                                            })();

                                            return {
                                                type: 'Feature',
                                                geometry: { type: 'Point', coordinates },
                                                properties: { ...props, hasBLO }
                                            };
                                        })
                                    }}
                                >
                                    <Layer
                                        id="blo-booth-blo-markers"
                                        type="circle"
                                        paint={{
                                            'circle-radius': 6,
                                            'circle-color': [
                                                'case',
                                                ['get', 'hasBLO'],
                                                '#22c55e',
                                                '#ef4444'
                                            ],
                                            'circle-stroke-width': 2,
                                            'circle-stroke-color': '#ffffff',
                                            'circle-opacity': 0.9
                                        }}
                                    />
                                </Source>
                            )}
                        </Map>
                    </Box>

                    {/* Map Legend */}
                    <Paper elevation={2} sx={{ mt: 1, p: 1.5, display: 'inline-block' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Map Legend</Typography>
                        <Stack direction="row" spacing={3}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#22c55e', border: '2px solid #ffffff', boxShadow: 1 }} />
                                <Typography variant="caption">Has BLO</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#ef4444', border: '2px solid #ffffff', boxShadow: 1 }} />
                                <Typography variant="caption">No BLO</Typography>
                            </Stack>
                        </Stack>
                    </Paper>

                    {/* Right-side Drawer */}
                    <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                        <Box sx={{ width: { xs: 340, sm: 480 }, p: 0, height: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper }}>
                                <Box>
                                    <Typography variant="h6">Booth Details</Typography>
                                    <Typography variant="caption" color="text.secondary">Click a booth polygon to view BLO entries</Typography>
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
                                            <Typography variant="body2"><strong>Booth No:</strong> {drawerData.details.booth?.booth_number || drawerData.boothNo || 'N/A'}</Typography>
                                            <Typography variant="body2"><strong>Block:</strong> {drawerData.details.booth?.block_id?.name || 'N/A'}</Typography>
                                            <Typography variant="body2"><strong>Assembly:</strong> {drawerData.details.booth?.assembly_id?.name || 'N/A'}</Typography>
                                            <Typography variant="body2"><strong>Parliament:</strong> {drawerData.details.booth?.parliament_id?.name || 'N/A'}</Typography>
                                        </Paper>

                                        <Paper elevation={0} sx={{ p: 1 }}>
                                            <Typography variant="subtitle2">BLO Entries ({drawerData.details.blos?.length || 0})</Typography>
                                            {drawerData.details.blos?.length ? drawerData.details.blos.slice(0, 20).map(b => (
                                                <Box key={b._id} sx={{ mb: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, cursor: 'pointer' }}
                                                     onClick={() => navigate(`/blo/${b._id}`)}>
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{b.blo_name || 'N/A'}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {b.contact_number || ''}
                                                    </Typography>
                                                </Box>
                                            )) : (
                                                <Typography variant="body2">No BLO entries found for this booth.</Typography>
                                            )}
                                        </Paper>
                                    </Stack>
                                )}
                            </Box>
                        </Box>
                    </Drawer>
                </Box>

                {/* Filters */}
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            placeholder="Search BLOs..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                        />
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
                                {filterOptions.states?.map(state => (
                                    <MenuItem key={state._id} value={state._id}>
                                        {state.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Division</InputLabel>
                            <Select
                                value={filters.division_id}
                                onChange={(e) => handleFilterChange('division_id', e.target.value)}
                                label="Division"
                            >
                                <MenuItem value="">All Divisions</MenuItem>
                                {filteredDivisions.map(division => (
                                    <MenuItem key={division._id} value={division._id}>
                                        {division.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            placeholder="BLO Name"
                            value={filters.blo_name}
                            onChange={(e) => handleFilterChange('blo_name', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Parliament</InputLabel>
                            <Select
                                value={filters.parliament_id}
                                onChange={(e) => handleFilterChange('parliament_id', e.target.value)}
                                label="Parliament"
                            >
                                <MenuItem value="">All Parliaments</MenuItem>
                                {filteredParliaments.map(parliament => (
                                    <MenuItem key={parliament._id} value={parliament._id}>
                                        {parliament.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Assembly</InputLabel>
                            <Select
                                value={filters.assembly_id}
                                onChange={(e) => handleFilterChange('assembly_id', e.target.value)}
                                label="Assembly"
                            >
                                <MenuItem value="">All Assemblies</MenuItem>
                                {filteredAssemblies.map(assembly => (
                                    <MenuItem key={assembly._id} value={assembly._id}>
                                        {assembly.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Block</InputLabel>
                            <Select
                                value={filters.block_id}
                                onChange={(e) => handleFilterChange('block_id', e.target.value)}
                                label="Block"
                            >
                                <MenuItem value="">All Blocks</MenuItem>
                                {filteredBlocks.map(block => (
                                    <MenuItem key={block._id} value={block._id}>
                                        {block.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Booth</InputLabel>
                            <Select
                                value={filters.booth_id}
                                onChange={(e) => handleFilterChange('booth_id', e.target.value)}
                                label="Booth"
                            >
                                <MenuItem value="">All Booths</MenuItem>
                                {filteredBooths.map(booth => (
                                    <MenuItem key={booth._id} value={booth._id}>
                                        {booth.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            placeholder="Contact Number"
                            value={filters.contact_number}
                            onChange={(e) => handleFilterChange('contact_number', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={1}>
                        <Button fullWidth variant="outlined" onClick={clearFilters}>
                            Clear
                        </Button>
                    </Grid>
                </Grid>

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
                    filename={`BLOs-export-${new Date().toISOString().split('T')[0]}.csv`}
                    style={{ display: 'none' }}
                />
            </Stack>

            {/* Modals */}
            <BLOModal
                open={openModal}
                modalToggler={() => setOpenModal(false)}
                BLO={selectedBLO}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                refresh={fetchBLOs}
            />

            <AlertBLODelete
                id={deleteAlert.id}
                title={selectedBLO?.BLO_name}
                open={deleteAlert.open}
                handleClose={() => setDeleteAlert({ open: false, id: null })}
                refresh={fetchBLOs}
            />
        </MainCard>
    );
};

export default BLOListPage;
