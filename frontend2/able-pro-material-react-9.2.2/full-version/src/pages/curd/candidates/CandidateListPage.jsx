// === CandidateListPage.jsx ===
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Stack, Typography, Box, Tooltip, Divider, Chip, Avatar
} from '@mui/material';
import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import {
    getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
    useReactTable, flexRender
} from '@tanstack/react-table';
import { CSVLink } from 'react-csv';
import IconButton from 'components/@extended/IconButton';
import { Add, Edit, Trash, Eye, User } from 'iconsax-react';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import ScrollX from 'components/ScrollX';
import MainCard from 'components/MainCard';
import EmptyReactTable from 'pages/tables/react-table/empty';
import CandidateModal from './CandidateModal';
import CandidateView from './CandidateView';
import AlertCandidateDelete from './AlertCandidateDelete';

const CandidateListPage = () => {
    const theme = useTheme();
    const [candidates, setCandidates] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState({ open: false, id: null });
    const [globalFilter, setGlobalFilter] = useState('');
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [parties, setParties] = useState([]);
    const [electionYears, setElectionYears] = useState([]);
    const [users, setUsers] = useState([]);

    // CSV functionality
    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const fetchCandidates = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            const query = globalFilter ? `&search=${encodeURIComponent(globalFilter)}` : '';
            const res = await fetch(`http://localhost:5000/api/candidates?page=${pageIndex + 1}&limit=${pageSize}${query}`);
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

    const fetchReferenceData = async () => {
        try {
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, partiesRes, electionYearsRes] = await Promise.all([
                fetch('http://localhost:5000/api/states'),
                fetch('http://localhost:5000/api/divisions'),
                fetch('http://localhost:5000/api/parliaments'),
                fetch('http://localhost:5000/api/assemblies'),
                fetch('http://localhost:5000/api/parties'),
                fetch('http://localhost:5000/api/election-years')
            ]);

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

            const [statesData, divisionsData, parliamentsData, assembliesData, partiesData, electionYearsData] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                partiesRes.json(),
                electionYearsRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (partiesData.success) setParties(partiesData.data);
            if (electionYearsData) setElectionYears(electionYearsData);
        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    useEffect(() => {
        fetchCandidates(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatNumber = (number) => {
        if (!number) return 'N/A';
        return number.toLocaleString();
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
                maxWidth: 150,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }}>
                {getValue()}
            </Typography>
        )
    },
    {
        header: 'Photo',
        accessorKey: 'photo',
        cell: ({ getValue }) => (
            getValue() ? (
                <Avatar src={getValue()} alt="Candidate" sx={{ width: 40, height: 40 }} />
            ) : (
                <Avatar sx={{ width: 40, height: 40 }}>
                    <User size={20} />
                </Avatar>
            )
        )
    },
    {
        header: 'Party',
        accessorKey: 'party_id',
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
        header: 'State',
        accessorKey: 'state_id',
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
        header: 'Election Year',
        accessorKey: 'election_year',
        cell: ({ getValue }) => (
            <Chip
                label={getValue() ? `${getValue().year}` : 'N/A'}
                color="warning"
                size="small"
                variant="outlined"
            />
        )
    },
    {
        header: 'Caste',
        accessorKey: 'caste',
        cell: ({ getValue }) => (
            <Typography sx={{
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }}>
                {getValue() || 'N/A'}
            </Typography>
        )
    },
    {
        header: 'Criminal Cases',
        accessorKey: 'criminal_cases',
        cell: ({ getValue }) => (
            <Chip
                label={getValue() || '0'}
                color={getValue() > 0 ? 'error' : 'success'}
                size="small"
            />
        )
    },
    {
        header: 'Assets',
        accessorKey: 'assets',
        cell: ({ getValue }) => (
            <Typography sx={{ fontWeight: 'medium' }}>
                ₹{formatNumber(getValue())}
            </Typography>
        )
    },
    {
        header: 'Liabilities',
        accessorKey: 'liabilities',
        cell: ({ getValue }) => (
            <Typography sx={{ fontWeight: 'medium', color: 'error.main' }}>
                ₹{formatNumber(getValue())}
            </Typography>
        )
    },
    {
        header: 'Education',
        accessorKey: 'education',
        cell: ({ getValue }) => (
            <Typography sx={{
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
            }}>
                {getValue() || 'N/A'}
            </Typography>
        )
    },
    {
        header: 'Status',
        accessorKey: 'is_active',
        cell: ({ getValue }) => (
            <Chip
                label={getValue ? 'Active' : 'Inactive'}
                color={getValue ? 'success' : 'error'}
                size="small"
            />
        )
    },
    {
        header: 'Created By',
        accessorKey: 'created_by',
        cell: ({ getValue }) => (
            <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar sx={{ width: 24, height: 24 }}>
                    <User size={16} />
                </Avatar>
                <Typography>{getValue()?.username || 'Unknown'}</Typography>
            </Stack>
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
            const expandIcon = isExpanded
                ? <Add style={{ transform: 'rotate(45deg)', color: theme.palette.error.main }} />
                : <Eye />;
            return (
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                    <Tooltip title="View">
                        <IconButton color="secondary" onClick={row.getToggleExpandedHandler()}>
                            {expandIcon}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                        <IconButton color="primary" onClick={(e) => {
                            e.stopPropagation();
                            setEditData(row.original);
                            setOpenModal(true);
                        }}>
                            <Edit />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton color="error" onClick={(e) => {
                            e.stopPropagation();
                            setDeleteAlert({ open: true, id: row.original._id });
                        }}>
                            <Trash />
                        </IconButton>
                    </Tooltip>
                </Stack>
            );
        }
    }
], [theme]);


    const table = useReactTable({
        data: candidates,
        columns,
        state: { pagination, globalFilter },
        pageCount,
        manualPagination: true,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getRowCanExpand: () => true
    });

    // Helper to fetch all candidates for CSV
    const fetchAllCandidatesForCsv = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/candidates?all=true');
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all candidates for CSV:', error);
        }
        return [];
    };

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllCandidatesForCsv();
        setCsvData(allData.map(item => ({
            Name: item.name,
            Party: item.party_id?.name || '',
            State: item.state_id?.name || '',
            Assembly: item.assembly_id?.name || '',
            Parliament: item.parliament_id?.name || '',
            'Election Year': item.election_year ? `${item.election_year.year}` : '',
            Caste: item.caste || '',
            Votes: item.votes || 0,
            'Criminal Cases': item.criminal_cases || 0,
            Assets: item.assets || 0,
            Liabilities: item.liabilities || 0,
            Education: item.education || '',
            Status: item.is_active ? 'Active' : 'Inactive',
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
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
                    <DebouncedInput
                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={`Search ${candidates.length} candidates...`}
                    />
                    <Stack direction="row" spacing={1}>
                        <CSVLink
                            data={csvData}
                            filename="candidates_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
                        <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                            {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditData(null); setOpenModal(true); }}>
                            Add Candidate
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
                                                    <CandidateView data={row.original} />
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

            <CandidateModal
                open={openModal}
                modalToggler={setOpenModal}
                candidate={editData}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                parties={parties}
                electionYears={electionYears}
                users={users}
                refresh={() => fetchCandidates(pagination.pageIndex, pagination.pageSize)}
            />
            <AlertCandidateDelete
                open={deleteAlert.open}
                handleClose={() => setDeleteAlert({ open: false, id: null })}
                id={deleteAlert.id}
                refresh={() => fetchCandidates(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
};

export default CandidateListPage;
