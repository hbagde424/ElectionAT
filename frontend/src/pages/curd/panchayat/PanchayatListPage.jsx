import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Stack, Typography, Box, Tooltip, Divider, Chip, Avatar, Grid,
    IconButton, Select, MenuItem, FormControl, InputLabel, TextField, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress
} from '@mui/material';
import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import axiosServices from 'utils/axios';
import { safeParseJson, safeRenderError } from 'utils/importResultHelpers';
import { usePermissions } from 'contexts/PermissionContext';
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';
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
import { useCsvOtp } from 'hooks/useCsvOtp';

const PanchayatListPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();
    const [panchayats, setPanchayats] = useState([]);
    const [allPanchayats, setAllPanchayats] = useState([]);
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

    const filterOptions = useFilterOptionsFromData(allPanchayats, {
        states: { field: 'state_id', nameField: 'name' },
        divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
        parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
        assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
        blocks: { field: 'block_id', nameField: 'name', parentField: 'assembly_id' }
    });

    // derive filtered lists for top-level filters so dropdowns cascade
    const filteredDivisions = filterOptions.divisions?.filter(d => (filters.state_id ? (d.state_id?._id || d.state_id) === filters.state_id : true)) || [];
    const filteredParliaments = filterOptions.parliaments?.filter(p => (filters.division_id ? (p.division_id?._id || p.division_id) === filters.division_id : true)) || [];
    const filteredAssemblies = filterOptions.assemblies?.filter(a => (filters.parliament_id ? (a.parliament_id?._id || a.parliament_id) === filters.parliament_id : true)) || [];
    const filteredBlocks = filterOptions.blocks?.filter(b => (filters.assembly_id ? (b.assembly_id?._id || b.assembly_id) === filters.assembly_id : true)) || [];
    const filteredBooths = booths.filter(b => (filters.block_id ? (b.block_id?._id || b.block_id) === filters.block_id : true));

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
    const fetchAllPanchayatsForFilters = async () => {
        try {
            const hierarchyFilters = {};
            if (userHierarchy?.state) hierarchyFilters.state = userHierarchy.state._id || userHierarchy.state;
            if (userHierarchy?.division) hierarchyFilters.division = userHierarchy.division._id || userHierarchy.division;
            if (userHierarchy?.parliament) hierarchyFilters.parliament = userHierarchy.parliament._id || userHierarchy.parliament;
            if (userHierarchy?.assembly) hierarchyFilters.assembly = userHierarchy.assembly._id || userHierarchy.assembly;
            if (userHierarchy?.block) hierarchyFilters.block = userHierarchy.block._id || userHierarchy.block;

            const data = await fetchAllDataForFilters('/panchayats', hierarchyFilters);
            setAllPanchayats(data);
        } catch (error) {
            console.error('Failed to fetch all panchayats for filters:', error);
        }
    };


    useEffect(() => {
        fetchHierarchyData();
        fetchAllPanchayatsForFilters();
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
    }, [pagination, sorting, globalFilter, filters]);

    const fetchPanchayats = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
                ...(globalFilter && { search: globalFilter }),
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            });

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
    const startCsvDownload = async () => {
        setExportLoading(true);
        try {
            const params = new URLSearchParams({
                all: 'true',
                ...(globalFilter && { search: globalFilter }),
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            });

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

    const handleExport = async () => {
        await requestOtp(startCsvDownload);
    };

    // Excel Template Download
    const handleDownloadExcelTemplate = async () => {
        try {
            const XLSX = await import('xlsx');
            const templateData = [
                {
                    panchayat_name: 'Sample Panchayat',
                    location: 'Near Main Road',
                    state_no: '23',
                    division_code: '1',
                    parliament_no: '101',
                    AC_NO: '1',
                    block: 'Block Name',
                    booth_number: '1',
                    male_count: '5000',
                    female_count: '4800',
                    others_count: '20'
                }
            ];
            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
            XLSX.writeFile(workbook, 'panchayat-template.xlsx');
        } catch (error) {
            console.error('Error generating template:', error);
            alert('Failed to download template. Please try again.');
        }
    };

    // Excel Import Handler
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
                for (const k of Object.keys(r)) obj[k.trim().toLowerCase().replace(/\s+/g, '_')] = r[k];
                return {
                    panchayat_name: obj.panchayat_name ?? obj.name ?? '',
                    location: obj.location ?? '',
                    state: obj.state_no ?? obj.state ?? '',
                    division_code: obj.division_code ?? obj.division ?? '',
                    parliament_no: obj.parliament_no ?? obj.parliament ?? '',
                    assembly_no: obj.ac_no ?? obj.assembly_no ?? obj.assembly ?? '',
                    block: obj.block ?? '',
                    booth_number: obj.booth_number ?? obj.booth ?? '',
                    male_count: obj.male_count ?? '0',
                    female_count: obj.female_count ?? '0',
                    others_count: obj.others_count ?? '0'
                };
            });

            const filtered = rows.filter(r => String(r.panchayat_name).trim());

            const token = localStorage.getItem('serviceToken');
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/panchayats/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ rows: filtered })
            });

            // Parse response defensively
            const result = await safeParseJson(res);

            if (!res.ok) {
                setImportResult(result || { success: false, message: result?.message || `Request failed: ${res.status} ${res.statusText}` });
            } else {
                setImportResult(result || { success: false, message: 'Invalid JSON response from server' });
                if (result?.success) fetchPanchayats();
            }
        } catch (err) {
            setImportResult({ success: false, message: err?.message || String(err) });
        } finally {
            setImporting(false);
            if (importInputRef.current) importInputRef.current.value = '';
        }
    };

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
                        <Button variant="outlined" onClick={handleDownloadExcelTemplate}>
                            Download Excel Template
                        </Button>
                        <Button variant="outlined" onClick={() => importInputRef.current?.click()} disabled={importing}>
                            {importing ? 'Importing...' : 'Import Excel'}
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

                {importResult && (
                    <Alert severity={importResult.success ? 'success' : 'error'} onClose={() => setImportResult(null)} sx={{ mx: 3, mb: 2 }}>
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {importResult.message || (importResult.success ? `Imported ${importResult.created ?? 0} / ${importResult.total ?? ''}` : 'Import result')}
                            </Typography>

                            {typeof importResult.created !== 'undefined' && typeof importResult.skipped !== 'undefined' && (
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    {`Created: ${importResult.created} — Skipped: ${importResult.skipped}`}
                                </Typography>
                            )}

                            {Array.isArray(importResult.errors) && importResult.errors.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="subtitle2">Errors (first {Math.min(10, importResult.errors.length)}):</Typography>
                                    <Box component="ul" sx={{ pl: 3, m: 0 }}>
                                        {importResult.errors.slice(0, 10).map((err, idx) => (
                                            <li key={idx}>
                                                <Typography variant="body2">{safeRenderError(err)}</Typography>
                                            </li>
                                        ))}
                                        {importResult.errors.length > 10 && (
                                            <li>
                                                <Typography variant="body2">{`...and ${importResult.errors.length - 10} more`}</Typography>
                                            </li>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Alert>
                )}

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
                refresh={fetchPanchayats}
            />

            <AlertPanchayatDelete
                id={deleteAlert.id}
                title={selectedPanchayat?.panchayat_name}
                open={deleteAlert.open}
                handleClose={() => setDeleteAlert({ open: false, id: null })}
                refresh={fetchPanchayats}
            />

            <input
                ref={importInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={handleImportFile}
            />
        </MainCard>
    );
};

export default PanchayatListPage;