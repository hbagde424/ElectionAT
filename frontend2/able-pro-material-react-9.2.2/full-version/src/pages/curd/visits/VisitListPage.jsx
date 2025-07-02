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

import VisitModal from './VisitModal';
import AlertVisitDelete from './AlertVisitDelete';
import VisitView from './VisitView';
import { Tooltip } from '@mui/material';

export default function VisitListPage() {
    const theme = useTheme();

    const [selectedVisit, setSelectedVisit] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [visitDeleteId, setVisitDeleteId] = useState('');
    const [visits, setVisits] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

    const fetchVisits = async (pageIndex, pageSize) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/visits?page=${pageIndex + 1}&limit=${pageSize}`);
            const json = await res.json();
            if (json.success) {
                setVisits(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch visits:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisits(pagination.pageIndex, pagination.pageSize);
    }, [pagination.pageIndex, pagination.pageSize]);

    const handleDeleteOpen = (id) => {
        setVisitDeleteId(id);
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
            header: 'Person',
            accessorKey: 'person_name'
        },
        {
            header: 'Post',
            accessorKey: 'post'
        },
        {
            header: 'Booth',
            accessorKey: 'booth_id.name',
            cell: ({ row }) => row.original.booth_id?.name
        },
        {
            header: 'Block',
            accessorKey: 'block_id.name',
            cell: ({ row }) => row.original.block_id?.name
        },
        {
            header: 'Assembly',
            accessorKey: 'assembly_id.name',
            cell: ({ row }) => row.original.assembly_id?.name
        },
        {
            header: 'Parliament',
            accessorKey: 'parliament_id.name',
            cell: ({ row }) => row.original.parliament_id?.name
        },
        {
            header: 'Division',
            accessorKey: 'division_id.name',
            cell: ({ row }) => row.original.division_id?.name
        },
        {
            header: 'Date',
            accessorKey: 'date',
            cell: ({ getValue }) => new Date(getValue()).toLocaleDateString()
        },
        {
            header: 'Actions',
            cell: ({ row }) => (
                <Stack direction="row" spacing={1} justifyContent="center">
                    <Tooltip title="View">
                        <IconButton color="secondary" onClick={row.getToggleExpandedHandler()}>
                            {row.getIsExpanded() ? <Add style={{ transform: 'rotate(45deg)', color: theme.palette.error.main }} /> : <Eye />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <IconButton
                            color="primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVisit(row.original);
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
            )
        }
    ], [theme]);

    const table = useReactTable({
        data: visits,
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
                <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ p: 3 }}>
                    <DebouncedInput
                        value={table.getState().globalFilter || ''}
                        onFilterChange={(value) => table.setGlobalFilter(String(value))}
                        placeholder={`Search ${visits.length} visits...`}
                    />
                    <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedVisit(null); setOpenModal(true); }}>
                        Add Visit
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
                                                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                            ))}
                                        </TableRow>
                                        {row.getIsExpanded() && (
                                            <TableRow>
                                                <TableCell colSpan={row.getVisibleCells().length}>
                                                    <VisitView data={row.original} />
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

            <VisitModal
                open={openModal}
                modalToggler={setOpenModal}
                visit={selectedVisit}
                refresh={() => fetchVisits(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertVisitDelete
                id={visitDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchVisits(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}
