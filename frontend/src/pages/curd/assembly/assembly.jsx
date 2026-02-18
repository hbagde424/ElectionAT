import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, TextField, MenuItem, Tooltip, Alert, Drawer, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash } from 'iconsax-react';
import { useNavigate } from 'react-router-dom';
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
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';
import { usePermissions } from 'contexts/PermissionContext';
import { useCsvOtp } from 'hooks/useCsvOtp';

import AssemblyModal from './assemblyModal';
import AlertAssemblyDelete from './AlertAssemblyDelete';
import AssemblyView from './assemblyView';
import AssemblyPolygonUpload from './assemblyPolygonUpload';

export default function assembliesListPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy } = usePermissions();

    const [selectedAssembly, setSelectedAssembly] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [assemblyDeleteId, setassemblyDeleteId] = useState('');
    const [assemblies, setassemblies] = useState([]);
    const [allAssemblies, setallAssemblies] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [users, setUsers] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState({
        state_id: '',
        division_id: '',
        parliament_id: ''
    });
    const csvLinkRef = useRef();
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const importInputRef = useRef();

    // Map & Drawer state
    const [assemblyGeoJSON, setassemblyGeoJSON] = useState(null);
    const [allAssemblyGeoJSON, setallAssemblyGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;
    const [openPolygonUpload, setOpenPolygonUpload] = useState(false);

    const fetchAllAssembliesForFilters = async () => {
        try {
            const data = await fetchAllDataForFilters('/assemblies', {});
            setallAssemblies(data);
        } catch (error) {
            console.error('Failed to fetch all assemblies for filters:', error);
        }
    };

    const fetchReferenceData = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, usersRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/users`, { headers })
            ]);

            const usersData = await usersRes.json();
            if (usersData.success) setUsers(usersData.data);

            const [statesData, divisionsData, parliamentsData, assembliesData, blocksData] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (blocksData.success) setBlocks(blocksData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    const fetchassemblies = async (pageIndex, pageSize, globalFilter = '', currentFilters = filters) => {
        setLoading(true);
        try {
            const queryParams = [];
            if (globalFilter) queryParams.push(`search=${encodeURIComponent(globalFilter)}`);
            if (currentFilters.state_id) queryParams.push(`state=${encodeURIComponent(currentFilters.state_id)}`);
            if (currentFilters.division_id) queryParams.push(`division=${encodeURIComponent(currentFilters.division_id)}`);
            if (currentFilters.parliament_id) queryParams.push(`parliament=${encodeURIComponent(currentFilters.parliament_id)}`);
            if (currentFilters.assembly_id) queryParams.push(`assembly=${encodeURIComponent(currentFilters.assembly_id)}`);
            if (currentFilters.) queryParams.push(`block=${encodeURIComponent(currentFilters.)}`);

            const queryString = queryParams.length > 0 ? `&${queryParams.join('&')}` : '';
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies?page=${pageIndex + 1}&limit=${pageSize}${queryString}`, { headers });
            const json = await res.json();
            if (json.success) {
                setassemblies(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch assemblies:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchassemblies(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
        fetchAllAssembliesForFilters();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    // Load Assembly polygons from assemblies table - filtered by user hierarchy
    useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem('serviceToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                
                const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies?limit=10000`, { headers });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                
                if (!json.success || !Array.isArray(json.data)) {
                    throw new Error('Invalid response format');
                }

                // Filter assemblies based on user hierarchy
                let assembliesToUse = json.data;
                if (userHierarchy?.Assembly) {
                    assembliesToUse = json.data.filter(b => String(b._id) === String(userHierarchy.Assembly._id || userHierarchy.Assembly));
                } else if (userHierarchy?.block) {
                    assembliesToUse = json.data.filter(b => String(b.?._id || b.) === String(userHierarchy.block._id || userHierarchy.block));
                } else if (userHierarchy?.assembly) {
                    assembliesToUse = json.data.filter(b => String(b.assembly_id?._id || b.assembly_id) === String(userHierarchy.assembly._id || userHierarchy.assembly));
                } else if (userHierarchy?.parliament) {
                    assembliesToUse = json.data.filter(b => String(b.parliament_id?._id || b.parliament_id) === String(userHierarchy.parliament._id || userHierarchy.parliament));
                } else if (userHierarchy?.division) {
                    assembliesToUse = json.data.filter(b => String(b.division_id?._id || b.division_id) === String(userHierarchy.division._id || userHierarchy.division));
                } else if (userHierarchy?.state) {
                    assembliesToUse = json.data.filter(b => String(b.state_id?._id || b.state_id) === String(userHierarchy.state._id || userHierarchy.state));
                }

                // Extract polygons from assemblies that have polygon data
                const features = [];
                assembliesToUse.forEach(Assembly => {
                    if (Assembly.polygon) {
                        let featureToAdd = null;
                        
                        if (Assembly.polygon.type === 'Feature') {
                            featureToAdd = {
                                ...Assembly.polygon,
                                properties: {
                                    ...Assembly.polygon.properties,
                                    Assembly_id: Assembly._id,
                                    Assembly_name: Assembly.name,
                                    Assembly_number: Assembly.Assembly_number
                                }
                            };
                        } else if (Assembly.polygon.type === 'FeatureCollection' && Array.isArray(Assembly.polygon.features)) {
                            Assembly.polygon.features.forEach(feat => {
                                features.push({
                                    ...feat,
                                    properties: {
                                        ...feat.properties,
                                        Assembly_id: Assembly._id,
                                        Assembly_name: Assembly.name,
                                        Assembly_number: Assembly.Assembly_number
                                    }
                                });
                            });
                            return;
                        }
                        
                        if (featureToAdd) {
                            features.push(featureToAdd);
                        }
                    }
                });

                if (!features.length) {
                    setMapError('No assemblies with polygon data available');
                    setallAssemblyGeoJSON(null);
                    setassemblyGeoJSON(null);
                } else {
                    const geoJSON = { type: 'FeatureCollection', features };
                    setallAssemblyGeoJSON(geoJSON);
                    setassemblyGeoJSON(geoJSON);
                    setMapError('');
                }
            } catch (e) {
                console.error('Failed to load Assembly polygons:', e);
                setMapError(`Failed to load polygon data: ${e.message}`);
                setallAssemblyGeoJSON(null);
                setassemblyGeoJSON(null);
            }
        })();
    }, [userHierarchy]);

    const filterOptions = useFilterOptionsFromData(allAssemblies, {
        states: { field: 'state_id', nameField: 'name' },
        divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
        parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
        assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
        blocks: { field: '', nameField: 'name', parentField: 'assembly_id' }
    });

    const handleDeleteOpen = (id) => {
        setassemblyDeleteId(id);
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

    const fetchAssemblyDetailsByPolygon = async (assemblyId, AssemblyName) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            let Assembly = null;

            if (assemblyId) {
                try {
                    const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies/${assemblyId}`, { headers });
                    const json = await res.json();
                    if (json?.success && json.data) {
                        Assembly = json.data;
                    }
                } catch (e) {
                    console.warn('Failed to fetch Assembly by ID:', e);
                }

                if (Assembly && Assembly._id) {
                    setDrawerData({ loading: false, AssemblyName: AssemblyName, AssemblyNumber: Assembly.Assembly_number, details: { Assembly } });
                    setDrawerOpen(true);
                } else {
                    setDrawerData({ loading: false, AssemblyName: AssemblyName, details: null, error: 'Assembly not found' });
                    setDrawerOpen(true);
                }
            } else {
                setDrawerData({ loading: false, AssemblyName: AssemblyName, details: null, error: 'Invalid Assembly ID' });
                setDrawerOpen(true);
            }
        } catch (err) {
            console.error('Failed to fetch Assembly details by polygon:', err);
            setDrawerData({ loading: false, AssemblyName: AssemblyName, details: null, error: err.message });
            setDrawerOpen(true);
        }
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
            header: 'Assembly Name',
            accessorKey: 'name',
            cell: ({ getValue }) => (
                <Typography sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'Assembly No',
            accessorKey: 'Assembly_number',
            cell: ({ getValue }) => (
                <Chip label={getValue() || 'N/A'} color="primary" size="small" variant="outlined" />
            )
        },
        {
            header: 'Address',
            accessorKey: 'full_address',
            cell: ({ getValue }) => (
                <Typography sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Male',
            accessorKey: 'Male_Count',
            cell: ({ getValue }) => <Typography>{getValue() || 0}</Typography>
        },
        {
            header: 'Female',
            accessorKey: 'Female_Count',
            cell: ({ getValue }) => <Typography>{getValue() || 0}</Typography>
        },
        {
            header: 'Total',
            accessorKey: 'Total',
            cell: ({ getValue }) => <Chip label={getValue() || 0} color="success" size="small" />
        },
        {
            header: 'Block',
            accessorKey: '',
            cell: ({ getValue }) => (
                <Chip label={getValue()?.name || 'N/A'} color="secondary" size="small" variant="outlined" />
            )
        },
        {
            header: 'Assembly',
            accessorKey: 'assembly_id',
            cell: ({ getValue }) => (
                <Chip label={getValue()?.name || 'N/A'} color="info" size="small" variant="outlined" />
            )
        },
        {
            header: 'Created At',
            accessorKey: 'created_at',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'Polygon',
            accessorKey: 'polygon',
            cell: ({ getValue }) => {
                const hasPolygon = !!getValue();
                return (
                    <Chip label={hasPolygon ? 'Yes' : 'No'} color={hasPolygon ? 'success' : 'default'} size="small" variant="outlined" />
                );
            }
        },
        {
            header: 'Actions',
            meta: { className: 'cell-center' },
            cell: ({ row }) => {
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <Tooltip title="View Details">
                            <IconButton color="secondary" onClick={() => navigate(`/assembly/${row.original._id}`)}>
                                <Eye />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedAssembly(row.original); setOpenModal(true); }}>
                                <Edit />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton color="error" onClick={(e) => { e.stopPropagation(); handleDeleteOpen(row.original._id); }}>
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

    const fetchallAssembliesForCsv = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies?all=true`, { headers });
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

    const startCsvDownload = async () => {
        setCsvLoading(true);
        const allData = await fetchallAssembliesForCsv();
        setCsvData(allData.map(item => ({
            'Assembly Name': item.name,
            'Assembly Number': item.AC_NO || 'N/A',
            'Description': item.description || '',
            'Male Count': 0 || 0,
            'Female Count': 0 || 0,
            'Others Count': 0 || 0,
            'Total': 0 || 0,
            'Block': item.?.name || '',
            'Assembly': item.assembly_id?.name || '',
            'Parliament': item.parliament_id?.name || '',
            'Division': item.division_id?.name || '',
            'State': item.state_id?.name || '',
            'Created At': item.created_at
        })));
        setCsvLoading(false);
        setTimeout(() => {
            if (csvLinkRef.current) {
                csvLinkRef.current.link.click();
            }
        }, 100);
    };

    const handleDownloadCsv = async () => {
        await requestOtp(startCsvDownload);
    };

    const handleDownloadExcelTemplate = async () => {
        try {
            const XLSX = await import('xlsx');
            const templateData = [
                {
                    name: 'मानसी',
                    Assembly_number: '280',
                    full_address: 'प्राथमिक विद्यालय मानसी',
                    category: 'General',
                    ,
                    ,
                    ,
                    ,
                    ,
                    block_no: '1',
                    AC_NO: '1',
                    parliament_no: '101',
                    division_code: '1',
                    state_no: '23'
                }
            ];
            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
            XLSX.writeFile(workbook, 'assemblies_template.xlsx');
        } catch (error) {
            console.error('Error generating template:', error);
            alert('Failed to download template. Please try again.');
        }
    };

    const handleImportFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setImportResult(null);

        try {
            const XLSX = await import('xlsx');
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const normalizedData = jsonData.map((row) => {
                const normalized = {};
                Object.keys(row).forEach((key) => {
                    const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
                    normalized[normalizedKey] = row[key];
                });
                return normalized;
            });

            const filteredRows = normalizedData.filter((r) => r.name || r.Assembly_number);

            const token = localStorage.getItem('serviceToken');
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` })
                },
                body: JSON.stringify({ rows: filteredRows })
            });

            const result = await response.json();

            if (response.ok) {
                const created = result.created ?? result.imported ?? 0;
                const skipped = result.skipped ?? 0;
                const total = result.total ?? (created + skipped) ?? 0;
                const errors = result.errors || [];
                setImportResult({
                    success: true,
                    created,
                    imported: created,
                    skipped,
                    total,
                    errors,
                    ids: result.ids || []
                });
                fetchassemblies(pagination.pageIndex, pagination.pageSize);
            } else {
                setImportResult({
                    success: false,
                    message: result.message || 'Import failed'
                });
            }
        } catch (error) {
            setImportResult({
                success: false,
                message: error.message || 'Import failed'
            });
        } finally {
            setImporting(false);
            if (importInputRef.current) {
                importInputRef.current.value = '';
            }
        }
    };

    if (loading) return <EmptyReactTable />;

    const handleFilterApply = () => {
        fetchassemblies(pagination.pageIndex, pagination.pageSize, globalFilter, filters);
    };

    const handleClearFilter = () => {
        setFilters({
            state_id: '',
            division_id: '',
            parliament_id: '',
            assembly_id: '',
            : ''
        });
        fetchassemblies(pagination.pageIndex, pagination.pageSize, globalFilter, {
            state_id: '',
            division_id: '',
            parliament_id: '',
            assembly_id: '',
            : ''
        });
    };

    return (
        <>
            <MainCard content={false}>
                {/* Assembly Map section */}
                <Box sx={{ p: 2, pb: 0 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Assembly Map</Typography>
                    {mapError && <Alert severity="warning" sx={{ mb: 1 }}>{mapError}</Alert>}
                    {!assemblyGeoJSON && !mapError && (
                        <Alert severity="info" sx={{ mb: 1 }}>Loading map data...</Alert>
                    )}
                    <MapContainerStyled sx={{ minHeight: 400 }}>
                        {mapboxToken ? (
                            <Map
                                ref={mapRef}
                                mapboxAccessToken={mapboxToken}
                                initialViewState={{ longitude: 77.0, latitude: 23.5, zoom: 5 }}
                                mapStyle="mapbox://styles/mapbox/streets-v12"
                                interactiveLayerIds={assemblyGeoJSON ? ['Assembly-fill'] : []}
                                onClick={(e) => {
                                    if (!assemblyGeoJSON) return;
                                    try {
                                        const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                                        const point = e.point || { x: e.originalEvent?.clientX, y: e.originalEvent?.clientY };
                                        let features = e.features || [];
                                        if ((!features || features.length === 0) && map && point) {
                                            features = map.queryRenderedFeatures([point.x, point.y], { layers: ['Assembly-fill'] }) || [];
                                        }
                                        const f = features.find(f => f.layer && f.layer.id === 'Assembly-fill') || features[0];
                                        if (f) {
                                            const props = f.properties || {};
                                            const assemblyId = props.Assembly_id || '';
                                            const AssemblyName = props.Assembly_name || '';
                                            setDrawerData({ loading: true, AssemblyName: AssemblyName, details: null });
                                            setDrawerOpen(true);
                                            fetchAssemblyDetailsByPolygon(assemblyId, AssemblyName);
                                        }
                                    } catch (err) {
                                        console.warn('Map click handler error:', err);
                                    }
                                }}
                            >
                                <MapControl />
                                {assemblyGeoJSON && (
                                    <Source id="Assembly-polygons" type="geojson" data={assemblyGeoJSON}>
                                        <Layer id="Assembly-fill" type="fill" paint={{ 'fill-color': '#4CAF50', 'fill-opacity': 0.22 }} />
                                        <Layer id="Assembly-outline" type="line" paint={{ 'line-color': '#388E3C', 'line-width': 2 }} />
                                        <Layer
                                            id="Assembly-label"
                                            type="symbol"
                                            layout={{ 'text-field': ['concat', ['coalesce', ['get', 'Assembly_name'], ['get', 'name'], ''], '\n', ['coalesce', ['get', 'Assembly_number'], ['get', 'no'], '']], 'text-size': 10, 'text-allow-overlap': true, 'text-anchor': 'center' }}
                                            paint={{
                                                'text-color': '#000',
                                                'text-halo-color': '#ffffff',
                                                'text-halo-width': 2
                                            }}
                                        />
                                    </Source>
                                )}
                            </Map>
                        ) : (
                            <Alert severity="error">Mapbox token not configured</Alert>
                        )}
                    </MapContainerStyled>
                </Box>

                {/* Drawer for Assembly Details */}
                <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ '& .MuiDrawer-paper': { width: 400 } }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
                        <Typography variant="h6">Assembly Details</Typography>
                        <IconButton onClick={() => setDrawerOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Box sx={{ p: 2, overflowY: 'auto', height: 'calc(100% - 60px)' }}>
                        {drawerData?.loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                <CircularProgress />
                            </Box>
                        ) : drawerData?.error ? (
                            <Alert severity="error">{drawerData.error}</Alert>
                        ) : drawerData?.details ? (
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">Assembly Name</Typography>
                                    <Typography variant="body1">{drawerData.AssemblyName || 'N/A'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">Assembly Number</Typography>
                                    <Typography variant="body1">{drawerData.AssemblyNumber || 'N/A'}</Typography>
                                </Box>
                                <Divider />
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">Address</Typography>
                                    <Typography variant="body2">{drawerData.details.Assembly?.full_address || 'N/A'}</Typography>
                                </Box>
                                <Divider />
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">Voter Count</Typography>
                                    <Typography variant="body2">Male: {drawerData.details.Assembly?.Male_Count || 0}</Typography>
                                    <Typography variant="body2">Female: {drawerData.details.Assembly?.Female_Count || 0}</Typography>
                                    <Typography variant="body2">Total: {drawerData.details.Assembly?.Total || 0}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">Block</Typography>
                                    <Typography variant="body2">{drawerData.details.Assembly?.?.name || 'N/A'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">Assembly</Typography>
                                    <Typography variant="body2">{drawerData.details.Assembly?.assembly_id?.name || 'N/A'}</Typography>
                                </Box>
                            </Stack>
                        ) : (
                            <Typography variant="body2" color="textSecondary">Click on a Assembly on the map to view details</Typography>
                        )}
                    </Box>
                </Drawer>

                {/* Header: Search + CSV + Add */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" sx={{ p: 2 }}>
                    <DebouncedInput
                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={`Search ${assemblies.length} assemblies...`}
                        style={{ flex: 1 }}
                    />

                    <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                        <CSVLink data={csvData} filename="assemblies_all.csv" style={{ display: 'none' }} ref={csvLinkRef} />
                        <Dialog open={otpDialogOpen} onClose={() => !otpLoading && closeDialog()} maxWidth="xs" fullWidth>
                            <DialogTitle>Enter OTP to Download CSV</DialogTitle>
                            <DialogContent>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    OTP sent to: <strong>{maskedDest || '**********'}</strong>
                                </Typography>
                                <TextField
                                    autoFocus
                                    fullWidth
                                    label="OTP"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    disabled={otpLoading}
                                    inputProps={{ maxLength: 8 }}
                                />
                                {otpError && (
                                    <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                                        {otpError}
                                    </Typography>
                                )}
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => closeDialog()} disabled={otpLoading}>Cancel</Button>
                                <Button onClick={() => verifyOtp()} variant="contained" disabled={otpLoading || !otpCode.trim()}>
                                    {otpLoading ? <CircularProgress size={20} /> : 'Verify & Download'}
                                </Button>
                            </DialogActions>
                        </Dialog>
                        <Button variant="outlined" onClick={handleDownloadExcelTemplate}>
                            Download Excel Template
                        </Button>
                        <Button variant="outlined" onClick={() => importInputRef.current?.click()} disabled={importing}>
                            {importing ? 'Importing...' : 'Import Excel'}
                        </Button>
                        <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                            {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                        </Button>
                        <Button variant="outlined" onClick={() => setOpenPolygonUpload(true)}>
                            Upload Polygon
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedAssembly(null); setOpenModal(true); }}>
                            Add Assembly
                        </Button>
                    </Stack>
                    {importResult && (
                        <Alert severity={importResult.success ? 'success' : 'error'} onClose={() => setImportResult(null)} sx={{ mt: 1 }}>
                            {importResult.success ? (
                                (() => {
                                    const created = importResult.created ?? importResult.imported ?? 0;
                                    const skipped = importResult.skipped ?? 0;
                                    const total = importResult.total ?? (created + skipped) ?? 0;
                                    const errorsCount = importResult.errors?.length ?? 0;
                                    return `Imported: ${created} / ${total} | Skipped: ${skipped} | Errors: ${errorsCount}`;
                                })()
                            ) : (
                                `Import failed: ${importResult.message}`
                            )}
                        </Alert>
                    )}
                </Stack>

                {/* Filters */}
                <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2, flexWrap: 'wrap' }}>
                    <TextField select label="State" value={filters.state_id} onChange={(e) => setFilters((prev) => ({ ...prev, state_id: e.target.value, division_id: '', parliament_id: '', assembly_id: '', : '' }))} sx={{ minWidth: 150 }} size="small">
                        <MenuItem value="">All States</MenuItem>
                        {filterOptions.states?.map((state) => (
                            <MenuItem key={state._id} value={state._id}>{state.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField select label="Division" value={filters.division_id} onChange={(e) => setFilters((prev) => ({ ...prev, division_id: e.target.value, parliament_id: '', assembly_id: '', : '' }))} sx={{ minWidth: 150 }} size="small" disabled={!filters.state_id}>
                        <MenuItem value="">All Divisions</MenuItem>
                        {filterOptions.divisions?.filter(division => {
                            const stateId = division.state_id?._id || division.state_id;
                            return stateId === filters.state_id;
                        }).map((division) => (
                            <MenuItem key={division._id} value={division._id}>{division.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField select label="Parliament" value={filters.parliament_id} onChange={(e) => setFilters((prev) => ({ ...prev, parliament_id: e.target.value, assembly_id: '', : '' }))} sx={{ minWidth: 150 }} size="small" disabled={!filters.division_id}>
                        <MenuItem value="">All Parliaments</MenuItem>
                        {filterOptions.parliaments?.filter(parliament => {
                            const divisionId = parliament.division_id?._id || parliament.division_id;
                            return divisionId === filters.division_id;
                        }).map((parliament) => (
                            <MenuItem key={parliament._id} value={parliament._id}>{parliament.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField select label="Assembly" value={filters.assembly_id} onChange={(e) => setFilters((prev) => ({ ...prev, assembly_id: e.target.value, : '' }))} sx={{ minWidth: 150 }} size="small" disabled={!filters.parliament_id}>
                        <MenuItem value="">All Assemblies</MenuItem>
                        {filterOptions.assemblies?.filter(assembly => {
                            const parliamentId = assembly.parliament_id?._id || assembly.parliament_id;
                            return parliamentId === filters.parliament_id;
                        }).map((assembly) => (
                            <MenuItem key={assembly._id} value={assembly._id}>{assembly.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField select label="Block" value={filters.} onChange={(e) => setFilters((prev) => ({ ...prev, : e.target.value }))} sx={{ minWidth: 150 }} size="small" disabled={!filters.assembly_id}>
                        <MenuItem value="">All Blocks</MenuItem>
                        {filterOptions.blocks?.filter(block => {
                            const assemblyId = block.assembly_id?._id || block.assembly_id;
                            return assemblyId === filters.assembly_id;
                        }).map((block) => (
                            <MenuItem key={block._id} value={block._id}>{block.name}</MenuItem>
                        ))}
                    </TextField>

                    <Button variant="contained" onClick={handleFilterApply} size="small">Apply</Button>
                    <Button variant="outlined" onClick={handleClearFilter} size="small">Clear</Button>
                </Stack>

                {/* Table */}
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
                                                sx={{ cursor: header.column.getCanSort() ? 'pointer' : 'default', color: 'white', fontWeight: 'bold', backgroundColor: 'primary.main' }}
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
            </MainCard>

            {/* Hidden Import Input */}
            <input type="file" accept=".xlsx,.xls,.csv" ref={importInputRef} style={{ display: 'none' }} onChange={handleImportFile} />

            {/* Modals */}
            <AssemblyModal
                open={openModal}
                modalToggler={setOpenModal}
                Assembly={selectedAssembly}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                users={users}
                refresh={() => fetchassemblies(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertAssemblyDelete
                id={assemblyDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchassemblies(pagination.pageIndex, pagination.pageSize)}
            />

            <AssemblyPolygonUpload
                open={openPolygonUpload}
                onClose={() => setOpenPolygonUpload(false)}
                onSuccess={() => {
                    fetchassemblies(pagination.pageIndex, pagination.pageSize);
                }}
            />
        </>
    );
}


