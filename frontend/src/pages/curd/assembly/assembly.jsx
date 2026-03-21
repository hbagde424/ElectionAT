import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, TextField, MenuItem, Tooltip, Alert, Drawer, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Collapse
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
import { filterAssembliesByHierarchy } from 'utils/hierarchyUtils';

import AssemblyModal from './AssemblyModal';
import AlertAssemblyDelete from './AlertAssemblyDelete';
import AssemblyView from './AssemblyView';
import AssemblyPolygonUpload from './AssemblyPolygonUpload';

export default function AssembliesListPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy } = usePermissions();

    const [selectedAssembly, setSelectedAssembly] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [assemblyDeleteId, setAssemblyDeleteId] = useState('');
    const [assemblies, setAssemblies] = useState([]);
    const [allAssemblies, setAllAssemblies] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
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
    const [assemblyGeoJSON, setAssemblyGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;
    const [openPolygonUpload, setOpenPolygonUpload] = useState(false);
    const [expandedSections, setExpandedSections] = useState({});
    const [assemblyDataMap, setAssemblyDataMap] = useState({}); // Map assembly_id to assembly data

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
                // If it's a populated object with name/title/description, show that
                if (value.name) return value.name;
                if (value.title) return value.title;
                if (value.description) return value.description;
                if (value.username) return value.username;
                // Otherwise skip ID objects
                return null;
            }
            return String(value).substring(0, 100);
        };

        const filterAndFormatData = (item) => {
            const fieldsToSkip = ['_id', 'id', 'created_by', 'updated_by', 'created_at', 'updated_at', 'createdAt', 'updatedAt', '__v', 'assembly_id'];
            
            return Object.entries(item)
                .filter(([key, value]) => {
                    // Skip if key contains 'id' or is in skip list
                    if (key.includes('_id') || key.includes('Id') || fieldsToSkip.includes(key)) return false;
                    // Skip internal fields
                    if (key.startsWith('_')) return false;
                    // Skip if value is an object (unless it has a name/title)
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

    const fetchAllAssembliesForFilters = async () => {
        try {
            const data = await fetchAllDataForFilters('/assemblies', {});
            setAllAssemblies(data);
        } catch (error) {
            console.error('Failed to fetch all assemblies for filters:', error);
        }
    };

    const fetchReferenceData = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const [statesRes, divisionsRes, parliamentsRes, usersRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/users`, { headers })
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
            if (currentFilters.state_id) queryParams.push(`state=${encodeURIComponent(currentFilters.state_id)}`);
            if (currentFilters.division_id) queryParams.push(`division=${encodeURIComponent(currentFilters.division_id)}`);
            if (currentFilters.parliament_id) queryParams.push(`parliament=${encodeURIComponent(currentFilters.parliament_id)}`);

            const queryString = queryParams.length > 0 ? `&${queryParams.join('&')}` : '';
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies?page=${pageIndex + 1}&limit=${pageSize}${queryString}`, { headers });
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
        fetchAssemblies(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
        fetchAllAssembliesForFilters();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    // Helper function to load and update assembly polygons
    const loadAssemblyPolygons = async (currentFilters = filters) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            // Build query params with filters
            const queryParams = [];
            if (currentFilters.state_id) queryParams.push(`state=${encodeURIComponent(currentFilters.state_id)}`);
            if (currentFilters.division_id) queryParams.push(`division=${encodeURIComponent(currentFilters.division_id)}`);
            if (currentFilters.parliament_id) queryParams.push(`parliament=${encodeURIComponent(currentFilters.parliament_id)}`);
            
            const queryString = queryParams.length > 0 ? `&${queryParams.join('&')}` : '';
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies?limit=10000${queryString}`, { headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            
            if (!json.success || !Array.isArray(json.data)) {
                throw new Error('Invalid response format');
            }

            // Create a map of assembly data for quick lookup
            const assemblyMap = {};
            json.data.forEach(assembly => {
                assemblyMap[assembly._id] = assembly;
            });
            setAssemblyDataMap(assemblyMap);

            let assembliesToUse = filterAssembliesByHierarchy(json.data, userHierarchy);

            const features = [];
            assembliesToUse.forEach(assembly => {
                if (assembly.polygon) {
                    let featureToAdd = null;
                    
                    if (assembly.polygon.type === 'Feature') {
                        featureToAdd = {
                            ...assembly.polygon,
                            properties: {
                                assembly_id: assembly._id
                            }
                        };
                    } else if (assembly.polygon.type === 'FeatureCollection' && Array.isArray(assembly.polygon.features)) {
                        assembly.polygon.features.forEach(feat => {
                            features.push({
                                ...feat,
                                properties: {
                                    assembly_id: assembly._id
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
                setAssemblyGeoJSON(null);
            } else {
                const geoJSON = { type: 'FeatureCollection', features };
                setAssemblyGeoJSON(geoJSON);
                setMapError('');
            }
        } catch (e) {
            console.error('Failed to load assembly polygons:', e);
            setMapError(`Failed to load polygon data: ${e.message}`);
            setAssemblyGeoJSON(null);
        }
    };

    useEffect(() => {
        loadAssemblyPolygons(filters);
    }, [userHierarchy]);

    useEffect(() => {
        if (assemblies.length > 0) {
            loadAssemblyPolygons(filters);
        }
    }, [assemblies]);

    const filterOptions = useFilterOptionsFromData(allAssemblies, {
        states: { field: 'state_id', nameField: 'name' },
        divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
        parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' }
    });

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

    const fetchAssemblyDetailsByPolygon = async (assemblyId, assemblyName) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            if (assemblyId) {
                try {
                    const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies/${assemblyId}/related-data`, { headers });
                    const json = await res.json();
                    console.log('Assembly Related Data:', json);
                    if (json?.success && json.data) {
                        setDrawerData({ loading: false, assemblyName: assemblyName, acNo: json.data.assembly?.AC_NO, details: json.data });
                        setDrawerOpen(true);
                    } else {
                        setDrawerData({ loading: false, assemblyName: assemblyName, details: null, error: 'Assembly data not found' });
                        setDrawerOpen(true);
                    }
                } catch (e) {
                    console.warn('Failed to fetch assembly related data:', e);
                    setDrawerData({ loading: false, assemblyName: assemblyName, details: null, error: 'Failed to fetch assembly data' });
                    setDrawerOpen(true);
                }
            } else {
                setDrawerData({ loading: false, assemblyName: assemblyName, details: null, error: 'Invalid assembly ID' });
                setDrawerOpen(true);
            }
        } catch (err) {
            console.error('Failed to fetch assembly details by polygon:', err);
            setDrawerData({ loading: false, assemblyName: assemblyName, details: null, error: err.message });
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
            header: 'AC No',
            accessorKey: 'AC_NO',
            cell: ({ getValue }) => (
                <Chip label={getValue() || 'N/A'} color="primary" size="small" variant="outlined" />
            )
        },
        {
            header: 'Type',
            accessorKey: 'type',
            cell: ({ getValue }) => (
                <Chip label={getValue() || 'N/A'} size="small" variant="outlined" />
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
            header: 'Parliament',
            accessorKey: 'parliament_id',
            cell: ({ getValue }) => (
                <Chip label={getValue()?.name || 'N/A'} color="warning" size="small" variant="outlined" />
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

    const fetchAllAssembliesForCsv = async () => {
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
        const allData = await fetchAllAssembliesForCsv();
        setCsvData(allData.map(item => ({
            'Assembly Name': item.name,
            'AC Number': item.AC_NO || 'N/A',
            'Type': item.type || '',
            'Category': item.category || '',
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
                    name: 'Chhattisgarh Assembly',
                    AC_NO: '1',
                    type: 'Urban',
                    category: 'General',
                    parliament_no: '101',
                    division_code: '1',
                    state_no: '22'
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

            const filteredRows = normalizedData.filter((r) => r.name);

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
                fetchAssemblies(pagination.pageIndex, pagination.pageSize);
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
        fetchAssemblies(pagination.pageIndex, pagination.pageSize, globalFilter, filters);
        loadAssemblyPolygons(filters);
    };

    const handleClearFilter = () => {
        const clearedFilters = {
            state_id: '',
            division_id: '',
            parliament_id: ''
        };
        setFilters(clearedFilters);
        fetchAssemblies(pagination.pageIndex, pagination.pageSize, globalFilter, clearedFilters);
        loadAssemblyPolygons(clearedFilters);
    };

    return (
        <>
            <MainCard content={false}>
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
                                        const f = features.find(f => f.layer && f.layer.id === 'assembly-fill') || features[0];
                                        if (f) {
                                            const props = f.properties || {};
                                            const assemblyId = props.assembly_id || '';
                                            const assemblyData = assemblyDataMap[assemblyId];
                                            const assemblyName = assemblyData?.name || '';
                                            setDrawerData({ loading: true, assemblyName: assemblyName, details: null });
                                            setDrawerOpen(true);
                                            fetchAssemblyDetailsByPolygon(assemblyId, assemblyName);
                                        }
                                    } catch (err) {
                                        console.warn('Map click handler error:', err);
                                    }
                                }}
                            >
                                <MapControl />
                                {assemblyGeoJSON && (
                                    <Source id="assembly-polygons" type="geojson" data={assemblyGeoJSON}>
                                        <Layer id="assembly-fill" type="fill" paint={{ 'fill-color': '#9C27B0', 'fill-opacity': 0.22 }} />
                                        <Layer id="assembly-outline" type="line" paint={{ 'line-color': '#7B1FA2', 'line-width': 2 }} />
                                    </Source>
                                )}
                                {/* Labels from CRUD assembly data */}
                                {assemblyGeoJSON && assemblyDataMap && (() => {
                                    const labelFeatures = [];
                                    assemblyGeoJSON.features.forEach((feature) => {
                                        const assemblyId = feature.properties?.assembly_id;
                                        const assemblyData = assemblyDataMap[assemblyId];
                                        if (!assemblyData || !feature.geometry) return;
                                        
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
                                                    name: assemblyData.name || '', 
                                                    acNo: String(assemblyData.AC_NO || '') 
                                                } 
                                            });
                                        }
                                    });
                                    
                                    return labelFeatures.length > 0 ? (
                                        <Source id="assembly-labels-source" type="geojson" data={{ type: 'FeatureCollection', features: labelFeatures }}>
                                            <Layer 
                                                id="assembly-label-layer" 
                                                type="symbol" 
                                                layout={{ 
                                                    'text-field': ['concat', ['get', 'name'], '\n', ['get', 'acNo']], 
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

                {/* Drawer for Assembly Details */}
                <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 500 } } }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Assembly Details</Typography>
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
                                {/* Basic Assembly Info */}
                                <Box sx={{ p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, borderLeft: '4px solid #1976d2' }}>
                                    <Typography variant="subtitle2" sx={{ color: '#1565c0', fontWeight: 600, mb: 1 }}>Basic Information</Typography>
                                    <Stack spacing={1}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Assembly Name</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{drawerData.details.assembly?.name || 'N/A'}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>AC Number</Typography>
                                            <Chip label={drawerData.details.assembly?.AC_NO || 'N/A'} size="small" color="primary" />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Type</Typography>
                                            <Typography variant="body2">{drawerData.details.assembly?.type || 'N/A'}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Category</Typography>
                                            <Typography variant="body2">{drawerData.details.assembly?.category || 'N/A'}</Typography>
                                        </Box>
                                    </Stack>
                                </Box>

                                {/* Hierarchy Info */}
                                <Box sx={{ p: 2, backgroundColor: '#f3e5f5', borderRadius: 1, borderLeft: '4px solid #7b1fa2' }}>
                                    <Typography variant="subtitle2" sx={{ color: '#6a1b9a', fontWeight: 600, mb: 1 }}>Hierarchy</Typography>
                                    <Stack spacing={1}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>State</Typography>
                                            <Chip label={drawerData.details.assembly?.state_id?.name || 'N/A'} size="small" variant="outlined" />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Division</Typography>
                                            <Chip label={drawerData.details.assembly?.division_id?.name || 'N/A'} size="small" variant="outlined" />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Parliament</Typography>
                                            <Chip label={drawerData.details.assembly?.parliament_id?.name || 'N/A'} size="small" variant="outlined" />
                                        </Box>
                                    </Stack>
                                </Box>

                                {/* Related Data Sections */}
                                {renderDataSection('Blocks', drawerData.details.blocks, 'blocks', '#e8f5e9', '#388e3c', '#2e7d32')}
                                {renderDataSection('Booths', drawerData.details.booths, 'booths', '#fff3e0', '#f57c00', '#e65100')}
                                {renderDataSection('Demographics', drawerData.details.boothDemographics, 'demographics', '#fce4ec', '#c2185b', '#880e4f')}
                                {renderDataSection('Election Stats', drawerData.details.boothElectionStats, 'electionStats', '#e0f2f1', '#00796b', '#004d40')}
                                {renderDataSection('Infrastructure', drawerData.details.boothInfrastructure, 'infrastructure', '#f1f8e9', '#689f38', '#33691e')}
                                {renderDataSection('Party Presence', drawerData.details.boothPartyPresence, 'partyPresence', '#ede7f6', '#512da8', '#311b92')}
                                {renderDataSection('Volunteers', drawerData.details.boothVolunteers, 'volunteers', '#fbe9e7', '#d84315', '#bf360c')}
                                {renderDataSection('Booth Votes', drawerData.details.boothVotes, 'boothVotes', '#e3f2fd', '#1976d2', '#0d47a1')}
                                {renderDataSection('Booth Admins', drawerData.details.boothAdmins, 'boothAdmins', '#f3e5f5', '#7b1fa2', '#4a148c')}
                                {renderDataSection('Active Parties', drawerData.details.activeParties, 'activeParties', '#fff8e1', '#f57f17', '#f57c00')}
                                {renderDataSection('Election Types', drawerData.details.electionTypes, 'electionTypes', '#e0f2f1', '#00897b', '#004d40')}
                                {renderDataSection('Coding', drawerData.details.coding, 'coding', '#f1f8e9', '#558b2f', '#33691e')}
                                {renderDataSection('Caste Lists', drawerData.details.casteLists, 'casteLists', '#fce4ec', '#ad1457', '#880e4f')}
                                {renderDataSection('Events', drawerData.details.events, 'events', '#e8eaf6', '#3949ab', '#1a237e')}
                                {renderDataSection('Genders', drawerData.details.genders, 'genders', '#f3e5f5', '#6a1b9a', '#4a148c')}
                                {renderDataSection('Falliya', drawerData.details.falliya, 'falliya', '#fff3e0', '#e65100', '#bf360c')}
                                {renderDataSection('BLA', drawerData.details.bla, 'bla', '#e0f2f1', '#00695c', '#004d40')}
                                {renderDataSection('BLO', drawerData.details.blo, 'blo', '#f1f8e9', '#689f38', '#33691e')}
                                {renderDataSection('Local Issues', drawerData.details.localIssues, 'localIssues', '#fce4ec', '#c2185b', '#880e4f')}
                                {renderDataSection('Local News', drawerData.details.localNews, 'localNews', '#e3f2fd', '#1976d2', '#0d47a1')}
                                {renderDataSection('Local Dynamics', drawerData.details.localDynamics, 'localDynamics', '#f3e5f5', '#7b1fa2', '#4a148c')}
                                {renderDataSection('Influencers', drawerData.details.influencers, 'influencers', '#fff8e1', '#f57f17', '#f57c00')}
                                {renderDataSection('Governments', drawerData.details.governments, 'governments', '#e0f2f1', '#00897b', '#004d40')}
                                {renderDataSection('Party Activities', drawerData.details.partyActivities, 'partyActivities', '#f1f8e9', '#558b2f', '#33691e')}
                                {renderDataSection('Panchayats', drawerData.details.panchayats, 'panchayats', '#fce4ec', '#ad1457', '#880e4f')}
                                {renderDataSection('Villages', drawerData.details.villages, 'villages', '#e8eaf6', '#3949ab', '#1a237e')}
                                {renderDataSection('Samitis', drawerData.details.samitis, 'samitis', '#f3e5f5', '#6a1b9a', '#4a148c')}
                                {renderDataSection('Visits', drawerData.details.visits, 'visits', '#fff3e0', '#e65100', '#bf360c')}
                                {renderDataSection('Voting Trends', drawerData.details.votingTrends, 'votingTrends', '#e0f2f1', '#00695c', '#004d40')}
                                {renderDataSection('Winning Parties', drawerData.details.winningParties, 'winningParties', '#f1f8e9', '#689f38', '#33691e')}
                                {renderDataSection('Winning Candidates', drawerData.details.winningCandidates, 'winningCandidates', '#fce4ec', '#c2185b', '#880e4f')}
                                {renderDataSection('Work Status', drawerData.details.workStatus, 'workStatus', '#e3f2fd', '#1976d2', '#0d47a1')}
                                {renderDataSection('Parliament Votes', drawerData.details.parliamentVotes, 'parliamentVotes', '#f3e5f5', '#7b1fa2', '#4a148c')}
                                {renderDataSection('Block Votes', drawerData.details.blockVotes, 'blockVotes', '#fff8e1', '#f57f17', '#f57c00')}
                                {renderDataSection('Districts', drawerData.details.districts, 'districts', '#e0f2f1', '#00897b', '#004d40')}
                            </Stack>
                        ) : (
                            <Typography variant="body2" color="textSecondary">Click on an assembly on the map to view details</Typography>
                        )}
                    </Box>
                </Drawer>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" sx={{ p: 2 }}>
                    <DebouncedInput value={globalFilter} onFilterChange={setGlobalFilter} placeholder={`Search ${assemblies.length} assemblies...`} style={{ flex: 1 }} />
                    <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                        <CSVLink data={csvData} filename="assemblies_all.csv" style={{ display: 'none' }} ref={csvLinkRef} />
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
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedAssembly(null); setOpenModal(true); }}>Add Assembly</Button>
                    </Stack>
                    {importResult && (
                        <Alert severity={importResult.success ? 'success' : 'error'} onClose={() => setImportResult(null)} sx={{ mt: 1 }}>
                            {importResult.success ? `Imported: ${importResult.created} / ${importResult.total} | Skipped: ${importResult.skipped}` : `Import failed: ${importResult.message}`}
                        </Alert>
                    )}
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2, flexWrap: 'wrap' }}>
                    <TextField select label="State" value={filters.state_id} onChange={(e) => setFilters((prev) => ({ ...prev, state_id: e.target.value, division_id: '', parliament_id: '' }))} sx={{ minWidth: 150 }} size="small">
                        <MenuItem value="">All States</MenuItem>
                        {filterOptions.states?.map((state) => (<MenuItem key={state._id} value={state._id}>{state.name}</MenuItem>))}
                    </TextField>
                    <TextField select label="Division" value={filters.division_id} onChange={(e) => setFilters((prev) => ({ ...prev, division_id: e.target.value, parliament_id: '' }))} sx={{ minWidth: 150 }} size="small" disabled={!filters.state_id}>
                        <MenuItem value="">All Divisions</MenuItem>
                        {filterOptions.divisions?.filter(division => (division.state_id?._id || division.state_id) === filters.state_id).map((division) => (<MenuItem key={division._id} value={division._id}>{division.name}</MenuItem>))}
                    </TextField>
                    <TextField select label="Parliament" value={filters.parliament_id} onChange={(e) => setFilters((prev) => ({ ...prev, parliament_id: e.target.value }))} sx={{ minWidth: 150 }} size="small" disabled={!filters.division_id}>
                        <MenuItem value="">All Parliaments</MenuItem>
                        {filterOptions.parliaments?.filter(parliament => (parliament.division_id?._id || parliament.division_id) === filters.division_id).map((parliament) => (<MenuItem key={parliament._id} value={parliament._id}>{parliament.name}</MenuItem>))}
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
                                        {row.getIsExpanded() && (<TableRow><TableCell colSpan={row.getVisibleCells().length}><AssemblyView data={row.original} /></TableCell></TableRow>)}
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

            <AssemblyModal open={openModal} modalToggler={setOpenModal} assembly={selectedAssembly} states={states} divisions={divisions} parliaments={parliaments} users={users} refresh={() => fetchAssemblies(pagination.pageIndex, pagination.pageSize)} />
            <AlertAssemblyDelete id={assemblyDeleteId} open={openDelete} handleClose={handleDeleteClose} refresh={() => fetchAssemblies(pagination.pageIndex, pagination.pageSize)} />
            <AssemblyPolygonUpload open={openPolygonUpload} onClose={() => setOpenPolygonUpload(false)} onSuccess={() => { fetchAssemblies(pagination.pageIndex, pagination.pageSize); }} />
        </>
    );
}
