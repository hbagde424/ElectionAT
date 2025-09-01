import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, FormControl, InputLabel, Select, MenuItem
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

import CasteModal from './CasteModal';
import AlertCasteDelete from './AlertCasteDelete';
import CasteView from './CasteView';

export default function CasteListPage() {
    const theme = useTheme();

    const [selectedCaste, setSelectedCaste] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [casteDeleteId, setCasteDeleteId] = useState('');
    const [casteList, setCasteList] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState({
        category: '',
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: '',
        booth: ''
    });

    // States for filtered options
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    const categoryOptions = ['SC', 'ST', 'OBC', 'GENERAL'];

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
            if (boothsData.success) {
                setBooths(boothsData.data);
            }

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    // Handle state change
    const handleStateChange = (stateId) => {

        setFilters(prev => ({
            ...prev,
            state: stateId,
            division: '',
            parliament: '',
            assembly: '',
            block: '',
            booth: ''
        }));

        // Filter divisions based on selected state
        const filteredDivs = divisions.filter(div => div.state_id?._id === stateId);
        setFilteredDivisions(filteredDivs);
        setFilteredParliaments([]);
        setFilteredAssemblies([]);
        setFilteredBlocks([]);
        setFilteredBooths([]);
    };

    // Handle division change
    const handleDivisionChange = (divisionId) => {

        setFilters(prev => ({
            ...prev,
            division: divisionId,
            parliament: '',
            assembly: '',
            block: '',
            booth: ''
        }));

        // Filter parliaments based on selected division
        const filteredParls = parliaments.filter(parl => parl.division_id?._id === divisionId);
        setFilteredParliaments(filteredParls);
        setFilteredAssemblies([]);
        setFilteredBlocks([]);
        setFilteredBooths([]);
    };

    // Handle parliament change
    const handleParliamentChange = (parliamentId) => {
        setFilters(prev => ({
            ...prev,
            parliament: parliamentId,
            assembly: '',
            block: '',
            booth: ''
        }));

        // Filter assemblies based on selected parliament
        const filteredAsm = assemblies.filter(asm => asm.parliament_id?._id === parliamentId);
        setFilteredAssemblies(filteredAsm);
        setFilteredBlocks([]);
        setFilteredBooths([]);
    };

    // Handle assembly change
    const handleAssemblyChange = (assemblyId) => {
        setFilters(prev => ({
            ...prev,
            assembly: assemblyId,
            block: '',
            booth: ''
        }));
    };

    // Handle block change
    const handleBlockChange = (blockId) => {
        setFilters(prev => ({
            ...prev,
            block: blockId,
            booth: ''
        }));
    };

    // Update filteredBlocks when assembly or blocks change
    useEffect(() => {
        if (filters.assembly) {
            const filteredBlks = blocks.filter(blk => blk.assembly_id?._id === filters.assembly);
            setFilteredBlocks(filteredBlks);
        } else {
            setFilteredBlocks([]);
        }
        // Reset filteredBooths if assembly changes
        setFilteredBooths([]);
    }, [filters.assembly, blocks]);

    // Update filteredBooths when block or booths change
    useEffect(() => {
        if (filters.block) {
            const filteredBths = booths.filter(bth => bth.block_id?._id === filters.block);
            setFilteredBooths(filteredBths);
        } else {
            setFilteredBooths([]);
        }
    }, [filters.block, booths]);

    const fetchCasteList = async (pageIndex, pageSize, globalFilter = '', currentFilters = filters) => {
        setLoading(true);
        try {
            let query = globalFilter ? `&search=${encodeURIComponent(globalFilter)}` : '';
            Object.entries(currentFilters).forEach(([key, value]) => {
                if (value) {
                    query += `&${key}=${encodeURIComponent(value)}`;
                }
            });
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/caste-lists?page=${pageIndex + 1}&limit=${pageSize}${query}`);
            const json = await res.json();
            if (json.success) {
                setCasteList(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch caste list:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCasteList(pagination.pageIndex, pagination.pageSize, globalFilter, filters);
        fetchReferenceData();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    const handleDeleteOpen = (id) => {
        setCasteDeleteId(id);
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
            header: 'Caste',
            accessorKey: 'caste',
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
            header: 'percentage',
            accessorKey: 'percentage',
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
            header: 'Category',
            accessorKey: 'category',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.toUpperCase() || 'N/A'}
                    size="small"
                    color={
                        getValue() === 'SC' ? 'primary' :
                            getValue() === 'ST' ? 'secondary' :
                                getValue() === 'OBC' ? 'warning' :
                                    'default'
                    }
                />
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
            header: 'Booth Number',
            accessorKey: 'booth',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.booth_number || 'N/A'}
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
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedCaste(row.original); setOpenModal(true); }}>
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
        data: casteList,
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

    const fetchAllCastesForCsv = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/caste-lists?all=true`);
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all castes for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllCastesForCsv();
        setCsvData(allData.map(item => ({
            Caste: item.caste,
            Category: item.category,
            State: item.state?.name || '',
            Division: item.division?.name || '',
            Parliament: item.parliament?.name || '',
            Assembly: item.assembly?.name || '',
            Block: item.block?.name || '',
            Booth: item.booth?.name || '',
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
                        sx={{ p: 2, gap: 2 }}
                    >
                        <DebouncedInput
                            value={globalFilter}
                            onFilterChange={setGlobalFilter}
                            placeholder={`Search ${casteList.length} caste entries...`}
                        />
                        <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            justifyContent="flex-end"
                        >
                            <CSVLink
                                data={csvData}
                                filename="caste_list_all.csv"
                                style={{ display: 'none' }}
                                ref={csvLinkRef}
                            />
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
                                onClick={() => { setSelectedCaste(null); setOpenModal(true); }}
                            >
                                Add Caste Entry
                            </Button>
                        </Stack>
                    </Stack>

                    {/* Filters */}
                    <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        sx={{ p: 2, flexWrap: "wrap", gap: 2 }}
                    >
                        <FormControl sx={{ minWidth: 200 }} size="small">
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={filters.category}
                                label="Category"
                                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                            >
                                <MenuItem value="">All Categories</MenuItem>
                                {categoryOptions.map((category) => (
                                    <MenuItem key={category} value={category}>{category}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 200 }} size="small">
                            <InputLabel>State</InputLabel>
                            <Select
                                value={filters.state}
                                label="State"
                                onChange={(e) => handleStateChange(e.target.value)}
                            >
                                <MenuItem value="">All States</MenuItem>
                                {states.map((state) => (
                                    <MenuItem key={state._id} value={state._id}>{state.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 200 }} size="small" disabled={!filters.state}>
                            <InputLabel>Division</InputLabel>
                            <Select
                                value={filters.division}
                                label="Division"
                                onChange={(e) => handleDivisionChange(e.target.value)}
                            >
                                <MenuItem value="">All Divisions</MenuItem>
                                {filteredDivisions.map((division) => (
                                    <MenuItem key={division._id} value={division._id}>{division.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 200 }} size="small" disabled={!filters.division}>
                            <InputLabel>Parliament</InputLabel>
                            <Select
                                value={filters.parliament}
                                label="Parliament"
                                onChange={(e) => handleParliamentChange(e.target.value)}
                            >
                                <MenuItem value="">All Parliaments</MenuItem>
                                {filteredParliaments.map((parliament) => (
                                    <MenuItem key={parliament._id} value={parliament._id}>{parliament.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 200 }} size="small" disabled={!filters.parliament}>
                            <InputLabel>Assembly</InputLabel>
                            <Select
                                value={filters.assembly}
                                label="Assembly"
                                onChange={(e) => handleAssemblyChange(e.target.value)}
                            >
                                <MenuItem value="">All Assemblies</MenuItem>
                                {filteredAssemblies.map((assembly) => (
                                    <MenuItem key={assembly._id} value={assembly._id}>{assembly.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 200 }} size="small" disabled={!filters.assembly}>
                            <InputLabel>Block</InputLabel>
                            <Select
                                value={filters.block}
                                label="Block"
                                onChange={(e) => handleBlockChange(e.target.value)}
                            >
                                <MenuItem value="">All Blocks</MenuItem>
                                {filteredBlocks.map((block) => (
                                    <MenuItem key={block._id} value={block._id}>{block.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 200 }} size="small" disabled={!filters.block}>
                            <InputLabel>Booth</InputLabel>
                            <Select
                                value={filters.booth}
                                label="Booth"
                                onChange={(e) => setFilters(prev => ({ ...prev, booth: e.target.value }))}
                            >
                                <MenuItem value="">All Booths</MenuItem>
                                {filteredBooths.map((booth) => (
                                    <MenuItem key={booth._id} value={booth._id}>{booth.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            variant="outlined"
                            onClick={() => {
                                const defaultFilters = {
                                    category: '',
                                    state: '',
                                    division: '',
                                    parliament: '',
                                    assembly: '',
                                    block: '',
                                    booth: ''
                                };
                                setFilters(defaultFilters);
                                fetchCasteList(pagination.pageIndex, pagination.pageSize, globalFilter, defaultFilters);
                            }}
                        >
                            Clear
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                fetchCasteList(pagination.pageIndex, pagination.pageSize, globalFilter, filters);
                            }}
                        >
                            Apply
                        </Button>
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
                                                    <CasteView data={row.original} />
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

            <CasteModal
                open={openModal}
                modalToggler={setOpenModal}
                casteEntry={selectedCaste}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                refresh={() => fetchCasteList(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertCasteDelete
                id={casteDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchCasteList(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}
