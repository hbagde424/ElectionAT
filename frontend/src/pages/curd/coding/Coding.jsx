// codingListPage.js
import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip
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
        setFilters(prev => ({ ...prev, [field]: value }));
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
    };

    const [columnFilters, setColumnFilters] = useState([]);

    const fetchReferenceData = async () => {
        try {
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes] = await Promise.all([
                fetch('http://localhost:5000/api/states'),
                fetch('http://localhost:5000/api/divisions'),
                fetch('http://localhost:5000/api/parliaments'),
                fetch('http://localhost:5000/api/assemblies'),
                fetch('http://localhost:5000/api/blocks'),
                fetch('http://localhost:5000/api/booths')
            ]);

            const [statesData, divisionsData, parliamentsData, assembliesData, blocksData, boothsData] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                boothsRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (blocksData.success) setBlocks(blocksData.data);
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
                    query += `&${filter.id}=${encodeURIComponent(filter.value)}`;
                }
            });

            const res = await fetch(`http://localhost:5000/api/codings?page=${pageIndex + 1}&limit=${pageSize}${query}`);
            const json = await res.json();
            if (json.success) {
                setCodingList(json.data);
                setPageCount(json.pages);
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
            cell: ({ row }) => <Typography>{row.index + 1}</Typography>,
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
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getRowCanExpand: () => true
    });

    const fetchAllCodingsForCsv = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/codings?all=true');
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

    if (loading) return <EmptyReactTable />;

    return (
        <>
            <MainCard content={false}>
                <Box sx={{ p: 3 }}>
                    <Stack spacing={2}>
                        {/* Top Actions */}
                        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                            <DebouncedInput
                                value={globalFilter}
                                onFilterChange={setGlobalFilter}
                                placeholder={`Search ${codingList.length} coding entries...`}
                            />
                            <Stack direction="row" spacing={1}>
                                <CSVLink
                                    data={csvData}
                                    filename="coding_list_all.csv"
                                    style={{ display: 'none' }}
                                    ref={csvLinkRef}
                                />
                                <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                                    {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                                </Button>
                                <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedCoding(null); setOpenModal(true); }}>
                                    Add Coding Entry
                                </Button>
                            </Stack>
                        </Stack>

                        {/* Filters */}
                        <MainCard content={false} sx={{ p: 2 }}>
                            <Stack spacing={2}>
                                <Typography variant="h5">Filters</Typography>
                                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
                                    <Box sx={{ minWidth: 200 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>State</Typography>
                                        <select
                                            value={filters.state}
                                            onChange={(e) => handleFilterChange('state', e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                border: '1px solid #ddd'
                                            }}
                                        >
                                            <option value="">All States</option>
                                            {states.map((state) => (
                                                <option key={state._id} value={state._id}>{state.name}</option>
                                            ))}
                                        </select>
                                    </Box>
                                    <Box sx={{ minWidth: 200 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Division</Typography>
                                        <select
                                            value={filters.division}
                                            onChange={(e) => handleFilterChange('division', e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                border: '1px solid #ddd'
                                            }}
                                        >
                                            <option value="">All Divisions</option>
                                            {divisions.map((division) => (
                                                <option key={division._id} value={division._id}>{division.name}</option>
                                            ))}
                                        </select>
                                    </Box>
                                    <Box sx={{ minWidth: 200 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Parliament</Typography>
                                        <select
                                            value={filters.parliament}
                                            onChange={(e) => handleFilterChange('parliament', e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                border: '1px solid #ddd'
                                            }}
                                        >
                                            <option value="">All Parliaments</option>
                                            {parliaments.map((parliament) => (
                                                <option key={parliament._id} value={parliament._id}>{parliament.name}</option>
                                            ))}
                                        </select>
                                    </Box>
                                    <Box sx={{ minWidth: 200 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Assembly</Typography>
                                        <select
                                            value={filters.assembly}
                                            onChange={(e) => handleFilterChange('assembly', e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                border: '1px solid #ddd'
                                            }}
                                        >
                                            <option value="">All Assemblies</option>
                                            {assemblies.map((assembly) => (
                                                <option key={assembly._id} value={assembly._id}>{assembly.name}</option>
                                            ))}
                                        </select>
                                    </Box>
                                    <Box sx={{ minWidth: 200 }}>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Block</Typography>
                                        <select
                                            value={filters.block}
                                            onChange={(e) => handleFilterChange('block', e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                border: '1px solid #ddd'
                                            }}
                                        >
                                            <option value="">All Blocks</option>
                                            {blocks.map((block) => (
                                                <option key={block._id} value={block._id}>{block.name}</option>
                                            ))}
                                        </select>
                                    </Box>
                                </Stack>
                                <Stack direction="row" spacing={2} justifyContent="flex-end">
                                    <Button variant="outlined" onClick={handleClearFilters}>
                                        Clear Filters
                                    </Button>
                                    <Button variant="contained" onClick={handleApplyFilters}>
                                        Apply Filters
                                    </Button>
                                </Stack>
                            </Stack>
                        </MainCard>
                    </Stack>
                </Box>

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
                                                    <CodingView data={row.original} />
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