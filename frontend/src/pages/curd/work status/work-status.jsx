import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip,
    FormControl, InputLabel, Select, MenuItem, Grid
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash } from 'iconsax-react';
import {
    getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
    useReactTable, flexRender
} from '@tanstack/react-table';
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import IconButton from 'components/@extended/IconButton';
import EmptyReactTable from 'pages/tables/react-table/empty';
import { CSVLink } from 'react-csv';

import WorkStatusModal from './WorkStatusModal';
import AlertWorkStatusDelete from './AlertWorkStatusDelete';
import WorkStatusView from './WorkStatusView';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';

export default function WorkStatusListPage() {
    const theme = useTheme();

    const [selectedWorkStatus, setSelectedWorkStatus] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [workStatusDeleteId, setWorkStatusDeleteId] = useState('');
    const [workStatuses, setWorkStatuses] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');

    // Filter states
    const [filters, setFilters] = useState({
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: '',
        workType: '',
        status: ''
    });

    // Temporary filters for staging changes
    const [tempFilters, setTempFilters] = useState({
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: '',
        workType: '',
        status: ''
    });

    const handleStateChange = (event) => {
        const stateId = event.target.value;
        setTempFilters({
            ...tempFilters,
            state_id: stateId,
            division_id: '',
            parliament_id: '',
            assembly_id: '',
            block_id: '',
            booth_id: ''
        });
    };

    const handleDivisionChange = (event) => {
        const divisionId = event.target.value;
        setTempFilters({
            ...tempFilters,
            division_id: divisionId,
            parliament_id: '',
            assembly_id: '',
            block_id: '',
            booth_id: ''
        });
    };

    const handleParliamentChange = (event) => {
        const parliamentId = event.target.value;
        setTempFilters({
            ...tempFilters,
            parliament_id: parliamentId,
            assembly_id: '',
            block_id: '',
            booth_id: ''
        });
    };

    const handleAssemblyChange = (event) => {
        const assemblyId = event.target.value;
        setTempFilters({
            ...tempFilters,
            assembly_id: assemblyId,
            block_id: '',
            booth_id: ''
        });
    };

    const handleBlockChange = (event) => {
        const blockId = event.target.value;
        setTempFilters({
            ...tempFilters,
            block_id: blockId,
            booth_id: ''
        });
    };

    const handleBoothChange = (event) => {
        const boothId = event.target.value;
        setTempFilters({
            ...tempFilters,
            booth_id: boothId
        });
    };

    const handleWorkTypeChange = (event) => {
        const workType = event.target.value;
        setTempFilters({
            ...tempFilters,
            workType: workType
        });
    };

    const handleStatusChange = (event) => {
        const status = event.target.value;
        setTempFilters({
            ...tempFilters,
            status: status
        });
    };

    const handleApplyFilters = () => {
        setFilters(tempFilters);
        setPagination({ pageIndex: 0, pageSize: 10 });
        fetchWorkStatuses(0, 10, globalFilter, tempFilters);
    };

    const handleClearFilters = () => {
        const emptyFilters = {
            state_id: '',
            division_id: '',
            parliament_id: '',
            assembly_id: '',
            block_id: '',
            booth_id: '',
            workType: '',
            status: ''
        };
        setFilters(emptyFilters);
        setTempFilters(emptyFilters);
        setPagination({ pageIndex: 0, pageSize: 10 });
        fetchWorkStatuses(0, 10, globalFilter, emptyFilters);
    };

    const fetchReferenceData = async () => {
        try {
            // Fetch states first
            const statesRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/states`);
            const statesData = await statesRes.json();

            // Fetch divisions next to see their structure
            const divisionsRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`);
            const divisionsData = await divisionsRes.json();

            // Fetch the rest
            const [
                parliamentsRes,
                assembliesRes,
                blocksRes,
                boothsRes
            ] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/booths`)
            ]);

            const [

                parliamentsData,
                assembliesData,
                blocksData,
                boothsData
            ] = await Promise.all([

                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                boothsRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) {
                setDivisions(divisionsData.data);
            }
            if (parliamentsData.success) {
                setParliaments(parliamentsData.data);
            }
            if (assembliesData.success) {
                setAssemblies(assembliesData.data);
            }
            if (blocksData.success) {
                setBlocks(blocksData.data);
            }
            if (boothsData.success) {
                setBooths(boothsData.data);
            }

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    const fetchWorkStatuses = async (pageIndex, pageSize, globalFilter = '', currentFilters = filters) => {
        setLoading(true);
        try {
            const queryParams = [];
            queryParams.push(`page=${pageIndex + 1}`);
            queryParams.push(`limit=${pageSize}`);

            if (globalFilter) queryParams.push(`search=${encodeURIComponent(globalFilter)}`);
            if (currentFilters.state_id) queryParams.push(`state=${encodeURIComponent(currentFilters.state_id)}`);
            if (currentFilters.division_id) queryParams.push(`division=${encodeURIComponent(currentFilters.division_id)}`);
            if (currentFilters.parliament_id) queryParams.push(`parliament=${encodeURIComponent(currentFilters.parliament_id)}`);
            if (currentFilters.assembly_id) queryParams.push(`assembly=${encodeURIComponent(currentFilters.assembly_id)}`);
            if (currentFilters.block_id) queryParams.push(`block=${encodeURIComponent(currentFilters.block_id)}`);
            if (currentFilters.booth_id) queryParams.push(`booth=${encodeURIComponent(currentFilters.booth_id)}`);
            if (currentFilters.workType) queryParams.push(`workType=${encodeURIComponent(currentFilters.workType)}`);
            if (currentFilters.status) queryParams.push(`status=${encodeURIComponent(currentFilters.status)}`);

            const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/work-status${queryString}`);
            const json = await res.json();
            if (json.success) {
                setWorkStatuses(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch work statuses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkStatuses(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    const handleDeleteOpen = (id) => {
        setWorkStatusDeleteId(id);
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

    const formatCurrency = (amount) => {
        if (!amount) return '₹0';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
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
            header: 'Work Name',
            accessorKey: 'work_name',
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
            header: 'Department',
            accessorKey: 'department',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 'N/A'}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: ({ getValue }) => {
                const status = getValue();
                let color = 'default';
                if (status === 'Completed') color = 'success';
                else if (status === 'In Progress') color = 'info';
                else if (status === 'Pending') color = 'warning';
                else if (status === 'Halted' || status === 'Cancelled') color = 'error';

                return (
                    <Chip
                        label={status}
                        color={color}
                        size="small"
                    />
                );
            }
        },
        {
            header: 'Work Type',
            accessorKey: 'work_type',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 'N/A'}
                    size="small"
                    variant="outlined"
                    color="primary"
                />
            )
        },
        {
            header: 'Fund Source',
            accessorKey: 'approved_fund_from',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 'N/A'}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Falia',
            accessorKey: 'falia',
            cell: ({ getValue }) => (
                <Typography>{getValue() || 'N/A'}</Typography>
            )
        },
        // {
        //     header: 'Description',
        //     accessorKey: 'description',
        //     cell: ({ getValue }) => (
        //         <Typography sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        //             {getValue() || 'N/A'}
        //         </Typography>
        //     )
        // },
        {
            header: 'Total Budget',
            accessorKey: 'total_budget',
            cell: ({ getValue }) => (
                <Typography>{formatCurrency(getValue())}</Typography>
            )
        },
        {
            header: 'Spent Amount',
            accessorKey: 'spent_amount',
            cell: ({ getValue }) => (
                <Typography>{formatCurrency(getValue())}</Typography>
            )
        },
        {
            header: 'Start Date',
            accessorKey: 'start_date',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'Expected End',
            accessorKey: 'expected_end_date',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'Actual End',
            accessorKey: 'actual_end_date',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'Booth',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.name || 'N/A'} {getValue()?.booth_number ? `(#${getValue()?.booth_number})` : ''}
                </Typography>
            )
        },
        {
            header: 'Block',
            accessorKey: 'block_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
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
                    size="small"
                    variant="outlined"
                    color="info"
                />
            )
        },
        {
            header: 'Parliament',
            accessorKey: 'parliament_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    size="small"
                    variant="outlined"
                    color="secondary"
                />
            )
        },
        {
            header: 'Division',
            accessorKey: 'division_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    size="small"
                    variant="outlined"
                    color="warning"
                />
            )
        },
        {
            header: 'State',
            accessorKey: 'state_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    size="small"
                    variant="outlined"
                    color="primary"
                />
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
            header: 'Created By',
            accessorKey: 'created_by',
            cell: ({ getValue }) => (
                <Typography>{getValue()?.username || 'N/A'}</Typography>
            )
        },
        {
            header: 'Updated By',
            accessorKey: 'updated_by',
            cell: ({ getValue }) => (
                <Typography>{getValue()?.username || 'N/A'}</Typography>
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
                        <IconButton color="secondary" onClick={row.getToggleExpandedHandler()}>
                            {expandIcon}
                        </IconButton>
                        <IconButton
                            color="primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedWorkStatus(row.original);
                                setOpenModal(true);
                            }}
                        >
                            <Edit />
                        </IconButton>
                        <IconButton
                            color="error"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteOpen(row.original._id);
                            }}
                        >
                            <Trash />
                        </IconButton>
                    </Stack>
                );
            }
        }
    ], [theme]);


    const table = useReactTable({
        data: workStatuses,
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

    const fetchAllWorkStatusesForCsv = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/work-status?all=true`);
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all work statuses for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllWorkStatusesForCsv();
        setCsvData(allData.map(item => ({
            'Work Name': item.work_name,
            'Department': item.department,
            'Status': item.status,
            'Approved Fund From': item.approved_fund_from,
            'Total Budget': item.total_budget,
            'Spent Amount': item.spent_amount,
            'Falia': item.falia,
            'Description': item.description,
            'Start Date': item.start_date,
            'Expected End Date': item.expected_end_date,
            'Actual End Date': item.actual_end_date || '',
            'State': item.state_id?.name || '',
            'Division': item.division_id?.name || '',
            'Parliament': item.parliament_id?.name || '',
            'Assembly': item.assembly_id?.name || '',
            'Block': item.block_id?.name || '',
            'Booth': item.booth_id?.name ? `${item.booth_id.name} (Booth #${item.booth_id.booth_number || ''})` : '',
            'Created By': item.created_by?.username || '',
            'Updated By': item.updated_by?.username || '',
            'Created At': item.created_at,
            'Updated At': item.updated_at || ''
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
                <Stack spacing={2} sx={{ padding: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                        <DebouncedInput
                            value={globalFilter}
                            onFilterChange={setGlobalFilter}
                            placeholder={`Search ${workStatuses.length} work status list...`}
                        />
                        <Stack direction="row" spacing={1}>
                            <CSVLink
                                data={csvData}
                                filename="work_status_all.csv"
                                style={{ display: 'none' }}
                                ref={csvLinkRef}
                            />
                            <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                                {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => {
                                    setSelectedWorkStatus(null);
                                    setOpenModal(true);
                                }}
                            >
                                Add Work Status
                            </Button>
                        </Stack>
                    </Stack>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>State</InputLabel>
                                <Select
                                    value={tempFilters.state_id}
                                    onChange={handleStateChange}
                                    label="State"
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {states.map((state) => (
                                        <MenuItem key={state._id} value={state._id}>{state.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Division</InputLabel>
                                <Select
                                    value={tempFilters.division_id}
                                    onChange={handleDivisionChange}
                                    label="Division"
                                    disabled={!tempFilters.state_id}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {divisions.filter(division => {
                                        const stateId = division.state_id?._id || division.state_id;
                                        return stateId === tempFilters.state_id;
                                    }).map((division) => (
                                        <MenuItem key={division._id} value={division._id}>{division.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Parliament</InputLabel>
                                <Select
                                    value={tempFilters.parliament_id}
                                    onChange={handleParliamentChange}
                                    label="Parliament"
                                    disabled={!tempFilters.division_id}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {parliaments.filter(parliament => {
                                        const divisionId = parliament.division_id?._id || parliament.division_id;
                                        return divisionId === tempFilters.division_id;
                                    }).map((parliament) => (
                                        <MenuItem key={parliament._id} value={parliament._id}>{parliament.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Assembly</InputLabel>
                                <Select
                                    value={tempFilters.assembly_id}
                                    onChange={handleAssemblyChange}
                                    label="Assembly"
                                    disabled={!tempFilters.parliament_id}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {assemblies.filter(assembly => {
                                        const parliamentId = assembly.parliament_id?._id || assembly.parliament_id;
                                        return parliamentId === tempFilters.parliament_id;
                                    }).map((assembly) => (
                                        <MenuItem key={assembly._id} value={assembly._id}>{assembly.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Block</InputLabel>
                                <Select
                                    value={tempFilters.block_id}
                                    onChange={handleBlockChange}
                                    label="Block"
                                    disabled={!tempFilters.assembly_id}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {blocks.filter(block => {
                                        const assemblyId = block.assembly_id?._id || block.assembly_id;
                                        return assemblyId === tempFilters.assembly_id;
                                    }).map((block) => (
                                        <MenuItem key={block._id} value={block._id}>{block.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Booth</InputLabel>
                                <Select
                                    value={tempFilters.booth_id}
                                    onChange={handleBoothChange}
                                    label="Booth"
                                    disabled={!tempFilters.block_id}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {booths.filter(booth => {
                                        const blockId = booth.block_id?._id || booth.block_id;
                                        return blockId === tempFilters.block_id;
                                    }).map((booth) => (
                                        <MenuItem key={booth._id} value={booth._id}>{booth.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Work Type</InputLabel>
                                <Select
                                    value={tempFilters.workType}
                                    onChange={handleWorkTypeChange}
                                    label="Work Type"
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="infrastructure">Infrastructure</MenuItem>
                                    <MenuItem value="social">Social</MenuItem>
                                    <MenuItem value="education">Education</MenuItem>
                                    <MenuItem value="health">Health</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={tempFilters.status}
                                    onChange={handleStatusChange}
                                    label="Status"
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="Pending">Pending</MenuItem>
                                    <MenuItem value="In Progress">In Progress</MenuItem>
                                    <MenuItem value="Completed">Completed</MenuItem>
                                    <MenuItem value="Halted">Halted</MenuItem>
                                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Stack direction="row" spacing={1}>
                                <Button
                                    variant="contained"
                                    onClick={handleApplyFilters}
                                    sx={{ width: '50%' }}
                                >
                                    Apply
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleClearFilters}
                                    sx={{ width: '50%' }}
                                >
                                    Clear
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
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
                                                    <WorkStatusView data={row.original} />
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

            <WorkStatusModal
                open={openModal}
                modalToggler={setOpenModal}
                workStatus={selectedWorkStatus}
                booths={booths}
                blocks={blocks}
                assemblies={assemblies}
                parliaments={parliaments}
                divisions={divisions}
                states={states}
                refresh={() => fetchWorkStatuses(pagination.pageIndex, pagination.pageSize, globalFilter)}
            />

            <AlertWorkStatusDelete
                id={workStatusDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchWorkStatuses(pagination.pageIndex, pagination.pageSize, globalFilter)}
            />
        </>
    );
}

