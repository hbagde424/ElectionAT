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

import BoothModal from './BoothModal';
import AlertBoothDelete from './AlertBoothDelete';
import BoothView from './BoothView';
import BoothPolygonUpload from './BoothPolygonUpload';

export default function BoothsListPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy } = usePermissions();

    const [selectedBooth, setSelectedBooth] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [boothDeleteId, setBoothDeleteId] = useState('');
    const [booths, setBooths] = useState([]);
    const [allBooths, setAllBooths] = useState([]);
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
        parliament_id: '',
        assembly_id: '',
        block_id: ''
    });
    const csvLinkRef = useRef();
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const importInputRef = useRef();

    // Map & Drawer state
    const [boothGeoJSON, setBoothGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;
    const [openPolygonUpload, setOpenPolygonUpload] = useState(false);
    const [expandedSections, setExpandedSections] = useState({});
    const [boothDataMap, setBoothDataMap] = useState({}); // Map booth_id to booth data

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
            const fieldsToSkip = ['_id', 'id', 'created_by', 'updated_by', 'created_at', 'updated_at', 'createdAt', 'updatedAt', '__v', 'booth_id'];
            
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

    const fetchAllBoothsForFilters = async () => {
        try {
            const data = await fetchAllDataForFilters('/booths', {});
            setAllBooths(data);
        } catch (error) {
            console.error('Failed to fetch all booths for filters:', error);
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

    const fetchBooths = async (pageIndex, pageSize, globalFilter = '', currentFilters = filters) => {
        setLoading(true);
        try {
            const queryParams = [];
            if (globalFilter) queryParams.push(`search=${encodeURIComponent(globalFilter)}`);
            if (currentFilters.state_id) queryParams.push(`state=${encodeURIComponent(currentFilters.state_id)}`);
            if (currentFilters.division_id) queryParams.push(`division=${encodeURIComponent(currentFilters.division_id)}`);
            if (currentFilters.parliament_id) queryParams.push(`parliament=${encodeURIComponent(currentFilters.parliament_id)}`);
            if (currentFilters.assembly_id) queryParams.push(`assembly=${encodeURIComponent(currentFilters.assembly_id)}`);
            if (currentFilters.block_id) queryParams.push(`block=${encodeURIComponent(currentFilters.block_id)}`);

            const queryString = queryParams.length > 0 ? `&${queryParams.join('&')}` : '';
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?page=${pageIndex + 1}&limit=${pageSize}${queryString}`, { headers });
            const json = await res.json();
            if (json.success) {
                setBooths(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch booths:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooths(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
        fetchAllBoothsForFilters();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    // Helper function to load and update booth polygons
    const loadBoothPolygons = async (currentFilters = filters) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            // Build query params with filters
            const queryParams = [];
            if (currentFilters.state_id) queryParams.push(`state=${encodeURIComponent(currentFilters.state_id)}`);
            if (currentFilters.division_id) queryParams.push(`division=${encodeURIComponent(currentFilters.division_id)}`);
            if (currentFilters.parliament_id) queryParams.push(`parliament=${encodeURIComponent(currentFilters.parliament_id)}`);
            if (currentFilters.assembly_id) queryParams.push(`assembly=${encodeURIComponent(currentFilters.assembly_id)}`);
            if (currentFilters.block_id) queryParams.push(`block=${encodeURIComponent(currentFilters.block_id)}`);
            
            const queryString = queryParams.length > 0 ? `&${queryParams.join('&')}` : '';
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?limit=10000${queryString}`, { headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            
            if (!json.success || !Array.isArray(json.data)) {
                throw new Error('Invalid response format');
            }

            // Create a map of booth data for quick lookup
            const boothMap = {};
            json.data.forEach(booth => {
                boothMap[booth._id] = booth;
            });
            setBoothDataMap(boothMap);

            // Filter booths based on user hierarchy
            let boothsToUse = json.data;
            if (userHierarchy?.booth) {
                boothsToUse = json.data.filter(b => String(b._id) === String(userHierarchy.booth._id || userHierarchy.booth));
            } else if (userHierarchy?.block) {
                boothsToUse = json.data.filter(b => String(b.block_id?._id || b.block_id) === String(userHierarchy.block._id || userHierarchy.block));
            } else if (userHierarchy?.assembly) {
                boothsToUse = json.data.filter(b => String(b.assembly_id?._id || b.assembly_id) === String(userHierarchy.assembly._id || userHierarchy.assembly));
            } else if (userHierarchy?.parliament) {
                boothsToUse = json.data.filter(b => String(b.parliament_id?._id || b.parliament_id) === String(userHierarchy.parliament._id || userHierarchy.parliament));
            } else if (userHierarchy?.division) {
                boothsToUse = json.data.filter(b => String(b.division_id?._id || b.division_id) === String(userHierarchy.division._id || userHierarchy.division));
            } else if (userHierarchy?.state) {
                boothsToUse = json.data.filter(b => String(b.state_id?._id || b.state_id) === String(userHierarchy.state._id || userHierarchy.state));
            }

            // Extract polygons from booths that have polygon data
            const features = [];
            boothsToUse.forEach(booth => {
                if (booth.polygon) {
                    let featureToAdd = null;
                    
                    if (booth.polygon.type === 'Feature') {
                        featureToAdd = {
                            ...booth.polygon,
                            properties: {
                                booth_id: booth._id
                            }
                        };
                    } else if (booth.polygon.type === 'FeatureCollection' && Array.isArray(booth.polygon.features)) {
                        booth.polygon.features.forEach(feat => {
                            features.push({
                                ...feat,
                                properties: {
                                    booth_id: booth._id
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
                setMapError('No booths with polygon data available');
                setBoothGeoJSON(null);
            } else {
                const geoJSON = { type: 'FeatureCollection', features };
                setBoothGeoJSON(geoJSON);
                setMapError('');
            }
        } catch (e) {
            console.error('Failed to load booth polygons:', e);
            setMapError(`Failed to load polygon data: ${e.message}`);
            setBoothGeoJSON(null);
        }
    };

    // Load booth polygons on mount and when user hierarchy changes
    useEffect(() => {
        loadBoothPolygons(filters);
    }, [userHierarchy]);

    // Reload polygons when booths data changes (after update/delete)
    useEffect(() => {
        if (booths.length > 0) {
            loadBoothPolygons(filters);
        }
    }, [booths]);

    const filterOptions = useFilterOptionsFromData(allBooths, {
        states: { field: 'state_id', nameField: 'name' },
        divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
        parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
        assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
        blocks: { field: 'block_id', nameField: 'name', parentField: 'assembly_id' }
    });

    const handleDeleteOpen = (id) => {
        setBoothDeleteId(id);
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

    const fetchBoothDetailsByPolygon = async (boothId, boothName) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            if (boothId) {
                try {
                    const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths/${boothId}/related-data`, { headers });
                    const json = await res.json();
                    console.log('Booth Related Data:', json);
                    if (json?.success && json.data) {
                        setDrawerData({ loading: false, boothName: boothName, boothNumber: json.data.booth?.booth_number, details: json.data });
                        setDrawerOpen(true);
                    } else {
                        setDrawerData({ loading: false, boothName: boothName, details: null, error: 'Booth data not found' });
                        setDrawerOpen(true);
                    }
                } catch (e) {
                    console.warn('Failed to fetch booth related data:', e);
                    setDrawerData({ loading: false, boothName: boothName, details: null, error: 'Failed to fetch booth data' });
                    setDrawerOpen(true);
                }
            } else {
                setDrawerData({ loading: false, boothName: boothName, details: null, error: 'Invalid booth ID' });
                setDrawerOpen(true);
            }
        } catch (err) {
            console.error('Failed to fetch booth details by polygon:', err);
            setDrawerData({ loading: false, boothName: boothName, details: null, error: err.message });
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
            header: 'Booth Name',
            accessorKey: 'name',
            cell: ({ getValue }) => (
                <Typography sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'Booth No',
            accessorKey: 'booth_number',
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
            accessorKey: 'block_id',
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
                            <IconButton color="secondary" onClick={() => navigate(`/booth/${row.original._id}`)}>
                                <Eye />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedBooth(row.original); setOpenModal(true); }}>
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
        data: booths,
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

    const fetchAllBoothsForCsv = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?all=true`, { headers });
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all booths for CSV:', error);
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
        const allData = await fetchAllBoothsForCsv();
        setCsvData(allData.map(item => ({
            'Booth Name': item.name,
            'Booth Number': item.booth_number || 'N/A',
            'Address': item.full_address || '',
            'Male Count': item.Male_Count || 0,
            'Female Count': item.Female_Count || 0,
            'Others Count': item.others_Count || 0,
            'Total': item.Total || 0,
            'Block': item.block_id?.name || '',
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
                    booth_number: '280',
                    full_address: 'प्राथमिक विद्यालय मानसी',
                    latitude: '12',
                    longitude: '2',
                    Male_Count: '273',
                    Female_Count: '291',
                    others_Count: '0',
                    Total: '564',
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
            XLSX.writeFile(workbook, 'booths_template.xlsx');
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

            const filteredRows = normalizedData.filter((r) => r.name || r.booth_number);

            const token = localStorage.getItem('serviceToken');
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths/import`, {
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
                fetchBooths(pagination.pageIndex, pagination.pageSize);
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
        fetchBooths(pagination.pageIndex, pagination.pageSize, globalFilter, filters);
        loadBoothPolygons(filters);
    };

    const handleClearFilter = () => {
        const clearedFilters = {
            state_id: '',
            division_id: '',
            parliament_id: '',
            assembly_id: '',
            block_id: ''
        };
        setFilters(clearedFilters);
        fetchBooths(pagination.pageIndex, pagination.pageSize, globalFilter, clearedFilters);
        loadBoothPolygons(clearedFilters);
    };

    return (
        <>
            <MainCard content={false}>
                {/* Booth Map section */}
                <Box sx={{ p: 2, pb: 0 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Booth Map</Typography>
                    {mapError && <Alert severity="warning" sx={{ mb: 1 }}>{mapError}</Alert>}
                    {!boothGeoJSON && !mapError && (
                        <Alert severity="info" sx={{ mb: 1 }}>Loading map data...</Alert>
                    )}
                    <MapContainerStyled sx={{ minHeight: 400 }}>
                        {mapboxToken ? (
                            <Map
                                ref={mapRef}
                                mapboxAccessToken={mapboxToken}
                                initialViewState={{ longitude: 77.0, latitude: 23.5, zoom: 5 }}
                                mapStyle="mapbox://styles/mapbox/streets-v12"
                                interactiveLayerIds={boothGeoJSON ? ['booth-fill'] : []}
                                onClick={(e) => {
                                    if (!boothGeoJSON) return;
                                    try {
                                        const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                                        const point = e.point || { x: e.originalEvent?.clientX, y: e.originalEvent?.clientY };
                                        let features = e.features || [];
                                        if ((!features || features.length === 0) && map && point) {
                                            features = map.queryRenderedFeatures([point.x, point.y], { layers: ['booth-fill'] }) || [];
                                        }
                                        const f = features.find(f => f.layer && f.layer.id === 'booth-fill') || features[0];
                                        if (f) {
                                            const props = f.properties || {};
                                            const boothId = props.booth_id || '';
                                            const boothName = props.booth_name || '';
                                            setDrawerData({ loading: true, boothName: boothName, details: null });
                                            setDrawerOpen(true);
                                            fetchBoothDetailsByPolygon(boothId, boothName);
                                        }
                                    } catch (err) {
                                        console.warn('Map click handler error:', err);
                                    }
                                }}
                            >
                                <MapControl />
                                {boothGeoJSON && (
                                    <Source id="booth-polygons" type="geojson" data={boothGeoJSON}>
                                        <Layer id="booth-fill" type="fill" paint={{ 'fill-color': '#4CAF50', 'fill-opacity': 0.22 }} />
                                        <Layer id="booth-outline" type="line" paint={{ 'line-color': '#388E3C', 'line-width': 2 }} />
                                    </Source>
                                )}
                                {/* Labels from CRUD booth data */}
                                {boothGeoJSON && boothDataMap && (() => {
                                    const labelFeatures = [];
                                    boothGeoJSON.features.forEach((feature) => {
                                        const boothId = feature.properties?.booth_id;
                                        const boothData = boothDataMap[boothId];
                                        if (!boothData || !feature.geometry) return;
                                        
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
                                                    name: boothData.name || '', 
                                                    number: String(boothData.booth_number || '') 
                                                } 
                                            });
                                        }
                                    });
                                    
                                    return labelFeatures.length > 0 ? (
                                        <Source id="booth-labels-source" type="geojson" data={{ type: 'FeatureCollection', features: labelFeatures }}>
                                            <Layer 
                                                id="booth-label-layer" 
                                                type="symbol" 
                                                layout={{ 
                                                    'text-field': ['concat', ['get', 'name'], '\n', ['get', 'number']], 
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

                {/* Drawer for Booth Details */}
                <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 500 } } }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e0e0e0', backgroundColor: '#f5f5f5' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>Booth Details</Typography>
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
                                {/* Basic Booth Info */}
                                <Box sx={{ p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, borderLeft: '4px solid #1976d2' }}>
                                    <Typography variant="subtitle2" sx={{ color: '#1565c0', fontWeight: 600, mb: 1 }}>Basic Information</Typography>
                                    <Stack spacing={1}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Booth Name</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{drawerData.details.booth?.name || 'N/A'}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Booth Number</Typography>
                                            <Chip label={drawerData.details.booth?.booth_number || 'N/A'} size="small" color="primary" />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Address</Typography>
                                            <Typography variant="body2">{drawerData.details.booth?.full_address || 'N/A'}</Typography>
                                        </Box>
                                    </Stack>
                                </Box>

                                {/* Hierarchy Info */}
                                <Box sx={{ p: 2, backgroundColor: '#f3e5f5', borderRadius: 1, borderLeft: '4px solid #7b1fa2' }}>
                                    <Typography variant="subtitle2" sx={{ color: '#6a1b9a', fontWeight: 600, mb: 1 }}>Hierarchy</Typography>
                                    <Stack spacing={1}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>State</Typography>
                                            <Chip label={drawerData.details.booth?.state_id?.name || 'N/A'} size="small" variant="outlined" />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Division</Typography>
                                            <Chip label={drawerData.details.booth?.division_id?.name || 'N/A'} size="small" variant="outlined" />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Parliament</Typography>
                                            <Chip label={drawerData.details.booth?.parliament_id?.name || 'N/A'} size="small" variant="outlined" />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Assembly</Typography>
                                            <Chip label={drawerData.details.booth?.assembly_id?.name || 'N/A'} size="small" variant="outlined" />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Block</Typography>
                                            <Chip label={drawerData.details.booth?.block_id?.name || 'N/A'} size="small" variant="outlined" />
                                        </Box>
                                    </Stack>
                                </Box>

                                {/* Voter Demographics */}
                                <Box sx={{ p: 2, backgroundColor: '#e8f5e9', borderRadius: 1, borderLeft: '4px solid #388e3c' }}>
                                    <Typography variant="subtitle2" sx={{ color: '#2e7d32', fontWeight: 600, mb: 1 }}>Voter Demographics</Typography>
                                    <Stack spacing={1}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Male</Typography>
                                            <Chip label={drawerData.details.booth?.Male_Count || 0} size="small" color="info" />
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Female</Typography>
                                            <Chip label={drawerData.details.booth?.Female_Count || 0} size="small" color="warning" />
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Others</Typography>
                                            <Chip label={drawerData.details.booth?.others_Count || 0} size="small" />
                                        </Box>
                                        <Divider sx={{ my: 1 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#fff9c4', p: 1, borderRadius: 0.5 }}>
                                            <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>Total</Typography>
                                            <Chip label={drawerData.details.booth?.Total || 0} size="small" color="success" />
                                        </Box>
                                    </Stack>
                                </Box>

                                {/* Related Data Sections - Demographics */}
                                {drawerData.details.demographics?.count > 0 && (
                                    <Box sx={{ backgroundColor: '#fff3e0', borderRadius: 1, borderLeft: '4px solid #f57c00', overflow: 'hidden' }}>
                                        <Box
                                            onClick={() => toggleSection('demographics')}
                                            sx={{ p: 2, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:hover': { backgroundColor: '#ffe0b2' } }}
                                        >
                                            <Typography variant="subtitle2" sx={{ color: '#e65100', fontWeight: 600 }}>Demographics ({drawerData.details.demographics.count})</Typography>
                                            <ExpandMoreIcon sx={{ transform: expandedSections.demographics ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                                        </Box>
                                        <Collapse in={expandedSections.demographics}>
                                            <Box sx={{ p: 2, pt: 0, borderTop: '1px solid #ffb74d' }}>
                                                {drawerData.details.demographics.data.map((item, idx) => (
                                                    <Box key={idx} sx={{ mb: 1.5, pb: 1.5, borderBottom: idx < drawerData.details.demographics.data.length - 1 ? '1px solid #ffe0b2' : 'none' }}>
                                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Record {idx + 1}</Typography>
                                                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                                            {Object.entries(item).filter(([key]) => !key.startsWith('_')).slice(0, 5).map(([key, value]) => (
                                                                <Typography key={key} variant="caption" sx={{ color: '#555' }}>
                                                                    <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value).substring(0, 30) : String(value).substring(0, 50)}
                                                                </Typography>
                                                            ))}
                                                        </Stack>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Collapse>
                                    </Box>
                                )}

                                {/* Election Stats */}
                                {drawerData.details.electionStats?.count > 0 && (
                                    <Box sx={{ backgroundColor: '#fce4ec', borderRadius: 1, borderLeft: '4px solid #c2185b', overflow: 'hidden', mt: 2 }}>
                                        <Box
                                            onClick={() => toggleSection('electionStats')}
                                            sx={{ p: 2, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:hover': { backgroundColor: '#f8bbd0' } }}
                                        >
                                            <Typography variant="subtitle2" sx={{ color: '#880e4f', fontWeight: 600 }}>Election Stats ({drawerData.details.electionStats.count})</Typography>
                                            <ExpandMoreIcon sx={{ transform: expandedSections.electionStats ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                                        </Box>
                                        <Collapse in={expandedSections.electionStats}>
                                            <Box sx={{ p: 2, pt: 0, borderTop: '1px solid #f48fb1' }}>
                                                {drawerData.details.electionStats.data.map((item, idx) => (
                                                    <Box key={idx} sx={{ mb: 1.5, pb: 1.5, borderBottom: idx < drawerData.details.electionStats.data.length - 1 ? '1px solid #fce4ec' : 'none' }}>
                                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Record {idx + 1}</Typography>
                                                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                                            {Object.entries(item).filter(([key]) => !key.startsWith('_')).slice(0, 5).map(([key, value]) => (
                                                                <Typography key={key} variant="caption" sx={{ color: '#555' }}>
                                                                    <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value).substring(0, 30) : String(value).substring(0, 50)}
                                                                </Typography>
                                                            ))}
                                                        </Stack>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Collapse>
                                    </Box>
                                )}

                                {/* Infrastructure */}
                                {drawerData.details.infrastructure?.count > 0 && (
                                    <Box sx={{ backgroundColor: '#e0f2f1', borderRadius: 1, borderLeft: '4px solid #00796b', overflow: 'hidden', mt: 2 }}>
                                        <Box
                                            onClick={() => toggleSection('infrastructure')}
                                            sx={{ p: 2, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:hover': { backgroundColor: '#b2dfdb' } }}
                                        >
                                            <Typography variant="subtitle2" sx={{ color: '#004d40', fontWeight: 600 }}>Infrastructure ({drawerData.details.infrastructure.count})</Typography>
                                            <ExpandMoreIcon sx={{ transform: expandedSections.infrastructure ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                                        </Box>
                                        <Collapse in={expandedSections.infrastructure}>
                                            <Box sx={{ p: 2, pt: 0, borderTop: '1px solid #80cbc4' }}>
                                                {drawerData.details.infrastructure.data.map((item, idx) => (
                                                    <Box key={idx} sx={{ mb: 1.5, pb: 1.5, borderBottom: idx < drawerData.details.infrastructure.data.length - 1 ? '1px solid #e0f2f1' : 'none' }}>
                                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Record {idx + 1}</Typography>
                                                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                                            {Object.entries(item).filter(([key]) => !key.startsWith('_')).slice(0, 5).map(([key, value]) => (
                                                                <Typography key={key} variant="caption" sx={{ color: '#555' }}>
                                                                    <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value).substring(0, 30) : String(value).substring(0, 50)}
                                                                </Typography>
                                                            ))}
                                                        </Stack>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Collapse>
                                    </Box>
                                )}

                                {/* Party Presence */}
                                {drawerData.details.partyPresence?.count > 0 && (
                                    <Box sx={{ backgroundColor: '#f1f8e9', borderRadius: 1, borderLeft: '4px solid #689f38', overflow: 'hidden', mt: 2 }}>
                                        <Box
                                            onClick={() => toggleSection('partyPresence')}
                                            sx={{ p: 2, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:hover': { backgroundColor: '#dcedc8' } }}
                                        >
                                            <Typography variant="subtitle2" sx={{ color: '#33691e', fontWeight: 600 }}>Party Presence ({drawerData.details.partyPresence.count})</Typography>
                                            <ExpandMoreIcon sx={{ transform: expandedSections.partyPresence ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                                        </Box>
                                        <Collapse in={expandedSections.partyPresence}>
                                            <Box sx={{ p: 2, pt: 0, borderTop: '1px solid #c5e1a5' }}>
                                                {drawerData.details.partyPresence.data.map((item, idx) => (
                                                    <Box key={idx} sx={{ mb: 1.5, pb: 1.5, borderBottom: idx < drawerData.details.partyPresence.data.length - 1 ? '1px solid #f1f8e9' : 'none' }}>
                                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Record {idx + 1}</Typography>
                                                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                                            {Object.entries(item).filter(([key]) => !key.startsWith('_')).slice(0, 5).map(([key, value]) => (
                                                                <Typography key={key} variant="caption" sx={{ color: '#555' }}>
                                                                    <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value).substring(0, 30) : String(value).substring(0, 50)}
                                                                </Typography>
                                                            ))}
                                                        </Stack>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Collapse>
                                    </Box>
                                )}

                                {/* Volunteers */}
                                {drawerData.details.volunteers?.count > 0 && (
                                    <Box sx={{ backgroundColor: '#ede7f6', borderRadius: 1, borderLeft: '4px solid #512da8', overflow: 'hidden', mt: 2 }}>
                                        <Box
                                            onClick={() => toggleSection('volunteers')}
                                            sx={{ p: 2, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:hover': { backgroundColor: '#d1c4e9' } }}
                                        >
                                            <Typography variant="subtitle2" sx={{ color: '#311b92', fontWeight: 600 }}>Volunteers ({drawerData.details.volunteers.count})</Typography>
                                            <ExpandMoreIcon sx={{ transform: expandedSections.volunteers ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                                        </Box>
                                        <Collapse in={expandedSections.volunteers}>
                                            <Box sx={{ p: 2, pt: 0, borderTop: '1px solid #ce93d8' }}>
                                                {drawerData.details.volunteers.data.map((item, idx) => (
                                                    <Box key={idx} sx={{ mb: 1.5, pb: 1.5, borderBottom: idx < drawerData.details.volunteers.data.length - 1 ? '1px solid #ede7f6' : 'none' }}>
                                                        <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>Record {idx + 1}</Typography>
                                                        <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                                            {Object.entries(item).filter(([key]) => !key.startsWith('_')).slice(0, 5).map(([key, value]) => (
                                                                <Typography key={key} variant="caption" sx={{ color: '#555' }}>
                                                                    <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value).substring(0, 30) : String(value).substring(0, 50)}
                                                                </Typography>
                                                            ))}
                                                        </Stack>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Collapse>
                                    </Box>
                                )}

                                {/* Votes */}
                                {renderDataSection('Votes', drawerData.details.votes, 'votes', '#e1f5fe', '#0277bd', '#01579b')}

                                {/* Booth Admins */}
                                {renderDataSection('Booth Admins', drawerData.details.admins, 'admins', '#ffebee', '#d32f2f', '#b71c1c')}

                                {/* Other Data Categories - All Expandable */}
                                {renderDataSection('Genders', drawerData.details.genders, 'genders', '#f3e5f5', '#9c27b0', '#6a1b9a')}
                                {renderDataSection('BLA', drawerData.details.bla, 'bla', '#ffebee', '#c62828', '#b71c1c')}
                                {renderDataSection('BLO', drawerData.details.blo, 'blo', '#f1f8e9', '#558b2f', '#33691e')}
                                {renderDataSection('Local Issues', drawerData.details.localIssues, 'localIssues', '#fff3e0', '#f57f17', '#e65100')}
                                {renderDataSection('Winning Parties', drawerData.details.winningParties, 'winningParties', '#e0f2f1', '#009688', '#004d40')}
                                {renderDataSection('Active Parties', drawerData.details.activeParties, 'activeParties', '#e8eaf6', '#3f51b5', '#1a237e')}

                                {/* All Other Data Categories - Expandable */}
                                {renderDataSection('Election Types', drawerData.details.electionTypes, 'electionTypes', '#f1f8e9', '#558b2f', '#33691e')}
                                {renderDataSection('Coding', drawerData.details.coding, 'coding', '#fce4ec', '#e91e63', '#880e4f')}
                                {renderDataSection('Caste Lists', drawerData.details.casteLists, 'casteLists', '#fff3e0', '#ff6f00', '#e65100')}
                                {renderDataSection('Events', drawerData.details.events, 'events', '#e0f2f1', '#009688', '#004d40')}
                                {renderDataSection('Falliya', drawerData.details.falliya, 'falliya', '#e1f5fe', '#0288d1', '#01579b')}
                                {renderDataSection('Local News', drawerData.details.localNews, 'localNews', '#e8f5e9', '#2e7d32', '#1b5e20')}
                                {renderDataSection('Local Dynamics', drawerData.details.localDynamics, 'localDynamics', '#ede7f6', '#512da8', '#311b92')}
                                {renderDataSection('Influencers', drawerData.details.influencers, 'influencers', '#fce4ec', '#c2185b', '#880e4f')}
                                {renderDataSection('Governments', drawerData.details.governments, 'governments', '#e0f2f1', '#00796b', '#004d40')}
                                {renderDataSection('Party Activities', drawerData.details.partyActivities, 'partyActivities', '#f1f8e9', '#689f38', '#33691e')}
                                {renderDataSection('Panchayats', drawerData.details.panchayats, 'panchayats', '#e1f5fe', '#0277bd', '#01579b')}
                                {renderDataSection('Villages', drawerData.details.villages, 'villages', '#f3e5f5', '#7b1fa2', '#6a1b9a')}
                                {renderDataSection('Samitis', drawerData.details.samitis, 'samitis', '#fff3e0', '#f57c00', '#e65100')}
                                {renderDataSection('Visits', drawerData.details.visits, 'visits', '#fce4ec', '#e91e63', '#880e4f')}
                                {renderDataSection('Voting Trends', drawerData.details.votingTrends, 'votingTrends', '#e8eaf6', '#3f51b5', '#1a237e')}
                                {renderDataSection('Work Status', drawerData.details.workStatus, 'workStatus', '#f1f8e9', '#558b2f', '#33691e')}
                                {renderDataSection('Parliament Votes', drawerData.details.parliamentVotes, 'parliamentVotes', '#ffebee', '#d32f2f', '#b71c1c')}
                                {renderDataSection('Block Votes', drawerData.details.blockVotes, 'blockVotes', '#e1f5fe', '#0277bd', '#01579b')}
                                {renderDataSection('Assembly Votes', drawerData.details.assemblyVotes, 'assemblyVotes', '#f3e5f5', '#7b1fa2', '#6a1b9a')}
                                {renderDataSection('Party Vote Share', drawerData.details.partyVoteShare, 'partyVoteShare', '#fff3e0', '#ff6f00', '#e65100')}


                                {/* No Related Data Message */}
                                {Object.values(drawerData.details).every(item => !item?.count || item.count === 0) && (
                                    <Alert severity="info">No related data found for this booth</Alert>
                                )}
                            </Stack>
                        ) : (
                            <Typography variant="body2" color="textSecondary">Click on a booth on the map to view details</Typography>
                        )}
                    </Box>
                </Drawer>

                {/* Header: Search + CSV + Add */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" sx={{ p: 2 }}>
                    <DebouncedInput
                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={`Search ${booths.length} booths...`}
                        style={{ flex: 1 }}
                    />

                    <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                        <CSVLink data={csvData} filename="booths_all.csv" style={{ display: 'none' }} ref={csvLinkRef} />
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
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedBooth(null); setOpenModal(true); }}>
                            Add Booth
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
                    <TextField select label="State" value={filters.state_id} onChange={(e) => setFilters((prev) => ({ ...prev, state_id: e.target.value, division_id: '', parliament_id: '', assembly_id: '', block_id: '' }))} sx={{ minWidth: 150 }} size="small">
                        <MenuItem value="">All States</MenuItem>
                        {filterOptions.states?.map((state) => (
                            <MenuItem key={state._id} value={state._id}>{state.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField select label="Division" value={filters.division_id} onChange={(e) => setFilters((prev) => ({ ...prev, division_id: e.target.value, parliament_id: '', assembly_id: '', block_id: '' }))} sx={{ minWidth: 150 }} size="small" disabled={!filters.state_id}>
                        <MenuItem value="">All Divisions</MenuItem>
                        {filterOptions.divisions?.filter(division => {
                            const stateId = division.state_id?._id || division.state_id;
                            return stateId === filters.state_id;
                        }).map((division) => (
                            <MenuItem key={division._id} value={division._id}>{division.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField select label="Parliament" value={filters.parliament_id} onChange={(e) => setFilters((prev) => ({ ...prev, parliament_id: e.target.value, assembly_id: '', block_id: '' }))} sx={{ minWidth: 150 }} size="small" disabled={!filters.division_id}>
                        <MenuItem value="">All Parliaments</MenuItem>
                        {filterOptions.parliaments?.filter(parliament => {
                            const divisionId = parliament.division_id?._id || parliament.division_id;
                            return divisionId === filters.division_id;
                        }).map((parliament) => (
                            <MenuItem key={parliament._id} value={parliament._id}>{parliament.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField select label="Assembly" value={filters.assembly_id} onChange={(e) => setFilters((prev) => ({ ...prev, assembly_id: e.target.value, block_id: '' }))} sx={{ minWidth: 150 }} size="small" disabled={!filters.parliament_id}>
                        <MenuItem value="">All Assemblies</MenuItem>
                        {filterOptions.assemblies?.filter(assembly => {
                            const parliamentId = assembly.parliament_id?._id || assembly.parliament_id;
                            return parliamentId === filters.parliament_id;
                        }).map((assembly) => (
                            <MenuItem key={assembly._id} value={assembly._id}>{assembly.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField select label="Block" value={filters.block_id} onChange={(e) => setFilters((prev) => ({ ...prev, block_id: e.target.value }))} sx={{ minWidth: 150 }} size="small" disabled={!filters.assembly_id}>
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
                                                    <BoothView data={row.original} />
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
            <BoothModal
                open={openModal}
                modalToggler={setOpenModal}
                booth={selectedBooth}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                users={users}
                refresh={() => fetchBooths(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertBoothDelete
                id={boothDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchBooths(pagination.pageIndex, pagination.pageSize)}
            />

            <BoothPolygonUpload
                open={openPolygonUpload}
                onClose={() => setOpenPolygonUpload(false)}
                onSuccess={() => {
                    fetchBooths(pagination.pageIndex, pagination.pageSize);
                }}
            />
        </>
    );
}
