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
    const [users, setUsers] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');

    const fetchReferenceData = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const usersRes = await fetch('http://localhost:5000/api/users', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const usersData = await usersRes.json();
            if (usersData.success) setUsers(usersData.data);
        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    const fetchParties = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            const query = globalFilter ? `&search=${encodeURIComponent(globalFilter)}` : '';
            const res = await fetch(`http://localhost:5000/api/parties?page=${pageIndex + 1}&limit=${pageSize}${query}`);
            const json = await res.json();
            if (json.success) {
                // Map parties with user details
                const partiesWithUsers = json.data.map(party => {
                    const createdByUser = users.find(user => user._id === party.created_by);
                    const updatedByUser = party.updated_by ? users.find(user => user._id === party.updated_by) : null;
                    
                    return {
                        ...party,
                        created_by: createdByUser || { username: 'N/A' },
                        updated_by: updatedByUser || null
                    };
                });
                
                setParties(partiesWithUsers);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch parties:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReferenceData();
    }, []);

    useEffect(() => {
        if (users.length > 0) {
            fetchParties(pagination.pageIndex, pagination.pageSize, globalFilter);
        }
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, users]);

    const handleDeleteOpen = (id) => {
        setPartyDeleteId(id);
        setOpenDelete(true);
    };

    const handleDeleteClose = () => setOpenDelete(false);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const columns = useMemo(() => [
        {
            header: '#',
            accessorKey: '_id',
            cell: ({ row }) => <Typography>{row.index + 1}</Typography>
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
            header: 'Abbreviation',
            accessorKey: 'abbreviation',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 'N/A'}
                    size="small"
                    variant="outlined"
                    sx={{ textTransform: 'uppercase' }}
                />
            )
        },
        {
            header: 'Symbol',
            accessorKey: 'symbol',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Founded Year',
            accessorKey: 'founded_year',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Created By',
            accessorKey: 'created_by',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue()?.username || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Updated By',
            accessorKey: 'updated_by',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue()?.username || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Created At',
            accessorKey: 'created_at',
            cell: ({ getValue }) => (
                <Typography sx={{ minWidth: 150 }}>
                    {formatDate(getValue())}
                </Typography>
            )
        },
        {
            header: 'Updated At',
            accessorKey: 'updated_at',
            cell: ({ getValue }) => (
                <Typography sx={{ minWidth: 150 }}>
                    {formatDate(getValue())}
                </Typography>
            )
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

    const fetchAllPartiesForCsv = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/parties?all=true');
            const json = await res.json();
            if (json.success) {
                return json.data.map(party => {
                    const createdByUser = users.find(user => user._id === party.created_by);
                    const updatedByUser = party.updated_by ? users.find(user => user._id === party.updated_by) : null;
                    
                    return {
                        ...party,
                        created_by: createdByUser || { username: 'N/A' },
                        updated_by: updatedByUser || null
                    };
                });
            }
        } catch (error) {
            console.error('Failed to fetch all parties for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllPartiesForCsv();
        setCsvData(allData.map(item => ({
            Name: item.name,
            Abbreviation: item.abbreviation,
            Symbol: item.symbol || '',
            'Founded Year': item.founded_year || '',
            'Created By': item.created_by?.username || 'N/A',
            'Updated By': item.updated_by?.username || 'N/A',
            'Created At': formatDate(item.created_at),
            'Updated At': formatDate(item.updated_at)
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
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
                    <DebouncedInput
                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={`Search ${parties.length} parties...`}
                    />
                    <Stack direction="row" spacing={1}>
                        <CSVLink
                            data={csvData}
                            filename="parties_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
                        <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                            {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedParty(null); setOpenModal(true); }}>
                            Add Party
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
                                                sx={{ 
                                                    cursor: header.column.getCanSort() ? 'pointer' : 'default',
                                                    minWidth: header.column.columnDef.minWidth
                                                }}
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
                users={users}
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