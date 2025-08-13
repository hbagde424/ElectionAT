import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, TextField, MenuItem,
    Grid
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
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

import AssemblyModal from './AssemblyModal';
import AlertAssemblyDelete from './AlertAssemblyDelete';
import AssemblyView from './AssemblyView';

export default function AssemblyListPage() {
    const theme = useTheme();

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

    const typeOptions = ['Urban', 'Rural', 'Mixed'];
    const categoryOptions = ['General', 'Reserved', 'Special'];

    const fetchReferenceData = async () => {
        try {
            const [statesRes, divisionsRes, parliamentsRes] = await Promise.all([
                fetch('http://localhost:5000/api/states'),
                fetch('http://localhost:5000/api/divisions'),
                fetch('http://localhost:5000/api/parliaments')
            ]);

            const token = localStorage.getItem('serviceToken');
            const [usersRes] = await Promise.all([
                fetch('http://localhost:5000/api/users', {
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
            if (currentFilters.state_id) queryParams.push(`state=${encodeURIComponent(currentFilters.state_id)}`);
            if (currentFilters.division_id) queryParams.push(`division=${encodeURIComponent(currentFilters.division_id)}`);
            if (currentFilters.parliament_id) queryParams.push(`parliament=${encodeURIComponent(currentFilters.parliament_id)}`);

            const queryString = queryParams.length > 0 ? `&${queryParams.join('&')}` : '';
            const res = await fetch(`http://localhost:5000/api/assemblies?page=${pageIndex + 1}&limit=${pageSize}${queryString}`);
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
            cell: ({ row }) => <Typography>{row.index + 1}</Typography>
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
                const isExpanded = row.getIsExpanded();
                const expandIcon = isExpanded ? <Add style={{ transform: 'rotate(45deg)', color: theme.palette.error.main }} /> : <Eye />;
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <IconButton color="secondary" onClick={row.getToggleExpandedHandler()}>
                            {expandIcon}
                        </IconButton>
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedAssembly(row.original); setOpenModal(true); }}>
                            <Edit />
                        </IconButton>
                        <IconButton color="error" onClick={(e) => { e.stopPropagation(); handleDeleteOpen(row.original._id); }}>
                            <Trash />
                        </IconButton>
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
            const res = await fetch('http://localhost:5000/api/assemblies?all=true');
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

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllAssembliesForCsv();
        setCsvData(allData.map(item => ({
            Name: item.name,
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

    if (loading) return <EmptyReactTable />;

    const handleFilterApply = () => {
        fetchAssemblies(pagination.pageIndex, pagination.pageSize, globalFilter, filters);
    };

    const handleClearFilter = () => {
        setFilters({
            type: '',
            category: '',
            state_id: '',
            division_id: '',
            parliament_id: ''
        });
        fetchAssemblies(pagination.pageIndex, pagination.pageSize, globalFilter, {
            type: '',
            category: '',
            state_id: '',
            division_id: '',
            parliament_id: ''
        });
    };

    return (
        <>
            <MainCard content={false}>
                <Stack spacing={2} sx={{ padding: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                        <Typography variant="h5">Assembly List</Typography>
                        <Stack direction="row" spacing={1}>
                            <CSVLink
                                data={csvData}
                                filename="assemblies_all.csv"
                                style={{ display: 'none' }}
                                ref={csvLinkRef}
                            />
                            <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                                {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                            </Button>
                            <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedAssembly(null); setOpenModal(true); }}>
                                Add Assembly
                            </Button>
                        </Stack>
                    </Stack>

                    <Stack direction="row" spacing={2} alignItems="center">
                        <DebouncedInput
                            value={globalFilter}
                            onFilterChange={setGlobalFilter}
                            placeholder={`Search ${assemblies.length} assemblies...`}
                            sx={{ width: '100%', maxWidth: 250 }}
                        />
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
                                    division_id: '', // Reset division when state changes
                                    parliament_id: '' // Reset parliament when state changes
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
                                    parliament_id: '' // Reset parliament when division changes
                                }));
                            }}
                            sx={{ minWidth: 120 }}
                            size="small"
                            disabled={!filters.state_id}
                        >
                            <MenuItem value="">All Divisions</MenuItem>
                            {divisions
                                .filter(division => !filters.state_id || division.state_id?._id === filters.state_id)
                                .map((division) => (
                                    <MenuItem key={division._id} value={division._id}>
                                        {division.name}
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
                                .filter(parliament => !filters.division_id || parliament.division_id?._id === filters.division_id)
                                .map((parliament) => (
                                    <MenuItem key={parliament._id} value={parliament._id}>
                                        {parliament.name}
                                    </MenuItem>
                                ))}
                        </TextField>
                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="outlined"
                                onClick={handleClearFilter}
                                size="small"
                            >
                                Clear Filters
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleFilterApply}
                                size="small"
                            >
                                Clear Filters
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>



                <ScrollX>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableCell
                                                key={header.id}
                                                onClick={header.column.getToggleSortingHandler()}
                                                sx={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
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