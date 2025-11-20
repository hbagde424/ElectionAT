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
import FalliyaModal from './FalliyaModal';
import AlertFalliyaDelete from './AlertFalliyaDelete';

const FalliyaListPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();
    const [falliyas, setFalliyas] = useState([]);
    const [allFalliyas, setAllFalliyas] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [selectedFalliya, setSelectedFalliya] = useState(null);
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
    const [villages, setVillages] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: '',
        panchayat_id: '',
        village_id: '',
        falliya_name: '',
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
            header: 'Falliya Name',
            accessorKey: 'falliya_name',
            cell: ({ getValue }) => (
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'Village',
            accessorKey: 'village_id',
            cell: ({ getValue }) => getValue()?.village_name || 'N/A'
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
                            onClick={() => navigate(`/falliya/${row.original._id}`)}
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
        data: falliyas,
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
    const fetchAllFalliyasForFilters = async () => {
        try {
            const hierarchyFilters = {};
            if (userHierarchy?.state) hierarchyFilters.state = userHierarchy.state._id || userHierarchy.state;
            if (userHierarchy?.division) hierarchyFilters.division = userHierarchy.division._id || userHierarchy.division;
            if (userHierarchy?.parliament) hierarchyFilters.parliament = userHierarchy.parliament._id || userHierarchy.parliament;
            if (userHierarchy?.assembly) hierarchyFilters.assembly = userHierarchy.assembly._id || userHierarchy.assembly;
            if (userHierarchy?.block) hierarchyFilters.block = userHierarchy.block._id || userHierarchy.block;
            if (userHierarchy?.panchayat) hierarchyFilters.panchayat = userHierarchy.panchayat._id || userHierarchy.panchayat;
            if (userHierarchy?.village) hierarchyFilters.village = userHierarchy.village._id || userHierarchy.village;

            const data = await fetchAllDataForFilters('/falliyas', hierarchyFilters);
            setAllFalliyas(data);
        } catch (error) {
            console.error('Failed to fetch all falliyas for filters:', error);
        }
    };

    const filterOptions = useFilterOptionsFromData(allFalliyas, {
        panchayats: { field: 'panchayat_id', nameField: 'panchayat_name' },
        villages: { field: 'village_id', nameField: 'village_name', parentField: 'panchayat_id' }
    });

    useEffect(() => {
        fetchHierarchyData();
        fetchAllFalliyasForFilters();
    }, []);

    const fetchHierarchyData = async () => {
        try {
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes, panchayatsRes, villagesRes] = await Promise.all([
                axiosServices.get('/states?all=true'),
                axiosServices.get('/divisions?all=true'),
                axiosServices.get('/parliaments?all=true'),
                axiosServices.get('/assemblies?all=true'),
                axiosServices.get('/blocks?all=true'),
                axiosServices.get('/booths?all=true'),
                axiosServices.get('/panchayats?all=true'),
                axiosServices.get('/villages?all=true')
            ]);

            setStates(statesRes.data.data || []);
            setDivisions(divisionsRes.data.data || []);
            setParliaments(parliamentsRes.data.data || []);
            setAssemblies(assembliesRes.data.data || []);
            setBlocks(blocksRes.data.data || []);
            setBooths(boothsRes.data.data || []);
            setPanchayats(panchayatsRes.data.data || []);
            setVillages(villagesRes.data.data || []);
        } catch (error) {
            console.error('Error fetching hierarchy data:', error);
        }
    };

    // Fetch falliyas data
    useEffect(() => {
        fetchFalliyas();
    }, [pagination, sorting, globalFilter, filters]);

    const fetchFalliyas = async () => {
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

            const response = await axiosServices.get(`/falliyas?${params}`);
            const { data, total, pages } = response.data;

            setFalliyas(data || []);
            setPageCount(pages || 0);
        } catch (error) {
            console.error('Error fetching falliyas:', error);
            setFalliyas([]);
        }
        setLoading(false);
    };

    const handleAdd = () => {
        setSelectedFalliya(null);
        setOpenModal(true);
    };

    const handleEdit = (falliya) => {
        setSelectedFalliya(falliya);
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
            village_id: '',
            falliya_name: '',
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

            const response = await axiosServices.get(`/falliyas?${params}`);
            const exportData = response.data.data.map(falliya => ({
                'Falliya Name': falliya.falliya_name,
                'Village': falliya.village_id?.village_name || '',
                'Panchayat': falliya.panchayat_id?.panchayat_name || '',
                'State': falliya.state_id?.name || '',
                'Division': falliya.division_id?.name || '',
                'Parliament': falliya.parliament_id?.name || '',
                'Assembly': falliya.assembly_id?.name || '',
                'Block': falliya.block_id?.name || '',
                'Booth': falliya.booth_id?.name || '',
                'Location': falliya.location || '',
                'Latitude': falliya.latitude || '',
                'Longitude': falliya.longitude || '',
                'Male Count': falliya.male_count || 0,
                'Female Count': falliya.female_count || 0,
                'Others Count': falliya.others_count || 0,
                'Total Count': falliya.total_count || 0,
                'Created At': new Date(falliya.created_at).toLocaleDateString(),
                'Updated At': new Date(falliya.updated_at).toLocaleDateString()
            }));

            setCsvData(exportData);
            setTimeout(() => csvLinkRef.current?.link.click(), 100);
        } catch (error) {
            console.error('Error exporting data:', error);
        }
        setExportLoading(false);
    };

    // Excel Template Download
    const handleDownloadExcelTemplate = async () => {
        try {
            const XLSX = await import('xlsx');
            const templateData = [
                {
                    falliya_name: 'North Falliya',
                    village_name: 'Rampur',
                    panchayat_name: 'Rampur Gram Panchayat',
                    location: 'North Side',
                    male_population: '120',
                    female_population: '110',
                    total_population: '230'
                }
            ];
            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
            XLSX.writeFile(workbook, 'falliya-template.xlsx');
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

            const response = await axiosServices.post('/falliyas/import', { data: normalizedData });
            setImportResult(response.data);
            if (response.data.success) {
                fetchFalliyas();
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
                    <Typography variant="h4">Falliya Management</Typography>
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
                            Add Falliya
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
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth
                            placeholder="Search falliyas..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Village</InputLabel>
                            <Select
                                value={filters.village_id}
                                onChange={(e) => handleFilterChange('village_id', e.target.value)}
                                label="Village"
                            >
                                <MenuItem value="">All Villages</MenuItem>
                                {filterOptions.villages?.map(village => (
                                    <MenuItem key={village._id} value={village._id}>
                                        {village.village_name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
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
                        <TextField
                            fullWidth
                            placeholder="Falliya Name"
                            value={filters.falliya_name}
                            onChange={(e) => handleFilterChange('falliya_name', e.target.value)}
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
                    <Grid item xs={12} md={2}>
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
                    filename={`falliyas-export-${new Date().toISOString().split('T')[0]}.csv`}
                    style={{ display: 'none' }}
                />
            </Stack>

            {/* Modals */}
            <FalliyaModal
                open={openModal}
                modalToggler={() => setOpenModal(false)}
                falliya={selectedFalliya}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                panchayats={panchayats}
                villages={villages}
                refresh={fetchFalliyas}
            />

            <AlertFalliyaDelete
                id={deleteAlert.id}
                title={selectedFalliya?.falliya_name}
                open={deleteAlert.open}
                handleClose={() => setDeleteAlert({ open: false, id: null })}
                refresh={fetchFalliyas}
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

export default FalliyaListPage;