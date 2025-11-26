import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, TextField, MenuItem, Tooltip,
    Drawer, Paper, Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { Add, Edit, Eye, Trash } from 'iconsax-react';
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
import CloseIcon from '@mui/icons-material/Close';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';

import ParliamentModal from './ParliamentModal';
import AlertParliamentDelete from './AlertParliamentDelete';
import ParliamentView from './ParliamentView';

export default function ParliamentListPage() {
    const theme = useTheme();
    const navigate = useNavigate();

    const [selectedParliament, setSelectedParliament] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [parliamentDeleteId, setParliamentDeleteId] = useState('');
    const [parliaments, setParliaments] = useState([]);
    const [allParliaments, setAllParliaments] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [electionYears, setElectionYears] = useState([]);
    const [users, setUsers] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState({
        category: '',
        regional_type: '',
        state_id: '',
        division_id: ''
    });

    // Map & Drawer state
    const [parliamentGeoJSON, setParliamentGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    // Import functionality states
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const importInputRef = useRef();

    // Use lowercase for modal compatibility
    const categoryOptions = ['general', 'reserved', 'special'];
    const regionalTypeOptions = ['urban', 'rural', 'mixed'];


    const fetchReferenceData = async () => {
        try {
            const [statesRes, divisionsRes, assembliesRes, electionYearsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/election-years`)
            ]);

            const token = localStorage.getItem('serviceToken');
            const [usersRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/users`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            ]);

            const usersData = await usersRes.json();
            if (usersData.success) setUsers(usersData.data);

            const [statesData, divisionsData, assembliesData, electionYearsData] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                assembliesRes.json(),
                electionYearsRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (electionYearsData.success) setElectionYears(electionYearsData.data);
        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    const fetchParliaments = async (pageIndex, pageSize, globalFilter = '', currentFilters = filters) => {
        setLoading(true);
        try {
            const queryParams = [];
            if (globalFilter) queryParams.push(`search=${encodeURIComponent(globalFilter)}`);
            if (currentFilters.category) queryParams.push(`category=${encodeURIComponent(currentFilters.category)}`);
            if (currentFilters.regional_type) queryParams.push(`regional_type=${encodeURIComponent(currentFilters.regional_type)}`);
            if (currentFilters.state_id) queryParams.push(`state=${encodeURIComponent(currentFilters.state_id)}`);
            if (currentFilters.division_id) queryParams.push(`division=${encodeURIComponent(currentFilters.division_id)}`);

            const queryString = queryParams.length > 0 ? `&${queryParams.join('&')}` : '';
            const token = localStorage.getItem('serviceToken');
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments?page=${pageIndex + 1}&limit=${pageSize}${queryString}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
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

    const fetchAllParliamentsForFilters = async () => {
        try {
            const data = await fetchAllDataForFilters('/parliaments', {});
            setAllParliaments(data);
        } catch (error) {
            console.error('Failed to fetch all parliaments for filters:', error);
        }
    };

    const filterOptions = useFilterOptionsFromData(allParliaments, {
        states: { field: 'state_id', nameField: 'name' },
        divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' }
    });

    useEffect(() => {
        fetchParliaments(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
        fetchAllParliamentsForFilters();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    // Load parliament polygons for map
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliament-polygons`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                let features = [];
                if (Array.isArray(data?.features)) features = data.features;
                else if (Array.isArray(data?.data?.[0]?.features)) features = data.data[0].features;
                else if (Array.isArray(data) && Array.isArray(data[0]?.features)) features = data[0].features;
                if (!features.length) {
                    setMapError('No parliament polygons found');
                    setParliamentGeoJSON(null);
                } else {
                    setParliamentGeoJSON({ type: 'FeatureCollection', features });
                }
            } catch (e) {
                console.error('Failed to load parliament polygons:', e);
                setMapError(`Failed to load parliament polygons: ${e.message}`);
                setParliamentGeoJSON(null);
            }
        })();
    }, []);

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
            header: 'Parliament No',
            accessorKey: 'parliament_no',
            cell: ({ getValue, row }) => (
                <Chip
                    label={getValue() || row.original['Parliament No'] || 'N/A'}
                    color="secondary"
                    size="small"
                    variant="filled"
                />
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
            header: 'Category',
            accessorKey: 'category',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() ? getValue().charAt(0).toUpperCase() + getValue().slice(1) : 'N/A'}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Regional Type',
            accessorKey: 'regional_type',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() ? getValue().charAt(0).toUpperCase() + getValue().slice(1) : 'N/A'}
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
            header: 'Division',
            accessorKey: 'division_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="warning"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Election Year',
            accessorKey: 'election_year_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.year || 'N/A'}
                    color="success"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Assembly',
            accessorKey: 'assembly_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="info"
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
            header: 'Actions',
            meta: { className: 'cell-center' },
            cell: ({ row }) => {
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <Tooltip title="View Details">
                            <IconButton
                                color="secondary"
                                onClick={() => navigate(`/parliament/${row.original._id}`)}
                            >
                                <Eye />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton color="primary" onClick={(e) => {
                                e.stopPropagation();
                                setSelectedParliament(row.original);
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
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments?all=true`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
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
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllParliamentsForCsv();
        setCsvData(allData.map(item => ({
            Name: item.name,
            Description: item.description ? item.description.replace(/<[^>]+>/g, '') : '',
            Category: item.category,
            'Regional Type': item.regional_type,
            State: item.state_id?.name || '',
            Division: item.division_id?.name || '',
            'Election Year': item.election_year_id?.year || '',
            'Election Type': item.election_year_id?.election_type || '',
            Assembly: item.assembly_id?.name || '',
            'Created By': item.created_by?.username || '',
            'Updated By': item.updated_by?.username || '',
            'Created At': item.created_at,
            'Updated At': item.updated_at
        })));
        setCsvLoading(false);
        setTimeout(() => {
            if (csvLinkRef.current) {
                csvLinkRef.current.link.click();
            }
        }, 100);
    };

    const handleDownloadExcelTemplate = async () => {
        try {
            const XLSX = await import('xlsx');
            const templateData = [
                {
                    name: '5th Parliament District',
                    parliament_no: '25',
                    description: 'Sample parliament description',
                    category: 'General',
                    regional_type: 'Urban',
                    state_no: '23',
                    division_code: '1',
                    election_year: '2024'
                }
            ];
            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
            XLSX.writeFile(workbook, 'parliaments_import_template.xlsx');
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
                    parliament_no: obj.parliament_no ?? obj['parliament no'] ?? '',
                    description: obj.description ?? '',
                    category: obj.category ?? '',
                    regional_type: obj.regional_type ?? obj['regional type'] ?? '',
                    state: obj.state_no ?? obj.state ?? '',
                    division_code: obj.division_code ?? obj.division ?? '',
                    election_year: obj.election_year ?? obj['election year'] ?? ''
                };
            });

            const filtered = rows.filter(r => String(r.name).trim() && String(r.parliament_no).trim());

            const token = localStorage.getItem('serviceToken');
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments/import`, {
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
                fetchParliaments(pagination.pageIndex, pagination.pageSize, globalFilter, filters);
            }
        } catch (err) {
            setImportResult({ success: false, message: err?.message || String(err) });
        } finally {
            setImporting(false);
            if (importInputRef.current) importInputRef.current.value = '';
        }
    };

    if (loading) return <EmptyReactTable />;

    const handleFilterApply = () => {
        setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page
        fetchParliaments(0, pagination.pageSize, globalFilter, filters); // Use page index 0
    };

    const fetchParliamentDetailsByPolygon = async (pcNo, pcName) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Find parliament by number or name
            let parliament = null;
            try {
                const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments?all=true&limit=10000`, { headers });
                const json = await res.json();
                if (json?.success && Array.isArray(json.data)) {
                    const pcNoStr = String(pcNo || '').trim();
                    const nameStr = String(pcName || '').trim().toLowerCase();
                    parliament = json.data.find(p => String(p.parliament_no || p['Parliament No'] || '').trim() === pcNoStr) ||
                        json.data.find(p => String(p.name || '').trim().toLowerCase() === nameStr);
                }
            } catch (e) {
                console.warn('Failed to fetch all parliaments for matching:', e);
            }

            let assembliesList = [];
            let winners = [];
            let visits = [];

            if (parliament && parliament._id) {
                const pid = parliament._id;
                const fetches = [
                    fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies?parliament=${encodeURIComponent(pid)}&all=true&limit=10000`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/parliament-candidates?parliament=${encodeURIComponent(pid)}&all=true`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/visits?parliament=${encodeURIComponent(pid)}&all=true`, { headers })
                ];
                const [aRes, cRes, vRes] = await Promise.allSettled(fetches);
                const tryJson = async (r) => { try { const j = await r.json(); return j; } catch { return null; } };
                if (aRes.status === 'fulfilled' && aRes.value.ok) { const j = await tryJson(aRes.value); if (j?.success && Array.isArray(j.data)) assembliesList = j.data; }
                if (cRes.status === 'fulfilled' && cRes.value.ok) { const j = await tryJson(cRes.value); if (j?.success && Array.isArray(j.data)) winners = j.data; }
                if (vRes.status === 'fulfilled' && vRes.value.ok) { const j = await tryJson(vRes.value); if (j?.success && Array.isArray(j.data)) visits = j.data; }

                // Fallback: try by pc_no
                if ((!winners || winners.length === 0) && pcNo) {
                    try {
                        const wr = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliament-candidates?pc_no=${encodeURIComponent(pcNo)}&all=true`, { headers });
                        const wj = await wr.json();
                        if (wj?.success && Array.isArray(wj.data)) winners = wj.data;
                    } catch { }
                }

                // Strictly filter winners to selected parliament by id or pc_no
                const pcNoStr = String(pcNo || '').trim();
                const filteredWinners = (winners || []).filter(w => {
                    const wid = (w.parliament_id && (w.parliament_id._id || w.parliament_id)) || null;
                    const wPcNo = (w.parliament_id && (w.parliament_id.parliament_no || w.parliament_id['Parliament No'])) || w.pc_no || w.PC_NO || w['Parliament No'] || null;
                    const matchById = wid && String(wid) === String(pid);
                    const matchByNo = wPcNo && String(wPcNo).trim() === pcNoStr;
                    return matchById || matchByNo;
                });

                setDrawerData({ loading: false, pcNo, pcName, details: { parliament, assemblies: assembliesList, winners: filteredWinners, visits } });
                setDrawerOpen(true);
            } else {
                setDrawerData({ loading: false, pcNo, pcName, details: null, error: 'Parliament not found' });
                setDrawerOpen(true);
            }
        } catch (err) {
            console.error('Failed to fetch parliament details by polygon:', err);
            setDrawerData({ loading: false, pcNo, pcName, details: null, error: err.message });
            setDrawerOpen(true);
        }
    };

    return (
        <>
            <MainCard content={false}>
                {/* Parliament Map section above the table */}
                <Box sx={{ p: 2, pb: 0 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Parliament Map</Typography>
                    {mapError && <Alert severity="warning" sx={{ mb: 1 }}>{mapError}</Alert>}
                    <MapContainerStyled>
                        <Map
                            ref={mapRef}
                            mapboxAccessToken={mapboxToken}
                            initialViewState={{ longitude: 77.0, latitude: 23.5, zoom: 6 }}
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
                                        const pcNo = props.PC_NO || props.pc_no || props['Parliament No'] || '';
                                        const pcName = props.PC_NAME || props.name || '';
                                        setDrawerData({ loading: true, pcNo, pcName, details: null });
                                        setDrawerOpen(true);
                                        fetchParliamentDetailsByPolygon(pcNo, pcName);
                                    }
                                } catch (err) {
                                    console.warn('Map click handler error:', err);
                                }
                            }}
                        >
                            <MapControl />
                            {parliamentGeoJSON && (
                                <Source id="parliament-polygons" type="geojson" data={parliamentGeoJSON}>
                                    <Layer id="parliament-fill" type="fill" paint={{ 'fill-color': '#2196F3', 'fill-opacity': 0.22 }} />
                                    <Layer id="parliament-outline" type="line" paint={{ 'line-color': '#1976D2', 'line-width': 2 }} />
                                    <Layer
                                        id="parliament-label"
                                        type="symbol"
                                        layout={{ 'text-field': ['concat', ['coalesce', ['get', 'PC_NO'], ['get', 'AC_NO'], ''], '\n', ['coalesce', ['get', 'PC_NAME'], ['get', 'AC_NAME'], '']], 'text-size': 10, 'text-allow-overlap': true, 'text-anchor': 'center' }}
                                        paint={{
                                            'text-color': '#000',
                                            'text-halo-color': '#ffffff',
                                            'text-halo-width': 2,
                                            'text-halo-blur': 1
                                        }}
                                    />
                                </Source>
                            )}
                        </Map>
                    </MapContainerStyled>
                </Box>
                {/* Header Section */}
                <Stack
                    direction={{ xs: 'column', lg: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'stretch', lg: 'center' }}
                    justifyContent="space-between"
                    sx={{ p: 2 }}
                >
                    {/* Search & Filters */}

                    <DebouncedInput
                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={`Search ${parliaments.length} parliaments...`}
                        style={{ minWidth: 200 }}
                    />
                    <Stack
                        direction="row"
                        spacing={1}
                        justifyContent={{ xs: 'flex-start', lg: 'flex-end' }}
                        flexShrink={0}
                    >
                        <CSVLink
                            data={csvData}
                            filename="parliaments_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
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
                        >
                            {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => {
                                setSelectedParliament(null);
                                setOpenModal(true);
                            }}
                        >
                            Add Parliament
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

                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ p: 2, flexWrap: 'wrap' }}
                >


                    <TextField
                        select
                        label="Category"
                        value={filters.category}
                        onChange={(e) =>
                            setFilters((prev) => ({ ...prev, category: e.target.value }))
                        }
                        sx={{ minWidth: 150 }}
                        size="small"
                    >
                        <MenuItem value="">All Categories</MenuItem>
                        {categoryOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Regional Type"
                        value={filters.regional_type}
                        onChange={(e) =>
                            setFilters((prev) => ({ ...prev, regional_type: e.target.value }))
                        }
                        sx={{ minWidth: 150 }}
                        size="small"
                    >
                        <MenuItem value="">All Types</MenuItem>
                        {regionalTypeOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="State"
                        value={filters.state_id}
                        onChange={(e) => {
                            setFilters((prev) => ({
                                ...prev,
                                state_id: e.target.value,
                                division_id: ''
                            }));
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

                    <TextField
                        select
                        label="Division"
                        value={filters.division_id}
                        onChange={(e) =>
                            setFilters((prev) => ({ ...prev, division_id: e.target.value }))
                        }
                        sx={{ minWidth: 150 }}
                        size="small"
                        disabled={!filters.state_id}
                    >
                        <MenuItem value="">All Divisions</MenuItem>
                        {filterOptions.divisions?.filter(division => {
                            const stateId = division.state_id?._id || division.state_id;
                            return stateId === filters.state_id;
                        }).map((division) => (
                            <MenuItem key={division._id} value={division._id}>
                                {division.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Button
                        variant="contained"
                        onClick={handleFilterApply}
                        size="small"
                    >
                        Apply
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setFilters({
                                category: '',
                                regional_type: '',
                                state_id: '',
                                division_id: ''
                            });
                            setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page
                            fetchParliaments(
                                0,
                                pagination.pageSize,
                                globalFilter,
                                {
                                    category: '',
                                    regional_type: '',
                                    state_id: '',
                                    division_id: ''
                                }
                            );
                        }}
                        size="small"
                    >
                        Clear
                    </Button>
                </Stack>



                {/* Table Section */}
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
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                >
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
                                                <TableCell
                                                    colSpan={row.getVisibleCells().length}
                                                >
                                                    <ParliamentView data={row.original} />
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
            </MainCard >

            {/* Right-side Drawer for clicked parliament info */}
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ width: { xs: 340, sm: 480 }, p: 0, height: '100%' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper }}>
                        <Box>
                            <Typography variant="h6">Parliament Details</Typography>
                            <Typography variant="caption" color="text.secondary">Click a parliament polygon to view more information</Typography>
                        </Box>
                        <IconButton color="secondary" onClick={() => setDrawerOpen(false)} sx={{ p: 0.5 }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Box sx={{ p: 2, overflowY: 'auto', height: 'calc(100% - 72px)' }}>
                        {!drawerData && <Typography variant="body2">Click a parliament polygon to view details.</Typography>}
                        {drawerData?.loading && <Typography variant="body2">Loading...</Typography>}

                        {drawerData?.details && (
                            <Stack spacing={2}>
                                <Paper elevation={1} sx={{ p: 2, borderRadius: 1 }}>
                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Basic</Typography>
                                    <Typography variant="body2"><strong>Name:</strong> {drawerData.details.parliament?.name || drawerData.pcName || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Parliament No:</strong> {drawerData.details.parliament?.parliament_no || drawerData.details.parliament?.['Parliament No'] || drawerData.pcNo || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Division:</strong> {drawerData.details.parliament?.division_id?.name || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>State:</strong> {drawerData.details.parliament?.state_id?.name || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Category:</strong> {drawerData.details.parliament?.category || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Regional Type:</strong> {drawerData.details.parliament?.regional_type || 'N/A'}</Typography>
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Assemblies ({drawerData.details.assemblies?.length || 0})</Typography>
                                    {drawerData.details.assemblies?.length ? drawerData.details.assemblies.slice(0, 12).map(a => (
                                        <Typography key={a._id} variant="body2">• {a.AC_NO ? `#${a.AC_NO} — ` : ''}{a.name}</Typography>
                                    )) : <Typography variant="body2">No assemblies found.</Typography>}
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Parliament Winners ({drawerData.details.winners?.length || 0})</Typography>
                                    {drawerData.details.winners?.length ? drawerData.details.winners.slice(0, 6).map(w => (
                                        <Box key={w._id} sx={{ mb: 0.5 }}>
                                            <Typography variant="body2">• {w.name || w.candidate_id?.name || 'Candidate'} — {w.party_id?.name || w.party || 'Party'}</Typography>
                                            <Typography variant="caption" color="text.secondary">Year: {typeof w.election_year_id === 'object' ? (w.election_year_id?.year || w.election_year_id?.name) : w.election_year_id}</Typography>
                                        </Box>
                                    )) : <Typography variant="body2">No winners data.</Typography>}
                                    <Box sx={{ mt: 1 }}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => {
                                                const pid = drawerData.details.parliament?._id;
                                                if (pid) {
                                                    navigate(`/parliament-candidate?parliament=${encodeURIComponent(pid)}`);
                                                } else {
                                                    navigate(`/parliament-candidate`);
                                                }
                                            }}
                                        >
                                            View all candidates (all years)
                                        </Button>
                                    </Box>
                                </Paper>

                                {!!drawerData.details.visits?.length && (
                                    <Paper elevation={0} sx={{ p: 1 }}>
                                        <Typography variant="subtitle2">Visits ({drawerData.details.visits?.length || 0})</Typography>
                                        {drawerData.details.visits.slice(0, 6).map(v => (
                                            <Box key={v._id} sx={{ mb: 0.5 }}>
                                                <Typography variant="body2">• {v.date ? new Date(v.date).toLocaleDateString('en-IN') : ''} — {v.candidate_id?.name || ''}</Typography>
                                                <Typography variant="caption" color="text.secondary">{v.locationName || ''}</Typography>
                                            </Box>
                                        ))}
                                    </Paper>
                                )}
                            </Stack>
                        )}
                    </Box>
                </Box>
            </Drawer>

            <input
                type="file"
                accept=".xlsx,.xls,.csv"
                ref={importInputRef}
                style={{ display: 'none' }}
                onChange={handleImportFile}
            />

            {/* Modals */}
            < ParliamentModal
                open={openModal}
                modalToggler={setOpenModal}
                parliament={selectedParliament}
                states={states}
                divisions={divisions}
                assemblies={assemblies}
                electionYears={electionYears}
                refresh={() =>
                    fetchParliaments(pagination.pageIndex, pagination.pageSize)
                }
            />

            < AlertParliamentDelete
                id={parliamentDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() =>
                    fetchParliaments(pagination.pageIndex, pagination.pageSize)
                }
            />
        </>
    );

}
