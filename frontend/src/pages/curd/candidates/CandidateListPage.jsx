import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Stack, Typography, Box, Tooltip, Divider, Chip, Avatar, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress
} from '@mui/material';
import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
    getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
    useReactTable, flexRender
} from '@tanstack/react-table';
import { CSVLink } from 'react-csv';
import { useCsvOtp } from 'hooks/useCsvOtp';
import IconButton from 'components/@extended/IconButton';
import { Add, Edit, Trash, Eye } from 'iconsax-react';
import { HeaderSort, TablePagination } from 'components/third-party/react-table';
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';
// import TextField from '@mui/material/TextField';
import ScrollX from 'components/ScrollX';
import MainCard from 'components/MainCard';
import EmptyReactTable from 'pages/tables/react-table/empty';
import CandidateModal from './CandidateModal';
import CandidateView from './CandidateView';
import AlertCandidateDelete from './AlertCandidateDelete';

const CandidateListPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [allCandidates, setAllCandidates] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState({ open: false, id: null });
    const [globalFilter, setGlobalFilter] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const searchDebounceRef = useRef(null);
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

    // OTP flow for CSV export
    const {
        otpDialogOpen,
        otpCode,
        setOtpCode,
        loading: otpLoading,
        maskedDest,
        error: otpError,
        requestOtp,
        verifyOtp,
        closeDialog
    } = useCsvOtp();

    // Excel import states
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const importInputRef = useRef();

    const handleSearchChange = (value) => {
        setGlobalFilter(value);

        // If search is cleared, reset pagination to normal but maintain current page if possible
        if (!value || value.trim() === '') {
            // Only reset page size if it was set to large number for search
            if (pagination.pageSize === 10000) {
                setPagination(prev => ({ ...prev, pageSize: 10 }));
            }
        }
    };

    const fetchCandidates = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            let actualPageIndex = pageIndex;
            let actualPageSize = pageSize;

            // When searching, fetch all results on one page
            if (globalFilter && globalFilter.trim() !== '') {
                actualPageIndex = 0;
                actualPageSize = 10000; // Large enough to get all results
            }

            const query = globalFilter && globalFilter.trim() !== '' ? `&search=${encodeURIComponent(globalFilter)}` : '';
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/candidates?page=${actualPageIndex + 1}&limit=${actualPageSize}${query}`, { headers });
            const json = await safeParseJson(res);

            if (json.success) {
                setCandidates(json.data);
                if (globalFilter && globalFilter.trim() !== '') {
                    // When searching, show all results on one page
                    setPageCount(1);
                } else {
                    // When not searching, use normal pagination
                    setPageCount(json.pages);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllCandidatesForFilters = async () => {
        const data = await fetchAllDataForFilters('/candidates', {});
        setAllCandidates(data);
    };

    const fetchReferenceData = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const [
                statesRes, divisionsRes, parliamentsRes,
                assembliesRes, partiesRes, electionYearsRes
            ] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parties`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/election-years`, { headers })
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
        fetchAllCandidatesForFilters();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    // Extract filter options from actual candidate data
    const filterOptions = useFilterOptionsFromData(allCandidates, {
        parties: { field: 'party_id', nameField: 'name' },
        states: { field: 'state_id', nameField: 'name' },
        divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
        parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
        assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' }
    });

    // Handle search clear - reset pagination
    useEffect(() => {
        if (!globalFilter || globalFilter.trim() === '') {
            if (pagination.pageSize === 10000) {
                setPagination(prev => ({ pageIndex: 0, pageSize: 10 }));
            }
        }
    }, [globalFilter]);

    useEffect(() => {
        fetchReferenceData();
    }, []);

    const formatNumber = (number) => {
        if (!number) return 'N/A';
        return number.toLocaleString();
    };

    const formatDate = (value) => {
        if (!value) return 'N/A';
        try {
            return new Date(value).toLocaleString();
        } catch (e) {
            return value;
        }
    };

    // Safely parse JSON responses and surface HTML/text when server returns non-JSON (helps debug unexpected '<!DOCTYPE')
    const safeParseJson = async (res) => {
        const ct = res.headers?.get?.('content-type') || '';
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            console.error('HTTP error:', res.status, text);
            throw new Error(`HTTP ${res.status}: ${text}`);
        }
        if (ct.includes('application/json')) {
            return res.json();
        }
        const text = await res.text().catch(() => '');
        console.error('Expected JSON but received non-JSON response:', text.slice(0, 1000));
        throw new Error('Invalid JSON response from server');
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
            header: 'Party',
            accessorKey: 'party_id.name',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 'N/A'}
                    color="primary"
                    size="small"
                />
            )
        },
        {
            header: 'Education',
            accessorKey: 'education',
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
            header: 'Assets',
            accessorKey: 'assets',
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
            header: 'Liabilities',
            accessorKey: 'liabilities',
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
            header: 'Created By',
            accessorKey: 'created_by.username',
            cell: ({ getValue }) => (
                <Typography>{getValue() || 'N/A'}</Typography>
            )
        },
        {
            header: 'Created At',
            accessorKey: 'created_at',
            cell: ({ getValue }) => (
                <Typography>{formatDate(getValue())}</Typography>
            )
        },
        {
            header: 'Updated By',
            accessorKey: 'updated_by.username',
            cell: ({ getValue }) => (
                <Typography>{getValue() || 'N/A'}</Typography>
            )
        },
        {
            header: 'Updated At',
            accessorKey: 'updated_at',
            cell: ({ getValue }) => (
                <Typography>{formatDate(getValue())}</Typography>
            )
        },
        {
            header: 'Actions',
            meta: { className: 'cell-center' },
            cell: ({ row }) => {
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <Tooltip title="View Details">
                            <IconButton
                                color="secondary"
                                onClick={() => navigate(`/candidates/${row.original._id}`)}
                            >
                                <Eye />
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
        manualPagination: true, // Always use manual pagination
        onPaginationChange: setPagination,
        onGlobalFilterChange: handleSearchChange,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getRowCanExpand: () => true
    });

    const fetchAllCandidatesForCsv = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/candidates?all=true`, { headers });
            const json = await safeParseJson(res);
            if (json && json.success) return json.data;
        } catch (error) {
            console.error('Failed to fetch all candidates for CSV:', error);
        }
        return [];
    };

    const startCsvDownload = async () => {
        setCsvLoading(true);
        const allData = await fetchAllCandidatesForCsv();
        setCsvData(allData.map(item => ({
            'ID': item._id || '',
            'Name': item.name || '',
            'Caste': item.caste || '',
            'Criminal Cases': item.criminal_cases || 0,
            'Assets': item.assets || '',
            'Liabilities': item.liabilities || '',
            'Education': item.education || '',
            'Photo': item.photo || '',
            'Description': item.description ? item.description.replace(/<[^>]+>/g, '') : '',
            'Party ID': item.party_id?._id || (item.party_id || ''),
            'Party Name': item.party_id?.name || '',
            'State ID': item.state_id?._id || (item.state_id || ''),
            'State Name': item.state_id?.name || '',
            'Division ID': item.division_id?._id || (item.division_id || ''),
            'Division Name': item.division_id?.name || '',
            'Parliament ID': item.parliament_id?._id || (item.parliament_id || ''),
            'Parliament Name': item.parliament_id?.name || '',
            'Assembly ID': item.assembly_id?._id || (item.assembly_id || ''),
            'Assembly Name': item.assembly_id?.name || '',
            'Is Active': item.is_active ? 'Yes' : 'No',
            'Created By': item.created_by?.username || '',
            'Updated By': item.updated_by?.username || '',
            'Created At': item.created_at ? new Date(item.created_at).toISOString() : '',
            'Updated At': item.updated_at ? new Date(item.updated_at).toISOString() : ''
        })));
        setCsvLoading(false);
        setTimeout(() => {
            if (csvLinkRef.current) {
                csvLinkRef.current.link.click();
            }
        }, 100);
    };

    const handleDownloadCsv = async () => {
        // Initiate OTP flow; startCsvDownload will run after successful verification
        await requestOtp(startCsvDownload);
    };

    // Excel Template Download
    const handleDownloadExcelTemplate = async () => {
        try {
            const XLSX = await import('xlsx');
            const templateData = [
                {
                    name: 'Rajesh Kumar Singh',
                    caste: 'General',
                    criminal_cases: '0',
                    assets: '₹50,00,000 (Land, House)',
                    liabilities: '₹5,00,000 (Home Loan)',
                    education: 'M.A. Political Science',
                    photo: 'https://example.com/photo.jpg',
                    description: 'Former MLA with 10 years experience',
                    party_name: 'BJP',
                    state_no: '23',
                    division_code: '1',
                    parliament_no: '101',
                    AC_NO: '1'
                }
            ];
            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
            XLSX.writeFile(workbook, 'candidates-template.xlsx');
        } catch (error) {
            console.error('Error generating template:', error);
            alert('Failed to download template. Please try again.');
        }
    };

    // Excel Import Handler
    const handleImportFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        setImportResult(null);

        try {
            const XLSX = await import('xlsx');
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const normalizedData = jsonData.map(row => {
                const normalized = {};
                Object.keys(row).forEach(key => {
                    const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
                    normalized[normalizedKey] = row[key];
                });
                return normalized;
            });

            const token = localStorage.getItem('serviceToken');
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/candidates/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` })
                },
                body: JSON.stringify({ data: normalizedData })
            });

            const result = await safeParseJson(response);
            setImportResult(result);
            if (result.success) {
                fetchCandidates(pagination.pageIndex, pagination.pageSize, globalFilter);
            }
        } catch (err) {
            setImportResult({ success: false, message: err.message || 'Import failed' });
        } finally {
            setImporting(false);
            if (importInputRef.current) importInputRef.current.value = '';
        }
    };

    if (loading) return <EmptyReactTable />;

    return (
        <>
            <MainCard content={false}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
                    <TextField
                        size="small"
                        variant="outlined"
                        placeholder={`Search ${candidates.length} records...`}
                        value={searchInput}
                        onChange={(e) => {
                            const v = e.target.value;
                            setSearchInput(v);
                            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                            searchDebounceRef.current = setTimeout(() => handleSearchChange(v), 500);
                        }}
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
                        <Button variant="outlined" onClick={handleDownloadExcelTemplate}>
                            Download Excel Template
                        </Button>
                        <Button variant="outlined" onClick={() => importInputRef.current?.click()} disabled={importing}>
                            {importing ? 'Importing...' : 'Import Excel'}
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditData(null); setOpenModal(true); }}>
                            Add Candidate
                        </Button>
                    </Stack>
                </Stack>

                {/* OTP Dialog for CSV export */}
                <Dialog open={otpDialogOpen} onClose={closeDialog}>
                    <DialogTitle>Enter OTP</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2">An OTP has been sent to {maskedDest}</Typography>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="OTP"
                            fullWidth
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                        />
                        {otpLoading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}><CircularProgress size={24} /></Box>}
                        {otpError && <Typography color="error" sx={{ mt: 1 }}>{otpError}</Typography>}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeDialog}>Cancel</Button>
                        <Button onClick={async () => { await verifyOtp(); }} disabled={otpLoading}>Verify</Button>
                    </DialogActions>
                </Dialog>

                {importResult && (
                    <Alert severity={importResult.success ? 'success' : 'error'} onClose={() => setImportResult(null)} sx={{ mx: 3, mb: 2 }}>
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {importResult.message || (importResult.success ? `Imported ${importResult.created ?? 0} / ${importResult.total ?? ''}` : 'Import result')}
                            </Typography>

                            {typeof importResult.created !== 'undefined' && typeof importResult.skipped !== 'undefined' && (
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    {`Created: ${importResult.created} — Skipped: ${importResult.skipped}`}
                                </Typography>
                            )}

                            {Array.isArray(importResult.errors) && importResult.errors.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="subtitle2">Errors (first {Math.min(10, importResult.errors.length)}):</Typography>
                                    <Box component="ul" sx={{ pl: 3, m: 0 }}>
                                        {importResult.errors.slice(0, 10).map((err, idx) => (
                                            <li key={idx}>
                                                <Typography variant="body2">{`Row ${err.row}: ${err.message}`}</Typography>
                                            </li>
                                        ))}
                                        {importResult.errors.length > 10 && (
                                            <li>
                                                <Typography variant="body2">{`...and ${importResult.errors.length - 10} more`}</Typography>
                                            </li>
                                        )}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Alert>
                )}

                <ScrollX>
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
                                                    cursor: header.column.getCanSort() ? 'pointer' : 'default',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    backgroundColor: 'primary.main'
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
                    {(!globalFilter || globalFilter.trim() === '') && (
                        <Box sx={{ p: 2 }}>
                            <TablePagination
                                setPageSize={(size) => setPagination((prev) => ({ ...prev, pageSize: size }))}
                                setPageIndex={(index) => setPagination((prev) => ({ ...prev, pageIndex: index }))}
                                getState={table.getState}
                                getPageCount={() => pageCount}
                            />
                        </Box>
                    )}
                </ScrollX>
            </MainCard>

            <input
                ref={importInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={handleImportFile}
            />

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
                refresh={() => {
                    if (!globalFilter || globalFilter.trim() === '') {
                        fetchCandidates(pagination.pageIndex, pagination.pageSize);
                    } else {
                        fetchCandidates(0, 10000, globalFilter);
                    }
                }}
            />
            <AlertCandidateDelete
                open={deleteAlert.open}
                handleClose={() => setDeleteAlert({ open: false, id: null })}
                id={deleteAlert.id}
                refresh={() => {
                    if (!globalFilter || globalFilter.trim() === '') {
                        fetchCandidates(pagination.pageIndex, pagination.pageSize);
                    } else {
                        fetchCandidates(0, 10000, globalFilter);
                    }
                }}
            />
        </>
    );
};

export default CandidateListPage;
