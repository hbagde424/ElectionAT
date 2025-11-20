import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, TextField, MenuItem,
    Grid, Tooltip, Drawer, Paper, Alert
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
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import GroupIcon from '@mui/icons-material/Group';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import { CSVLink } from 'react-csv';

import AssemblyModal from './AssemblyModal';
import AlertAssemblyDelete from './AlertAssemblyDelete';
import AssemblyView from './AssemblyView';

export default function AssemblyListPage() {
    const theme = useTheme();
    const navigate = useNavigate();

    const [selectedAssembly, setSelectedAssembly] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [assemblyDeleteId, setAssemblyDeleteId] = useState('');
    const [assemblies, setAssemblies] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [users, setUsers] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState({
        type: '',
        category: '',
        state_id: '',
        division_id: '',
        parliament_id: ''
    });

    // Map state
    const [assemblyGeoJSON, setAssemblyGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const [selectedMapAssembly, setSelectedMapAssembly] = useState(null);
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    const typeOptions = ['Urban', 'Rural', 'Mixed'];
    const categoryOptions = ['General', 'Reserved', 'Special'];

    const fetchReferenceData = async () => {
        try {
            const [statesRes, divisionsRes, parliamentsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`)
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
            if (currentFilters.type) queryParams.push(`type=${encodeURIComponent(currentFilters.type)}`);
            if (currentFilters.category) queryParams.push(`category=${encodeURIComponent(currentFilters.category)}`);
            if (currentFilters.state_id) queryParams.push(`state_id=${encodeURIComponent(currentFilters.state_id)}`);
            if (currentFilters.division_id) queryParams.push(`division=${encodeURIComponent(currentFilters.division_id)}`);
            if (currentFilters.parliament_id) queryParams.push(`parliament=${encodeURIComponent(currentFilters.parliament_id)}`);

            const queryString = queryParams.length > 0 ? `&${queryParams.join('&')}` : '';
            const url = `${import.meta.env.VITE_APP_API_URL}/assemblies?page=${pageIndex + 1}&limit=${pageSize}${queryString}`;

            const token = localStorage.getItem('serviceToken');
            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
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
        // Initial load
        fetchAssemblies(0, 10); // Default values for first load
        fetchReferenceData();
        // Load assembly polygons for map
        (async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/assembly-polygons`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                let features = [];
                if (Array.isArray(data?.features)) features = data.features;
                else if (Array.isArray(data?.data?.[0]?.features)) features = data.data[0].features;
                else if (Array.isArray(data) && Array.isArray(data[0]?.features)) features = data[0].features;
                if (!features.length) {
                    setMapError('No assembly polygons found');
                    setAssemblyGeoJSON(null);
                } else {
                    setAssemblyGeoJSON({ type: 'FeatureCollection', features });
                }
            } catch (e) {
                console.error('Failed to load assembly polygons:', e);
                setMapError(`Failed to load assembly polygons: ${e.message}`);
                setAssemblyGeoJSON(null);
            }
        })();
    }, []); // Empty dependency array for initial load only

    useEffect(() => {
        // Runs when pagination or filters change
        if (pagination.pageIndex !== undefined && pagination.pageSize !== undefined) {
            fetchAssemblies(pagination.pageIndex, pagination.pageSize, globalFilter);
        }
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

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
            header: 'Assembly NO',
            accessorKey: 'AC_NO',
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
            header: 'Type',
            accessorKey: 'type',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.toUpperCase() || 'N/A'}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Category',
            accessorKey: 'category',
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
            header: 'Parliament',
            accessorKey: 'parliament_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="secondary"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Description',
            accessorKey: 'description',
            cell: ({ getValue }) => {
                const html = getValue() || '';
                // Strip HTML tags for preview, show first 40 chars
                const text = html.replace(/<[^>]+>/g, '').slice(0, 40);
                return (
                    <Typography sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={text}>
                        {text || 'N/A'}
                    </Typography>
                );
            }
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
                                onClick={() => navigate(`/assembly/${row.original._id}`)}
                            >
                                <Eye />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton color="primary" onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAssembly(row.original);
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
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies?all=true`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
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
    const csvLinkRef = useRef();
    const [parlCsvData, setParlCsvData] = useState([]);
    const [parlCsvLoading, setParlCsvLoading] = useState(false);
    const parlCsvLinkRef = useRef();
    const importInputRef = useRef();
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllAssembliesForCsv();
        setCsvData(allData.map(item => ({
            Name: item.name,
            Description: item.description || '',
            Type: item.type,
            Category: item.category,
            State: item.state_id?.name || '',
            Division: item.division_id?.name || '',
            Parliament: item.parliament_id?.name || '',
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

    // Download reference CSV for Parliaments (parliament_no, name, state, division, division_code)
    const handleDownloadParliamentReference = async () => {
        setParlCsvLoading(true);
        try {
            const token = localStorage.getItem('serviceToken');
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments?page=1&limit=10000`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const json = await res.json();
            if (json?.success && Array.isArray(json.data)) {
                const divisionCodeMap = new Map(divisions.map(d => [String(d._id), d.division_code]));
                const rows = json.data.map(p => ({
                    parliament_no: p.parliament_no,
                    parliament_name: p.name,
                    state: p.state_id?.name || '',
                    division: p.division_id?.name || '',
                    division_code: divisionCodeMap.get(String(p.division_id?._id)) || ''
                }));
                setParlCsvData(rows);
                setTimeout(() => {
                    if (parlCsvLinkRef.current) {
                        parlCsvLinkRef.current.link.click();
                    }
                }, 50);
            }
        } catch (e) {
            console.error('Failed to prepare parliaments reference CSV:', e);
        } finally {
            setParlCsvLoading(false);
        }
    };

    // Download empty Excel template with only headers matching the modal fields
    // Load xlsx dynamically to avoid breaking the dev server when dependency is absent
    const handleDownloadExcelTemplate = async () => {
        // Use numeric/code fields instead of database IDs
        try {
            const XLSX = await import('xlsx');
            const templateData = [
                {
                    name: 'Gwalior North',
                    AC_NO: '1',
                    description: 'Example assembly constituency',
                    type: 'Urban',
                    category: 'General',
                    division_code: 'GWL',
                    parliament_no: '101'
                }
            ];
            const ws = XLSX.utils.json_to_sheet(templateData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Template');
            // writeFile triggers browser download when built for web
            XLSX.writeFile(wb, 'assembly_import_template.xlsx');
            return;
        } catch (e) {
            console.warn('xlsx dynamic import failed, falling back to CSV template:', e && e.message);
        }

        // Fallback: generate CSV template
        try {
            const headers = ['name', 'AC_NO', 'description', 'type', 'category', 'division_code', 'parliament_no'];
            const exampleRow = ['Gwalior North', '1', 'Example assembly constituency', 'Urban', 'General', 'GWL', '101'];
            const csvContent = headers.join(',') + '\n' + exampleRow.join(',') + '\n';
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'assembly_import_template.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to generate fallback CSV template:', err);
        }
    };

    if (loading) return <EmptyReactTable />;

    const handleFilterApply = () => {
        setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page
        fetchAssemblies(0, pagination.pageSize, globalFilter, filters); // Use page index 0
    };

    const handleClearFilter = () => {
        setFilters({
            type: '',
            category: '',
            state_id: '',
            division_id: '',
            parliament_id: ''
        });
        setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page
        fetchAssemblies(0, pagination.pageSize, globalFilter, {
            type: '',
            category: '',
            state_id: '',
            division_id: '',
            parliament_id: ''
        });
    };

    const applyAssemblyFilter = () => {
        if (selectedMapAssembly && drawerData?.details?.assembly) {
            const assembly = drawerData.details.assembly;
            const newFilters = {
                type: assembly.type || '',
                category: assembly.category || '',
                state_id: assembly.state_id?._id || '',
                division_id: assembly.division_id?._id || '',
                parliament_id: assembly.parliament_id?._id || ''
            };
            setFilters(newFilters);
            setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
            fetchAssemblies(0, pagination.pageSize, globalFilter, newFilters);
            setDrawerOpen(false);

            // Scroll to table
            setTimeout(() => {
                const tableElement = document.querySelector('[role="table"]');
                if (tableElement) {
                    tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
        }
    };

    const fetchAssemblyDetailsByPolygon = async (acNo, acName) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Find the assembly by AC_NO or name
            let assembly = null;
            try {
                const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies?all=true&limit=10000`, { headers });
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    const acNoStr = String(acNo || '').trim();
                    const nameStr = String(acName || '').trim().toLowerCase();
                    assembly = json.data.find(a => String(a.AC_NO || '').trim() === acNoStr)
                        || json.data.find(a => String(a.name || '').trim().toLowerCase() === nameStr);
                }
            } catch (e) {
                console.warn('Failed to fetch all assemblies for matching:', e);
            }

            let blocks = [];
            let booths = [];
            let visits = [];
            let workStatuses = [];
            let winners = [];

            if (assembly && assembly._id) {
                const assemblyId = assembly._id;
                const fetches = [
                    fetch(`${import.meta.env.VITE_APP_API_URL}/blocks?assembly=${encodeURIComponent(assemblyId)}&all=true&limit=1000`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/booths?assembly=${encodeURIComponent(assemblyId)}&all=true&limit=10000`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/visits?assembly=${encodeURIComponent(assemblyId)}&all=true`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/work-status?assembly=${encodeURIComponent(assemblyId)}&all=true`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/winning-candidates?assembly=${encodeURIComponent(assemblyId)}&all=true`, { headers })
                ];
                const [bRes, boothRes, vRes, wsRes, wcRes] = await Promise.allSettled(fetches);
                const tryJson = async (r) => { try { const j = await r.json(); return j; } catch { return null; } };
                if (bRes.status === 'fulfilled' && bRes.value.ok) { const j = await tryJson(bRes.value); if (j?.success && Array.isArray(j.data)) blocks = j.data; }
                if (boothRes.status === 'fulfilled' && boothRes.value.ok) { const j = await tryJson(boothRes.value); if (j?.success && Array.isArray(j.data)) booths = j.data; }
                if (vRes.status === 'fulfilled' && vRes.value.ok) { const j = await tryJson(vRes.value); if (j?.success && Array.isArray(j.data)) visits = j.data; }
                if (wsRes.status === 'fulfilled' && wsRes.value.ok) { const j = await tryJson(wsRes.value); if (j?.success && Array.isArray(j.data)) workStatuses = j.data; }
                if (wcRes.status === 'fulfilled' && wcRes.value.ok) { const j = await tryJson(wcRes.value); if (j?.success && Array.isArray(j.data)) winners = j.data; }

                // Fallback for winners by AC_NO
                if ((!winners || winners.length === 0) && acNo) {
                    try {
                        const wr = await fetch(`${import.meta.env.VITE_APP_API_URL}/winning-candidates?ac_no=${encodeURIComponent(acNo)}&all=true`, { headers });
                        const wj = await wr.json();
                        if (wj?.success && Array.isArray(wj.data)) winners = wj.data;
                    } catch { }
                }

                // Narrow winners to only those belonging to this assembly (by assembly id or AC No).
                if (Array.isArray(winners) && winners.length > 0) {
                    const matchesAssembly = (w) => {
                        try {
                            // assembly id checks
                            const wa = w.assembly_id || w.assembly || (w._source && (w._source.assembly_id || w._source.assembly));
                            if (wa) {
                                if (typeof wa === 'object' && (wa._id || wa.id)) {
                                    if (String(wa._id || wa.id) === String(assembly._id)) return true;
                                } else if (String(wa) === String(assembly._id)) return true;
                            }
                            // candidate nested assembly
                            if (w.candidate_id && (w.candidate_id.assembly_id || w.candidate_id.assembly)) {
                                const ca = w.candidate_id.assembly_id || w.candidate_id.assembly;
                                if (typeof ca === 'object' && (ca._id || ca.id)) {
                                    if (String(ca._id || ca.id) === String(assembly._id)) return true;
                                } else if (String(ca) === String(assembly._id)) return true;
                            }
                            // AC/AC_NO checks
                            const acField = w.ac_no || w.AC_NO || w.acNo || (w._source && (w._source.ac_no || w._source.AC_NO)) || w.constituency_no || w.constituency?.AC_NO;
                            if (acField && String(acField) === String(acNo)) return true;
                            // candidate nested ac_no
                            if (w.candidate_id && (w.candidate_id.ac_no || w.candidate_id.AC_NO || w.candidate_id.acNo)) {
                                const caNo = w.candidate_id.ac_no || w.candidate_id.AC_NO || w.candidate_id.acNo;
                                if (String(caNo) === String(acNo)) return true;
                            }
                        } catch (err) {
                            // ignore
                        }
                        return false;
                    };

                    const narrowed = winners.filter(matchesAssembly);
                    if (narrowed.length > 0) winners = narrowed;
                    else winners = []; // don't show a global list for this assembly if none match

                    // Normalize and deduplicate winners by candidate + year to avoid duplicate display
                    if (Array.isArray(winners) && winners.length > 0) {
                        winners = winners.map(w => {
                            const yearLabel = (w.year_id && typeof w.year_id === 'object') ? (w.year_id.year || w.year_id.name) : w.year_id;
                            const yearStr = yearLabel != null ? String(yearLabel) : '';
                            const candidateLabel = w.name || (w.candidate_id && (w.candidate_id.name || w.candidate_id._id)) || w.candidate || '';
                            return { ...w, _yearLabel: yearStr, _candidateLabel: candidateLabel };
                        });

                        const seen = new Set();
                        const deduped = [];
                        for (const w of winners) {
                            const key = `${w._candidateLabel}::${w._yearLabel}`;
                            if (!seen.has(key)) {
                                seen.add(key);
                                deduped.push(w);
                            }
                        }

                        deduped.sort((a, b) => {
                            const ay = parseInt(a._yearLabel) || 0;
                            const by = parseInt(b._yearLabel) || 0;
                            if (by !== ay) return by - ay;
                            return (a._candidateLabel || '').localeCompare(b._candidateLabel || '');
                        });

                        winners = deduped;
                    }
                }

                setDrawerData({
                    loading: false,
                    acNo,
                    acName,
                    details: {
                        assembly,
                        blocks,
                        booths,
                        visits,
                        workStatuses,
                        winners
                    }
                });
                setDrawerOpen(true);

                // Auto-apply filter to table when assembly details are loaded
                if (assembly) {
                    const newFilters = {
                        type: assembly.type || '',
                        category: assembly.category || '',
                        state_id: assembly.state_id?._id || '',
                        division_id: assembly.division_id?._id || '',
                        parliament_id: assembly.parliament_id?._id || ''
                    };
                    setFilters(newFilters);
                    setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
                    fetchAssemblies(0, pagination.pageSize, globalFilter, newFilters);
                }
            } else {
                setDrawerData({ loading: false, acNo, acName, details: null, error: 'Assembly not found' });
                setDrawerOpen(true);
            }
        } catch (err) {
            console.error('Failed to fetch assembly details by polygon:', err);
            setDrawerData({ loading: false, acNo, acName, details: null, error: err.message });
            setDrawerOpen(true);
        }
    };

    // Handle file import
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
            // Normalize keys and pick required columns
            const rows = json.map((r) => {
                const obj = {};
                for (const k of Object.keys(r)) obj[k.trim().toLowerCase()] = r[k];
                return {
                    name: obj.name ?? '',
                    AC_NO: obj.ac_no ?? obj.acno ?? obj['ac no'] ?? obj['assembly no'] ?? '',
                    description: obj.description ?? '',
                    type: obj.type ?? '',
                    category: obj.category ?? '',
                    division_code: obj.division_code ?? obj.division ?? '',
                    parliament_no: obj.parliament_no ?? obj.parliament ?? ''
                };
            });

            // Filter out completely empty rows (no name and no AC_NO)
            const filtered = rows.filter(r => String(r.name).trim() || String(r.AC_NO).trim());

            const token = localStorage.getItem('serviceToken');
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies/import`, {
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
                // Refresh list after import
                fetchAssemblies(pagination.pageIndex, pagination.pageSize, globalFilter, filters);
            }
        } catch (err) {
            setImportResult({ success: false, message: err?.message || String(err) });
        } finally {
            setImporting(false);
            // reset input to allow re-select same file
            if (importInputRef.current) importInputRef.current.value = '';
        }
    };

    return (
        <>
            <MainCard content={false}>
                {/* Map section above the table */}
                <Box sx={{ p: 2, pb: 0 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Assembly Map</Typography>
                    {mapError && <Alert severity="warning" sx={{ mb: 1 }}>{mapError}</Alert>}
                    {importResult && (
                        <Alert severity={importResult.success ? 'success' : 'error'} sx={{ mb: 1 }}>
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
                    <MapContainerStyled>
                        <Map
                            ref={mapRef}
                            mapboxAccessToken={mapboxToken}
                            initialViewState={{ longitude: 77.0, latitude: 23.5, zoom: 6 }}
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
                                    const assemblyFeature = features.find(f => f.layer && f.layer.id === 'assembly-fill') || features[0];
                                    if (assemblyFeature) {
                                        const props = assemblyFeature.properties || {};
                                        const acNo = props.AC_NO || props.ac_no || props.acNo || '';
                                        const acName = props.AC_NAME || props.name || '';
                                        setSelectedMapAssembly({ acNo, acName });
                                        setDrawerData({ loading: true, acNo, acName, details: null });
                                        setDrawerOpen(true);

                                        // Fetch assembly details and apply filter immediately
                                        (async () => {
                                            await fetchAssemblyDetailsByPolygon(acNo, acName);
                                        })();
                                    }
                                } catch (err) {
                                    console.warn('Map click handler error:', err);
                                }
                            }}
                        >
                            <MapControl />
                            {assemblyGeoJSON && (
                                <Source id="assembly-polygons" type="geojson" data={assemblyGeoJSON}>
                                    <Layer
                                        id="assembly-fill"
                                        type="fill"
                                        paint={{ 'fill-color': '#8BC34A', 'fill-opacity': 0.25 }}
                                    />
                                    <Layer id="assembly-outline" type="line" paint={{ 'line-color': '#4CAF50', 'line-width': 2 }} />
                                    <Layer
                                        id="assembly-label"
                                        type="symbol"
                                        layout={{ 'text-field': ['concat', ['get', 'AC_NO'], '\n', ['get', 'AC_NAME']], 'text-size': 10, 'text-allow-overlap': true }}
                                        paint={{ 'text-color': '#333', 'text-halo-color': '#fff', 'text-halo-width': 1 }}
                                    />
                                </Source>
                            )}
                        </Map>
                    </MapContainerStyled>
                </Box>
                {/* Header: Search + Actions */}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    justifyContent="space-between"
                    sx={{ p: 2, gap: 2 }}
                >
                    {/* Search Box */}
                    <DebouncedInput
                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={`Search ${assemblies.length} assemblies...`}
                        sx={{ width: { xs: '100%', sm: 250 } }}
                    />

                    {/* Action Buttons */}
                    <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        justifyContent="flex-end"
                    >
                        <CSVLink
                            data={csvData}
                            filename="assemblies_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
                        <CSVLink
                            data={parlCsvData}
                            filename="parliaments_reference.csv"
                            style={{ display: 'none' }}
                            ref={parlCsvLinkRef}
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
                            onClick={handleDownloadParliamentReference}
                            size="small"
                        >
                            {parlCsvLoading ? 'Preparing Parliaments...' : 'Download Parliament Reference CSV'}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                if (importInputRef.current) importInputRef.current.click();
                            }}
                            size="small"
                        >
                            Import Excel
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
                            onClick={() => { setSelectedAssembly(null); setOpenModal(true); }}
                            size="small"
                        >
                            Add Assembly
                        </Button>
                    </Stack>
                </Stack>

                {/* Filters */}
                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ p: 2, flexWrap: 'wrap', gap: 2 }}
                >
                    <TextField
                        select
                        label="Type"
                        value={filters.type}
                        onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                        sx={{ minWidth: 120 }}
                        size="small"
                    >
                        <MenuItem value="">All Types</MenuItem>
                        {typeOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Category"
                        value={filters.category}
                        onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                        sx={{ minWidth: 120 }}
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
                        label="State"
                        value={filters.state_id}
                        onChange={(e) => {
                            const newStateId = e.target.value;
                            setFilters((prev) => ({
                                ...prev,
                                state_id: newStateId,
                                division_id: '',
                                parliament_id: ''
                            }));
                        }}
                        sx={{ minWidth: 120 }}
                        size="small"
                    >
                        <MenuItem value="">All States</MenuItem>
                        {states.map((state) => (
                            <MenuItem key={state._id} value={state._id}>
                                {state.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Division"
                        value={filters.division_id}
                        onChange={(e) => {
                            const newDivisionId = e.target.value;
                            setFilters((prev) => ({
                                ...prev,
                                division_id: newDivisionId,
                                parliament_id: ''
                            }));
                        }}
                        sx={{ minWidth: 120 }}
                        size="small"
                        disabled={!filters.state_id}
                    >
                        <MenuItem value="">All Divisions</MenuItem>
                        {divisions
                            .filter(d => !filters.state_id || d.state_id?._id === filters.state_id)
                            .map((d) => (
                                <MenuItem key={d._id} value={d._id}>
                                    {d.name}
                                </MenuItem>
                            ))}
                    </TextField>

                    <TextField
                        select
                        label="Parliament"
                        value={filters.parliament_id}
                        onChange={(e) => setFilters((prev) => ({ ...prev, parliament_id: e.target.value }))}
                        sx={{ minWidth: 120 }}
                        size="small"
                        disabled={!filters.division_id}
                    >
                        <MenuItem value="">All Parliaments</MenuItem>
                        {parliaments
                            .filter(p => !filters.division_id || p.division_id?._id === filters.division_id)
                            .map((p) => (
                                <MenuItem key={p._id} value={p._id}>
                                    {p.name}
                                </MenuItem>
                            ))}
                    </TextField>

                    <Button variant="contained" onClick={handleFilterApply} size="small">
                        Apply
                    </Button>
                    <Button variant="outlined" onClick={handleClearFilter} size="small">
                        Clear
                    </Button>
                </Stack>

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
                                                    cursor: header.column.getCanSort() ? 'pointer' : 'default',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    backgroundColor: 'primary.main'
                                                }}
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
            </MainCard >
            {/* Hidden file input for import */}
            <input
                type="file"
                accept=".xlsx,.xls,.csv"
                ref={importInputRef}
                style={{ display: 'none' }}
                onChange={handleImportFile}
            />

            {/* Right-side Drawer for clicked assembly info */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                sx={{
                    '& .MuiDrawer-paper': {
                        width: 450,
                        boxSizing: 'border-box'
                    }
                }}
            >
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 2 }}>
                        <Box>
                            <Typography variant="h5" fontWeight={700}>Assembly Details</Typography>
                            <Typography variant="caption" color="text.secondary">Complete information about selected assembly</Typography>
                        </Box>
                        <IconButton onClick={() => setDrawerOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Divider />

                    {/* Content */}
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                        {!drawerData && <Typography variant="body2" color="text.secondary">Click an assembly polygon to view details.</Typography>}
                        {drawerData?.loading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                <Typography variant="body2">Loading...</Typography>
                            </Box>
                        )}

                        {drawerData?.details && (
                            <Stack spacing={2}>
                                {/* Assembly Basic Info */}
                                <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.primary.lighter }}>
                                    <Stack spacing={2}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box
                                                sx={{
                                                    width: 72,
                                                    height: 72,
                                                    borderRadius: '50%',
                                                    bgcolor: theme.palette.primary.main,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.5rem',
                                                    color: 'white',
                                                    fontWeight: 700
                                                }}
                                            >
                                                {drawerData.details.assembly?.AC_NO || drawerData.acNo || '?'}
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" fontWeight={700} color="primary">
                                                    {drawerData.details.assembly?.name || drawerData.acName || 'N/A'}
                                                </Typography>
                                                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                                                    {drawerData.details.assembly?.type && (
                                                        <Chip label={drawerData.details.assembly.type} size="small" color="primary" variant="outlined" />
                                                    )}
                                                    {drawerData.details.assembly?.category && (
                                                        <Chip label={drawerData.details.assembly.category} size="small" color="secondary" variant="outlined" />
                                                    )}
                                                </Stack>
                                            </Box>
                                        </Box>
                                    </Stack>
                                </Paper>

                                {/* Location Information */}
                                <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.warning.lighter }}>
                                    <Typography variant="h6" fontWeight={700} color="warning.dark" sx={{ mb: 2 }}>
                                        <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Location Hierarchy
                                    </Typography>
                                    <Stack spacing={1.5}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>State</Typography>
                                            <Typography variant="body1" fontWeight={600}>{drawerData.details.assembly?.state_id?.name || 'N/A'}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Division</Typography>
                                            <Typography variant="body1" fontWeight={600}>{drawerData.details.assembly?.division_id?.name || 'N/A'}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>Parliament</Typography>
                                            <Typography variant="body1" fontWeight={600}>{drawerData.details.assembly?.parliament_id?.name || 'N/A'}</Typography>
                                        </Box>
                                    </Stack>
                                </Paper>

                                {/* Blocks Info */}
                                <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.success.lighter }}>
                                    <Typography variant="h6" fontWeight={700} color="success.dark" sx={{ mb: 2 }}>
                                        <LocationOnIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Blocks ({drawerData.details.blocks?.length || 0})
                                    </Typography>
                                    <Stack spacing={1}>
                                        {drawerData.details.blocks?.length ? drawerData.details.blocks.slice(0, 8).map(b => (
                                            <Box key={b._id} sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: 1, bgcolor: 'background.paper' }}>
                                                <Typography variant="body2" fontWeight={600}>{b.name}</Typography>
                                            </Box>
                                        )) : (
                                            <Typography variant="body2" color="text.secondary">No blocks found</Typography>
                                        )}
                                    </Stack>
                                </Paper>

                                {/* Booths Info */}
                                <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.info.lighter }}>
                                    <Typography variant="h6" fontWeight={700} color="info.dark" sx={{ mb: 2 }}>
                                        <HowToVoteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Booths ({drawerData.details.booths?.length || 0})
                                    </Typography>
                                    <Stack spacing={1}>
                                        {drawerData.details.booths?.length ? drawerData.details.booths.slice(0, 8).map(bt => (
                                            <Box key={bt._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, bgcolor: 'background.paper' }}>
                                                <Typography variant="body2" fontWeight={600}>#{bt.booth_number}</Typography>
                                                <Typography variant="body2">{bt.name}</Typography>
                                            </Box>
                                        )) : (
                                            <Typography variant="body2" color="text.secondary">No booths found</Typography>
                                        )}
                                    </Stack>
                                </Paper>

                                {/* Work Status */}
                                {drawerData.details.workStatuses?.length > 0 && (
                                    <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.secondary.lighter }}>
                                        <Typography variant="h6" fontWeight={700} color="secondary.dark" sx={{ mb: 2 }}>
                                            <WorkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            Work Status ({drawerData.details.workStatuses.length})
                                        </Typography>
                                        <Stack spacing={1}>
                                            {drawerData.details.workStatuses.slice(0, 5).map(ws => (
                                                <Box key={ws._id} sx={{ p: 1, borderRadius: 1, bgcolor: 'background.paper' }}>
                                                    <Typography variant="body2" fontWeight={600}>{ws.work_name || 'Work'}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Status: {ws.status || 'N/A'} | Budget: ₹{ws.total_budget?.toLocaleString() || 'N/A'}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Paper>
                                )}

                                {/* Winning Candidates */}
                                <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.grey[100] }}>
                                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                                        <EmojiEventsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Winning Candidates ({drawerData.details.winners?.length || 0})
                                    </Typography>
                                    <Stack spacing={1}>
                                        {drawerData.details.winners?.length ? drawerData.details.winners.slice(0, 5).map(w => (
                                            <Box key={w._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, bgcolor: 'background.paper' }}>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {w.name || w.candidate_id?.name || 'Candidate'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Year: {typeof w.year_id === 'object' ? (w.year_id?.year || w.year_id?.name) : w.year_id}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={w.party_id?.name || w.party || 'Party'}
                                                    size="small"
                                                    color="primary"
                                                />
                                            </Box>
                                        )) : (
                                            <Typography variant="body2" color="text.secondary">No winners data</Typography>
                                        )}
                                    </Stack>
                                </Paper>

                                {/* Visits Info */}
                                {drawerData.details.visits?.length > 0 && (
                                    <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.grey[50] }}>
                                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                                            <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                            Recent Visits ({drawerData.details.visits.length})
                                        </Typography>
                                        <Stack spacing={1}>
                                            {drawerData.details.visits.slice(0, 5).map(v => (
                                                <Box key={v._id} sx={{ p: 1, borderRadius: 1, bgcolor: 'background.paper' }}>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {v.candidate_id?.name || 'Candidate'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {v.date ? new Date(v.date).toLocaleDateString('en-IN') : ''} • {v.locationName || ''}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Stack>
                                    </Paper>
                                )}

                                {/* Apply Filter Button */}
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    size="large"
                                    onClick={applyAssemblyFilter}
                                    sx={{ mt: 2 }}
                                >
                                    Apply Filter to Table
                                </Button>
                                <Alert severity="info" sx={{ mt: 1 }}>
                                    This will filter the table below to show only this assembly's data
                                </Alert>
                            </Stack>
                        )}
                    </Box>
                </Box>
            </Drawer>

            <AssemblyModal
                open={openModal}
                modalToggler={setOpenModal}
                assembly={selectedAssembly}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                refresh={() => fetchAssemblies(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertAssemblyDelete
                id={assemblyDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchAssemblies(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}
