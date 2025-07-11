// PartyActivitiesListPage.jsx
import { useEffect, useMemo, useState, Fragment } from 'react';
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

import PartyActivitiesModal from './PartyActivitiesModal';
import AlertPartyActivitiesDelete from './AlertPartyActivitiesDelete';
import PartyActivitiesView from './PartyActivitiesView';

export default function PartyActivitiesListPage() {
    const theme = useTheme();

    const [selectedPartyActivity, setSelectedPartyActivity] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [partyActivityDeleteId, setPartyActivityDeleteId] = useState('');
    const [partyActivities, setPartyActivities] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [parties, setParties] = useState([]);
    const [users, setUsers] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');

    const fetchReferenceData = async () => {
        try {
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes, partiesRes] = await Promise.all([
                fetch('http://localhost:5000/api/states'),
                fetch('http://localhost:5000/api/divisions'),
                fetch('http://localhost:5000/api/parliaments'),
                fetch('http://localhost:5000/api/assemblies'),
                fetch('http://localhost:5000/api/blocks'),
                fetch('http://localhost:5000/api/booths'),
                fetch('http://localhost:5000/api/parties')
            ]);

            console.log('partiesRes', partiesRes);

            const token = localStorage.getItem('serviceToken');

            const [usersRes] = await Promise.all([
                fetch('http://localhost:5000/api/users', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            ]);

            const usersData = await usersRes.json();
            if (usersData.success) setUsers(usersData.data);

            const [statesData, divisionsData, parliamentsData, assembliesData, blocksData, boothsData, partiesData] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                boothsRes.json(),
                partiesRes.json()
            ]);


            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (blocksData.success) setBlocks(blocksData.data);
            if (boothsData.success) setBooths(boothsData.data);
            if (partiesData.success) setParties(partiesData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };



    const fetchPartyActivities = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            const query = globalFilter ? `&search=${encodeURIComponent(globalFilter)}` : '';
            const res = await fetch(`http://localhost:5000/api/party-activities?page=${pageIndex + 1}&limit=${pageSize}${query}`);
            const json = await res.json();
            if (json.success) {
                setPartyActivities(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch party activities:', error);
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchPartyActivities(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    const handleDeleteOpen = (id) => {
        setPartyActivityDeleteId(id);
        setOpenDelete(true);
    };

    const handleDeleteClose = () => setOpenDelete(false);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'scheduled':
                return 'info';
            case 'ongoing':
                return 'warning';
            case 'completed':
                return 'success';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

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
            cell: ({ row }) => <Typography>{row.index + 1}</Typography>
        },
        {
            header: 'Title',
            accessorKey: 'title',
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
            header: 'Activity Type',
            accessorKey: 'activity_type',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.toUpperCase() || 'N/A'}
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
            header: 'Block',
            accessorKey: 'block_id',
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
            header: 'Booth',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() ? `${getValue().name} (${getValue().booth_number})` : 'N/A'}
                    color="success"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Description',
            accessorKey: 'description',
            cell: ({ getValue }) => (
                <Typography sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Activity Date',
            accessorKey: 'activity_date',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'End Date',
            accessorKey: 'end_date',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'Location',
            accessorKey: 'location',
            cell: ({ getValue }) => <Typography>{getValue() || 'N/A'}</Typography>
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.toUpperCase() || 'N/A'}
                    color={getStatusColor(getValue())}
                    size="small"
                />
            )
        },
        {
            header: 'Attendance',
            accessorKey: 'attendance_count',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() ? getValue().toLocaleString() : 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Media Coverage',
            accessorKey: 'media_coverage',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() ? 'Yes' : 'No'}
                    color={getValue() ? 'success' : 'default'}
                    size="small"
                />
            )
        },
        {
            header: 'Media Links',
            accessorKey: 'media_links',
            cell: ({ getValue }) => (
                Array.isArray(getValue()) && getValue().length > 0
                    ? getValue().map((link, idx) => (
                        <img key={idx} src={link} alt={`media-link-${idx}`} style={{ maxWidth: '100px', display: 'block', marginBottom: '4px' }} />
                    ))
                    : 'N/A'
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
            cell: ({ getValue }) => {
                const value = getValue();
                if (!value) return <Typography>N/A</Typography>;
                const date = new Date(value);
                const formatted = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                return <Typography>{formatted}</Typography>;
            }
        },
        {
            header: 'Updated At',
            accessorKey: 'updated_at',
            cell: ({ getValue }) => {
                const value = getValue();
                if (!value) return <Typography>N/A</Typography>;
                const date = new Date(value);
                const formatted = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                return <Typography>{formatted}</Typography>;
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
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedPartyActivity(row.original); setOpenModal(true); }}>
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
        data: partyActivities,
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

    if (loading) return <EmptyReactTable />;

    return (
        <>
            <MainCard content={false}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
                    <DebouncedInput
                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={`Search ${partyActivities.length} party activities...`}
                    />
                    <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedPartyActivity(null); setOpenModal(true); }}>
                        Add Party Activity
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
                                                    <PartyActivitiesView data={row.original} />
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

            <PartyActivitiesModal
                open={openModal}
                modalToggler={setOpenModal}
                partyActivity={selectedPartyActivity}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                parties={parties}
                users={users}
                refresh={() => fetchPartyActivities(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertPartyActivitiesDelete
                id={partyActivityDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchPartyActivities(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}
