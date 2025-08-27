import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, TextField, MenuItem
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

import LocalIssueModal from './LocalModal';
import AlertLocalIssueDelete from './AlertLocalDelete';
import LocalIssueView from './LocalView';

export default function LocalIssueListPage() {
    const theme = useTheme();

    const [selectedIssue, setSelectedIssue] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [issueDeleteId, setIssueDeleteId] = useState('');
    const [localIssues, setLocalIssues] = useState([]);
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
    const [selectedState, setSelectedState] = useState('');
    const [selectedDivision, setSelectedDivision] = useState('');
    const [selectedParliament, setSelectedParliament] = useState('');
    const [selectedAssembly, setSelectedAssembly] = useState('');
    const [selectedBlock, setSelectedBlock] = useState('');
    const [selectedBooth, setSelectedBooth] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedPriority, setSelectedPriority] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');

    // Temporary filter states
    const [tempFilters, setTempFilters] = useState({
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: '',
        booth: '',
        status: '',
        priority: '',
        department: ''
    });

    // Status and Priority options
    const statusOptions = ['Reported', 'In Progress', 'Resolved', 'Rejected'];
    const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];
    const departmentOptions = ['Education', 'Healthcare', 'Infrastructure', 'Transportation', 'Water Supply', 'Sanitation', 'Power Supply', 'Agriculture', 'Others'];

    // Filtered arrays for cascading dropdowns
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    // State -> Enable all dropdowns and filter by state
    useEffect(() => {
        if (tempFilters.state) {
            // Filter divisions by state
            const filteredDivs = divisions?.filter(division =>
                division.state_id?._id === tempFilters.state ||
                division.state_id === tempFilters.state
            ) || [];
            setFilteredDivisions(filteredDivs);

            // Filter parliaments by state (through divisions)
            const stateDivisionIds = filteredDivs.map(div => div._id);
            const filteredParls = parliaments?.filter(parliament => {
                const divId = parliament.division_id?._id || parliament.division_id;
                return stateDivisionIds.includes(divId);
            }) || [];
            setFilteredParliaments(filteredParls);

            // Filter assemblies by state (through parliaments)
            const stateParliamentIds = filteredParls.map(parl => parl._id);
            const filteredAssems = assemblies?.filter(assembly => {
                const parlId = assembly.parliament_id?._id || assembly.parliament_id;
                return stateParliamentIds.includes(parlId);
            }) || [];
            setFilteredAssemblies(filteredAssems);

            // Filter blocks by state (through assemblies)
            const stateAssemblyIds = filteredAssems.map(assem => assem._id);
            const filteredBlks = blocks?.filter(block => {
                const assemId = block.assembly_id?._id || block.assembly_id;
                return stateAssemblyIds.includes(assemId);
            }) || [];
            setFilteredBlocks(filteredBlks);

            // Filter booths by state (through blocks)
            const stateBlockIds = filteredBlks.map(block => block._id);
            const filteredBths = booths?.filter(booth => {
                const blockId = booth.block_id?._id || booth.block_id;
                return stateBlockIds.includes(blockId);
            }) || [];
            setFilteredBooths(filteredBths);

        } else {
            // If no state selected, show all options
            setFilteredDivisions(divisions || []);
            setFilteredParliaments(parliaments || []);
            setFilteredAssemblies(assemblies || []);
            setFilteredBlocks(blocks || []);
            setFilteredBooths(booths || []);
        }
    }, [tempFilters.state, divisions, parliaments, assemblies, blocks, booths]);

    const fetchReferenceData = async () => {
        try {
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/booths`)
            ]);

            const [statesData, divisionsData, parliamentsData, assembliesData, blocksData, boothsData] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                boothsRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (blocksData.success) setBlocks(blocksData.data);
            if (boothsData.success) setBooths(boothsData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    const fetchLocalIssues = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            let query = globalFilter ? `&search=${encodeURIComponent(globalFilter)}` : '';
            if (selectedState) query += `&state=${selectedState}`;
            if (selectedDivision) query += `&division=${selectedDivision}`;
            if (selectedParliament) query += `&parliament=${selectedParliament}`;
            if (selectedAssembly) query += `&assembly=${selectedAssembly}`;
            if (selectedBlock) query += `&block=${selectedBlock}`;
            if (selectedBooth) query += `&booth=${selectedBooth}`;
            if (selectedStatus) query += `&status=${encodeURIComponent(selectedStatus)}`;
            if (selectedPriority) query += `&priority=${encodeURIComponent(selectedPriority)}`;
            if (selectedDepartment) query += `&department=${encodeURIComponent(selectedDepartment)}`;

            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/local-issues?page=${pageIndex + 1}&limit=${pageSize}${query}`);
            const json = await res.json();

            if (json.success) {
                setLocalIssues(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch local issues:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocalIssues(pagination.pageIndex, pagination.pageSize, globalFilter);
    }, [
        pagination.pageIndex,
        pagination.pageSize,
        globalFilter,
        selectedState,
        selectedDivision,
        selectedParliament,
        selectedAssembly,
        selectedBlock,
        selectedBooth,
        selectedStatus,
        selectedPriority,
        selectedDepartment
    ]);

    useEffect(() => {
        fetchReferenceData();
    }, []);

    const handleDeleteOpen = (id) => {
        setIssueDeleteId(id);
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

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Low': return 'success';
            case 'Medium': return 'info';
            case 'High': return 'warning';
            case 'Critical': return 'error';
            default: return 'default';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Reported': return 'info';
            case 'In Progress': return 'warning';
            case 'Resolved': return 'success';
            case 'Rejected': return 'error';
            default: return 'default';
        }
    };

    const columns = useMemo(() => [
        {
            header: '#',
            accessorKey: '_id',
               cell: ({ row, table }) => {
                    const { pageIndex, pageSize } = table.getState().pagination;
                    const serialNumber = pageIndex * pageSize + row.index + 1;
                    return <Typography>{serialNumber}</Typography>;
                },
            size: 60
        },
        {
            header: 'Issue Name',
            accessorKey: 'issue_name',
            cell: ({ getValue }) => (
                <Typography sx={{
                    minWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue()}
                </Typography>
            ),
            size: 250
        },
        {
            header: 'Department',
            accessorKey: 'department',
            cell: ({ getValue }) => (
                <Typography sx={{
                    minWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue()}
                </Typography>
            ),
            size: 180
        },
        {
            header: 'Description',
            accessorKey: 'description',
            cell: ({ getValue }) => (
                <Typography sx={{
                    minWidth: 200,
                    maxWidth: 300,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue() || 'N/A'}
                </Typography>
            ),
            size: 300
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()}
                    color={getStatusColor(getValue())}
                    size="small"
                />
            ),
            size: 120
        },
        {
            header: 'Priority',
            accessorKey: 'priority',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()}
                    color={getPriorityColor(getValue())}
                    size="small"
                    variant="outlined"
                />
            ),
            size: 120
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
            ),
            size: 150
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
            ),
            size: 150
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
            ),
            size: 150
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
            ),
            size: 150
        },
        {
            header: 'Block',
            accessorKey: 'block_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="success"
                    size="small"
                    variant="outlined"
                />
            ),
            size: 150
        },
        {
            header: 'Booth',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="error"
                    size="small"
                    variant="outlined"
                />
            ),
            size: 150
        },
        {
            header: 'Booth Number',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.booth_number || 'N/A'}
                    color="error"
                    size="small"
                    variant="outlined"
                />
            ),
            size: 150
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
                <Typography>
                    {getValue()?.username || 'N/A'}
                </Typography>
            ),
            size: 150
        },
        {
            header: 'Updated By',
            accessorKey: 'updated_by',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.username || 'N/A'}
                </Typography>
            ),
            size: 150
        },
        {
            header: 'Created At',
            accessorKey: 'created_at',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>,
            size: 120
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
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedIssue(row.original); setOpenModal(true); }}>
                            <Edit />
                        </IconButton>
                        <IconButton color="error" onClick={(e) => { e.stopPropagation(); handleDeleteOpen(row.original._id); }}>
                            <Trash />
                        </IconButton>
                    </Stack>
                );
            },
            size: 150
        }
    ], [theme]);

    const table = useReactTable({
        data: localIssues,
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

    const fetchAllLocalIssuesForCsv = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/local-issues?all=true`);
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all local issues for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllLocalIssuesForCsv();
        setCsvData(allData.map(item => ({
            'Issue Name': item.issue_name,
            'Department': item.department,
            'Description': item.description,
            'Status': item.status,
            'Priority': item.priority,
            'State': item.state_id?.name || '',
            'Division': item.division_id?.name || '',
            'Parliament': item.parliament_id?.name || '',
            'Assembly': item.assembly_id?.name || '',
            'Block': item.block_id?.name || '',
            'Booth': item.booth_id?.name || '',
            'Booth Number': item.booth_id?.booth_number || '',
            'Created By': item.created_by?.username || '',
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
                        placeholder={`Search ${localIssues.length} issues...`}
                    />

                    <Stack direction="row" spacing={1}>
                        <CSVLink
                            data={csvData}
                            filename="local_issues_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
                        <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                            {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedIssue(null); setOpenModal(true); }}>
                            Add Local Issue
                        </Button>
                    </Stack>
                </Stack>

                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ p: 2, flexWrap: "wrap", gap: 2 }}
                >
                    <TextField
                        select
                        label="State"
                        size="small"
                        value={tempFilters.state}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, state: e.target.value }))}
                        sx={{ width: 200, mb: 2 }}
                    >
                        <MenuItem value="">Select State</MenuItem>
                        {states.map(state => (
                            <MenuItem key={state._id} value={state._id}>{state.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Division"
                        size="small"
                        value={tempFilters.division}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, division: e.target.value }))}
                        sx={{ width: 200, mb: 2 }}
                        disabled={!tempFilters.state}
                    >
                        <MenuItem value="">Select Division</MenuItem>
                        {filteredDivisions.map(division => (
                            <MenuItem key={division._id} value={division._id}>{division.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Parliament"
                        size="small"
                        value={tempFilters.parliament}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, parliament: e.target.value }))}
                        sx={{ width: 200, mb: 2 }}
                        disabled={!tempFilters.state}
                    >
                        <MenuItem value="">Select Parliament</MenuItem>
                        {filteredParliaments.map(parliament => (
                            <MenuItem key={parliament._id} value={parliament._id}>{parliament.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Assembly"
                        size="small"
                        value={tempFilters.assembly}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, assembly: e.target.value }))}
                        sx={{ width: 200, mb: 2 }}
                        disabled={!tempFilters.state}
                    >
                        <MenuItem value="">Select Assembly</MenuItem>
                        {filteredAssemblies.map(assembly => (
                            <MenuItem key={assembly._id} value={assembly._id}>{assembly.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Block"
                        size="small"
                        value={tempFilters.block}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, block: e.target.value }))}
                        sx={{ width: 200, mb: 2 }}
                        disabled={!tempFilters.state}
                    >
                        <MenuItem value="">Select Block</MenuItem>
                        {filteredBlocks.map(block => (
                            <MenuItem key={block._id} value={block._id}>{block.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Booth"
                        size="small"
                        value={tempFilters.booth}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, booth: e.target.value }))}
                        sx={{ width: 200, mb: 2 }}
                        disabled={!tempFilters.state}
                    >
                        <MenuItem value="">Select Booth</MenuItem>
                        {filteredBooths.map(booth => (
                            <MenuItem key={booth._id} value={booth._id}>{booth.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Status"
                        size="small"
                        value={tempFilters.status}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, status: e.target.value }))}
                        sx={{ width: 200, mb: 2 }}
                    >
                        <MenuItem value="">Select Status</MenuItem>
                        {statusOptions.map(status => (
                            <MenuItem key={status} value={status}>{status}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Priority"
                        size="small"
                        value={tempFilters.priority}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, priority: e.target.value }))}
                        sx={{ width: 200, mb: 2 }}
                    >
                        <MenuItem value="">Select Priority</MenuItem>
                        {priorityOptions.map(priority => (
                            <MenuItem key={priority} value={priority}>{priority}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Department"
                        size="small"
                        value={tempFilters.department}
                        onChange={(e) => setTempFilters(prev => ({ ...prev, department: e.target.value }))}
                        sx={{ width: 200, mb: 2 }}
                    >
                        <MenuItem value="">Select Department</MenuItem>
                        {departmentOptions.map(dept => (
                            <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                        ))}
                    </TextField>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            // Apply filters
                            setSelectedState(tempFilters.state);
                            setSelectedDivision(tempFilters.division);
                            setSelectedParliament(tempFilters.parliament);
                            setSelectedAssembly(tempFilters.assembly);
                            setSelectedBlock(tempFilters.block);
                            setSelectedBooth(tempFilters.booth);
                            setSelectedStatus(tempFilters.status);
                            setSelectedPriority(tempFilters.priority);
                            setSelectedDepartment(tempFilters.department);

                            // Reset pagination to first page
                            setPagination(prev => ({ ...prev, pageIndex: 0 }));
                        }}
                        sx={{ height: 40, alignSelf: 'flex-start' }}
                    >
                        Apply
                    </Button>

                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => {
                            // Reset all filters
                            setTempFilters({
                                state: '',
                                division: '',
                                parliament: '',
                                assembly: '',
                                block: '',
                                booth: '',
                                status: '',
                                priority: '',
                                department: ''
                            });
                            setSelectedState('');
                            setSelectedDivision('');
                            setSelectedParliament('');
                            setSelectedAssembly('');
                            setSelectedBlock('');
                            setSelectedBooth('');
                            setSelectedStatus('');
                            setSelectedPriority('');
                            setSelectedDepartment('');

                            // Reset pagination to first page
                            setPagination(prev => ({ ...prev, pageIndex: 0 }));
                        }}
                        sx={{ height: 40, alignSelf: 'flex-start' }}
                    >
                        Clear
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
                                                sx={{
                                                    cursor: header.column.getCanSort() ? 'pointer' : 'default',
                                                    width: header.getSize(),
                                                    minWidth: header.getSize()
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
                                                <TableCell
                                                    key={cell.id}
                                                    sx={{
                                                        width: cell.column.getSize(),
                                                        minWidth: cell.column.getSize()
                                                    }}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                        {row.getIsExpanded() && (
                                            <TableRow>
                                                <TableCell colSpan={row.getVisibleCells().length}>
                                                    <LocalIssueView data={row.original} />
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
            </MainCard >

            <LocalIssueModal
                open={openModal}
                modalToggler={setOpenModal}
                localIssue={selectedIssue}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                refresh={() => fetchLocalIssues(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertLocalIssueDelete
                id={issueDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchLocalIssues(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}
