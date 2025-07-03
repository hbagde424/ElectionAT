// === CandidateListPage.jsx ===
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Stack, Typography, Box, Tooltip, Divider
} from '@mui/material';
import { useEffect, useMemo, useState, Fragment } from 'react';
import {
    getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
    useReactTable, flexRender
} from '@tanstack/react-table';
import IconButton from 'components/@extended/IconButton';
import { Add, Edit, Trash, Eye } from 'iconsax-react';
import DebouncedInput from 'components/third-party/react-table/DebouncedInput';
import TablePagination from 'components/third-party/react-table/TablePagination';
import ScrollX from 'components/ScrollX';
import MainCard from 'components/MainCard';
import CandidateModal from './CandidateModal';
import CandidateView from './CandidateView';
import AlertCandidateDelete from './AlertCandidateDelete';

const CandidateListPage = () => {
    const [candidates, setCandidates] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState({ open: false, id: null });

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/candidates?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}`);
            const json = await res.json();
            if (json.success) {
                setCandidates(json.data);
                setPageCount(json.pages);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCandidates();
    }, [pagination]);

    const columns = useMemo(() => [
        { header: '#', cell: ({ row }) => row.index + 1 },
        { header: 'Name', accessorKey: 'name' },
        { header: 'Party', cell: ({ row }) => row.original.party?.name },
        { header: 'Assembly', cell: ({ row }) => row.original.assembly?.name },
        { header: 'Votes', accessorKey: 'votes' },
        { header: 'Caste', accessorKey: 'caste' },
        {
            header: 'Actions',
            cell: ({ row }) => (
                <Stack direction="row" spacing={1}>
                    <Tooltip title="View">
                        <IconButton color="secondary" onClick={row.getToggleExpandedHandler()}><Eye /></IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <IconButton color="primary" onClick={() => { setEditData(row.original); setOpenModal(true); }}><Edit /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => setDeleteAlert({ open: true, id: row.original._id })}><Trash /></IconButton>
                    </Tooltip>
                </Stack>
            )
        }
    ], []);

    const table = useReactTable({
        data: candidates,
        columns,
        state: { pagination },
        pageCount,
        manualPagination: true,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getRowCanExpand: () => true
    });

    return (
        <MainCard content={false}>
            <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ p: 3 }}>
                <DebouncedInput
                    value={table.getState().globalFilter || ''}
                    onFilterChange={(value) => table.setGlobalFilter(String(value))}
                    placeholder={`Search ${candidates.length} candidates...`}
                />
                <Button variant="contained" startIcon={<Add />} onClick={() => { setEditData(null); setOpenModal(true); }}>Add Candidate</Button>
            </Stack>

            <ScrollX>
                <TableContainer>
                    <Table>
                        <TableHead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableCell key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableCell>
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
                                            <TableCell colSpan={row.getVisibleCells().length}><CandidateView data={row.original} /></TableCell>
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

            <CandidateModal open={openModal} modalToggler={setOpenModal} candidate={editData} refresh={fetchCandidates} />
            <AlertCandidateDelete open={deleteAlert.open} handleClose={() => setDeleteAlert({ open: false, id: null })} id={deleteAlert.id} refresh={fetchCandidates} />
        </MainCard>
    );
};

export default CandidateListPage;
