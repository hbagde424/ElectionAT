import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Stack, Typography, Box, Tooltip, Divider, Chip, Avatar, Grid,
    IconButton, Select, MenuItem, FormControl, InputLabel, TextField, Alert,
    Drawer, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress
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
import { useCsvOtp } from 'hooks/useCsvOtp';
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
import MaskedPhoneNumber from 'components/MaskedPhoneNumber';
import StarRating from 'components/StarRating';

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
    const [electionYears, setElectionYears] = useState([]);

    // Map related state
    const [blockNumberInput, setBlockNumberInput] = useState('ALL');
    const [mapTheme, setMapTheme] = useState('streets');
    const [boothGeoJSON, setBoothGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [selectedMapYear, setSelectedMapYear] = useState('');
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

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
        contact_number: '',
        designation: '',
        election_year_id: ''
    });

    // Temporary filters (for UI before Apply)
    const [tempFilters, setTempFilters] = useState({
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: '',
        blo_name: '',
        contact_number: '',
        designation: '',
        election_year_id: ''
    });

    // Applied filters (for actual API calls)
    const [appliedFilters, setAppliedFilters] = useState({
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: '',
        blo_name: '',
        contact_number: '',
        designation: '',
        election_year_id: ''
    });

    const fetchAllBLOsForFilters = async () => {
        try {
            const query = {};
            if (userHierarchy?.state) query.state_id = userHierarchy.state._id || userHierarchy.state;
            if (userHierarchy?.division) query.division_id = userHierarchy.division._id || userHierarchy.division;
            if (userHierarchy?.parliament) query.parliament_id = userHierarchy.parliament._id || userHierarchy.parliament;
            if (userHierarchy?.assembly) query.assembly_id = userHierarchy.assembly._id || userHierarchy.assembly;
            if (userHierarchy?.block) query.block_id = userHierarchy.block._id || userHierarchy.block;
            if (userHierarchy?.booth) query.booth_id = userHierarchy.booth._id || userHierarchy.booth;
            if (appliedFilters?.state_id) query.state_id = appliedFilters.state_id;
            if (appliedFilters?.division_id) query.division_id = appliedFilters.division_id;
            if (appliedFilters?.parliament_id) query.parliament_id = appliedFilters.parliament_id;
            if (appliedFilters?.assembly_id) query.assembly_id = appliedFilters.assembly_id;
            if (appliedFilters?.block_id) query.block_id = appliedFilters.block_id;
            if (appliedFilters?.booth_id) query.booth_id = appliedFilters.booth_id;
            if (appliedFilters?.blo_name) query.blo_name = appliedFilters.blo_name;
            if (appliedFilters?.designation) query.designation = appliedFilters.designation;
            if (globalFilter) query.search = globalFilter;

            const data = await fetchAllDataForFilters('/blos', query);
            setAllBLOs(data);
        } catch (error) {
            console.error('Failed to fetch all blos for filters:', error);
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
    const filteredDivisions = filterOptions.divisions?.filter(d => (tempFilters.state_id ? (d.state_id?._id || d.state_id) === tempFilters.state_id : true)) || [];
    const filteredParliaments = filterOptions.parliaments?.filter(p => (tempFilters.division_id ? (p.division_id?._id || p.division_id) === tempFilters.division_id : true)) || [];
    const filteredAssemblies = filterOptions.assemblies?.filter(a => (tempFilters.parliament_id ? (a.parliament_id?._id || a.parliament_id) === tempFilters.parliament_id : true)) || [];
    const filteredBlocks = filterOptions.blocks?.filter(b => (tempFilters.assembly_id ? (b.assembly_id?._id || b.assembly_id) === tempFilters.assembly_id : true)) || [];
    const filteredBooths = filterOptions.booths?.filter(b => (tempFilters.block_id ? (b.block_id?._id || b.block_id) === tempFilters.block_id : true)) || [];

    // CSV export
    const csvLinkRef = useRef(null);
    const [csvData, setCsvData] = useState([]);
    const [exportLoading, setExportLoading] = useState(false);
    const {
        otpDialogOpen,
        otpCode,
        setOtpCode,
        loading: otpLoading,
        maskedDest,
        error: otpError,
        requestOtp,
        verifyOtp,
        closeDialog
    } = useCsvOtp();

    // Excel import states
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const importInputRef = useRef();

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
            header: 'Status',
            accessorKey: 'is_active',
            cell: ({ getValue }) => (
                <Chip 
                    label={getValue() ? 'Active' : 'Inactive'} 
                    color={getValue() ? 'success' : 'error'}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Designation',
            accessorKey: 'designation',
            cell: ({ getValue }) => (
                <Typography variant="body2" sx={{ 
                    maxWidth: 200, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue() || 'N/A'}
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
            header: 'Booth Number',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {getValue()?.booth_number || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Booth Name',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Typography variant="body2">
                    {getValue()?.name || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Election Year',
            accessorKey: 'election_year_id',
            cell: ({ getValue }) => (
                <Typography variant="body2">
                    {getValue()?.year || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Contact Number',
            accessorKey: 'contact_number',
            cell: ({ getValue, row }) => (
                <MaskedPhoneNumber 
                    maskedNumber={getValue() || 'N/A'} 
                    bloId={row.original._id}
                />
            )
        },
        {
            header: 'Email',
            accessorKey: 'email',
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
                            onClick={() => navigate(`/BLO/${row.original._id}`)}
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

    // Keep filter options in sync with current applied filters
    useEffect(() => {
        fetchAllBLOsForFilters();
    }, [JSON.stringify(appliedFilters)]);

    const fetchHierarchyData = async () => {
        try {
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes, electionYearsRes] = await Promise.all([
                axiosServices.get('/states?all=true'),
                axiosServices.get('/divisions?all=true'),
                axiosServices.get('/parliaments?all=true'),
                axiosServices.get('/assemblies?all=true'),
                axiosServices.get('/blocks?all=true'),
                axiosServices.get('/booths?all=true'),
                axiosServices.get('/election-years?all=true')
            ]);

            // Handle different response structures
            const getDataFromResponse = (res) => {
                if (res.data?.data) return res.data.data;
                if (res.data?.success && Array.isArray(res.data.data)) return res.data.data;
                if (Array.isArray(res.data)) return res.data;
                return [];
            };

            const statesData = getDataFromResponse(statesRes);
            const divisionsData = getDataFromResponse(divisionsRes);
            const parliamentsData = getDataFromResponse(parliamentsRes);
            const assembliesData = getDataFromResponse(assembliesRes);
            const blocksData = getDataFromResponse(blocksRes);
            const boothsData = getDataFromResponse(boothsRes);
            const electionYearsData = getDataFromResponse(electionYearsRes);

            setStates(statesData);
            setDivisions(divisionsData);
            setParliaments(parliamentsData);
            setAssemblies(assembliesData);
            setBlocks(blocksData);
            setBooths(boothsData);
            setElectionYears(electionYearsData);
        } catch (error) {
            console.error('Error fetching hierarchy data:', error);
        }
    };

    // Helper: fit map to GeoJSON feature collection bounds with retries
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

    // Map helpers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('serviceToken');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // Fetch list of booths that already have a BLO (optionally filtered by year)
    const fetchBoothsWithBLO = async (year = '') => {
        try {
            let url = '/blos?all=true&limit=50000';
            if (year) {
                url += `&election_year_id=${year}`;
            }
            const res = await axiosServices.get(url);
            const list = res?.data?.data || [];
            
            // Create a Set of booth numbers (not IDs) that have blos
            const boothNumbers = new Set();
            list.forEach(b => {
                const booth = b.booth_id;
                const boothNumber = typeof booth === 'string' ? booth : booth?.booth_number;
                if (boothNumber) {
                    boothNumbers.add(String(boothNumber).trim());
                }
            });
            console.debug('[BLO Map] Fetched booths with BLO:', boothNumbers.size, 'year:', year || 'all', 'booth numbers:', Array.from(boothNumbers).slice(0, 5));
            setBoothsWithBLO(boothNumbers);
        } catch (e) {
            console.warn('Failed to fetch booths with BLO:', e);
        }
    };

    // Load booth polygons
    const loadBoothPolygons = async (blockInput) => {
        if (!blockInput) {
            setMapError('Please select a Block');
            return;
        }
        setMapError('');
        try {
            // Fetch booths with BLO markers in parallel, filtered by year if selected
            fetchBoothsWithBLO(selectedMapYear);

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
                } catch { }
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

    // Refresh BLO markers when year filter changes
    useEffect(() => {
        if (boothGeoJSON) {
            fetchBoothsWithBLO(selectedMapYear);
        }
    }, [selectedMapYear]);

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

            // fetch blos for this booth (with year filter if selected)
            let blosForBooth = [];
            if (booth && booth._id) {
                let bloUrl = `${import.meta.env.VITE_APP_API_URL}/blos?all=true&booth_id=${encodeURIComponent(booth._id)}`;
                if (selectedMapYear) {
                    bloUrl += `&election_year_id=${encodeURIComponent(selectedMapYear)}`;
                }
                const resB = await fetch(bloUrl, { headers });
                const jb = await resB.json();
                if (jb && jb.success && Array.isArray(jb.data)) {
                    blosForBooth = jb.data;
                }
            }

            console.debug('[BLO Map] Fetched booth details:', booth?.booth_number, 'blos:', blosForBooth.length);

            // also set table filters to this booth so the table below shows related data
            if (booth && booth._id) {
                handlePolygonSelectSetFilter(booth);
            }
            setDrawerData({ loading: false, boothNo, details: { booth, blos: blosForBooth } });
        } catch (e) {
            console.error('[BLO Map] Error fetching booth details:', e);
            setDrawerData({ loading: false, boothNo, details: { booth: null, blos: [] }, error: e.message });
        }
    };

    // When a polygon is selected on the map we also want the table to filter to that booth
    const handlePolygonSelectSetFilter = (booth) => {
        try {
            const boothId = booth?._id || booth;
            if (!boothId) return;
            console.debug('[BLO] polygon selected booth id:', boothId);
            setTempFilters(prev => ({ ...prev, booth_id: boothId }));
            setAppliedFilters(prev => ({ ...prev, booth_id: boothId }));
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
        } catch (err) {
            console.warn('Failed to set polygon booth filter:', err);
        }
    };
    useEffect(() => {
        fetchBLOs();
    }, [pagination, sorting, globalFilter, appliedFilters]);

    const fetchBLOs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
                ...(globalFilter && { search: globalFilter }),
                ...Object.fromEntries(Object.entries(appliedFilters).filter(([_, v]) => v))
            });

            if (sorting.length > 0) {
                params.append('sort', `${sorting[0].desc ? '-' : ''}${sorting[0].id}`);
            }

            const response = await axiosServices.get(`/blos?${params}`);
            const { data, total, pages } = response.data;

            setBLOs(data || []);
            setPageCount(pages || 0);
        } catch (error) {
            console.error('Error fetching blos:', error);
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
        setTempFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        setAppliedFilters(tempFilters);
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    };

    const clearFilters = () => {
        const emptyFilters = {
            state_id: '',
            division_id: '',
            parliament_id: '',
            assembly_id: '',
            block_id: '',
            booth_id: '',
            blo_name: '',
            contact_number: '',
            designation: '',
            election_year_id: ''
        };
        setTempFilters(emptyFilters);
        setAppliedFilters(emptyFilters);
        setGlobalFilter('');
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    };

    // CSV Export (OTP-protected)
    const startCsvDownload = async () => {
        setExportLoading(true);
        try {
            const params = new URLSearchParams({
                all: 'true',
                ...(globalFilter && { search: globalFilter }),
                ...Object.fromEntries(Object.entries(appliedFilters).filter(([_, v]) => v))
            });

            const response = await axiosServices.get(`/blos?${params}`);
            const exportData = response.data.data.map(BLO => ({
                'BLO Name': BLO.blo_name,
                'Status': BLO.is_active ? 'Active' : 'Inactive',
                'Contact Number': BLO.contact_number || '',
                'Email': BLO.email || '',
                'Designation': BLO.designation || '',
                'State': BLO.state_id?.name || '',
                'Division': BLO.division_id?.name || '',
                'Parliament': BLO.parliament_id?.name || '',
                'Assembly': BLO.assembly_id?.name || '',
                'Block': BLO.block_id?.name || '',
                'Booth Number': BLO.booth_id?.booth_number || '',
                'Booth Name': BLO.booth_id?.name || '',
                'Election Year': BLO.election_year_id?.year || '',
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

    const handleExport = async () => {
        await requestOtp(startCsvDownload);
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

                {/* Map Section */}
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
                        <TextField
                            select
                            size="small"
                            label="Election Year"
                            value={selectedMapYear}
                            onChange={(e) => setSelectedMapYear(e.target.value)}
                            sx={{ width: { xs: '100%', sm: 200 } }}
                        >
                            <MenuItem value="">All Years</MenuItem>
                            {electionYears?.map((y) => (
                                <MenuItem key={y._id} value={y._id}>{y.year}</MenuItem>
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
                            interactiveLayerIds={boothGeoJSON ? ['BLO-booth-fill'] : []}
                            onClick={async (e) => {
                                if (!boothGeoJSON) return;
                                try {
                                    const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                                    let features = e.features || [];
                                    if ((!features || features.length === 0) && map && map.queryRenderedFeatures) {
                                        features = map.queryRenderedFeatures(e.point);
                                    }
                                    const boothFeature = features.find(f => f.layer && f.layer.id === 'BLO-booth-fill') || features[0];
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
                                <Source id="BLO-booth-source" type="geojson" data={boothGeoJSON}>
                                    <Layer id="BLO-booth-fill" type="fill" paint={{ 'fill-color': '#1E90FF', 'fill-opacity': 0.25 }} />
                                    <Layer id="BLO-booth-outline" type="line" paint={{ 'line-color': '#1E90FF', 'line-width': 2 }} />
                                    <Layer
                                        id="BLO-booth-label"
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
                                    id="BLO-booth-markers"
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
                                                // Match booth number directly from polygon with booth numbers that have blos
                                                const boothNoStr = String(boothNo || '').trim();
                                                const hasIt = boothsWithBLO.has(boothNoStr);
                                                
                                                // Also try numeric comparison in case of formatting differences
                                                if (!hasIt && boothNoStr) {
                                                    const boothNoNum = parseInt(boothNoStr, 10);
                                                    for (let bn of boothsWithBLO) {
                                                        if (parseInt(bn, 10) === boothNoNum) {
                                                            return true;
                                                        }
                                                    }
                                                }
                                                
                                                if (hasIt) {
                                                    console.debug('[BLO Map] Found BLO for booth number:', boothNoStr);
                                                }
                                                return hasIt;
                                            })();

                                            return {
                                                type: 'Feature',
                                                geometry: { type: 'Point', coordinates },
                                                properties: { ...props, hasBLO: hasBLO ? 1 : 0 }
                                            };
                                        })
                                    }}
                                >
                                    <Layer
                                        id="BLO-booth-BLO-markers"
                                        type="circle"
                                        paint={{
                                            'circle-radius': 6,
                                            'circle-color': [
                                                'case',
                                                ['==', ['get', 'hasBLO'], 1],
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
                                                <Box key={b._id} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, cursor: 'pointer' }}
                                                    onClick={() => navigate(`/BLO/${b._id}`)}>
                                                    
                                                    {/* BLO Name and Status */}
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                                                Name:
                                                            </Typography>
                                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                                                {b.blo_name || 'N/A'}
                                                            </Typography>
                                                        </Stack>
                                                        <Chip 
                                                            label={b.is_active ? 'Active' : 'Inactive'} 
                                                            color={b.is_active ? 'success' : 'error'}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </Stack>

                                                    {/* Contact Number */}
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                                                            <strong>Mobile:</strong>
                                                        </Typography>
                                                        <MaskedPhoneNumber 
                                                            maskedNumber={b.contact_number || 'N/A'} 
                                                            bloId={b._id}
                                                        />
                                                    </Stack>

                                                    {/* Email */}
                                                    {b.email && (
                                                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                                                                <strong>Email:</strong>
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ 
                                                                flex: 1,
                                                                wordBreak: 'break-word'
                                                            }}>
                                                                {b.email}
                                                            </Typography>
                                                        </Stack>
                                                    )}

                                                    {/* Designation */}
                                                    {b.designation && (
                                                        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                                                                <strong>Designation:</strong>
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ 
                                                                flex: 1,
                                                                wordBreak: 'break-word'
                                                            }}>
                                                                {b.designation}
                                                            </Typography>
                                                        </Stack>
                                                    )}

                                                    {/* Election Year */}
                                                    {b.election_year_id && (
                                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 60 }}>
                                                                <strong>Year:</strong>
                                                            </Typography>
                                                            <Typography variant="caption">
                                                                {b.election_year_id?.year || 'N/A'}
                                                            </Typography>
                                                        </Stack>
                                                    )}

                                                    {/* Hierarchy Information */}
                                                    <Divider sx={{ my: 1 }} />
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                                                        Hierarchy:
                                                    </Typography>
                                                    
                                                    <Stack spacing={0.5}>
                                                        <Typography variant="caption">
                                                            <strong>State:</strong> {b.state_id?.name || 'N/A'}
                                                        </Typography>
                                                        <Typography variant="caption">
                                                            <strong>Division:</strong> {b.division_id?.name || 'N/A'}
                                                        </Typography>
                                                        <Typography variant="caption">
                                                            <strong>Parliament:</strong> {b.parliament_id?.name || 'N/A'}
                                                        </Typography>
                                                        <Typography variant="caption">
                                                            <strong>Assembly:</strong> {b.assembly_id?.name || 'N/A'}
                                                        </Typography>
                                                        <Typography variant="caption">
                                                            <strong>Block:</strong> {b.block_id?.name || 'N/A'}
                                                        </Typography>
                                                    </Stack>

                                                    {/* Created/Updated Info */}
                                                    <Divider sx={{ my: 1 }} />
                                                    <Stack direction="row" justifyContent="space-between">
                                                        <Typography variant="caption" color="text.secondary">
                                                            Created: {b.created_at ? new Date(b.created_at).toLocaleDateString() : 'N/A'}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Updated: {b.updated_at ? new Date(b.updated_at).toLocaleDateString() : 'N/A'}
                                                        </Typography>
                                                    </Stack>
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

                <Divider />

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
                                value={tempFilters.state_id}
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
                                value={tempFilters.division_id}
                                onChange={(e) => handleFilterChange('division_id', e.target.value)}
                                label="Division"
                                disabled={!tempFilters.state_id}
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
                            value={tempFilters.blo_name}
                            onChange={(e) => handleFilterChange('blo_name', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={1}>
                        <Button fullWidth variant="contained" onClick={applyFilters}>
                            Apply
                        </Button>
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

                {/* OTP Dialog for CSV export */}
                <Dialog open={otpDialogOpen} onClose={closeDialog} fullWidth maxWidth="xs">
                    <DialogTitle>Enter OTP to download CSV</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" sx={{ mb: 1 }}>OTP will be sent to: {maskedDest || 'your registered number'}</Typography>
                        <TextField
                            label="OTP"
                            fullWidth
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            margin="dense"
                        />
                        {otpError && <Alert severity="error" sx={{ mt: 1 }}>{otpError}</Alert>}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeDialog}>Cancel</Button>
                        <Button onClick={verifyOtp} variant="contained" disabled={otpLoading}>
                            {otpLoading ? <CircularProgress size={18} /> : 'Verify & Download'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Hidden CSV export link */}
                <CSVLink
                    ref={csvLinkRef}
                    data={csvData}
                    filename={`blos-export-${new Date().toISOString().split('T')[0]}.csv`}
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
                electionYears={electionYears}
                refresh={fetchBLOs}
            />

            <AlertBLODelete
                id={deleteAlert.id}
                title={selectedBLO?.blo_name}
                open={deleteAlert.open}
                handleClose={() => setDeleteAlert({ open: false, id: null })}
                refresh={fetchBLOs}
            />
        </MainCard>
    );
};

export default BLOListPage;