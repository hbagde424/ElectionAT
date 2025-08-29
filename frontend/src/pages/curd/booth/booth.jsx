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

import BoothModal from './BoothModal';
import AlertBoothDelete from './AlertBoothDelete';
import BoothView from './BoothView';

export default function BoothsListPage() {
    const theme = useTheme();

    const [selectedBooth, setSelectedBooth] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [boothDeleteId, setBoothDeleteId] = useState('');
    const [booths, setBooths] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [electionYears, setElectionYears] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState(() => {
        const saved = localStorage.getItem('boothPagination');
        return saved ? JSON.parse(saved) : { pageIndex: 0, pageSize: 10 };
    });
    // Track if currently searching
    const [isSearching, setIsSearching] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState({
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: ''
    });

    const fetchReferenceData = async () => {
        try {
            const [
                statesRes,
                divisionsRes,
                parliamentsRes,
                assembliesRes,
                blocksRes,
                electionYearsRes
            ] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/election-years`)
            ]);

            const [
                statesData,
                divisionsData,
                parliamentsData,
                assembliesData,
                blocksData,
                electionYearsData
            ] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                electionYearsRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (blocksData.success) setBlocks(blocksData.data);
            if (electionYearsData.success) setElectionYears(electionYearsData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    const fetchBooths = async (pageIndex, pageSize, globalFilter = '', currentFilters = filters) => {
        setLoading(true);
        try {
            const queryParams = [];
            let actualPageIndex = pageIndex;
            let actualPageSize = pageSize;
            let searching = false;
            if (globalFilter) {
                queryParams.push(`search=${encodeURIComponent(globalFilter)}`);
                actualPageIndex = 0;
                actualPageSize = 10000;
                searching = true;
            }
            if (currentFilters.state_id) queryParams.push(`state=${encodeURIComponent(currentFilters.state_id)}`);
            if (currentFilters.division_id) queryParams.push(`division=${encodeURIComponent(currentFilters.division_id)}`);
            if (currentFilters.parliament_id) queryParams.push(`parliament=${encodeURIComponent(currentFilters.parliament_id)}`);
            if (currentFilters.assembly_id) queryParams.push(`assembly=${encodeURIComponent(currentFilters.assembly_id)}`);
            if (currentFilters.block_id) queryParams.push(`block=${encodeURIComponent(currentFilters.block_id)}`);

            const queryString = queryParams.length > 0 ? `&${queryParams.join('&')}` : '';
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?page=${actualPageIndex + 1}&limit=${actualPageSize}${queryString}`);
            const json = await res.json();
            if (json.success) {
                setBooths(json.data);
                setIsSearching(searching);
                if (searching) {
                    setPageCount(1);
                    setPagination({ pageIndex: 0, pageSize: json.data.length || 1 });
                } else {
                    setPageCount(json.pages);
                }
            }
        } catch (error) {
            console.error('Failed to fetch booths:', error);
        } finally {
            setLoading(false);
        }
    };

    // Track previous globalFilter to detect when search is cleared
    const prevGlobalFilter = useRef('');
    useEffect(() => {
        // Only reset pagination when search is cleared (from non-empty to empty)
        if (prevGlobalFilter.current && !globalFilter) {
            setPagination({ pageIndex: 0, pageSize: 10 });
            setIsSearching(false);
        } else {
            fetchBooths(pagination.pageIndex, pagination.pageSize, globalFilter);
        }
        prevGlobalFilter.current = globalFilter;
        fetchReferenceData();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    // Save pagination state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('boothPagination', JSON.stringify(pagination));
    }, [pagination]);

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
                    {/* Strip HTML tags for table preview */}
                    {getValue() ? getValue().replace(/<[^>]+>/g, '').slice(0, 100) : ''}
                </Typography>
            )
        },
        {
            header: 'Booth Number',
            accessorKey: 'booth_number',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 'N/A'}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Election Year',
            accessorKey: 'election_year',
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
            header: 'Full Address',
            accessorKey: 'full_address',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Coordinates',
            accessorFn: (row) => `${row.latitude || 'N/A'}, ${row.longitude || 'N/A'}`,
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'Block',
            accessorKey: 'block_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="default"
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
        // {
        //     header: 'District',
        //     accessorKey: 'district_id',
        //     cell: ({ getValue }) => (
        //         <Chip
        //             label={getValue()?.name || 'N/A'}
        //             color="success"
        //             size="small"
        //             variant="outlined"
        //         />
        //     )
        // },
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
        // {
        //     header: 'Updated At',
        //     accessorKey: 'updated_at',
        //     cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        // },
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
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedBooth(row.original); setOpenModal(true); }}>
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
        data: booths,
        columns,
        state: { pagination, globalFilter },
        pageCount,
        manualPagination: true,
        onPaginationChange: isSearching ? undefined : setPagination,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getRowCanExpand: () => true
    });

    const fetchAllBoothsForCsv = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?all=true`);
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
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllBoothsForCsv();
        setCsvData(allData.map(item => ({
            Name: item.name,
            'Booth Number': item.booth_number,
            'Full Address': item.full_address,
            Latitude: item.latitude,
            Longitude: item.longitude,
            Block: item.block_id?.name || '',
            Assembly: item.assembly_id?.name || '',
            Parliament: item.parliament_id?.name || '',
            // District: item.district_id?.name || '',
            Division: item.division_id?.name || '',
            State: item.state_id?.name || '',
            Description: item.description ? item.description.replace(/<[^>]+>/g, '') : '',
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



    const handleFilterApply = () => {
        setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page
        fetchBooths(0, pagination.pageSize, globalFilter, filters);
    };

    const handleClearFilter = () => {
        setFilters({
            state_id: '',
            division_id: '',
            parliament_id: '',
            assembly_id: '',
            block_id: ''
        });
        setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page
        fetchBooths(0, pagination.pageSize, globalFilter, {
            state_id: '',
            division_id: '',
            parliament_id: '',
            assembly_id: '',
            block_id: ''
        });
    };



    if (loading) return <EmptyReactTable />;
    return (
        <>
            <MainCard content={false}>

                {/* Search + Actions */}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    justifyContent="space-between"
                    sx={{ p: 2, flexWrap: 'wrap', gap: 2 }}
                >
                    <DebouncedInput
                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={`Search ${booths.length} booths...`}
                        style={{ minWidth: 250 }}
                    />

                    <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        justifyContent="flex-end"
                    >
                        <CSVLink
                            data={csvData}
                            filename="booths_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
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
                                setSelectedBooth(null);
                                setOpenModal(true);
                            }}
                            size="small"
                        >
                            Add Booth
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
                        label="State"
                        value={filters.state_id}
                        onChange={(e) => {
                            setFilters(prev => ({
                                ...prev,
                                state_id: e.target.value,
                                division_id: '',
                                parliament_id: '',
                                assembly_id: '',
                                block_id: ''
                            }));
                        }}
                        sx={{ minWidth: 150 }}
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
                            setFilters(prev => ({
                                ...prev,
                                division_id: e.target.value,
                                parliament_id: '',
                                assembly_id: '',
                                block_id: ''
                            }));
                        }}
                        sx={{ minWidth: 150 }}
                        size="small"
                        disabled={!filters.state_id}
                    >
                        <MenuItem value="">All Divisions</MenuItem>
                        {divisions
                            .filter(d => !filters.state_id || d.state_id?._id === filters.state_id)
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
                        onChange={(e) => {
                            setFilters(prev => ({
                                ...prev,
                                parliament_id: e.target.value,
                                assembly_id: '',
                                block_id: ''
                            }));
                        }}
                        sx={{ minWidth: 150 }}
                        size="small"
                        disabled={!filters.division_id}
                    >
                        <MenuItem value="">All Parliaments</MenuItem>
                        {parliaments
                            .filter(p => !filters.division_id || p.division_id?._id === filters.division_id)
                            .map((parliament) => (
                                <MenuItem key={parliament._id} value={parliament._id}>
                                    {parliament.name}
                                </MenuItem>
                            ))}
                    </TextField>

                    <TextField
                        select
                        label="Assembly"
                        value={filters.assembly_id}
                        onChange={(e) => {
                            setFilters(prev => ({
                                ...prev,
                                assembly_id: e.target.value,
                                block_id: ''
                            }));
                        }}
                        sx={{ minWidth: 150 }}
                        size="small"
                        disabled={!filters.parliament_id}
                    >
                        <MenuItem value="">All Assemblies</MenuItem>
                        {assemblies
                            .filter(a => !filters.parliament_id || a.parliament_id?._id === filters.parliament_id)
                            .map((assembly) => (
                                <MenuItem key={assembly._id} value={assembly._id}>
                                    {assembly.name}
                                </MenuItem>
                            ))}
                    </TextField>

                    <TextField
                        select
                        label="Block"
                        value={filters.block_id}
                        onChange={(e) => setFilters(prev => ({ ...prev, block_id: e.target.value }))}
                        sx={{ minWidth: 150 }}
                        size="small"
                        disabled={!filters.assembly_id}
                    >
                        <MenuItem value="">All Blocks</MenuItem>
                        {blocks
                            .filter(b => !filters.assembly_id || b.assembly_id?._id === filters.assembly_id)
                            .map((block) => (
                                <MenuItem key={block._id} value={block._id}>
                                    {block.name}
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
                        {!isSearching && (
                            <TablePagination
                                setPageSize={(size) => setPagination((prev) => ({ ...prev, pageSize: size }))}
                                setPageIndex={(index) => setPagination((prev) => ({ ...prev, pageIndex: index }))}
                                getState={table.getState}
                                getPageCount={() => pageCount}
                            />
                        )}
                    </Box>
                </ScrollX>
            </MainCard >

            <BoothModal
                open={openModal}
                modalToggler={setOpenModal}
                booth={selectedBooth}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                electionYears={electionYears}
                refresh={() => fetchBooths(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertBoothDelete
                id={boothDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchBooths(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}
