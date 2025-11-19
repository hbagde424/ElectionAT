import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Stack, Typography, Box, Tooltip, Divider, Chip, Avatar, Grid,
    IconButton, Select, MenuItem, FormControl, InputLabel, TextField, Alert
} from '@mui/material';
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
import { Add, Edit, Trash, Eye } from 'iconsax-react';
import { useNavigate } from 'react-router-dom';
import { HeaderSort, TablePagination } from 'components/third-party/react-table';
import ScrollX from 'components/ScrollX';
import MainCard from 'components/MainCard';
import EmptyReactTable from 'pages/tables/react-table/empty';
import VillageModal from './VillageModal';
import AlertVillageDelete from './AlertVillageDelete';

const VillageListPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();
    const [villages, setVillages] = useState([]);
    const [allVillages, setAllVillages] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [selectedVillage, setSelectedVillage] = useState(null);
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
    const [panchayats, setPanchayats] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: '',
        panchayat_id: '',
        village_name: '',
        location: ''
    });

    // CSV export
    const csvLinkRef = useRef(null);
    const [csvData, setCsvData] = useState([]);
    const [exportLoading, setExportLoading] = useState(false);

    // Excel import states
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const importInputRef = useRef();

    const columns = useMemo(() => [
        {
            header: 'Village Name',
            accessorKey: 'village_name',
            cell: ({ getValue }) => (
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'Panchayat',
            accessorKey: 'panchayat_id',
            cell: ({ getValue }) => getValue()?.panchayat_name || 'N/A'
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
                            onClick={() => navigate(`/village/${row.original._id}`)}
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
        data: villages,
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
    const fetchAllVillagesForFilters = async () => {
        try {
            const hierarchyFilters = {};
            if (userHierarchy?.state) hierarchyFilters.state = userHierarchy.state._id || userHierarchy.state;
            if (userHierarchy?.division) hierarchyFilters.division = userHierarchy.division._id || userHierarchy.division;
            if (userHierarchy?.parliament) hierarchyFilters.parliament = userHierarchy.parliament._id || userHierarchy.parliament;
            if (userHierarchy?.assembly) hierarchyFilters.assembly = userHierarchy.assembly._id || userHierarchy.assembly;
            if (userHierarchy?.block) hierarchyFilters.block = userHierarchy.block._id || userHierarchy.block;
            if (userHierarchy?.panchayat) hierarchyFilters.panchayat = userHierarchy.panchayat._id || userHierarchy.panchayat;

            const data = await fetchAllDataForFilters('/villages', hierarchyFilters);
            setAllVillages(data);
        } catch (error) {
            console.error('Failed to fetch all villages for filters:', error);
        }
    };

    const filterOptions = useFilterOptionsFromData(allVillages, {
        panchayats: { field: 'panchayat_id', nameField: 'panchayat_name' }
    });

    useEffect(() => {
        fetchHierarchyData();
        fetchAllVillagesForFilters();
    }, []);

    const fetchHierarchyData = async () => {
        try {
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes, panchayatsRes] = await Promise.all([
                axiosServices.get('/states?all=true'),
                axiosServices.get('/divisions?all=true'),
                axiosServices.get('/parliaments?all=true'),
                axiosServices.get('/assemblies?all=true'),
                axiosServices.get('/blocks?all=true'),
                axiosServices.get('/booths?all=true'),
                axiosServices.get('/panchayats?all=true')
            ]);

            setStates(statesRes.data.data || []);
            setDivisions(divisionsRes.data.data || []);
            setParliaments(parliamentsRes.data.data || []);
            setAssemblies(assembliesRes.data.data || []);
            setBlocks(blocksRes.data.data || []);
            setBooths(boothsRes.data.data || []);
            setPanchayats(panchayatsRes.data.data || []);
        } catch (error) {
            console.error('Error fetching hierarchy data:', error);
        }
    };

    // Fetch villages data
    useEffect(() => {
        fetchVillages();
    }, [pagination, sorting, globalFilter, filters]);

    const fetchVillages = async () => {
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

            const response = await axiosServices.get(`/villages?${params}`);
            const { data, total, pages } = response.data;

            setVillages(data || []);
            setPageCount(pages || 0);
        } catch (error) {
            console.error('Error fetching villages:', error);
            setVillages([]);
        }
        setLoading(false);
    };

    const handleAdd = () => {
        setSelectedVillage(null);
        setOpenModal(true);
    };

    const handleEdit = (village) => {
        setSelectedVillage(village);
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
            panchayat_id: '',
            village_name: '',
            location: ''
        });
        setGlobalFilter('');
    };

    // CSV Export
    const handleExport = async () => {
        setExportLoading(true);
        try {
            const params = new URLSearchParams({
                all: 'true',
                ...(globalFilter && { search: globalFilter }),
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
            });

            const response = await axiosServices.get(`/villages?${params}`);
            const exportData = response.data.data.map(village => ({
                'Village Name': village.village_name,
                'Panchayat': village.panchayat_id?.panchayat_name || '',
                'State': village.state_id?.name || '',
                'Division': village.division_id?.name || '',
                'Parliament': village.parliament_id?.name || '',
                'Assembly': village.assembly_id?.name || '',
                'Block': village.block_id?.name || '',
                'Booth': village.booth_id?.name || '',
                'Location': village.location || '',
                'Latitude': village.latitude || '',
                'Longitude': village.longitude || '',
                'Male Count': village.male_count || 0,
                'Female Count': village.female_count || 0,
                'Others Count': village.others_count || 0,
                'Total Count': village.total_count || 0,
                'Created At': new Date(village.created_at).toLocaleDateString(),
                'Updated At': new Date(village.updated_at).toLocaleDateString()
            }));

            setCsvData(exportData);
            setTimeout(() => csvLinkRef.current?.link.click(), 100);
        } catch (error) {
            console.error('Error exporting data:', error);
        }
        setExportLoading(false);
    };

    // Excel Template Download
    const handleDownloadExcelTemplate = () => {
        const XLSX = require('xlsx');
        const headers = ['village_name', 'panchayat_id', 'state_id', 'division_id', 'parliament_id', 'assembly_id', 'block_id', 'booth_id', 'location', 'latitude', 'longitude', 'male_count', 'female_count', 'others_count'];
        const worksheet = XLSX.utils.aoa_to_sheet([headers]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
        XLSX.writeFile(workbook, 'villages-template.xlsx');
    };

    // Excel Import Handler
    const handleImportFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        setImportResult(null);

        try {
            const XLSX = require('xlsx');
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const normalizedData = jsonData.map(row => {
                const normalized = {};
                Object.keys(row).forEach(key => {
                    const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
                    normalized[normalizedKey] = row[key];
                });
                return normalized;
            });

            const response = await axiosServices.post('/villages/import', { data: normalizedData });
            setImportResult(response.data);
            if (response.data.success) {
                fetchVillages();
            }
        } catch (err) {
            setImportResult({ success: false, message: err.message || 'Import failed' });
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
                    <Typography variant="h4">Village Management</Typography>
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
                            Add Village
                        </Button>
                    </Stack>
                </Stack>

                {importResult && (
                    <Alert severity={importResult.success ? 'success' : 'error'} onClose={() => setImportResult(null)}>
                        {importResult.message || (importResult.success ? 'Import successful' : 'Import failed')}
                        {importResult.imported && ` (${importResult.imported} imported)`}
                        {importResult.failed && ` (${importResult.failed} failed)`}
                    </Alert>
                )}

                <Divider />

                {/* Filters */}
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            placeholder="Search villages..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Panchayat</InputLabel>
                            <Select
                                value={filters.panchayat_id}
                                onChange={(e) => handleFilterChange('panchayat_id', e.target.value)}
                                label="Panchayat"
                            >
                                <MenuItem value="">All Panchayats</MenuItem>
                                {filterOptions.panchayats?.map(panchayat => (
                                    <MenuItem key={panchayat._id} value={panchayat._id}>
                                        {panchayat.panchayat_name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
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
                                {states.map(state => (
                                    <MenuItem key={state._id} value={state._id}>
                                        {state.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            placeholder="Village Name"
                            value={filters.village_name}
                            onChange={(e) => handleFilterChange('village_name', e.target.value)}
                        />
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
                    filename={`villages-export-${new Date().toISOString().split('T')[0]}.csv`}
                    style={{ display: 'none' }}
                />
            </Stack>

            {/* Modals */}
            <VillageModal
                open={openModal}
                modalToggler={() => setOpenModal(false)}
                village={selectedVillage}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                panchayats={panchayats}
                refresh={fetchVillages}
            />

            <AlertVillageDelete
                id={deleteAlert.id}
                title={selectedVillage?.village_name}
                open={deleteAlert.open}
                handleClose={() => setDeleteAlert({ open: false, id: null })}
                refresh={fetchVillages}
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

export default VillageListPage;