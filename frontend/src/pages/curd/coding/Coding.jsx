// codingListPage.js
import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, TextField, MenuItem
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

import CodingModal from './CodingModal';
import AlertCodingDelete from './AlertCodingDelete';
import CodingView from './CodingView';

export default function CodingListPage() {
    const theme = useTheme();

    const [selectedCoding, setSelectedCoding] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [codingDeleteId, setCodingDeleteId] = useState('');
    const [codingList, setCodingList] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);

    // Filtered dropdown data
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);

    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState({
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: ''
    });

    const handleFilterChange = (field, value) => {

        let newFilters = { ...filters, [field]: value };

        // Clear child selections when parent changes
        if (field === 'state') {
            newFilters = { ...newFilters, division: '', parliament: '', assembly: '', block: '' };
            // Update filtered divisions based on selected state
            if (value && divisions.length > 0) {

                const stateDivisions = divisions.filter(division =>
                    division.state_id === value || division.state_id?._id === value
                );

                setFilteredDivisions(stateDivisions);
            } else {
                setFilteredDivisions([]);
            }
            setFilteredParliaments([]);
            setFilteredAssemblies([]);
            setFilteredBlocks([]);
        } else if (field === 'division') {
            newFilters = { ...newFilters, parliament: '', assembly: '', block: '' };
            // Update filtered parliaments based on selected division
            if (value && parliaments.length > 0) {

                const divisionParliaments = parliaments.filter(parliament =>
                    parliament.division_id === value || parliament.division_id?._id === value
                );

                setFilteredParliaments(divisionParliaments);
            } else {
                setFilteredParliaments([]);
            }
            setFilteredAssemblies([]);
            setFilteredBlocks([]);
        } else if (field === 'parliament') {
            newFilters = { ...newFilters, assembly: '', block: '' };
            // Update filtered assemblies based on selected parliament
            if (value && assemblies.length > 0) {

                const parliamentAssemblies = assemblies.filter(assembly =>
                    assembly.parliament_id === value || assembly.parliament_id?._id === value
                );

                setFilteredAssemblies(parliamentAssemblies);
            } else {
                setFilteredAssemblies([]);
            }
            setFilteredBlocks([]);
        } else if (field === 'assembly') {
            newFilters = { ...newFilters, block: '' };
            // Update filtered blocks based on selected assembly
            if (value && blocks.length > 0) {

                const assemblyBlocks = blocks.filter(block =>
                    block.assembly_id === value || block.assembly_id?._id === value
                );

                setFilteredBlocks(assemblyBlocks);
            } else {
                setFilteredBlocks([]);
            }
        }

        setFilters(newFilters);

        // Note: Filters are now only applied when Apply button is clicked
        // Removed automatic filter application to match user requirement
    };

    const handleApplyFilters = () => {
        const newColumnFilters = Object.entries(filters)
            .filter(([_, value]) => value !== '')
            .map(([id, value]) => ({ id, value }));
        setColumnFilters(newColumnFilters);
    };

    const handleClearFilters = () => {
        setFilters({
            state: '',
            division: '',
            parliament: '',
            assembly: '',
            block: ''
        });
        setColumnFilters([]);

        // Clear all filtered dropdowns
        setFilteredDivisions([]);
        setFilteredParliaments([]);
        setFilteredAssemblies([]);
        setFilteredBlocks([]);
    };

    const [columnFilters, setColumnFilters] = useState([]);

    const fetchReferenceData = async () => {
        try {
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/booths`)
            ]);

            const [statesData, divisionsData, parliamentsData, assembliesData, blocksData, boothsData] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                boothsRes.json()
            ]);

            if (statesData.success) {

                setStates(statesData.data);
            }
            if (divisionsData.success) {

                setDivisions(divisionsData.data);
            }
            if (parliamentsData.success) {

                setParliaments(parliamentsData.data);
            }
            if (assembliesData.success) {
                setAssemblies(assembliesData.data);
            }
            if (blocksData.success) {
                setBlocks(blocksData.data);
            }
            if (boothsData.success) setBooths(boothsData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    const fetchCodingList = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            let query = globalFilter ? `&search=${encodeURIComponent(globalFilter)}` : '';

            // Add column filters to the query
            columnFilters.forEach(filter => {
                if (filter.value) {
                    // Use the filter field names as expected by the backend
                    query += `&${filter.id}=${encodeURIComponent(filter.value)}`;
                }
            });

            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/codings?page=${pageIndex + 1}&limit=${pageSize}${query}`);
            const json = await res.json();
            if (json.success) {

                setCodingList(json.data);
                setPageCount(json.pages);
            } else {
                console.error('API Error:', json);
            }
        } catch (error) {
            console.error('Failed to fetch coding list:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCodingList(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, columnFilters]);

    // Reset to first page when filters change
    useEffect(() => {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, [columnFilters]);

    const handleDeleteOpen = (id) => {
        setCodingDeleteId(id);
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
                },
            enableColumnFilter: false,
        },
        {
            header: 'Name',
            accessorKey: 'name',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'Mobile',
            accessorKey: 'mobile',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'Coding Types',
            accessorKey: 'coding_types',
            cell: ({ getValue }) => (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    {getValue()?.map((type, index) => (
                        <Chip key={index} label={type} size="small" />
                    ))}
                </Stack>
            )
        },
        {
            header: 'State',
            accessorKey: 'state',
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
            accessorKey: 'division',
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
            accessorKey: 'parliament',
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
            header: 'Assembly',
            accessorKey: 'assembly',
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
            header: 'Block',
            accessorKey: 'block',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="success"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Booth',
            accessorKey: 'booth',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="error"
                    size="small"
                    variant="outlined"
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
                    {/* Strip HTML tags for table preview */}
                    {getValue() ? getValue().replace(/<[^>]+>/g, '').slice(0, 100) : ''}
                </Typography>
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
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedCoding(row.original); setOpenModal(true); }}>
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
        data: codingList,
        columns,
        state: {
            pagination,
            globalFilter,
            columnFilters
        },
        pageCount,
        manualPagination: true,
        manualFiltering: true,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getRowCanExpand: () => true
    });

    const fetchAllCodingsForCsv = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/codings?all=true`);
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all codings for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllCodingsForCsv();
        setCsvData(allData.map(item => ({
            'Name': item.name,
            'Mobile': item.mobile,
            'Email': item.email || '',
            'Facebook': item.facebook || '',
            'Instagram': item.instagram || '',
            'Twitter': item.twitter || '',
            'WhatsApp': item.whatsapp_number || '',
            'Coding Types': item.coding_types.join(', '),
            'State': item.state?.name || '',
            'Division': item.division?.name || '',
            'Parliament': item.parliament?.name || '',
            'Assembly': item.assembly?.name || '',
            'Block': item.block?.name || '',
            'Booth': item.booth?.name || '',
            'Created By': item.created_by?.username || '',
            'Created At': item.created_at
        })));
        setCsvLoading(false);
        setTimeout(() => {
            if (csvLinkRef.current) {
                csvLinkRef.current.link.click();
            }
        }, 100);
    };

    if (loading) {
        return <EmptyReactTable />;
    }


    return (
        <>
            <MainCard content={false}>


                <Stack spacing={2}>
                    {/* Top Actions */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        justifyContent="space-between"
                        sx={{ p: 2 }}
                    >
                        <DebouncedInput
                            value={globalFilter}
                            onFilterChange={setGlobalFilter}
                            placeholder={`Search ${codingList.length} coding entries...`}
                        />

                        <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            justifyContent="flex-end"
                        >
                            <CSVLink
                                data={csvData}
                                filename="coding_list_all.csv"
                                style={{ display: "none" }}
                                ref={csvLinkRef}
                            />
                            <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                                {csvLoading ? "Preparing CSV..." : "Download All CSV"}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => {
                                    setSelectedCoding(null);
                                    setOpenModal(true);
                                }}
                            >
                                Add Coding Entry
                            </Button>
                        </Stack>
                    </Stack>

                    {/* Filters */}
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{ p: 2, flexWrap: "wrap", gap: 2 }}
                    >
                        <TextField
                            select
                            label="State"
                            value={filters.state}
                            onChange={(e) => handleFilterChange("state", e.target.value)}
                            sx={{ minWidth: 200 }}
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
                            value={filters.division}
                            onChange={(e) => handleFilterChange("division", e.target.value)}
                            sx={{ minWidth: 200 }}
                            size="small"
                            disabled={!filters.state}
                        >
                            <MenuItem value="">All Divisions</MenuItem>
                            {filteredDivisions.map((division) => (
                                <MenuItem key={division._id} value={division._id}>
                                    {division.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Parliament"
                            value={filters.parliament}
                            onChange={(e) => handleFilterChange("parliament", e.target.value)}
                            sx={{ minWidth: 200 }}
                            size="small"
                            disabled={!filters.division}
                        >
                            <MenuItem value="">All Parliaments</MenuItem>
                            {filteredParliaments.map((parliament) => (
                                <MenuItem key={parliament._id} value={parliament._id}>
                                    {parliament.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Assembly"
                            value={filters.assembly}
                            onChange={(e) => handleFilterChange("assembly", e.target.value)}
                            sx={{ minWidth: 200 }}
                            size="small"
                            disabled={!filters.parliament}
                        >
                            <MenuItem value="">All Assemblies</MenuItem>
                            {filteredAssemblies.map((assembly) => (
                                <MenuItem key={assembly._id} value={assembly._id}>
                                    {assembly.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Block"
                            value={filters.block}
                            onChange={(e) => handleFilterChange("block", e.target.value)}
                            sx={{ minWidth: 200 }}
                            size="small"
                            disabled={!filters.assembly}
                        >
                            <MenuItem value="">All Blocks</MenuItem>
                            {filteredBlocks.map((block) => (
                                <MenuItem key={block._id} value={block._id}>
                                    {block.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <Stack direction="row" spacing={1} sx={{ minWidth: "fit-content" }}>
                            <Button variant="outlined" onClick={handleClearFilters}>
                                Clear
                            </Button>
                            <Button variant="contained" onClick={handleApplyFilters}>
                                Apply
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
                                {table.getRowModel().rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} align="center">
                                            <Typography>No data available</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    table.getRowModel().rows.map((row) => (
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
                                                        <CodingView data={row.original} />
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Fragment>
                                    ))
                                )}
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

            <CodingModal
                open={openModal}
                modalToggler={setOpenModal}
                codingEntry={selectedCoding}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                refresh={() => fetchCodingList(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertCodingDelete
                id={codingDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchCodingList(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}
