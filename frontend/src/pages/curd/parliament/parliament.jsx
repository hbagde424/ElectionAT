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

import ParliamentModal from './ParliamentModal';
import AlertParliamentDelete from './AlertParliamentDelete';
import ParliamentView from './ParliamentView';
import ParliamentPolygonUpload from './ParliamentPolygonUpload';

export default function ParliamentsListPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy } = usePermissions();

    const [selectedParliament, setSelectedParliament] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [parliamentDeleteId, setParliamentDeleteId] = useState('');
    const [parliaments, setParliaments] = useState([]);
    const [allParliaments, setAllParliaments] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [users, setUsers] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState({
        state_id: '',
        division_id: ''
    });
    const csvLinkRef = useRef();
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const importInputRef = useRef();

    // Map & Drawer state
    const [parliamentGeoJSON, setParliamentGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;
    const [openPolygonUpload, setOpenPolygonUpload] = useState(false);

    const fetchAllParliamentsForFilters = async () => {
        try {
            const data = await fetchAllDataForFilters('/parliaments', {});
            setAllParliaments(data);
        } catch (error) {
            console.error('Failed to fetch all parliaments for filters:', error);
        }
    };

    const fetchReferenceData = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const [statesRes, divisionsRes, usersRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/users`, { headers })
            ]);

            const usersData = await usersRes.json();
            if (usersData.success) setUsers(usersData.data);

            const [statesData, divisionsData] = await Promise.all([
                statesRes.json(),
                divisionsRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    const fetchParliaments = async (pageIndex, pageSize, globalFilter = '', currentFilters = filters) => {
        setLoading(true);
        try {
            const queryParams = [];
            if (globalFilter) queryParams.push(`search=${encodeURIComponent(globalFilter)}`);
            if (currentFilters.state_id) queryParams.push(`state=${encodeURIComponent(currentFilters.state_id)}`);
            if (currentFilters.division_id) queryParams.push(`division=${encodeURIComponent(currentFilters.division_id)}`);

            const queryString = queryParams.length > 0 ? `&${queryParams.join('&')}` : '';
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments?page=${pageIndex + 1}&limit=${pageSize}${queryString}`, { headers });
            const json = await res.json();
            if (json.success) {
                setParliaments(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch parliaments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParliaments(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
        fetchAllParliamentsForFilters();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    // Helper function to load and update parliament polygons
    const loadParliamentPolygons = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments?limit=10000`, { headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            
            if (!json.success || !Array.isArray(json.data)) {
                throw new Error('Invalid response format');
            }

            let parliamentsToUse = json.data;
            if (userHierarchy?.parliament) {
                parliamentsToUse = json.data.filter(p => String(p._id) === String(userHierarchy.parliament._id || userHierarchy.parliament));
            } else if (userHierarchy?.division) {
                parliamentsToUse = json.data.filter(p => String(p.division_id?._id || p.division_id) === String(userHierarchy.division._id || userHierarchy.division));
            } else if (userHierarchy?.state) {
                parliamentsToUse = json.data.filter(p => String(p.state_id?._id || p.state_id) === String(userHierarchy.state._id || userHierarchy.state));
            }

            const features = [];
            parliamentsToUse.forEach(parliament => {
                if (parliament.polygon) {
                    let featureToAdd = null;
                    
                    if (parliament.polygon.type === 'Feature') {
                        featureToAdd = {
                            ...parliament.polygon,
                            properties: {
                                ...parliament.polygon.properties,
                                parliament_id: parliament._id,
                                parliament_name: parliament.name,
                                parliament_no: parliament.parliament_no
                            }
                        };
                    } else if (parliament.polygon.type === 'FeatureCollection' && Array.isArray(parliament.polygon.features)) {
                        parliament.polygon.features.forEach(feat => {
                            features.push({
                                ...feat,
                                properties: {
                                    ...feat.properties,
                                    parliament_id: parliament._id,
                                    parliament_name: parliament.name,
                                    parliament_no: parliament.parliament_no
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
                setMapError('No parliaments with polygon data available');
                setParliamentGeoJSON(null);
            } else {
                const geoJSON = { type: 'FeatureCollection', features };
                setParliamentGeoJSON(geoJSON);
                setMapError('');
            }
        } catch (e) {
            console.error('Failed to load parliament polygons:', e);
            setMapError(`Failed to load polygon data: ${e.message}`);
            setParliamentGeoJSON(null);
        }
    };

    useEffect(() => {
        loadParliamentPolygons();
    }, [userHierarchy]);

    useEffect(() => {
        if (parliaments.length > 0) {
            loadParliamentPolygons();
        }
    }, [parliaments]);

    const filterOptions = useFilterOptionsFromData(allParliaments, {
        states: { field: 'state_id', nameField: 'name' },
        divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' }
    });

    const handleDeleteOpen = (id) => {
        setParliamentDeleteId(id);
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

    const fetchParliamentDetailsByPolygon = async (parliamentId, parliamentName) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            let parliament = null;

            if (parliamentId) {
                try {
                    const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments/${parliamentId}`, { headers });
                    const json = await res.json();
                    if (json?.success && json.data) {
                        parliament = json.data;
                    }
                } catch (e) {
                    console.warn('Failed to fetch parliament by ID:', e);
                }

                if (parliament && parliament._id) {
                    setDrawerData({ loading: false, parliamentName: parliamentName, parliamentNo: parliament.parliament_no, details: { parliament } });
                    setDrawerOpen(true);
                } else {
                    setDrawerData({ loading: false, parliamentName: parliamentName, details: null, error: 'Parliament not found' });
                    setDrawerOpen(true);
                }
            } else {
                setDrawerData({ loading: false, parliamentName: parliamentName, details: null, error: 'Invalid parliament ID' });
                setDrawerOpen(true);
            }
        } catch (err) {
            console.error('Failed to fetch parliament details by polygon:', err);
            setDrawerData({ loading: false, parliamentName: parliamentName, details: null, error: err.message });
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
            header: 'Parliament Name',
            accessorKey: 'name',
            cell: ({ getValue }) => (
                <Typography sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'PC No',
            accessorKey: 'parliament_no',
            cell: ({ getValue }) => (
                <Chip label={getValue() || 'N/A'} color="primary" size="small" variant="outlined" />
            )
        },
        {
            header: 'Category',
            accessorKey: 'category',
            cell: ({ getValue }) => (
                <Chip label={getValue() || 'N/A'} color="secondary" size="small" variant="outlined" />
            )
        },
        {
            header: 'Regional Type',
            accessorKey: 'regional_type',
            cell: ({ getValue }) => (
                <Chip label={getValue() || 'N/A'} size="small" variant="outlined" />
            )
        },
        {
            header: 'Division',
            accessorKey: 'division_id',
            cell: ({ getValue }) => (
                <Chip label={getValue()?.name || 'N/A'} color="info" size="small" variant="outlined" />
            )
        },
        {
            header: 'State',
            accessorKey: 'state_id',
            cell: ({ getValue }) => (
                <Chip label={getValue()?.name || 'N/A'} color="success" size="small" variant="outlined" />
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
                            <IconButton color="secondary" onClick={() => navigate(`/parliament/${row.original._id}`)}>
                                <Eye />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedParliament(row.original); setOpenModal(true); }}>
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
        data: parliaments,
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

    const fetchAllParliamentsForCsv = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments?all=true`, { headers });
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all parliaments for CSV:', error);
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
        const allData = await fetchAllParliamentsForCsv();
        setCsvData(allData.map(item => ({
            'Parliament Name': item.name,
            'PC Number': item.parliament_no || 'N/A',
            'Category': item.category || '',
            'Regional Type': item.regional_type || '',
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
                    name: 'Chhattisgarh Parliament',
                    parliament_no: '101',
                    category: 'General',
                    regional_type: 'Urban',
                    division_code: '1',
                    state_no: '22'
                }
            ];
            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
            XLSX.writeFile(workbook, 'parliaments_template.xlsx');
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

            const filteredRows = normalizedData.filter((r) => r.name);

            const token = localStorage.getItem('serviceToken');
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments/import`, {
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
                fetchParliaments(pagination.pageIndex, pagination.pageSize);
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
        fetchParliaments(pagination.pageIndex, pagination.pageSize, globalFilter, filters);
    };

    const handleClearFilter = () => {
        setFilters({
            state_id: '',
            division_id: ''
        });
        fetchParliaments(pagination.pageIndex, pagination.pageSize, globalFilter, {
            state_id: '',
            division_id: ''
        });
    };

    return (
        <>
            <MainCard content={false}>
                <Box sx={{ p: 2, pb: 0 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Parliament Map</Typography>
                    {mapError && <Alert severity="warning" sx={{ mb: 1 }}>{mapError}</Alert>}
                    {!parliamentGeoJSON && !mapError && (
                        <Alert severity="info" sx={{ mb: 1 }}>Loading map data...</Alert>
                    )}
                    <MapContainerStyled sx={{ minHeight: 400 }}>
                        {mapboxToken ? (
                            <Map
                                ref={mapRef}
                                mapboxAccessToken={mapboxToken}
                                initialViewState={{ longitude: 77.0, latitude: 23.5, zoom: 5 }}
                                mapStyle="mapbox://styles/mapbox/streets-v12"
                                interactiveLayerIds={parliamentGeoJSON ? ['parliament-fill'] : []}
                                onClick={(e) => {
                                    if (!parliamentGeoJSON) return;
                                    try {
                                        const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                                        const point = e.point || { x: e.originalEvent?.clientX, y: e.originalEvent?.clientY };
                                        let features = e.features || [];
                                        if ((!features || features.length === 0) && map && point) {
                                            features = map.queryRenderedFeatures([point.x, point.y], { layers: ['parliament-fill'] }) || [];
                                        }
                                        const f = features.find(f => f.layer && f.layer.id === 'parliament-fill') || features[0];
                                        if (f) {
                                            const props = f.properties || {};
                                            const parliamentId = props.parliament_id || '';
                                            const parliamentName = props.parliament_name || '';
                                            setDrawerData({ loading: true, parliamentName: parliamentName, details: null });
                                            setDrawerOpen(true);
                                            fetchParliamentDetailsByPolygon(parliamentId, parliamentName);
                                        }
                                    } catch (err) {
                                        console.warn('Map click handler error:', err);
                                    }
                                }}
                            >
                                <MapControl />
                                {parliamentGeoJSON && (
                                    <Source id="parliament-polygons" type="geojson" data={parliamentGeoJSON}>
                                        <Layer id="parliament-fill" type="fill" paint={{ 'fill-color': '#FF5722', 'fill-opacity': 0.22 }} />
                                        <Layer id="parliament-outline" type="line" paint={{ 'line-color': '#E64A19', 'line-width': 2 }} />
                                        <Layer
                                            id="parliament-label"
                                            type="symbol"
                                            layout={{ 'text-field': ['concat', ['coalesce', ['get', 'parliament_name'], ['get', 'name'], ''], '\n', ['coalesce', ['get', 'parliament_no'], ['get', 'no'], '']], 'text-size': 10, 'text-allow-overlap': true, 'text-anchor': 'center' }}
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

                <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ '& .MuiDrawer-paper': { width: 400 } }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
                        <Typography variant="h6">Parliament Details</Typography>
                        <IconButton onClick={() => setDrawerOpen(false)} size="small"><CloseIcon /></IconButton>
                    </Box>
                    <Box sx={{ p: 2, overflowY: 'auto', height: 'calc(100% - 60px)' }}>
                        {drawerData?.loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
                        ) : drawerData?.error ? (
                            <Alert severity="error">{drawerData.error}</Alert>
                        ) : drawerData?.details ? (
                            <Stack spacing={2}>
                                <Box><Typography variant="subtitle2" color="textSecondary">Parliament Name</Typography><Typography variant="body1">{drawerData.parliamentName || 'N/A'}</Typography></Box>
                                <Box><Typography variant="subtitle2" color="textSecondary">PC Number</Typography><Typography variant="body1">{drawerData.parliamentNo || 'N/A'}</Typography></Box>
                                <Divider />
                                <Box><Typography variant="subtitle2" color="textSecondary">Category</Typography><Typography variant="body2">{drawerData.details.parliament?.category || 'N/A'}</Typography></Box>
                                <Box><Typography variant="subtitle2" color="textSecondary">Regional Type</Typography><Typography variant="body2">{drawerData.details.parliament?.regional_type || 'N/A'}</Typography></Box>
                                <Box><Typography variant="subtitle2" color="textSecondary">Division</Typography><Typography variant="body2">{drawerData.details.parliament?.division_id?.name || 'N/A'}</Typography></Box>
                            </Stack>
                        ) : (
                            <Typography variant="body2" color="textSecondary">Click on a parliament on the map to view details</Typography>
                        )}
                    </Box>
                </Drawer>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" sx={{ p: 2 }}>
                    <DebouncedInput value={globalFilter} onFilterChange={setGlobalFilter} placeholder={`Search ${parliaments.length} parliaments...`} style={{ flex: 1 }} />
                    <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                        <CSVLink data={csvData} filename="parliaments_all.csv" style={{ display: 'none' }} ref={csvLinkRef} />
                        <Dialog open={otpDialogOpen} onClose={() => !otpLoading && closeDialog()} maxWidth="xs" fullWidth>
                            <DialogTitle>Enter OTP to Download CSV</DialogTitle>
                            <DialogContent>
                                <Typography variant="body2" sx={{ mb: 1 }}>OTP sent to: <strong>{maskedDest || '**********'}</strong></Typography>
                                <TextField autoFocus fullWidth label="OTP" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} disabled={otpLoading} inputProps={{ maxLength: 8 }} />
                                {otpError && <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>{otpError}</Typography>}
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => closeDialog()} disabled={otpLoading}>Cancel</Button>
                                <Button onClick={() => verifyOtp()} variant="contained" disabled={otpLoading || !otpCode.trim()}>
                                    {otpLoading ? <CircularProgress size={20} /> : 'Verify & Download'}
                                </Button>
                            </DialogActions>
                        </Dialog>
                        <Button variant="outlined" onClick={handleDownloadExcelTemplate}>Download Excel Template</Button>
                        <Button variant="outlined" onClick={() => importInputRef.current?.click()} disabled={importing}>{importing ? 'Importing...' : 'Import Excel'}</Button>
                        <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>{csvLoading ? 'Preparing CSV...' : 'Download All CSV'}</Button>
                        <Button variant="outlined" onClick={() => setOpenPolygonUpload(true)}>Upload Polygon</Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedParliament(null); setOpenModal(true); }}>Add Parliament</Button>
                    </Stack>
                    {importResult && (
                        <Alert severity={importResult.success ? 'success' : 'error'} onClose={() => setImportResult(null)} sx={{ mt: 1 }}>
                            {importResult.success ? `Imported: ${importResult.created} / ${importResult.total} | Skipped: ${importResult.skipped}` : `Import failed: ${importResult.message}`}
                        </Alert>
                    )}
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2, flexWrap: 'wrap' }}>
                    <TextField select label="State" value={filters.state_id} onChange={(e) => setFilters((prev) => ({ ...prev, state_id: e.target.value, division_id: '' }))} sx={{ minWidth: 150 }} size="small">
                        <MenuItem value="">All States</MenuItem>
                        {filterOptions.states?.map((state) => (<MenuItem key={state._id} value={state._id}>{state.name}</MenuItem>))}
                    </TextField>
                    <TextField select label="Division" value={filters.division_id} onChange={(e) => setFilters((prev) => ({ ...prev, division_id: e.target.value }))} sx={{ minWidth: 150 }} size="small" disabled={!filters.state_id}>
                        <MenuItem value="">All Divisions</MenuItem>
                        {filterOptions.divisions?.filter(division => (division.state_id?._id || division.state_id) === filters.state_id).map((division) => (<MenuItem key={division._id} value={division._id}>{division.name}</MenuItem>))}
                    </TextField>
                    <Button variant="contained" onClick={handleFilterApply} size="small">Apply</Button>
                    <Button variant="outlined" onClick={handleClearFilter} size="small">Clear</Button>
                </Stack>

                <ScrollX>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ backgroundColor: 'primary.main' }}>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableCell key={header.id} onClick={header.column.getToggleSortingHandler()} sx={{ cursor: header.column.getCanSort() ? 'pointer' : 'default', color: 'white', fontWeight: 'bold', backgroundColor: 'primary.main' }}>
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
                                            {row.getVisibleCells().map((cell) => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}
                                        </TableRow>
                                        {row.getIsExpanded() && (<TableRow><TableCell colSpan={row.getVisibleCells().length}><ParliamentView data={row.original} /></TableCell></TableRow>)}
                                    </Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Divider />
                    <Box sx={{ p: 2 }}>
                        <TablePagination setPageSize={(size) => setPagination((prev) => ({ ...prev, pageSize: size }))} setPageIndex={(index) => setPagination((prev) => ({ ...prev, pageIndex: index }))} getState={table.getState} getPageCount={() => pageCount} />
                    </Box>
                </ScrollX>
            </MainCard>

            <input type="file" accept=".xlsx,.xls,.csv" ref={importInputRef} style={{ display: 'none' }} onChange={handleImportFile} />

            <ParliamentModal open={openModal} modalToggler={setOpenModal} parliament={selectedParliament} states={states} divisions={divisions} users={users} refresh={() => fetchParliaments(pagination.pageIndex, pagination.pageSize)} />
            <AlertParliamentDelete id={parliamentDeleteId} open={openDelete} handleClose={handleDeleteClose} refresh={() => fetchParliaments(pagination.pageIndex, pagination.pageSize)} />
            <ParliamentPolygonUpload open={openPolygonUpload} onClose={() => setOpenPolygonUpload(false)} onSuccess={() => { fetchParliaments(pagination.pageIndex, pagination.pageSize); }} />
        </>
    );
}
