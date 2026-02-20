import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, MenuItem, TextField, Tooltip, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Drawer, Collapse
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { Add, Edit, Eye, Trash } from 'iconsax-react';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;
    const [expandedSections, setExpandedSections] = useState({});
    const [divisionDataMap, setDivisionDataMap] = useState({});

    const toggleSection = (sectionName) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }));
    };

    const renderDataSection = (title, data, sectionKey, bgColor, borderColor, textColor) => {
        if (!data?.count || data.count === 0) return null;
        
        const getDisplayValue = (value) => {
            if (value === null || value === undefined) return 'N/A';
            if (typeof value === 'object') {
                if (value.name) return value.name;
                if (value.title) return value.title;
                if (value.description) return value.description;
                if (value.username) return value.username;
                return null;
            }
            return String(value).substring(0, 100);
        };

        const filterAndFormatData = (item) => {
            const fieldsToSkip = ['_id', 'id', 'created_by', 'updated_by', 'created_at', 'updated_at', 'createdAt', 'updatedAt', '__v', 'division_id'];
            
            return Object.entries(item)
                .filter(([key, value]) => {
                    if (key.includes('_id') || key.includes('Id') || fieldsToSkip.includes(key)) return false;
                    if (key.startsWith('_')) return false;
                    if (typeof value === 'object' && !value?.name && !value?.title && !value?.description && !value?.username) return false;
                    return true;
                })
                .slice(0, 8)
                .map(([key, value]) => ({
                    key: key.replace(/_/g, ' ').toUpperCase(),
                    value: getDisplayValue(value)
                }))
                .filter(item => item.value !== null);
        };
        
        return (
            <Box key={sectionKey} sx={{ backgroundColor: bgColor, borderRadius: 1, borderLeft: `4px solid ${borderColor}`, overflow: 'hidden', mt: 2 }}>
                <Box
                    onClick={() => toggleSection(sectionKey)}
                    sx={{ p: 2, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:hover': { backgroundColor: bgColor, opacity: 0.8 } }}
                >
                    <Typography variant="subtitle2" sx={{ color: textColor, fontWeight: 600 }}>{title} ({data.count})</Typography>
                    <ExpandMoreIcon sx={{ transform: expandedSections[sectionKey] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                </Box>
                <Collapse in={expandedSections[sectionKey]}>
                    <Box sx={{ p: 2, pt: 0, borderTop: `1px solid ${borderColor}` }}>
                        {data.data.map((item, idx) => {
                            const formattedData = filterAndFormatData(item);
                            return (
                                <Box key={idx} sx={{ mb: 2, pb: 1.5, borderBottom: idx < data.data.length - 1 ? `1px solid ${bgColor}` : 'none' }}>
                                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, display: 'block', mb: 1 }}>Record {idx + 1}</Typography>
                                    <Stack spacing={0.75} sx={{ mt: 0.5 }}>
                                        {formattedData.length > 0 ? (
                                            formattedData.map(({ key, value }) => (
                                                <Box key={key} sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 1, alignItems: 'flex-start' }}>
                                                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, wordBreak: 'break-word' }}>
                                                        {key}:
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#333', wordBreak: 'break-word' }}>
                                                        {value}
                                                    </Typography>
                                                </Box>
                                            ))
                                        ) : (
                                            <Typography variant="caption" sx={{ color: '#999' }}>No data available</Typography>
                                        )}
                                    </Stack>
                                </Box>
                            );
                        })}
                    </Box>
                </Collapse>
            </Box>
        );
    };

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

    // Helper function to load and update division polygons
    const loadDivisionPolygons = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/divisions?limit=10000`, { headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            
            if (!json.success || !Array.isArray(json.data)) {
                throw new Error('Invalid response format');
            }

            // Create a map of division data for quick lookup
            const divisionMap = {};
            json.data.forEach(division => {
                divisionMap[division._id] = division;
            });
            setDivisionDataMap(divisionMap);

            let divisionsToUse = json.data;
            if (userHierarchy?.division) {
                divisionsToUse = json.data.filter(d => String(d._id) === String(userHierarchy.division._id || userHierarchy.division));
            } else if (userHierarchy?.state) {
                divisionsToUse = json.data.filter(d => String(d.state_id?._id || d.state_id) === String(userHierarchy.state._id || userHierarchy.state));
            }

            const features = [];
            divisionsToUse.forEach(division => {
                if (division.polygon) {
                    let featureToAdd = null;
                    
                    if (division.polygon.type === 'Feature') {
                        featureToAdd = {
                            ...division.polygon,
                            properties: {
                                division_id: division._id
                            }
                        };
                    } else if (division.polygon.type === 'FeatureCollection' && Array.isArray(division.polygon.features)) {
                        division.polygon.features.forEach(feat => {
                            features.push({
                                ...feat,
                                properties: {
                                    division_id: division._id
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
                setMapError('No divisions with polygon data available');
                setDivisionGeoJSON(null);
            } else {
                const geoJSON = { type: 'FeatureCollection', features };
                setDivisionGeoJSON(geoJSON);
                setMapError('');
            }
        } catch (e) {
            console.error('Failed to load division polygons:', e);
            setMapError(`Failed to load polygon data: ${e.message}`);
            setDivisionGeoJSON(null);
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
        loadDivisionPolygons();
    }, [userHierarchy]);

    // Reset to first page when searching or filtering
    useEffect(() => {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, [globalFilter, stateFilter]);

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

    const fetchDivisionDetailsByPolygon = async (divisionId, divisionName) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            if (divisionId) {
                try {
                    const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/divisions/${divisionId}/related-data`, { headers });
                    const json = await res.json();
                    console.log('Division Related Data:', json);
                    if (json?.success && json.data) {
                        setDrawerData({ loading: false, divisionName: divisionName, divisionCode: json.data.division?.division_code, details: json.data });
                        setDrawerOpen(true);
                    } else {
                        setDrawerData({ loading: false, divisionName: divisionName, details: null, error: 'Division data not found' });
                        setDrawerOpen(true);
                    }
                } catch (e) {
                    console.warn('Failed to fetch division related data:', e);
                    setDrawerData({ loading: false, divisionName: divisionName, details: null, error: 'Failed to fetch division data' });
                    setDrawerOpen(true);
                }
            } else {
                setDrawerData({ loading: false, divisionName: divisionName, details: null, error: 'Invalid division ID' });
                setDrawerOpen(true);
            }
        } catch (err) {
            console.error('Failed to fetch division details by polygon:', err);
            setDrawerData({ loading: false, divisionName: divisionName, details: null, error: err.message });
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
                                            const divisionData = divisionDataMap[divisionId];
                                            const divisionName = divisionData?.name || '';
                                            setDrawerData({ loading: true, divisionName: divisionName, details: null });
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
                                    </Source>
                                )}
                                {/* Labels from CRUD division data */}
                                {divisionGeoJSON && divisionDataMap && (() => {
                                    const labelFeatures = [];
                                    divisionGeoJSON.features.forEach((feature) => {
                                        const divisionId = feature.properties?.division_id;
                                        const divisionData = divisionDataMap[divisionId];
                                        if (!divisionData || !feature.geometry) return;
                                        
                                        let center = null;
                                        if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates.length > 0) {
                                            const coords = feature.geometry.coordinates[0];
                                            if (coords.length > 0) {
                                                const lngs = coords.map(c => c[0]);
                                                const lats = coords.map(c => c[1]);
                                                center = [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2];
                                            }
                                        } else if (feature.geometry.type === 'MultiPolygon' && feature.geometry.coordinates.length > 0) {
                                            const coords = feature.geometry.coordinates[0][0];
                                            if (coords && coords.length > 0) {
                                                const lngs = coords.map(c => c[0]);
                                                const lats = coords.map(c => c[1]);
                                                center = [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2];
                                            }
                                        }
                                        
                                        if (center) {
                                            labelFeatures.push({ 
                                                type: 'Feature', 
                                                geometry: { type: 'Point', coordinates: center }, 
                                                properties: { 
                                                    name: divisionData.name || '', 
                                                    divisionCode: String(divisionData.division_code || '') 
                                                } 
                                            });
                                        }
                                    });
                                    
                                    return labelFeatures.length > 0 ? (
                                        <Source id="division-labels-source" type="geojson" data={{ type: 'FeatureCollection', features: labelFeatures }}>
                                            <Layer 
                                                id="division-label-layer" 
                                                type="symbol" 
                                                layout={{ 
                                                    'text-field': ['concat', ['get', 'name'], '\n', ['get', 'divisionCode']], 
                                                    'text-size': 10, 
                                                    'text-allow-overlap': false, 
                                                    'text-anchor': 'center', 
                                                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                                                    'text-offset': [0, 0]
                                                }} 
                                                paint={{ 
                                                    'text-color': '#000', 
                                                    'text-halo-color': '#ffffff', 
                                                    'text-halo-width': 2 
                                                }} 
                                            />
                                        </Source>
                                    ) : null;
                                })()}
                            </Map>
                        ) : (
                            <Alert severity="error">Mapbox token not configured</Alert>
                        )}
                    </MapContainerStyled>
                </Box>

                {/* Drawer for Division Details */}
                <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 500 } } }}>
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
                            <Stack spacing={0}>
                                {/* Basic Information Section */}
                                <Box sx={{ backgroundColor: '#E3F2FD', borderRadius: 1, borderLeft: '4px solid #1976D2', overflow: 'hidden', mt: 0 }}>
                                    <Box
                                        onClick={() => toggleSection('basicInfo')}
                                        sx={{ p: 2, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:hover': { backgroundColor: '#E3F2FD', opacity: 0.8 } }}
                                    >
                                        <Typography variant="subtitle2" sx={{ color: '#1565C0', fontWeight: 600 }}>Basic Information</Typography>
                                        <ExpandMoreIcon sx={{ transform: expandedSections['basicInfo'] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                                    </Box>
                                    <Collapse in={expandedSections['basicInfo']}>
                                        <Box sx={{ p: 2, pt: 0, borderTop: '1px solid #1976D2' }}>
                                            <Stack spacing={0.75}>
                                                <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 1, alignItems: 'flex-start' }}>
                                                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>NAME:</Typography>
                                                    <Typography variant="caption" sx={{ color: '#333' }}>{drawerData.details.division?.name || 'N/A'}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 1, alignItems: 'flex-start' }}>
                                                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>CODE:</Typography>
                                                    <Typography variant="caption" sx={{ color: '#333' }}>{drawerData.details.division?.division_code || 'N/A'}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 1, alignItems: 'flex-start' }}>
                                                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>DESCRIPTION:</Typography>
                                                    <Typography variant="caption" sx={{ color: '#333' }}>{drawerData.details.division?.description ? drawerData.details.division.description.replace(/<[^>]+>/g, '').substring(0, 100) : 'N/A'}</Typography>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    </Collapse>
                                </Box>

                                {/* Hierarchy Section */}
                                <Box sx={{ backgroundColor: '#F3E5F5', borderRadius: 1, borderLeft: '4px solid #7B1FA2', overflow: 'hidden', mt: 2 }}>
                                    <Box
                                        onClick={() => toggleSection('hierarchy')}
                                        sx={{ p: 2, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:hover': { backgroundColor: '#F3E5F5', opacity: 0.8 } }}
                                    >
                                        <Typography variant="subtitle2" sx={{ color: '#6A1B9A', fontWeight: 600 }}>Hierarchy</Typography>
                                        <ExpandMoreIcon sx={{ transform: expandedSections['hierarchy'] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                                    </Box>
                                    <Collapse in={expandedSections['hierarchy']}>
                                        <Box sx={{ p: 2, pt: 0, borderTop: '1px solid #7B1FA2' }}>
                                            <Stack spacing={0.75}>
                                                <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 1, alignItems: 'flex-start' }}>
                                                    <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>STATE:</Typography>
                                                    <Typography variant="caption" sx={{ color: '#333' }}>{drawerData.details.division?.state_id?.name || 'N/A'}</Typography>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    </Collapse>
                                </Box>

                                {/* Related Data Sections */}
                                {renderDataSection('Assemblies', drawerData.details.assemblies, 'assemblies', '#E8F5E9', '#388E3C', '#1B5E20')}
                                {renderDataSection('Blocks', drawerData.details.blocks, 'blocks', '#FFF3E0', '#F57C00', '#E65100')}
                                {renderDataSection('Booths', drawerData.details.booths, 'booths', '#FCE4EC', '#C2185B', '#880E4F')}
                                {renderDataSection('Parliaments', drawerData.details.parliaments, 'parliaments', '#E0F2F1', '#00796B', '#004D40')}
                                {renderDataSection('Districts', drawerData.details.districts, 'districts', '#F1F8E9', '#558B2F', '#33691E')}
                                {renderDataSection('BLOs', drawerData.details.blos, 'blos', '#EDE7F6', '#512DA8', '#311B92')}
                                {renderDataSection('Assembly Votes', drawerData.details.assemblyVotes, 'assemblyVotes', '#E3F2FD', '#1976D2', '#0D47A1')}
                                {renderDataSection('Block Votes', drawerData.details.blockVotes, 'blockVotes', '#F3E5F5', '#7B1FA2', '#4A148C')}
                                {renderDataSection('Booth Votes', drawerData.details.boothVotes, 'boothVotes', '#FFF3E0', '#F57C00', '#E65100')}
                                {renderDataSection('Parliament Votes', drawerData.details.parliamentVotes, 'parliamentVotes', '#E0F2F1', '#00796B', '#004D40')}
                                {renderDataSection('Election Types', drawerData.details.electionTypes, 'electionTypes', '#F1F8E9', '#558B2F', '#33691E')}
                                {renderDataSection('Winning Candidates', drawerData.details.winningCandidates, 'winningCandidates', '#EDE7F6', '#512DA8', '#311B92')}
                                {renderDataSection('Winning Parties', drawerData.details.winningParties, 'winningParties', '#E8F5E9', '#388E3C', '#1B5E20')}
                                {renderDataSection('Booth Demographics', drawerData.details.boothDemographics, 'boothDemographics', '#FCE4EC', '#C2185B', '#880E4F')}
                                {renderDataSection('Booth Surveys', drawerData.details.boothSurveys, 'boothSurveys', '#E0F2F1', '#00796B', '#004D40')}
                                {renderDataSection('Booth Volunteers', drawerData.details.boothVolunteers, 'boothVolunteers', '#F1F8E9', '#558B2F', '#33691E')}
                                {renderDataSection('Caste Lists', drawerData.details.casteLists, 'casteLists', '#EDE7F6', '#512DA8', '#311B92')}
                                {renderDataSection('Genders', drawerData.details.genders, 'genders', '#E3F2FD', '#1976D2', '#0D47A1')}
                                {renderDataSection('BLAs', drawerData.details.blas, 'blas', '#F3E5F5', '#7B1FA2', '#4A148C')}
                                {renderDataSection('Falliya', drawerData.details.falliya, 'falliya', '#FFF3E0', '#F57C00', '#E65100')}
                                {renderDataSection('Coding', drawerData.details.coding, 'coding', '#E0F2F1', '#00796B', '#004D40')}
                                {renderDataSection('Influencers', drawerData.details.influencers, 'influencers', '#F1F8E9', '#558B2F', '#33691E')}
                                {renderDataSection('Events', drawerData.details.events, 'events', '#EDE7F6', '#512DA8', '#311B92')}
                                {renderDataSection('Party Activities', drawerData.details.partyActivities, 'partyActivities', '#E8F5E9', '#388E3C', '#1B5E20')}
                                {renderDataSection('Visits', drawerData.details.visits, 'visits', '#FCE4EC', '#C2185B', '#880E4F')}
                                {renderDataSection('Panchayats', drawerData.details.panchayats, 'panchayats', '#E0F2F1', '#00796B', '#004D40')}
                                {renderDataSection('Villages', drawerData.details.villages, 'villages', '#F1F8E9', '#558B2F', '#33691E')}
                                {renderDataSection('Local Issues', drawerData.details.localIssues, 'localIssues', '#EDE7F6', '#512DA8', '#311B92')}
                                {renderDataSection('Samitis', drawerData.details.samitis, 'samitis', '#E3F2FD', '#1976D2', '#0D47A1')}
                                {renderDataSection('Voting Trends', drawerData.details.votingTrends, 'votingTrends', '#F3E5F5', '#7B1FA2', '#4A148C')}
                                {renderDataSection('Work Status', drawerData.details.workStatus, 'workStatus', '#FFF3E0', '#F57C00', '#E65100')}
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
