import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, MenuItem, TextField, Tooltip, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Drawer
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { Add, Edit, Eye, Trash } from 'iconsax-react';
import CloseIcon from '@mui/icons-material/Close';
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

import DivisionModal from './DivisionModal';
import AlertDivisionDelete from './AlertDivisionDelete';
import DivisionView from './DivisionView';
import { useCsvOtp } from 'hooks/useCsvOtp';

export default function DivisionListPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel } = usePermissions();

    const [selectedDivision, setSelectedDivision] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [divisionDeleteId, setDivisionDeleteId] = useState('');
    const [divisions, setDivisions] = useState([]);
    const [allDivisions, setAllDivisions] = useState([]);
    const [states, setStates] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [stateFilter, setStateFilter] = useState('');
    // CSV download state
    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();
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

    // Import functionality states
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const importInputRef = useRef();

    // Map & Drawer state
    const [divisionGeoJSON, setDivisionGeoJSON] = useState(null);
    const [allDivisionGeoJSON, setAllDivisionGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    // Download all divisions for CSV
    const startCsvDownload = async () => {
        setCsvLoading(true);
        try {
            let url = `${import.meta.env.VITE_APP_API_URL}/divisions?limit=10000`;
            const token = localStorage.getItem('serviceToken');
            const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            const data = await res.json();
            if (data.success) {
                setCsvData(data.data);
                setTimeout(() => {
                    if (csvLinkRef.current) {
                        csvLinkRef.current.link.click();
                    }
                }, 100);
            }
        } catch (e) {
            console.error('Failed to download CSV:', e);
        } finally {
            setCsvLoading(false);
        }
    };

    const handleDownloadCsv = async () => {
        await requestOtp(startCsvDownload);
    };

    const handleDownloadExcelTemplate = async () => {
        try {
            const XLSX = await import('xlsx');
            const templateData = [
                {
                    name: 'Sample Division',
                    division_code: 'DIV001',
                    description: 'Sample division description',
                    state_no: '23'
                }
            ];
            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
            XLSX.writeFile(workbook, 'divisions_import_template.xlsx');
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
            const wb = XLSX.read(data, { type: 'array' });
            const wsName = wb.SheetNames[0];
            const ws = wb.Sheets[wsName];
            const json = XLSX.utils.sheet_to_json(ws, { defval: '' });

            const rows = json.map((r) => {
                const obj = {};
                for (const k of Object.keys(r)) obj[k.trim().toLowerCase()] = r[k];
                return {
                    name: obj.name ?? '',
                    division_code: obj.division_code ?? obj['division code'] ?? '',
                    description: obj.description ?? '',
                    state: obj.state_no ?? obj.state ?? ''
                };
            });

            const filtered = rows.filter(r => String(r.name).trim() && String(r.division_code).trim());

            const token = localStorage.getItem('serviceToken');
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/divisions/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ rows: filtered })
            });
            const result = await res.json();
            setImportResult(result);
            if (result?.success) {
                fetchDivisions(pagination.pageIndex, pagination.pageSize, globalFilter, stateFilter);
            }
        } catch (err) {
            setImportResult({ success: false, message: err?.message || String(err) });
        } finally {
            setImporting(false);
            if (importInputRef.current) importInputRef.current.value = '';
        }
    };

    const fetchReferenceData = async () => {
        try {
            const getAuthHeaders = () => {
                const token = localStorage.getItem('serviceToken');
                return token ? { Authorization: `Bearer ${token}` } : {};
            };

            const [statesRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`, { headers: getAuthHeaders() })
            ]);

            const statesData = await statesRes.json();
            if (statesData.success) {
                // Filter states based on user hierarchy
                let filteredStates = statesData.data;
                if (userHierarchy?.state) {
                    // User has state-level access - show only their state
                    filteredStates = statesData.data.filter(s => String(s._id) === String(userHierarchy.state._id || userHierarchy.state));
                }
                // If division-level or no hierarchy, still show all states for reference
                setStates(statesData.success ? statesData.data : []);
            }
        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    const fetchDivisions = async (pageIndex, pageSize, globalFilter = '', stateFilter = '') => {
        setLoading(true);
        try {
            // Always fetch all divisions first to apply hierarchy filter correctly
            let query = [];
            if (globalFilter) query.push(`search=${encodeURIComponent(globalFilter)}`);
            if (stateFilter) query.push(`state=${encodeURIComponent(stateFilter)}`);
            const queryString = query.length > 0 ? `&${query.join('&')}` : '';
            
            const url = `${import.meta.env.VITE_APP_API_URL}/divisions?page=1&limit=10000${queryString}`;
            const token = localStorage.getItem('serviceToken');
            const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            const json = await res.json();
            
            if (json.success) {
                // Filter divisions based on user hierarchy
                let filteredDivisions = json.data;
                if (userHierarchy?.division) {
                    // User has division-level access - show only their division
                    filteredDivisions = json.data.filter(d => String(d._id) === String(userHierarchy.division._id || userHierarchy.division));
                } else if (userHierarchy?.state) {
                    // User has state-level access - show only their state's divisions
                    filteredDivisions = json.data.filter(d => String(d.state_id?._id || d.state_id) === String(userHierarchy.state._id || userHierarchy.state));
                }
                // If no hierarchy, show all divisions (superAdmin)

                // Now apply pagination to filtered data
                const totalCount = filteredDivisions.length;
                const calculatedPages = Math.ceil(totalCount / pageSize);
                const startIndex = pageIndex * pageSize;
                const endIndex = startIndex + pageSize;
                const paginatedDivisions = filteredDivisions.slice(startIndex, endIndex);

                setDivisions(paginatedDivisions);
                setPageCount(calculatedPages);
            } else {
                setDivisions([]);
                setPageCount(0);
            }
        } catch (error) {
            setDivisions([]);
            setPageCount(0);
            console.error('Failed to fetch divisions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllDivisionsForFilters = async () => {
        try {
            const data = await fetchAllDataForFilters('/divisions', {});
            setAllDivisions(data);
        } catch (error) {
            console.error('Failed to fetch all divisions for filters:', error);
        }
    };

    const filterOptions = useFilterOptionsFromData(allDivisions, {
        states: { field: 'state_id', nameField: 'name' }
    });

    useEffect(() => {
        fetchDivisions(pagination.pageIndex, pagination.pageSize, globalFilter, stateFilter);
        fetchReferenceData();
        fetchAllDivisionsForFilters();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, stateFilter, userHierarchy]);

    // Load division polygons from divisions table - filtered by user hierarchy
    useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem('serviceToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                
                const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/divisions?all=true&limit=10000`, { headers });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                
                if (!json.success || !Array.isArray(json.data)) {
                    throw new Error('Invalid response format');
                }

                // Filter divisions based on user hierarchy
                let divisionsToUse = json.data;
                if (userHierarchy?.division) {
                    // User has division-level access - show only their division
                    divisionsToUse = json.data.filter(d => String(d._id) === String(userHierarchy.division._id || userHierarchy.division));
                } else if (userHierarchy?.state) {
                    // User has state-level access - show only their state's divisions
                    divisionsToUse = json.data.filter(d => String(d.state_id?._id || d.state_id) === String(userHierarchy.state._id || userHierarchy.state));
                }
                // If no hierarchy, show all divisions (superAdmin)

                // Extract polygons from divisions that have polygon data
                const features = [];
                divisionsToUse.forEach(division => {
                    if (division.polygon) {
                        // Handle both Feature and FeatureCollection formats
                        let featureToAdd = null;
                        
                        if (division.polygon.type === 'Feature') {
                            // Single Feature
                            featureToAdd = {
                                ...division.polygon,
                                properties: {
                                    ...division.polygon.properties,
                                    division_id: division._id,
                                    division_name: division.name,
                                    division_code: division.division_code
                                }
                            };
                        } else if (division.polygon.type === 'FeatureCollection' && Array.isArray(division.polygon.features)) {
                            // FeatureCollection - add all features
                            division.polygon.features.forEach(feat => {
                                features.push({
                                    ...feat,
                                    properties: {
                                        ...feat.properties,
                                        division_id: division._id,
                                        division_name: division.name,
                                        division_code: division.division_code
                                    }
                                });
                            });
                            return; // Skip the single feature add below
                        }
                        
                        if (featureToAdd) {
                            features.push(featureToAdd);
                        }
                    }
                });

                if (!features.length) {
                    setMapError('No divisions with polygon data available');
                    setAllDivisionGeoJSON(null);
                    setDivisionGeoJSON(null);
                } else {
                    const geoJSON = { type: 'FeatureCollection', features };
                    setAllDivisionGeoJSON(geoJSON);
                    setDivisionGeoJSON(geoJSON);
                    setMapError(''); // Clear any previous errors
                }
            } catch (e) {
                console.error('Failed to load division polygons:', e);
                setMapError(`Failed to load polygon data: ${e.message}`);
                setAllDivisionGeoJSON(null);
                setDivisionGeoJSON(null);
            }
        })();
    }, [userHierarchy]);

    // Filter polygons based on current table data
    useEffect(() => {
        if (!allDivisionGeoJSON) {
            return;
        }

        // Show all polygons on map, not just current page
        setDivisionGeoJSON(allDivisionGeoJSON);
    }, [allDivisionGeoJSON]);

    // Reset to first page when searching or filtering
    useEffect(() => {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, [globalFilter, stateFilter]);

    const fetchDivisionDetailsByPolygon = async (divisionId, divisionName) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Fetch division by ID
            let division = null;
            let blocks = [];
            let assemblies = [];

            if (divisionId) {
                try {
                    const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/divisions/${divisionId}`, { headers });
                    const json = await res.json();
                    if (json?.success && json.data) {
                        division = json.data;
                    }
                } catch (e) {
                    console.warn('Failed to fetch division by ID:', e);
                }

                if (division && division._id) {
                    const did = division._id;
                    const fetches = [
                        fetch(`${import.meta.env.VITE_APP_API_URL}/blocks?division=${encodeURIComponent(did)}&all=true&limit=10000`, { headers }),
                        fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies?division=${encodeURIComponent(did)}&all=true&limit=10000`, { headers })
                    ];
                    const [bRes, aRes] = await Promise.allSettled(fetches);
                    const tryJson = async (r) => { try { const j = await r.json(); return j; } catch { return null; } };
                    if (bRes.status === 'fulfilled' && bRes.value.ok) { const j = await tryJson(bRes.value); if (j?.success && Array.isArray(j.data)) blocks = j.data; }
                    if (aRes.status === 'fulfilled' && aRes.value.ok) { const j = await tryJson(aRes.value); if (j?.success && Array.isArray(j.data)) assemblies = j.data; }

                    setDrawerData({ loading: false, divisionCode: divisionName, divisionName: divisionName, details: { division, blocks, assemblies } });
                    setDrawerOpen(true);
                } else {
                    setDrawerData({ loading: false, divisionCode: divisionName, divisionName: divisionName, details: null, error: 'Division not found' });
                    setDrawerOpen(true);
                }
            } else {
                setDrawerData({ loading: false, divisionCode: divisionName, divisionName: divisionName, details: null, error: 'Invalid division ID' });
                setDrawerOpen(true);
            }
        } catch (err) {
            console.error('Failed to fetch division details by polygon:', err);
            setDrawerData({ loading: false, divisionCode: divisionName, divisionName: divisionName, details: null, error: err.message });
            setDrawerOpen(true);
        }
    };

    const handleDeleteOpen = (id) => {
        setDivisionDeleteId(id);
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
                    {getValue() ? getValue().replace(/<[^>]+>/g, '').slice(0, 100) : ''}
                </Typography>
            )
        },
        {
            header: 'Code',
            accessorKey: 'division_code',
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
            header: 'Polygon',
            accessorKey: 'polygon',
            cell: ({ getValue }) => {
                const hasPolygon = !!getValue();
                return (
                    <Chip
                        label={hasPolygon ? 'Yes' : 'No'}
                        color={hasPolygon ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                    />
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
                            <IconButton
                                color="secondary"
                                onClick={() => navigate(`/division/${row.original._id}`)}
                            >
                                <Eye />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton color="primary" onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDivision(row.original);
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
        data: divisions,
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

    if (loading) return <EmptyReactTable />;

    return (
        <>
            <MainCard content={false}>
                {/* Division Map section above the table */}
                <Box sx={{ p: 2, pb: 0 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Division Map</Typography>
                    {mapError && <Alert severity="warning" sx={{ mb: 1 }}>{mapError}</Alert>}
                    {!divisionGeoJSON && !mapError && (
                        <Alert severity="info" sx={{ mb: 1 }}>Loading map data...</Alert>
                    )}
                    <MapContainerStyled sx={{ minHeight: 400 }}>
                        {mapboxToken ? (
                            <Map
                                ref={mapRef}
                                mapboxAccessToken={mapboxToken}
                                initialViewState={{ longitude: 77.0, latitude: 23.5, zoom: 6 }}
                                mapStyle="mapbox://styles/mapbox/streets-v12"
                                interactiveLayerIds={divisionGeoJSON ? ['division-fill'] : []}
                                onClick={(e) => {
                                    if (!divisionGeoJSON) return;
                                    try {
                                        const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                                        const point = e.point || { x: e.originalEvent?.clientX, y: e.originalEvent?.clientY };
                                        let features = e.features || [];
                                        if ((!features || features.length === 0) && map && point) {
                                            features = map.queryRenderedFeatures([point.x, point.y], { layers: ['division-fill'] }) || [];
                                        }
                                        const f = features.find(f => f.layer && f.layer.id === 'division-fill') || features[0];
                                        if (f) {
                                            const props = f.properties || {};
                                            const divisionId = props.division_id || '';
                                            const divisionName = props.division_name || '';
                                            setDrawerData({ loading: true, divisionCode: divisionName, divisionName: divisionName, details: null });
                                            setDrawerOpen(true);
                                            fetchDivisionDetailsByPolygon(divisionId, divisionName);
                                        }
                                    } catch (err) {
                                        console.warn('Map click handler error:', err);
                                    }
                                }}
                            >
                                <MapControl />
                                {divisionGeoJSON && (
                                    <Source id="division-polygons" type="geojson" data={divisionGeoJSON}>
                                        <Layer id="division-fill" type="fill" paint={{ 'fill-color': '#4CAF50', 'fill-opacity': 0.22 }} />
                                        <Layer id="division-outline" type="line" paint={{ 'line-color': '#388E3C', 'line-width': 2 }} />
                                        <Layer
                                            id="division-label"
                                            type="symbol"
                                            layout={{ 'text-field': ['concat', ['coalesce', ['get', 'division_name'], ['get', 'name'], ''], '\n', ['coalesce', ['get', 'division_code'], ['get', 'code'], '']], 'text-size': 10, 'text-allow-overlap': true, 'text-anchor': 'center' }}
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

                {/* Drawer for Division Details */}
                <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ '& .MuiDrawer-paper': { width: 400 } }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
                        <Typography variant="h6">Division Details</Typography>
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
                                    <Typography variant="subtitle2" color="textSecondary">Division Code</Typography>
                                    <Typography variant="body1">{drawerData.divisionCode || 'N/A'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">Division Name</Typography>
                                    <Typography variant="body1">{drawerData.divisionName || 'N/A'}</Typography>
                                </Box>
                                <Divider />
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">State</Typography>
                                    <Typography variant="body1">{drawerData.details.division?.state_id?.name || 'N/A'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                                    <Typography variant="body2">{drawerData.details.division?.description ? drawerData.details.division.description.replace(/<[^>]+>/g, '') : 'N/A'}</Typography>
                                </Box>
                                <Divider />
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Blocks ({drawerData.details.blocks?.length || 0})</Typography>
                                    {drawerData.details.blocks && drawerData.details.blocks.length > 0 ? (
                                        <Stack spacing={1}>
                                            {drawerData.details.blocks.map((block) => (
                                                <Chip key={block._id} label={block.name} size="small" variant="outlined" />
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Typography variant="body2" color="textSecondary">No blocks found</Typography>
                                    )}
                                </Box>
                                <Divider />
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Assemblies ({drawerData.details.assemblies?.length || 0})</Typography>
                                    {drawerData.details.assemblies && drawerData.details.assemblies.length > 0 ? (
                                        <Stack spacing={1}>
                                            {drawerData.details.assemblies.map((assembly) => (
                                                <Chip key={assembly._id} label={assembly.name} size="small" variant="outlined" color="primary" />
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Typography variant="body2" color="textSecondary">No assemblies found</Typography>
                                    )}
                                </Box>
                            </Stack>
                        ) : (
                            <Typography variant="body2" color="textSecondary">Click on a division on the map to view details</Typography>
                        )}
                    </Box>
                </Drawer>
                {/* Header: Search + Filters + Actions */}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={40}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    justifyContent="space-between"
                    sx={{ p: 2 }}
                >

                    <DebouncedInput
                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={`Search ${divisions.length} divisions...`}
                    />

                    <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        justifyContent="flex-end"
                    >
                        <CSVLink
                            data={csvData}
                            filename="divisions_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
                        {/* OTP Dialog for CSV export */}
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
                                <Button onClick={() => verifyOtp()} variant="contained" disabled={otpLoading || !otpCode?.trim()}>
                                    {otpLoading ? <CircularProgress size={20} /> : 'Verify & Download'}
                                </Button>
                            </DialogActions>
                        </Dialog>
                        <Button
                            variant="outlined"
                            onClick={handleDownloadExcelTemplate}
                            size="small"
                        >
                            Download Excel Template
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                if (importInputRef.current) importInputRef.current.click();
                            }}
                            size="small"
                            disabled={importing}
                        >
                            {importing ? 'Importing...' : 'Import Excel'}
                        </Button>
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
                            onClick={() => {
                                setSelectedDivision(null);
                                setOpenModal(true);
                            }}
                            size="small"
                        >
                            Add Division
                        </Button>
                    </Stack>
                </Stack>

                {/* Import Result */}
                {importResult && (
                    <Alert severity={importResult.success ? 'success' : 'error'} sx={{ m: 2 }}>
                        {importResult.success ? (
                            <span>
                                Imported: {importResult.created || 0} / {importResult.total || 0}
                                {Array.isArray(importResult.errors) && importResult.errors.length > 0 && (
                                    <> | Errors: {importResult.errors.length}</>
                                )}
                            </span>
                        ) : (
                            <span>Import failed: {importResult.message || 'Unknown error'}</span>
                        )}
                    </Alert>
                )}

                {/* Filters */}
                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ p: 2, flexWrap: 'wrap' }}
                >
                    <TextField
                        select
                        label="State"
                        value={stateFilter}
                        onChange={(e) => {
                            setStateFilter(e.target.value);
                        }}
                        sx={{ minWidth: 150 }}
                        size="small"
                    >
                        <MenuItem value="">All States</MenuItem>
                        {filterOptions.states?.map((state) => (
                            <MenuItem key={state._id} value={state._id}>
                                {state.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Button
                        variant="contained"
                        onClick={() => fetchDivisions(
                            pagination.pageIndex,
                            pagination.pageSize,
                            globalFilter,
                            stateFilter
                        )}
                        size="small"
                    >
                        Apply
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setStateFilter('');
                            setGlobalFilter('');
                            fetchDivisions(
                                pagination.pageIndex,
                                pagination.pageSize,
                                '',
                                ''
                            );
                        }}
                        size="small"
                    >
                        Clear
                    </Button>
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
                                                sx={{
                                                    cursor: header.column.getCanSort()
                                                        ? 'pointer'
                                                        : 'default',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    backgroundColor: 'primary.main'
                                                }}
                                            >
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box>
                                                        {flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                    </Box>
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
                                {table.getRowModel().rows.map((row) => (
                                    <Fragment key={row.id}>
                                        <TableRow>
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                        {row.getIsExpanded() && (
                                            <TableRow>
                                                <TableCell colSpan={row.getVisibleCells().length}>
                                                    <DivisionView data={row.original} />
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
                            setPageSize={(size) =>
                                setPagination((prev) => ({ ...prev, pageSize: size }))
                            }
                            setPageIndex={(index) =>
                                setPagination((prev) => ({ ...prev, pageIndex: index }))
                            }
                            getState={table.getState}
                            getPageCount={() => pageCount}
                        />
                    </Box>
                </ScrollX>
            </MainCard>

            {/* Hidden Import Input */}
            <input
                type="file"
                accept=".xlsx,.xls,.csv"
                ref={importInputRef}
                style={{ display: 'none' }}
                onChange={handleImportFile}
            />

            {/* Modals */}
            <DivisionModal
                open={openModal}
                modalToggler={setOpenModal}
                division={selectedDivision}
                states={states}
                refresh={() =>
                    fetchDivisions(pagination.pageIndex, pagination.pageSize)
                }
            />

            <AlertDivisionDelete
                id={divisionDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() =>
                    fetchDivisions(pagination.pageIndex, pagination.pageSize)
                }
            />
        </>
    );

}
