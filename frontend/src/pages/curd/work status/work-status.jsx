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
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';
import EmptyReactTable from 'pages/tables/react-table/empty';
import { CSVLink } from 'react-csv';

import WorkStatusModal from './WorkStatusModal';
import AlertWorkStatusDelete from './AlertWorkStatusDelete';
import WorkStatusView from './WorkStatusView';

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
    const [filterValues, setFilterValues] = useState({
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: '',
        booth: '',
        workType: '',
        status: ''
    });

    const [appliedFilters, setAppliedFilters] = useState({
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: '',
        booth: '',
        workType: '',
        status: ''
    });

    // Filtered lists based on parent selections
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    const handleApplyFilters = () => {
        setAppliedFilters(filterValues);
        setPagination({ pageIndex: 0, pageSize: 10 });
        fetchWorkStatuses(0, 10, globalFilter);
    };

    const handleClearFilters = () => {
        const emptyFilters = {
            state: '',
            division: '',
            parliament: '',
            assembly: '',
            block: '',
            booth: '',
            workType: '',
            status: ''
        };
        setFilterValues(emptyFilters);
        setAppliedFilters(emptyFilters);
        setPagination({ pageIndex: 0, pageSize: 10 });
        // Reset filtered lists
        setFilteredDivisions(divisions);
        setFilteredParliaments(parliaments);
        setFilteredAssemblies(assemblies);
        setFilteredBlocks(blocks);
        setFilteredBooths(booths);
        fetchWorkStatuses(0, 10, globalFilter);
    };

    // Handle state change
    const handleStateChange = (stateId) => {
        const newFilterValues = {
            ...filterValues,
            state: stateId,
            division: '',
            parliament: '',
            assembly: '',
            block: '',
            booth: ''
        };
        setFilterValues(newFilterValues);

        // Filter divisions based on state
        const newDivisions = divisions.filter(div => div.state_id === stateId);
        setFilteredDivisions(newDivisions);
        setFilteredParliaments([]);
        setFilteredAssemblies([]);
        setFilteredBlocks([]);
        setFilteredBooths([]);
    };

    // Handle division change
    const handleDivisionChange = (divisionId) => {
        const newFilterValues = {
            ...filterValues,
            division: divisionId,
            parliament: '',
            assembly: '',
            block: '',
            booth: ''
        };
        setFilterValues(newFilterValues);

        // Filter parliaments based on division
        const newParliaments = parliaments.filter(parl => parl.division_id === divisionId);
        setFilteredParliaments(newParliaments);
        setFilteredAssemblies([]);
        setFilteredBlocks([]);
        setFilteredBooths([]);
    };

    // Handle parliament change
    const handleParliamentChange = (parliamentId) => {
        const newFilterValues = {
            ...filterValues,
            parliament: parliamentId,
            assembly: '',
            block: '',
            booth: ''
        };
        setFilterValues(newFilterValues);

        // Filter assemblies based on parliament
        const newAssemblies = assemblies.filter(assembly => assembly.parliament_id === parliamentId);
        setFilteredAssemblies(newAssemblies);
        setFilteredBlocks([]);
        setFilteredBooths([]);
    };

    // Handle assembly change
    const handleAssemblyChange = (assemblyId) => {
        const newFilterValues = {
            ...filterValues,
            assembly: assemblyId,
            block: '',
            booth: ''
        };
        setFilterValues(newFilterValues);

        // Filter blocks based on assembly
        const newBlocks = blocks.filter(block => block.assembly_id === assemblyId);
        setFilteredBlocks(newBlocks);
        setFilteredBooths([]);
    };

    // Handle block change
    const handleBlockChange = (blockId) => {
        const newFilterValues = {
            ...filterValues,
            block: blockId,
            booth: ''
        };
        setFilterValues(newFilterValues);

        // Filter booths based on block
        const newBooths = booths.filter(booth => booth.block_id === blockId);
        setFilteredBooths(newBooths);
    };

    const fetchReferenceData = async () => {
        try {
            const [
                statesRes,
                divisionsRes,
                parliamentsRes,
                assembliesRes,
                blocksRes,
                boothsRes
            ] = await Promise.all([
                fetch('http://localhost:5000/api/states'),
                fetch('http://localhost:5000/api/divisions'),
                fetch('http://localhost:5000/api/parliaments'),
                fetch('http://localhost:5000/api/assemblies'),
                fetch('http://localhost:5000/api/blocks'),
                fetch('http://localhost:5000/api/booths')
            ]);

            const [
                statesData,
                divisionsData,
                parliamentsData,
                assembliesData,
                blocksData,
                boothsData
            ] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                boothsRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) {
                setDivisions(divisionsData.data);
                setFilteredDivisions([]);
            }
            if (parliamentsData.success) {
                setParliaments(parliamentsData.data);
                setFilteredParliaments([]);
            }
            if (assembliesData.success) {
                setAssemblies(assembliesData.data);
                setFilteredAssemblies([]);
            }
            if (blocksData.success) {
                setBlocks(blocksData.data);
                setFilteredBlocks([]);
            }
            if (boothsData.success) {
                setBooths(boothsData.data);
                setFilteredBooths([]);
            }

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    const fetchWorkStatuses = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            let queryParams = [
                `page=${pageIndex + 1}`,
                `limit=${pageSize}`
            ];

            if (globalFilter) {
                queryParams.push(`search=${encodeURIComponent(globalFilter)}`);
            }

            if (appliedFilters.state) {
                queryParams.push(`state=${appliedFilters.state}`);
            }
            if (appliedFilters.division) {
                queryParams.push(`division=${appliedFilters.division}`);
            }
            if (appliedFilters.parliament) {
                queryParams.push(`parliament=${appliedFilters.parliament}`);
            }
            if (appliedFilters.assembly) {
                queryParams.push(`assembly=${appliedFilters.assembly}`);
            }
            if (appliedFilters.block) {
                queryParams.push(`block=${appliedFilters.block}`);
            }
            if (appliedFilters.booth) {
                queryParams.push(`booth=${appliedFilters.booth}`);
            }
            if (appliedFilters.workType) {
                queryParams.push(`workType=${appliedFilters.workType}`);
            }
            if (appliedFilters.status) {
                queryParams.push(`status=${appliedFilters.status}`);
            }

            const res = await fetch(`http://localhost:5000/api/work-status?${queryParams.join('&')}`);
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
            cell: ({ row }) => <Typography>{row.index + 1}</Typography>
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
            const res = await fetch('http://localhost:5000/api/work-status?all=true');
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
                            placeholder={`Search ${workStatuses.length} work statuses...`}
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
                                    value={filterValues.state}
                                    onChange={(e) => handleStateChange(e.target.value)}
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
                                    value={filterValues.division}
                                    onChange={(e) => handleDivisionChange(e.target.value)}
                                    label="Division"
                                    disabled={!filterValues.state}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {filteredDivisions.map((division) => (
                                        <MenuItem key={division._id} value={division._id}>{division.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Parliament</InputLabel>
                                <Select
                                    value={filterValues.parliament}
                                    onChange={(e) => handleParliamentChange(e.target.value)}
                                    label="Parliament"
                                    disabled={!filterValues.division}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {filteredParliaments.map((parliament) => (
                                        <MenuItem key={parliament._id} value={parliament._id}>{parliament.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Assembly</InputLabel>
                                <Select
                                    value={filterValues.assembly}
                                    onChange={(e) => handleAssemblyChange(e.target.value)}
                                    label="Assembly"
                                    disabled={!filterValues.parliament}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {filteredAssemblies.map((assembly) => (
                                        <MenuItem key={assembly._id} value={assembly._id}>{assembly.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Block</InputLabel>
                                <Select
                                    value={filterValues.block}
                                    onChange={(e) => handleBlockChange(e.target.value)}
                                    label="Block"
                                    disabled={!filterValues.assembly}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {filteredBlocks.map((block) => (
                                        <MenuItem key={block._id} value={block._id}>{block.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Booth</InputLabel>
                                <Select
                                    value={filterValues.booth}
                                    onChange={(e) => setFilterValues({ ...filterValues, booth: e.target.value })}
                                    label="Booth"
                                    disabled={!filterValues.block}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {filteredBooths.map((booth) => (
                                        <MenuItem key={booth._id} value={booth._id}>{booth.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Work Type</InputLabel>
                                <Select
                                    value={filterValues.workType}
                                    onChange={(e) => setFilterValues({ ...filterValues, workType: e.target.value })}
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
                                    value={filterValues.status}
                                    onChange={(e) => setFilterValues({ ...filterValues, status: e.target.value })}
                                    label="Status"
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="not_started">Not Started</MenuItem>
                                    <MenuItem value="in_progress">In Progress</MenuItem>
                                    <MenuItem value="completed">Completed</MenuItem>
                                    <MenuItem value="delayed">Delayed</MenuItem>
                                    <MenuItem value="cancelled">Cancelled</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Stack direction="row" spacing={1}>
                                <Button variant="contained" onClick={handleApplyFilters} sx={{ width: '50%' }}>
                                    Apply
                                </Button>
                                <Button variant="outlined" onClick={handleClearFilters} sx={{ width: '50%' }}>
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
