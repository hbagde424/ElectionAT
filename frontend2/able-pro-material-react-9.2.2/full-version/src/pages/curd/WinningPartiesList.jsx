import { useEffect, useMemo, useState, Fragment } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Tooltip
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

import WinningPartyModal from 'pages/curd/winning-parties/WinningPartyModal';
import AlertWinningPartyDelete from 'pages/curd/winning-parties/AlertWinningPartyDelete';
import WinningPartyView from 'pages/curd/winning-parties/WinningPartyView';

export default function WinningPartyListPage() {
    const theme = useTheme();
    const [selectedParty, setSelectedParty] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [deleteId, setDeleteId] = useState('');
    const [winningParties, setWinningParties] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

    const fetchWinningParties = async (pageIndex, pageSize) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/winning-parties?page=${pageIndex + 1}&limit=${pageSize}`);
            const json = await res.json();
            if (json.success) {
                setWinningParties(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch winning parties:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWinningParties(pagination.pageIndex, pagination.pageSize);
    }, [pagination.pageIndex, pagination.pageSize]);

    const handleDeleteOpen = (id) => {
        setDeleteId(id);
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
            header: 'Candidate',
            accessorKey: 'candidate_id.name',
            cell: ({ row }) => row.original.candidate_id?.name || row.original.candidate_id
        },
        {
            header: 'Assembly',
            accessorKey: 'assembly_id.name',
            cell: ({ row }) => row.original.assembly_id?.name || row.original.assembly_id
        },
        {
            header: 'Parliament',
            accessorKey: 'parliament_id.name',
            cell: ({ row }) => row.original.parliament_id?.name || row.original.parliament_id
        },
        {
            header: 'Party',
            accessorKey: 'party_id.name',
            cell: ({ row }) => row.original.party_id?.name || row.original.party_id
        },
        {
            header: 'Year',
            accessorKey: 'year_id.name',
            cell: ({ row }) => row.original.year_id?.name || row.original.year_id
        },
        {
            header: 'Votes',
            accessorKey: 'votes'
        },
        {
            header: 'Margin',
            accessorKey: 'margin'
        },
        {
            header: 'Actions',
            meta: { className: 'cell-center' },
            cell: ({ row }) => {
                const isExpanded = row.getIsExpanded();
                const expandIcon = isExpanded ? <Add style={{ transform: 'rotate(45deg)', color: theme.palette.error.main }} /> : <Eye />;
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <Tooltip title="View">
                            <IconButton color="secondary" onClick={row.getToggleExpandedHandler()}>
                                {expandIcon}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton
                                color="primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedParty(row.original);
                                    setOpenModal(true);
                                }}
                            >
                                <Edit />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton
                                color="error"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteOpen(row.original._id);
                                }}
                            >
                                <Trash />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                );
            }
        }
    ], [theme]);

    const table = useReactTable({
        data: winningParties,
        columns,
        state: {
            pagination
        },
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
                <Box sx={{ p: 3 }}>
                    <Typography variant="h4" gutterBottom>
                        Winning Party
                    </Typography>
                </Box>

                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ px: 3, pb: 2 }}>
                    <DebouncedInput
                        value={table.getState().globalFilter || ''}
                        onFilterChange={(value) => table.setGlobalFilter(String(value))}
                        placeholder={`Search ${winningParties.length} winning parties...`}
                    />
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setSelectedParty(null);
                            setOpenModal(true);
                        }}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        Add Winning Party
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
                                                    <WinningPartyView data={row.original} />
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

            <WinningPartyModal
                open={openModal}
                modalToggler={setOpenModal}
                party={selectedParty}
                refresh={fetchWinningParties}
            />

            <AlertWinningPartyDelete
                id={deleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={fetchWinningParties}
            />
        </>
    );
}
