// PartyListPage.jsx
import { useEffect, useMemo, useState, Fragment } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider
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

import PartyModal from './PartyModal';
import AlertPartyDelete from './AlertPartyDelete';
import PartyView from './PartyView';

export default function PartyListPage() {
    const theme = useTheme();

    const [selectedParty, setSelectedParty] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [partyDeleteId, setPartyDeleteId] = useState('');
    const [parties, setParties] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

    const fetchParties = async (pageIndex, pageSize) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/parties?page=${pageIndex + 1}&limit=${pageSize}`);
            const json = await res.json();
            if (json.success) {
                setParties(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch parties:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParties(pagination.pageIndex, pagination.pageSize);
    }, [pagination.pageIndex, pagination.pageSize]);

    const handleDeleteOpen = (id) => {
        setPartyDeleteId(id);
        setOpenDelete(true);
    };

    const handleDeleteClose = () => setOpenDelete(false);

    const columns = useMemo(() => [
        {
            header: '#',
            accessorKey: '_id',
            cell: ({ row }) => <Typography>{row.index + 1}</Typography>
        },
        {
            header: 'Party Name',
            accessorKey: 'name'
        },
        {
            header: 'Abbreviation',
            accessorKey: 'abbreviation'
        },
        {
            header: 'Symbol',
            accessorKey: 'symbol'
        },
        {
            header: 'Founded Year',
            accessorKey: 'founded_year'
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
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedParty(row.original); setOpenModal(true); }}>
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
        data: parties,
        columns,
        state: { pagination },
        pageCount,
        manualPagination: true,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getRowCanExpand: () => true
    });

    if (loading) return <EmptyReactTable />;

    return (
        <>
            <MainCard content={false}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
                    <DebouncedInput
                        value={table.getState().globalFilter || ''}
                        onFilterChange={(value) => table.setGlobalFilter(String(value))}
                        placeholder={`Search ${parties.length} parties...`}
                    />
                    <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedParty(null); setOpenModal(true); }}>
                        Add Party
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
                                                    <PartyView data={row.original} />
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

            <PartyModal
                open={openModal}
                modalToggler={setOpenModal}
                party={selectedParty}
                refresh={() => fetchParties(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertPartyDelete
                id={partyDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchParties(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}
