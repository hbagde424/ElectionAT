import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, TextField
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash } from 'iconsax-react';
import {
    getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
    useReactTable, flexRender
} from '@tanstack/react-table';
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';
import EmptyReactTable from 'pages/tables/react-table/empty';
import { CSVLink } from 'react-csv';

import { PermissionProvider } from 'contexts/PermissionContext';
import PermissionButton from 'components/PermissionButton';
import PermissionGate from 'components/PermissionGate';
import { hasOperationPermission } from 'utils/menuPermissions';

import StateModal from './StateModal';
import AlertStateDelete from './AlertStateDelete';
import StateView from './StateView';

export default function StatesListPage() {
    const theme = useTheme();

    const [selectedState, setSelectedState] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [stateDeleteId, setStateDeleteId] = useState('');
    const [states, setStates] = useState([]);
    const [users, setUsers] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/users`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const json = await res.json();
            if (json.success) setUsers(json.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const fetchStates = async (pageIndex, pageSize, searchTerm = '') => {
        setLoading(true);
        try {
            const query = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/states?page=${pageIndex + 1}&limit=${pageSize}${query}`);
            const json = await res.json();
            if (json.success) {
                setStates(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch states:', error);
        } finally {
            setLoading(false);
        }
    };

    const debouncedFetchStates = useRef(null);

    useEffect(() => {
        // Clear any existing timeout
        if (debouncedFetchStates.current) {
            clearTimeout(debouncedFetchStates.current);
        }

        // Set a new timeout
        debouncedFetchStates.current = setTimeout(() => {
            fetchStates(pagination.pageIndex, pagination.pageSize, globalFilter);
        }, 300); // Wait for 300ms after the user stops typing

        // Cleanup
        return () => {
            if (debouncedFetchStates.current) {
                clearTimeout(debouncedFetchStates.current);
            }
        };
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteOpen = (id) => {
        setStateDeleteId(id);
        setOpenDelete(true);
    };

    const handleDeleteClose = () => setOpenDelete(false);

    // CSV export functionality
    const csvLinkRef = useRef(null);
    const [csvLoading, setCsvLoading] = useState(false);

    const csvData = useMemo(() => {
        return states.map(state => ({
            Name: state.name,
            Code: state.code,
            'Total Assemblies': state.totalAssemblies || 0,
            'Total Parliaments': state.totalParliaments || 0,
            Population: state.population || 0,
            Area: state.area || 0,
            Created: new Date(state.createdAt).toLocaleDateString(),
            Updated: new Date(state.updatedAt).toLocaleDateString()
        }));
    }, [states]);

    const handleDownloadCsv = () => {
        setCsvLoading(true);
        setTimeout(() => {
            csvLinkRef.current?.link?.click();
            setCsvLoading(false);
        }, 100);
    };

    const columns = useMemo(() => [
        {
            id: 'expand',
            header: '',
            cell: ({ row }) => (
                <IconButton onClick={row.getToggleExpandedHandler()}>
                    {row.getIsExpanded() ? '-' : '+'}
                </IconButton>
            )
        },
        {
            header: 'Name',
            accessorKey: 'name',
            cell: ({ row }) => (
                <Stack>
                    <Typography variant="subtitle1">{row.original.name}</Typography>
                    <Typography variant="caption" color="secondary">{row.original.code}</Typography>
                </Stack>
            )
        },
        {
            header: 'Statistics',
            cell: ({ row }) => (
                <Stack direction="row" spacing={1}>
                    <Chip label={`${row.original.totalAssemblies || 0} Assemblies`} size="small" />
                    <Chip label={`${row.original.totalParliaments || 0} Parliaments`} size="small" color="secondary" />
                </Stack>
            )
        },
        {
            header: 'Population',
            accessorKey: 'population',
            cell: ({ getValue }) => {
                const value = getValue();
                return value ? Number(value).toLocaleString() : 'N/A';
            }
        },
        {
            header: 'Area (sq km)',
            accessorKey: 'area',
            cell: ({ getValue }) => {
                const value = getValue();
                return value ? Number(value).toLocaleString() : 'N/A';
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
                        <PermissionButton
                            icon={expandIcon}
                            requiredPermission="state_read"
                            onClick={row.getToggleExpandedHandler()}
                            color="secondary"
                            tooltipTitle={isExpanded ? "Collapse details" : "View details"}
                        />
                        <PermissionButton
                            icon={<Edit />}
                            requiredPermission="state_update"
                            onClick={(e) => { e.stopPropagation(); setSelectedState(row.original); setOpenModal(true); }}
                            color="primary"
                            tooltipTitle="Edit state"
                        />
                        <PermissionButton
                            icon={<Trash />}
                            requiredPermission="state_delete"
                            onClick={(e) => { e.stopPropagation(); handleDeleteOpen(row.original._id); }}
                            color="error"
                            tooltipTitle="Delete state"
                        />
                    </Stack>
                );
            }
        }
    ], [theme]);

    const table = useReactTable({
        data: states,
        columns,
        state: { pagination, globalFilter },
        pageCount,
        manualPagination: true,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getExpandedRowModel: () => ({})
    });

    if (loading && states.length === 0) {
        return (
            <MainCard content={false}>
                <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography>Loading...</Typography>
                </Box>
            </MainCard>
        );
    }

    return (
        <PermissionProvider>
            <MainCard content={false}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
                    <TextField
                        size="small"
                        variant="outlined"
                        placeholder={`Search ${states.length} states...`}
                        value={searchInput}
                        onChange={(e) => {
                            const v = e.target.value;
                            setSearchInput(v);
                            if (debouncedFetchStates.current) clearTimeout(debouncedFetchStates.current);
                            debouncedFetchStates.current = setTimeout(() => {
                                setGlobalFilter(String(v));
                            }, 300);
                        }}
                    />
                    <Stack direction="row" spacing={1}>
                        <PermissionGate requiredPermission="state_read">
                            <CSVLink
                                data={csvData}
                                filename="states_all.csv"
                                style={{ display: 'none' }}
                                ref={csvLinkRef}
                            />
                            <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                                {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                            </Button>
                        </PermissionGate>
                        <PermissionButton
                            variant="contained"
                            startIcon={<Add />}
                            requiredPermission="state_create"
                            onClick={() => { setSelectedState(null); setOpenModal(true); }}
                            tooltipTitle="Add new state"
                        >
                            Add State
                        </PermissionButton>
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
                                        <TableCell colSpan={columns.length}>
                                            <EmptyReactTable />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    table.getRowModel().rows.map((row) => (
                                        <Fragment key={row.id}>
                                            <TableRow>
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                            {row.getIsExpanded() && (
                                                <TableRow>
                                                    <TableCell colSpan={columns.length}>
                                                        <StateView state={row.original} users={users} />
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Fragment>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </ScrollX>

                <Divider />
                <Box sx={{ p: 2 }}>
                    <TablePagination
                        {...{
                            setPageSize: table.setPageSize,
                            setPageIndex: table.setPageIndex,
                            getState: table.getState,
                            getPageCount: table.getPageCount,
                            initialPageSize: pagination.pageSize
                        }}
                    />
                </Box>

                {/* Modals */}
                <StateModal
                    open={openModal}
                    onClose={() => setOpenModal(false)}
                    state={selectedState}
                    onSuccess={() => {
                        fetchStates(pagination.pageIndex, pagination.pageSize, globalFilter);
                        setOpenModal(false);
                    }}
                />

                <AlertStateDelete
                    id={stateDeleteId}
                    title={states.find(s => s._id === stateDeleteId)?.name || ''}
                    open={openDelete}
                    handleClose={handleDeleteClose}
                    onSuccess={() => {
                        fetchStates(pagination.pageIndex, pagination.pageSize, globalFilter);
                        handleDeleteClose();
                    }}
                />
            </MainCard>
        </PermissionProvider>
    );
}
