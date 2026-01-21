import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, MenuItem, TextField, Tooltip, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
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
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';

import DivisionModal from './DivisionModal';
import AlertDivisionDelete from './AlertDivisionDelete';
import DivisionView from './DivisionView';
import { useCsvOtp } from 'hooks/useCsvOtp';

export default function DivisionListPage() {
    const theme = useTheme();
    const navigate = useNavigate();

    const [selectedDivision, setSelectedDivision] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [divisionDeleteId, setDivisionDeleteId] = useState('');
    const [divisions, setDivisions] = useState([]);
    const [allDivisions, setAllDivisions] = useState([]);
    const [states, setStates] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [stateFilter, setStateFilter] = useState('');
    // CSV download state
    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();
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

    // Import functionality states
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const importInputRef = useRef();

    // Download all divisions for CSV
    const startCsvDownload = async () => {
        setCsvLoading(true);
        try {
            let url = `${import.meta.env.VITE_APP_API_URL}/divisions?limit=10000`;
            const token = localStorage.getItem('serviceToken');
            const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            const data = await res.json();
            if (data.success) {
                setCsvData(data.data);
                setTimeout(() => {
                    if (csvLinkRef.current) {
                        csvLinkRef.current.link.click();
                    }
                }, 100);
            }
        } catch (e) {
            console.error('Failed to download CSV:', e);
        } finally {
            setCsvLoading(false);
        }
    };

    const handleDownloadCsv = async () => {
        await requestOtp(startCsvDownload);
    };

    const handleDownloadExcelTemplate = async () => {
        try {
            const XLSX = await import('xlsx');
            const templateData = [
                {
                    name: 'Sample Division',
                    division_code: 'DIV001',
                    description: 'Sample division description',
                    state_no: '23'
                }
            ];
            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
            XLSX.writeFile(workbook, 'divisions_import_template.xlsx');
        } catch (error) {
            console.error('Error generating template:', error);
            alert('Failed to download template. Please try again.');
        }
    };

    const handleImportFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        setImportResult(null);
        try {
            const XLSX = await import('xlsx');
            const data = await file.arrayBuffer();
            const wb = XLSX.read(data, { type: 'array' });
            const wsName = wb.SheetNames[0];
            const ws = wb.Sheets[wsName];
            const json = XLSX.utils.sheet_to_json(ws, { defval: '' });

            const rows = json.map((r) => {
                const obj = {};
                for (const k of Object.keys(r)) obj[k.trim().toLowerCase()] = r[k];
                return {
                    name: obj.name ?? '',
                    division_code: obj.division_code ?? obj['division code'] ?? '',
                    description: obj.description ?? '',
                    state: obj.state_no ?? obj.state ?? ''
                };
            });

            const filtered = rows.filter(r => String(r.name).trim() && String(r.division_code).trim());

            const token = localStorage.getItem('serviceToken');
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/divisions/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ rows: filtered })
            });
            const result = await res.json();
            setImportResult(result);
            if (result?.success) {
                fetchDivisions(pagination.pageIndex, pagination.pageSize, globalFilter, stateFilter);
            }
        } catch (err) {
            setImportResult({ success: false, message: err?.message || String(err) });
        } finally {
            setImporting(false);
            if (importInputRef.current) importInputRef.current.value = '';
        }
    };

    const fetchReferenceData = async () => {
        try {
            const getAuthHeaders = () => {
                const token = localStorage.getItem('serviceToken');
                return token ? { Authorization: `Bearer ${token}` } : {};
            };

            const [statesRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`, { headers: getAuthHeaders() })
            ]);

            const statesData = await statesRes.json();
            if (statesData.success) setStates(statesData.data);
        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    const fetchDivisions = async (pageIndex, pageSize, globalFilter = '', stateFilter = '') => {
        setLoading(true);
        try {
            let url;
            let ignorePagination = !!globalFilter;
            if (ignorePagination) {
                // When searching, fetch all results (up to 10000)
                let query = [];
                if (globalFilter) query.push(`search=${encodeURIComponent(globalFilter)}`);
                if (stateFilter) query.push(`state=${encodeURIComponent(stateFilter)}`);
                const queryString = query.length > 0 ? `&${query.join('&')}` : '';
                url = `${import.meta.env.VITE_APP_API_URL}/divisions?page=1&limit=10000${queryString}`;
            } else {
                // Normal pagination
                let query = [];
                if (stateFilter) query.push(`state=${encodeURIComponent(stateFilter)}`);
                const queryString = query.length > 0 ? `&${query.join('&')}` : '';
                url = `${import.meta.env.VITE_APP_API_URL}/divisions?page=${pageIndex + 1}&limit=${pageSize}${queryString}`;
            }
            const token = localStorage.getItem('serviceToken');
            const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            const json = await res.json();
            if (json.success) {
                setDivisions(json.data);
                setPageCount(ignorePagination ? 1 : json.pages);
            } else {
                setDivisions([]);
                setPageCount(0);
            }
        } catch (error) {
            setDivisions([]);
            setPageCount(0);
            console.error('Failed to fetch divisions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllDivisionsForFilters = async () => {
        try {
            const data = await fetchAllDataForFilters('/divisions', {});
            setAllDivisions(data);
        } catch (error) {
            console.error('Failed to fetch all divisions for filters:', error);
        }
    };

    const filterOptions = useFilterOptionsFromData(allDivisions, {
        states: { field: 'state_id', nameField: 'name' }
    });

    useEffect(() => {
        fetchDivisions(pagination.pageIndex, pagination.pageSize, globalFilter, stateFilter);
        fetchReferenceData();
        fetchAllDivisionsForFilters();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, stateFilter]);

    // Reset to first page when searching or filtering
    useEffect(() => {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, [globalFilter, stateFilter]);

    const handleDeleteOpen = (id) => {
        setDivisionDeleteId(id);
        setOpenDelete(true);
    };

    const handleDeleteClose = () => setOpenDelete(false);

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
            cell: ({ row, table }) => {
                const { pageIndex, pageSize } = table.getState().pagination;
                const serialNumber = pageIndex * pageSize + row.index + 1;
                return <Typography>{serialNumber}</Typography>;
            }
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
                    {getValue() ? getValue().replace(/<[^>]+>/g, '').slice(0, 100) : ''}
                </Typography>
            )
        },
        {
            header: 'Code',
            accessorKey: 'division_code',
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
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <Tooltip title="View Details">
                            <IconButton
                                color="secondary"
                                onClick={() => navigate(`/division/${row.original._id}`)}
                            >
                                <Eye />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton color="primary" onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDivision(row.original);
                                setOpenModal(true);
                            }}>
                                <Edit />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton color="error" onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteOpen(row.original._id);
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
        data: divisions,
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
                {/* Header: Search + Filters + Actions */}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={40}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    justifyContent="space-between"
                    sx={{ p: 2 }}
                >

                    <DebouncedInput
                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={`Search ${divisions.length} divisions...`}
                    />

                    <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        justifyContent="flex-end"
                    >
                        <CSVLink
                            data={csvData}
                            filename="divisions_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
                        {/* OTP Dialog for CSV export */}
                        <Dialog open={otpDialogOpen} onClose={() => !otpLoading && closeDialog()} maxWidth="xs" fullWidth>
                            <DialogTitle>Enter OTP to Download CSV</DialogTitle>
                            <DialogContent>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    OTP sent to: <strong>{maskedDest || '**********'}</strong>
                                </Typography>
                                <TextField
                                    autoFocus
                                    fullWidth
                                    label="OTP"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    disabled={otpLoading}
                                    inputProps={{ maxLength: 8 }}
                                />
                                {otpError && (
                                    <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                                        {otpError}
                                    </Typography>
                                )}
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => closeDialog()} disabled={otpLoading}>Cancel</Button>
                                <Button onClick={() => verifyOtp()} variant="contained" disabled={otpLoading || !otpCode?.trim()}>
                                    {otpLoading ? <CircularProgress size={20} /> : 'Verify & Download'}
                                </Button>
                            </DialogActions>
                        </Dialog>
                        <Button
                            variant="outlined"
                            onClick={handleDownloadExcelTemplate}
                            size="small"
                        >
                            Download Excel Template
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                if (importInputRef.current) importInputRef.current.click();
                            }}
                            size="small"
                            disabled={importing}
                        >
                            {importing ? 'Importing...' : 'Import Excel'}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={handleDownloadCsv}
                            disabled={csvLoading}
                            size="small"
                        >
                            {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => {
                                setSelectedDivision(null);
                                setOpenModal(true);
                            }}
                            size="small"
                        >
                            Add Division
                        </Button>
                    </Stack>
                </Stack>

                {/* Import Result */}
                {importResult && (
                    <Alert severity={importResult.success ? 'success' : 'error'} sx={{ m: 2 }}>
                        {importResult.success ? (
                            <span>
                                Imported: {importResult.created || 0} / {importResult.total || 0}
                                {Array.isArray(importResult.errors) && importResult.errors.length > 0 && (
                                    <> | Errors: {importResult.errors.length}</>
                                )}
                            </span>
                        ) : (
                            <span>Import failed: {importResult.message || 'Unknown error'}</span>
                        )}
                    </Alert>
                )}

                {/* Filters */}
                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ p: 2, flexWrap: 'wrap' }}
                >
                    <TextField
                        select
                        label="State"
                        value={stateFilter}
                        onChange={(e) => {
                            setStateFilter(e.target.value);
                        }}
                        sx={{ minWidth: 150 }}
                        size="small"
                    >
                        <MenuItem value="">All States</MenuItem>
                        {filterOptions.states?.map((state) => (
                            <MenuItem key={state._id} value={state._id}>
                                {state.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Button
                        variant="contained"
                        onClick={() => fetchDivisions(
                            pagination.pageIndex,
                            pagination.pageSize,
                            globalFilter,
                            stateFilter
                        )}
                        size="small"
                    >
                        Apply
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setStateFilter('');
                            setGlobalFilter('');
                            fetchDivisions(
                                pagination.pageIndex,
                                pagination.pageSize,
                                '',
                                ''
                            );
                        }}
                        size="small"
                    >
                        Clear
                    </Button>
                </Stack>





                {/* Table */}
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
                                                    cursor: header.column.getCanSort()
                                                        ? 'pointer'
                                                        : 'default',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    backgroundColor: 'primary.main'
                                                }}
                                            >
                                                <Stack direction="row" spacing={1} alignItems="center">
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
                                                <TableCell colSpan={row.getVisibleCells().length}>
                                                    <DivisionView data={row.original} />
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
                            setPageSize={(size) =>
                                setPagination((prev) => ({ ...prev, pageSize: size }))
                            }
                            setPageIndex={(index) =>
                                setPagination((prev) => ({ ...prev, pageIndex: index }))
                            }
                            getState={table.getState}
                            getPageCount={() => pageCount}
                        />
                    </Box>
                </ScrollX>
            </MainCard>

            {/* Hidden Import Input */}
            <input
                type="file"
                accept=".xlsx,.xls,.csv"
                ref={importInputRef}
                style={{ display: 'none' }}
                onChange={handleImportFile}
            />

            {/* Modals */}
            <DivisionModal
                open={openModal}
                modalToggler={setOpenModal}
                division={selectedDivision}
                states={states}
                refresh={() =>
                    fetchDivisions(pagination.pageIndex, pagination.pageSize)
                }
            />

            <AlertDivisionDelete
                id={divisionDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() =>
                    fetchDivisions(pagination.pageIndex, pagination.pageSize)
                }
            />
        </>
    );

}
