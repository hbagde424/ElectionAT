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
import { Add, Edit, Trash, Eye } from 'iconsax-react';
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

    // CSV functionality
    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const fetchCandidates = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            let actualPageIndex = pageIndex;
            let actualPageSize = pageSize;
            // When searching, fetch all results on one page
            if (globalFilter) {
                actualPageIndex = 0;
                actualPageSize = 10000; // Large enough to get all results
            }
            const query = globalFilter ? `&search=${encodeURIComponent(globalFilter)}` : '';
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/candidates?page=${actualPageIndex + 1}&limit=${actualPageSize}${query}`);
            const json = await res.json();
            if (json.success) {
                setCandidates(json.data);
                if (globalFilter) {
                    setPageCount(1);
                    setPagination({ pageIndex: 0, pageSize: 10000 });
                } else {
                    setPageCount(json.pages);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchReferenceData = async () => {
        try {
            const [
                statesRes, divisionsRes, parliamentsRes,
                assembliesRes, partiesRes, electionYearsRes
            ] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parties`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/election-years`)
            ]);

            const [
                statesData, divisionsData, parliamentsData,
                assembliesData, partiesData, electionYearsData
            ] = await Promise.all([
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

    const formatNumber = (number) => {
        if (!number) return 'N/A';
        return number.toLocaleString();
    };

    const columns = useMemo(() => [
        {
            header: '#',
            accessorKey: '_id',
               cell: ({ row, table }) => {
                    const { pageIndex, pageSize } = table.getState().pagination;
                    const serialNumber = pageIndex * pageSize + row.index + 1;
                    return <Typography>{serialNumber}</Typography>;
                }
        },
        {
            header: 'Photo',
            accessorKey: 'photo',
            cell: ({ getValue }) => {
                const photoPath = getValue();
                let photoUrl = '/default-avatar.png';
                if (photoPath) {
                    photoUrl = photoPath;
                }
                return (
                    <Avatar
                        src={photoUrl}
                        alt="Candidate"
                        sx={{
                            width: 40,
                            height: 40,
                            '&:hover': {
                                cursor: 'pointer',
                                transform: 'scale(1.5)',
                                transition: 'transform 0.3s ease-in-out',
                                zIndex: 1
                            }
                        }}
                        onError={(e) => {
                            e.target.src = '/default-avatar.png';
                        }}
                    />
                );
            }
        },
        {
            header: 'Name',
            accessorKey: 'name',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Description',
            accessorKey: 'description',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 250,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontStyle: 'italic',
                    color: 'text.secondary'
                }}>
                    {/* Strip HTML tags for table preview */}
                    {getValue() ? getValue().replace(/<[^>]+>/g, '').slice(0, 100) : ''}
                </Typography>
            )
        },
        {
            header: 'Caste',
            accessorKey: 'caste',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 'N/A'}
                    size="small"
                />
            )
        },
        {
            header: 'Criminal Cases',
            accessorKey: 'criminal_cases',
            cell: ({ getValue }) => (
                <Typography color={getValue() > 0 ? 'error.main' : 'success.main'}>
                    {getValue() || 0}
                </Typography>
            )
        },
        {
            header: 'Status',
            accessorKey: 'is_active',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() ? 'Active' : 'Inactive'}
                    color={getValue() ? 'success' : 'error'}
                    size="small"
                />
            )
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
        manualPagination: !globalFilter,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getRowCanExpand: () => true
    });

    const fetchAllCandidatesForCsv = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/candidates?all=true`);
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
            'Name': item.name || '',
            'Description': item.description ? item.description.replace(/<[^>]+>/g, '') : '',
            'Party': item.party_id?.name || '',
            'State': item.state_id?.name || '',
            'Assembly': item.assembly_id?.name || '',
            'Parliament': item.parliament_id?.name || '',
            'Caste': item.caste || '',
            'Criminal Cases': item.criminal_cases || 0,
            'Education': item.education || '',
            'Assets': item.assets || '',
            'Liabilities': item.liabilities || '',
            'Election Year': item.election_year?.year || '',
            'Status': item.is_active ? 'Active' : 'Inactive',
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
                        placeholder={`Search ${candidates.length} records...`}
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
