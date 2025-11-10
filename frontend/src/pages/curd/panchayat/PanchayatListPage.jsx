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
import PanchayatModal from './PanchayatModal';
import AlertPanchayatDelete from './AlertPanchayatDelete';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';

const PanchayatListPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();
    const [panchayats, setPanchayats] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [selectedPanchayat, setSelectedPanchayat] = useState(null);
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

    // Filters
    const [filters, setFilters] = useState({
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: '',
        panchayat_name: '',
        location: ''
    });

    // derive filtered lists for top-level filters so dropdowns cascade
    const filteredDivisions = divisions.filter(d => (filters.state_id ? (d.state_id?._id || d.state_id) === filters.state_id : true));
    const filteredParliaments = parliaments.filter(p => (filters.division_id ? (p.division_id?._id || p.division_id) === filters.division_id : true));
    const filteredAssemblies = assemblies.filter(a => (filters.parliament_id ? (a.parliament_id?._id || a.parliament_id) === filters.parliament_id : true));
    const filteredBlocks = blocks.filter(b => (filters.assembly_id ? (b.assembly_id?._id || b.assembly_id) === filters.assembly_id : true));
    const filteredBooths = booths.filter(b => (filters.block_id ? (b.block_id?._id || b.block_id) === filters.block_id : true));

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
    const [boothsWithPanchayat, setBoothsWithPanchayat] = useState(new Set());
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    const columns = useMemo(() => [
        {
            header: 'Panchayat Name',
            accessorKey: 'panchayat_name',
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
                            onClick={() => navigate(`/panchayat/${row.original._id}`)}
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
        data: panchayats,
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

    // Fetch panchayats data
    useEffect(() => {
        fetchPanchayats();
    }, [pagination, sorting, globalFilter, filters, yearFilter]);

    const fetchPanchayats = async () => {
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

            const response = await axiosServices.get(`/panchayats?${params}`);
            const { data, total, pages } = response.data;

            setPanchayats(data || []);
            setPageCount(pages || 0);
        } catch (error) {
            console.error('Error fetching panchayats:', error);
            setPanchayats([]);
        }
        setLoading(false);
    };

    const handleAdd = () => {
        setSelectedPanchayat(null);
        setOpenModal(true);
    };

    const handleEdit = (panchayat) => {
        setSelectedPanchayat(panchayat);
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
            panchayat_name: '',
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

            const response = await axiosServices.get(`/panchayats?${params}`);
            const exportData = response.data.data.map(panchayat => ({
                'Panchayat Name': panchayat.panchayat_name,
                'State': panchayat.state_id?.name || '',
                'Division': panchayat.division_id?.name || '',
                'Parliament': panchayat.parliament_id?.name || '',
                'Assembly': panchayat.assembly_id?.name || '',
                'Block': panchayat.block_id?.name || '',
                'Booth': panchayat.booth_id?.name || '',
                'Location': panchayat.location || '',
                'Latitude': panchayat.latitude || '',
                'Longitude': panchayat.longitude || '',
                'Male Count': panchayat.male_count || 0,
                'Female Count': panchayat.female_count || 0,
                'Others Count': panchayat.others_count || 0,
                'Total Count': panchayat.total_count || 0,
                'Created At': new Date(panchayat.created_at).toLocaleDateString(),
                'Updated At': new Date(panchayat.updated_at).toLocaleDateString()
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

    const panchayatBoothNumberSet = useMemo(() => {
        const set = new Set();
        try {
            Array.from(boothsWithPanchayat || []).forEach((id) => {
                const booth = booths?.find((b) => String(b._id) === String(id));
                const num = booth && String(booth.booth_number).trim().toLowerCase();
                if (num) set.add(num);
            });
        } catch { }
        return set;
    }, [boothsWithPanchayat, booths]);

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
            const hasPanchayat = boothNumNorm && panchayatBoothNumberSet.has(boothNumNorm);

            features.push({
                type: 'Feature',
                geometry: { type: 'Point', coordinates },
                properties: { ...props, hasPanchayat, boothNumber: boothNoRaw }
            });
        }

        return { type: 'FeatureCollection', features };
    }, [boothGeoJSON, panchayatBoothNumberSet]);

    const fetchBoothsWithPanchayat = async (selectedYear = yearFilter) => {
        try {
            console.log('Fetching booths with panchayats (Year: ' + (selectedYear || 'All') + ')');
            const headers = getAuthHeaders();
            let url = `${import.meta.env.VITE_APP_API_URL}/panchayats?all=true`;
            if (selectedYear) url += `&year=${selectedYear}`;

            const resp = await fetch(url, { headers });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            const panchayatItems = data.data || [];

            const boothIdSet = new Set();
            panchayatItems.forEach((p) => {
                if (p.booth_id && p.booth_id._id) boothIdSet.add(String(p.booth_id._id));
                else if (p.booth_id) boothIdSet.add(String(p.booth_id));
            });

            setBoothsWithPanchayat(boothIdSet);
            console.log('Booths with panchayats:', boothIdSet.size);
        } catch (error) {
            console.error('Error fetching booths with panchayats:', error);
            setBoothsWithPanchayat(new Set());
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
            fetchBoothsWithPanchayat(yearFilter);

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
                    setMapError(`No polygons found for block: ${blockNum}`);
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
                let panchayatUrl = `${import.meta.env.VITE_APP_API_URL}/panchayats?booth_id=${encodeURIComponent(booth._id)}`;
                if (yearFilter) panchayatUrl += `&year=${yearFilter}`;

                const panchayatResp = await fetch(panchayatUrl, { headers });
                if (!panchayatResp.ok) throw new Error(`HTTP ${panchayatResp.status}`);
                const panchayatData = await panchayatResp.json();

                setDrawerData({
                    booth,
                    panchayats: panchayatData.data || []
                });
                setDrawerOpen(true);
            }
        } catch (error) {
            console.error('Error fetching booth details:', error);
            setDrawerData({ booth, panchayats: [] });
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
            fetchBoothsWithPanchayat(yearFilter);
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
        }
    }, [yearFilter]);

    return (
        <MainCard content={false}>
            <Stack spacing={2} sx={{ p: 2 }}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4">Panchayat Management</Typography>
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
                            Add Panchayat
                        </Button>
                    </Stack>
                </Stack>

                <Divider />

                {/* Filters */}
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            placeholder="Search panchayats..."
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
                                {states.map(state => (
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
                            placeholder="Panchayat Name"
                            value={filters.panchayat_name}
                            onChange={(e) => handleFilterChange('panchayat_name', e.target.value)}
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
                                                    ['get', 'hasPanchayat'],
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
                                <Typography variant="caption">Has Panchayat</Typography>
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
                                <Typography variant="caption">No Panchayat</Typography>
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
                    filename={`panchayats-export-${new Date().toISOString().split('T')[0]}.csv`}
                    style={{ display: 'none' }}
                />
            </Stack>

            {/* Modals */}
            <PanchayatModal
                open={openModal}
                modalToggler={() => setOpenModal(false)}
                panchayat={selectedPanchayat}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                refresh={() => {
                    fetchPanchayats();
                    fetchBoothsWithPanchayat(yearFilter);
                }}
            />

            <AlertPanchayatDelete
                id={deleteAlert.id}
                title={selectedPanchayat?.panchayat_name}
                open={deleteAlert.open}
                handleClose={() => setDeleteAlert({ open: false, id: null })}
                refresh={() => {
                    fetchPanchayats();
                    fetchBoothsWithPanchayat(yearFilter);
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
                                    Panchayats ({drawerData.panchayats?.length || 0})
                                </Typography>
                                {drawerData.panchayats && drawerData.panchayats.length > 0 ? (
                                    <Stack spacing={1.5}>
                                        {drawerData.panchayats.map((panchayat, idx) => (
                                            <Paper key={idx} elevation={1} sx={{ p: 2 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                                    {panchayat.panchayat_name}
                                                </Typography>
                                                <Grid container spacing={1}>
                                                    <Grid item xs={6}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            State
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {panchayat.state_id?.name || 'N/A'}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Division
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {panchayat.division_id?.name || 'N/A'}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Parliament
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {panchayat.parliament_id?.name || 'N/A'}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Assembly
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {panchayat.assembly_id?.name || 'N/A'}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Location
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {panchayat.location || 'N/A'}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <Stack direction="row" spacing={1}>
                                                            <Chip label={`Total: ${panchayat.total_count || 0}`} size="small" color="primary" />
                                                            <Chip label={`M: ${panchayat.male_count || 0}`} size="small" color="info" />
                                                            <Chip label={`F: ${panchayat.female_count || 0}`} size="small" color="secondary" />
                                                            <Chip label={`O: ${panchayat.others_count || 0}`} size="small" color="warning" />
                                                        </Stack>
                                                    </Grid>
                                                </Grid>
                                            </Paper>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Alert severity="info">No panchayats found for this booth</Alert>
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

export default PanchayatListPage;