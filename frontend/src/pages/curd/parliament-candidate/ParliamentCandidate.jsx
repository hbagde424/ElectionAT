import { useMemo, useState, useEffect, useRef, Fragment } from 'react';

// material-ui
import {
    Box,
    Button,
    Chip,
    Dialog,
    Divider,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    useTheme,
    CircularProgress,
    Paper
} from '@mui/material';

// third-party
import { 
    getCoreRowModel, 
    useReactTable, 
    getFilteredRowModel, 
    getPaginationRowModel, 
    getSortedRowModel,
    flexRender 
} from '@tanstack/react-table';
import { CSVLink } from 'react-csv';

// project-imports
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { PopupTransition } from 'components/@extended/Transitions';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';

// assets
import { Add, Edit, Eye, Trash, DocumentDownload } from 'iconsax-react';

// local imports
import ParliamentCandidateModal from './ParliamentCandidateModal';
import ParliamentCandidateView from './ParliamentCandidateView';
import AlertParliamentCandidateDelete from './AlertParliamentCandidateDelete';

export default function ParliamentCandidateListPage() {
    const theme = useTheme();

    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [candidateDeleteId, setCandidateDeleteId] = useState('');
    const [candidates, setCandidates] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');

    const fetchCandidates = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            const token = localStorage.getItem('serviceToken');
            const response = await fetch(
                `${import.meta.env.VITE_APP_API_URL}/parliament-candidates?page=${pageIndex + 1}&limit=${pageSize}&search=${globalFilter}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            const result = await response.json();
            if (result.success) {
                setCandidates(result.data);
                setPageCount(Math.ceil(result.total / pageSize));
            }
        } catch (error) {
            console.error('Error fetching candidates:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCandidates(pagination.pageIndex, pagination.pageSize, globalFilter);
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    const handleDeleteOpen = (id) => {
        setCandidateDeleteId(id);
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
            minute: '2-digit'
        });
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        return num.toLocaleString();
    };

    // Robust getter for margin percentage (decimal fraction).
    // Uses available fields if present, otherwise computes from margin/total.
    const getMarginPercentDecimal = (item) => {
        if (!item) return 0;
        // Try common keys or fallbacks
        const possible = [
            item.margin_percentage,
            item.marginPercentage,
            item.margin_percent,
            item['Margin %'],
            item['margin_percentage']
        ];

        for (const v of possible) {
            if (v !== undefined && v !== null && v !== '') {
                const num = Number(v);
                if (!isNaN(num)) return num;
            }
        }

        // Fallback: compute from margin and total
        const margin = Number(item.margin) || 0;
        const total = Number(item.total_votes_parliament) || 0;
        if (total > 0) return Math.abs(margin) / total;
        return 0;
    };

    const getResultChipColor = (result) => {
        switch (result?.toLowerCase()) {
            case 'win':
                return 'success';
            case 'loss':
                return 'error';
            default:
                return 'default';
        }
    };

    const columns = useMemo(() => [
        {
            id: 'serial',
            header: '#',
            cell: ({ row, table }) => {
                const pageIndex = table.getState().pagination.pageIndex;
                const pageSize = table.getState().pagination.pageSize;
                return pageIndex * pageSize + row.index + 1;
            },
            meta: { className: 'cell-center' }
        },
        {
            id: 'candidate_name',
            header: 'Candidate',
            accessorKey: 'candidate_id.name',
            cell: ({ getValue }) => (
                <Typography sx={{
                    fontWeight: 500,
                    color: 'primary.main'
                }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            id: 'parliament_name', 
            header: 'Parliament',
            accessorKey: 'parliament_id.name',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            id: 'election_year',
            header: 'Election Year',
            accessorKey: 'election_year_id.year',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            id: 'party_name',
            header: 'Party',
            accessorKey: 'party_id.name',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: 500
                }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            id: 'position_result',
            header: 'Result',
            accessorKey: 'position_result',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.toUpperCase() || 'N/A'}
                    color={getResultChipColor(getValue())}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            id: 'candidate_votes',
            header: 'Candidate Votes',
            accessorKey: 'candidate_votes',
            cell: ({ getValue }) => (
                <Typography sx={{ fontWeight: 500 }}>
                    {formatNumber(getValue())}
                </Typography>
            )
        },
        {
            id: 'total_votes',
            header: 'Total Votes',
            accessorKey: 'total_votes_parliament',
            cell: ({ getValue }) => (
                <Typography>
                    {formatNumber(getValue())}
                </Typography>
            )
        },
        {
            id: 'electors',
            header: 'Electors',
            accessorKey: 'electors',
            cell: ({ getValue }) => (
                <Typography>
                    {formatNumber(getValue())}
                </Typography>
            )
        },
        {
            id: 'turnout',
            header: 'Turnout',
            accessorKey: 'turnout',
            cell: ({ getValue }) => (
                <Typography>
                    {formatNumber(getValue())}
                </Typography>
            )
        },
        {
            id: 'total_votes_polled',
            header: 'Total Polled',
            accessorKey: 'total_votes_polled',
            cell: ({ getValue }) => (
                <Typography>
                    {formatNumber(getValue())}
                </Typography>
            )
        },
        {
            id: 'valid_votes',
            header: 'Valid Votes',
            accessorKey: 'valid_votes',
            cell: ({ getValue }) => (
                <Typography>
                    {formatNumber(getValue())}
                </Typography>
            )
        },
        {
            id: 'nota_votes',
            header: 'NOTA Votes',
            accessorKey: 'nota_votes',
            cell: ({ getValue }) => (
                <Typography>
                    {formatNumber(getValue())}
                </Typography>
            )
        },
        {
            id: 'vote_percentage',
            header: 'Vote %',
            accessorKey: 'vote_percentage',
            cell: ({ getValue }) => (
                <Typography sx={{ 
                    fontWeight: 500,
                    color: 'success.main'
                }}>
                    {getValue() ? `${getValue()}%` : '0%'}
                </Typography>
            )
        },
        {
            id: 'margin_percentage',
            header: 'Margin %',
            accessorKey: 'margin_percentage',
            cell: ({ getValue, row }) => (
                <Typography sx={{
                    fontWeight: 500,
                    color: row.original.margin >= 0 ? 'success.main' : 'error.main'
                }}>
                    {`${(getMarginPercentDecimal(row.original) * 100).toFixed(2)}%`}
                </Typography>
            )
        },
        {
            id: 'margin',
            header: 'Margin',
            accessorKey: 'margin',
            cell: ({ getValue, row }) => (
                <Typography sx={{
                    fontWeight: 500,
                    color: row.original.position_result === 'win' ? 'success.main' : 'error.main'
                }}>
                    {getValue() > 0 ? '+' : ''}{formatNumber(getValue())}
                </Typography>
            )
        },
        {
            id: 'created_by',
            header: 'Created By',
            accessorKey: 'created_by.username',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            id: 'created_at',
            header: 'Created At',
            accessorKey: 'created_at',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={0}>
                        <Tooltip title="View">
                            <IconButton
                                color="secondary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCandidate(row.original);
                                }}
                            >
                                <Eye />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton
                                color="primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCandidate(row.original);
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
            },
            meta: { className: 'cell-center' }
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
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel()
    });

    const fetchAllCandidatesForCsv = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliament-candidates?all=true`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error fetching all candidates:', error);
            return [];
        }
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllCandidatesForCsv();
        const csvFormattedData = allData.map((item, index) => ({
            'Sr. No.': index + 1,
            'Candidate': item.candidate_id?.name || 'N/A',
            'Parliament': item.parliament_id?.name || 'N/A',
            'Election Year': item.election_year_id?.year || 'N/A',
            'Party': item.party_id?.name || 'N/A',
            'Result': item.position_result?.toUpperCase() || 'N/A',
            'Candidate Votes': formatNumber(item.candidate_votes),
            'Total Votes': formatNumber(item.total_votes_parliament),
                'Vote Percentage': item.vote_percentage ? `${item.vote_percentage}%` : '0%',
                'Margin': formatNumber(item.margin),
                'Margin %': `${(getMarginPercentDecimal(item) * 100).toFixed(2)}%`,
                'Electors': formatNumber(item.electors),
                'Turnout': formatNumber(item.turnout),
                'Male Electors': formatNumber(item.male_electors),
                'Female Electors': formatNumber(item.female_electors),
                'Total Votes Polled': formatNumber(item.total_votes_polled),
                'Valid Votes': formatNumber(item.valid_votes),
                'Total Male Voters': formatNumber(item.total_male_voters),
                'Female Voters': formatNumber(item.female_voters),
                'NOTA Votes': formatNumber(item.nota_votes),
            'Created By': item.created_by?.username || 'N/A',
            'Created At': formatDate(item.created_at)
        }));
        setCsvData(csvFormattedData);
        setCsvLoading(false);
        
        // Trigger download
        setTimeout(() => {
            csvLinkRef.current?.link.click();
        }, 100);
    };

    if (loading) return <CircularProgress />;

    return (
        <>
            <MainCard content={false}>
                <ScrollX>
                    <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ padding: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Typography variant="h5">Parliament Candidates</Typography>
                            <DebouncedInput
                                value={globalFilter ?? ''}
                                onChange={(value) => setGlobalFilter(String(value))}
                                placeholder="Search candidates..."
                                size="small"
                                sx={{ width: 300 }}
                            />
                        </Stack>
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="outlined"
                                startIcon={csvLoading ? <CircularProgress size={18} /> : <DocumentDownload />}
                                onClick={handleDownloadCsv}
                                disabled={csvLoading}
                            >
                                {csvLoading ? 'Preparing...' : 'Export CSV'}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => {
                                    setSelectedCandidate(null);
                                    setOpenModal(true);
                                }}
                            >
                                Add Parliament Candidate
                            </Button>
                        </Stack>
                    </Stack>

                    <TableContainer>
                        <Table>
                            <TableHead sx={{ backgroundColor: 'primary.main' }}>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableCell
                                                key={header.id}
                                                onClick={header.column.getToggleSortingHandler()}
                                                sx={{
                                                    cursor: header.column.getCanSort()
                                                        ? 'pointer'
                                                        : 'default',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    backgroundColor: 'primary.main'
                                                }}
                                            >
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                >
                                                    <Box>
                                                        {flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                    </Box>
                                                    {header.column.getCanSort() && (
                                                        <HeaderSort column={header.column} />
                                                    )}
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
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                        {row.getIsExpanded() && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={row.getVisibleCells().length}
                                                >
                                                    <ParliamentCandidateView data={row.original} />
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

            {/* CSV Download Link */}
            <CSVLink
                data={csvData}
                filename="parliament-candidates.csv"
                ref={csvLinkRef}
                style={{ display: 'none' }}
            />

            {/* Add/Edit Modal */}
            <Dialog
                maxWidth="md"
                fullWidth
                TransitionComponent={PopupTransition}
                onClose={() => setOpenModal(false)}
                open={openModal}
                sx={{ '& .MuiDialog-paper': { p: 0 } }}
            >
                <ParliamentCandidateModal
                    open={openModal}
                    modalToggler={setOpenModal}
                    candidate={selectedCandidate}
                    refresh={() => fetchCandidates(pagination.pageIndex, pagination.pageSize, globalFilter)}
                />
            </Dialog>

            {/* View Modal */}
            <Dialog
                maxWidth="md"
                fullWidth
                TransitionComponent={PopupTransition}
                onClose={() => setSelectedCandidate(null)}
                open={selectedCandidate && !openModal}
                sx={{ '& .MuiDialog-paper': { p: 0 } }}
            >
                {selectedCandidate && !openModal && (
                    <ParliamentCandidateView 
                        data={selectedCandidate} 
                        onClose={() => setSelectedCandidate(null)}
                    />
                )}
            </Dialog>

            {/* Delete Confirmation */}
            <AlertParliamentCandidateDelete
                id={candidateDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchCandidates(pagination.pageIndex, pagination.pageSize, globalFilter)}
            />
        </>
    );
}