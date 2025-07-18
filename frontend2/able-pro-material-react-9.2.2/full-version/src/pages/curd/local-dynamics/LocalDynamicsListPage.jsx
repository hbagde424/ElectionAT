// LocalDynamicsListPage.jsx
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

import LocalDynamicsModal from './LocalDynamicsModal';
import AlertLocalDynamicsDelete from './AlertLocalDynamicsDelete';
import LocalDynamicsView from './LocalDynamicsView';

export default function LocalDynamicsListPage() {
    const theme = useTheme();

    const [selectedLocalDynamics, setSelectedLocalDynamics] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [localDynamicsDeleteId, setLocalDynamicsDeleteId] = useState('');
    const [localDynamics, setLocalDynamics] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

    const fetchLocalDynamics = async (pageIndex, pageSize) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/local-dynamics?page=${pageIndex + 1}&limit=${pageSize}`);
            const json = await res.json();
            if (json.success) {
                setLocalDynamics(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch local dynamics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocalDynamics(pagination.pageIndex, pagination.pageSize);
    }, [pagination.pageIndex, pagination.pageSize]);

    const handleDeleteOpen = (id) => {
        setLocalDynamicsDeleteId(id);
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
            header: 'Booth ID',
            accessorKey: 'booth_id'
        },
        {
            header: 'Dominant Caste',
            accessorKey: 'dominant_caste'
        },
        {
            header: 'Local Leader',
            accessorKey: 'local_leader'
        },
        {
            header: 'Known Issues',
            accessorKey: 'known_issues',
            cell: ({ getValue }) => {
                const value = getValue();
                return (
                    <Typography sx={{ 
                        maxWidth: 200, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                    }}>
                        {value}
                    </Typography>
                );
            }
        },
        {
            header: 'Grassroots Organizations',
            accessorKey: 'grassroots_orgs',
            cell: ({ getValue }) => {
                const value = getValue();
                return (
                    <Typography sx={{ 
                        maxWidth: 200, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                    }}>
                        {value}
                    </Typography>
                );
            }
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
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedLocalDynamics(row.original); setOpenModal(true); }}>
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
        data: localDynamics,
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
                        placeholder={`Search ${localDynamics.length} local dynamics...`}
                    />
                    <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedLocalDynamics(null); setOpenModal(true); }}>
                        Add Local Dynamics
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
                                                    <LocalDynamicsView data={row.original} />
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

            <LocalDynamicsModal
                open={openModal}
                modalToggler={setOpenModal}
                localDynamics={selectedLocalDynamics}
                refresh={() => fetchLocalDynamics(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertLocalDynamicsDelete
                id={localDynamicsDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchLocalDynamics(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}
