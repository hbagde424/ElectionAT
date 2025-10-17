import React, { useState, useEffect, useMemo, Fragment, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Chip,
    Grid,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tooltip,
    Divider,
    Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    flexRender,
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel
} from '@tanstack/react-table';
import { Add, Edit, Eye, Trash } from 'iconsax-react';
import { CSVLink } from 'react-csv';

// Project imports
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import EmptyReactTable from 'pages/tables/react-table/empty';
import { HeaderSort, TablePagination } from 'components/third-party/react-table';
import axiosServices from 'utils/axios';
import { usePermissions } from 'contexts/PermissionContext';

// Local imports
import SamitiModal from './SamitiModal';
import AlertSamitiDelete from './AlertSamitiDelete';

const SamitiListPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel } = usePermissions();
    
    const [samitis, setSamitis] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState({ open: false, id: null });
    const [globalFilter, setGlobalFilter] = useState('');
    const [searchInput, setSearchInput] = useState('');
    
    // Reference data
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    
    // Filters
    const [filterValues, setFilterValues] = useState({
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: '',
        booth: '',
        village: '',
        falia: ''
    });
    const [appliedFilters, setAppliedFilters] = useState({
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: '',
        booth: '',
        village: '',
        falia: ''
    });
    
    // CSV functionality
    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setGlobalFilter(searchInput);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchInput]);

    // Keep local input in sync when globalFilter changes
    useEffect(() => {
        setSearchInput(globalFilter || '');
    }, [globalFilter]);

    // Get user's access scope information
    const getUserAccessScope = () => {
        if (!userHierarchy) {
            return { level: 'All', description: 'You have access to all samiti data' };
        }

        const highestLevel = getUserHighestLevel();
        if (!highestLevel) {
            return { level: 'All', description: 'You have access to all samiti data' };
        }

        const levelNames = {
            state: 'State',
            division: 'Division',
            parliament: 'Parliament',
            assembly: 'Assembly',
            block: 'Block',
            booth: 'Booth'
        };

        const levelName = levelNames[highestLevel] || highestLevel;
        const entityName = userHierarchy[highestLevel]?.name || 'Unknown';

        return {
            level: levelName,
            entity: entityName,
            description: `You have access to samiti data for ${entityName} ${levelName} and all areas within it`
        };
    };

    const accessScope = getUserAccessScope();

    // Filtered data for cascading dropdowns
    const filteredDivisions = filterValues.state
        ? divisions.filter(division => {
            const stateId = division.state_id?._id || division.state_id;
            return stateId === filterValues.state;
        })
        : [];

    const filteredParliaments = filterValues.division
        ? parliaments.filter(parliament => {
            const divisionId = parliament.division_id?._id || parliament.division_id;
            return divisionId === filterValues.division;
        })
        : filterValues.state
            ? parliaments.filter(parliament => {
                const stateId = parliament.state_id?._id || parliament.state_id;
                return stateId === filterValues.state;
            })
            : [];

    const filteredAssemblies = filterValues.parliament
        ? assemblies.filter(assembly => {
            const parliamentId = assembly.parliament_id?._id || assembly.parliament_id;
            return parliamentId === filterValues.parliament;
        })
        : filterValues.division
            ? assemblies.filter(assembly => {
                const divisionId = assembly.division_id?._id || assembly.division_id;
                return divisionId === filterValues.division;
            })
            : [];

    const filteredBlocks = filterValues.assembly
        ? blocks.filter(block => {
            const assemblyId = block.assembly_id?._id || block.assembly_id;
            return assemblyId === filterValues.assembly;
        })
        : [];

    const filteredBooths = filterValues.block
        ? booths.filter(booth => {
            const blockId = booth.block_id?._id || booth.block_id;
            return blockId === filterValues.block;
        })
        : [];

    const fetchSamitis = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            let queryParams = [
                `page=${pageIndex + 1}`,
                `limit=${pageSize}`
            ];

            if (globalFilter) {
                queryParams.push(`search=${encodeURIComponent(globalFilter)}`);
            }

            // Apply filters
            if (appliedFilters.state) queryParams.push(`state_id=${appliedFilters.state}`);
            if (appliedFilters.division) queryParams.push(`division_id=${appliedFilters.division}`);
            if (appliedFilters.parliament) queryParams.push(`parliament_id=${appliedFilters.parliament}`);
            if (appliedFilters.assembly) queryParams.push(`assembly_id=${appliedFilters.assembly}`);
            if (appliedFilters.block) queryParams.push(`block_id=${appliedFilters.block}`);
            if (appliedFilters.booth) queryParams.push(`booth_id=${appliedFilters.booth}`);
            if (appliedFilters.village) queryParams.push(`village=${encodeURIComponent(appliedFilters.village)}`);
            if (appliedFilters.falia) queryParams.push(`falia=${encodeURIComponent(appliedFilters.falia)}`);

            const { data: json } = await axiosServices.get(`/samitis?${queryParams.join('&')}`);
            if (json.success) {
                setSamitis(json.data);
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
            const [
                statesRes, divisionsRes, parliamentsRes,
                assembliesRes, blocksRes, boothsRes
            ] = await Promise.all([
                axiosServices.get('/states'),
                axiosServices.get('/divisions'),
                axiosServices.get('/parliaments'),
                axiosServices.get('/assemblies'),
                axiosServices.get('/blocks'),
                axiosServices.get('/booths')
            ]);

            if (statesRes.data.success) setStates(statesRes.data.data);
            if (divisionsRes.data.success) setDivisions(divisionsRes.data.data);
            if (parliamentsRes.data.success) setParliaments(parliamentsRes.data.data);
            if (assembliesRes.data.success) setAssemblies(assembliesRes.data.data);
            if (blocksRes.data.success) setBlocks(blocksRes.data.data);
            if (boothsRes.data.success) setBooths(boothsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    useEffect(() => {
        fetchSamitis(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, appliedFilters]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    const handleApplyFilters = () => {
        setAppliedFilters(filterValues);
        setPagination({ pageIndex: 0, pageSize: 10 });
    };

    const handleClearFilters = () => {
        const emptyFilters = {
            state: '',
            division: '',
            parliament: '',
            assembly: '',
            block: '',
            booth: '',
            village: '',
            falia: ''
        };
        setFilterValues(emptyFilters);
        setAppliedFilters(emptyFilters);
        setPagination({ pageIndex: 0, pageSize: 10 });
    };

    // Handle cascading filter changes
    const handleStateChange = (stateValue) => {
        setFilterValues({
            ...filterValues,
            state: stateValue,
            division: '',
            parliament: '',
            assembly: '',
            block: '',
            booth: ''
        });
    };

    const handleDivisionChange = (divisionValue) => {
        setFilterValues({
            ...filterValues,
            division: divisionValue,
            parliament: '',
            assembly: '',
            block: '',
            booth: ''
        });
    };

    const handleParliamentChange = (parliamentValue) => {
        setFilterValues({
            ...filterValues,
            parliament: parliamentValue,
            assembly: '',
            block: '',
            booth: ''
        });
    };

    const handleAssemblyChange = (assemblyValue) => {
        setFilterValues({
            ...filterValues,
            assembly: assemblyValue,
            block: '',
            booth: ''
        });
    };

    const handleBlockChange = (blockValue) => {
        setFilterValues({
            ...filterValues,
            block: blockValue,
            booth: ''
        });
    };

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        try {
            let queryParams = ['all=true'];
            
            // Apply same filters for CSV export
            if (appliedFilters.state) queryParams.push(`state_id=${appliedFilters.state}`);
            if (appliedFilters.division) queryParams.push(`division_id=${appliedFilters.division}`);
            if (appliedFilters.parliament) queryParams.push(`parliament_id=${appliedFilters.parliament}`);
            if (appliedFilters.assembly) queryParams.push(`assembly_id=${appliedFilters.assembly}`);
            if (appliedFilters.block) queryParams.push(`block_id=${appliedFilters.block}`);
            if (appliedFilters.booth) queryParams.push(`booth_id=${appliedFilters.booth}`);
            if (appliedFilters.village) queryParams.push(`village=${encodeURIComponent(appliedFilters.village)}`);
            if (appliedFilters.falia) queryParams.push(`falia=${encodeURIComponent(appliedFilters.falia)}`);

            const { data: json } = await axiosServices.get(`/samitis?${queryParams.join('&')}`);

            if (json.success) {
                const csvData = json.data.map(item => ({
                    'Samiti Name': item.samiti_name || '',
                    'Village': item.village || '',
                    'Falia': item.falia || '',
                    'Count': item.count || 0,
                    'State': item.state_id?.name || '',
                    'Division': item.division_id?.name || '',
                    'Parliament': item.parliament_id?.name || '',
                    'Assembly': item.assembly_id?.name || '',
                    'Block': item.block_id?.name || '',
                    'Booth': item.booth_id?.name || '',
                    'Created By': item.created_by?.username || '',
                    'Created At': item.created_at ? new Date(item.created_at).toLocaleString('en-IN') : '',
                    'Updated At': item.updated_at ? new Date(item.updated_at).toLocaleString('en-IN') : ''
                }));

                setCsvData(csvData);
                setTimeout(() => {
                    if (csvLinkRef.current) {
                        csvLinkRef.current.link.click();
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Failed to generate CSV:', error);
        } finally {
            setCsvLoading(false);
        }
    };

    const columns = useMemo(() => [
        {
            header: '#',
            accessorKey: '_id',
            cell: ({ row }) => <Typography>{row.index + 1}</Typography>
        },
        {
            header: 'Samiti Name',
            accessorKey: 'samiti_name',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Village',
            accessorKey: 'village',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Falia',
            accessorKey: 'falia',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Count',
            accessorKey: 'count',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 0}
                    color="primary"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'State',
            accessorKey: 'state_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.name || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Division',
            accessorKey: 'division_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.name || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Assembly',
            accessorKey: 'assembly_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.name || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Block',
            accessorKey: 'block_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.name || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Booth',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.name || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Created At',
            accessorKey: 'created_at',
            cell: ({ getValue }) => (
                <Typography>
                    {formatDate(getValue())}
                </Typography>
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
                                onClick={() => navigate(`/samitis/${row.original._id}`)}
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
    ], [navigate]);

    const table = useReactTable({
        data: samitis,
        columns,
        state: { pagination, globalFilter },
        pageCount,
        manualPagination: true,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel()
    });

    if (loading) return <EmptyReactTable />;

    return (
        <>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <MainCard content={false}>
                        <Stack spacing={2} sx={{ padding: 3 }}>
                            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                                <TextField
                                    size="small"
                                    variant="outlined"
                                    placeholder={`Search ${samitis.length} samitis...`}
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    sx={{ minWidth: 300 }}
                                />
                                <Stack direction="row" spacing={1}>
                                    <CSVLink
                                        data={csvData}
                                        filename="samitis_all.csv"
                                        style={{ display: 'none' }}
                                        ref={csvLinkRef}
                                    />
                                    <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                                        {csvLoading ? 'Preparing CSV...' : 'Download CSV'}
                                    </Button>
                                    <Button variant="contained" startIcon={<Add />} onClick={() => { setEditData(null); setOpenModal(true); }}>
                                        Add Samiti
                                    </Button>
                                </Stack>
                            </Stack>

                            {/* Access Scope Information */}
                            <Alert severity="info">
                                <Typography variant="body2">
                                    <strong>Data Access:</strong> {accessScope.description}
                                </Typography>
                            </Alert>

                            {/* Filters Section */}
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>State</InputLabel>
                                        <Select
                                            value={filterValues.state}
                                            onChange={(e) => handleStateChange(e.target.value)}
                                            label="State"
                                        >
                                            <MenuItem value="">All States</MenuItem>
                                            {states.map((state) => (
                                                <MenuItem key={state._id} value={state._id}>
                                                    {state.name}
                                                </MenuItem>
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
                                            <MenuItem value="">
                                                {!filterValues.state ? "Select State First" : "All Divisions"}
                                            </MenuItem>
                                            {filteredDivisions.map((division) => (
                                                <MenuItem key={division._id} value={division._id}>
                                                    {division.name}
                                                </MenuItem>
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
                                            <MenuItem value="">
                                                {!filterValues.division ? "Select Division First" : "All Parliaments"}
                                            </MenuItem>
                                            {filteredParliaments.map((parliament) => (
                                                <MenuItem key={parliament._id} value={parliament._id}>
                                                    {parliament.name}
                                                </MenuItem>
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
                                            <MenuItem value="">
                                                {!filterValues.parliament ? "Select Parliament First" : "All Assemblies"}
                                            </MenuItem>
                                            {filteredAssemblies.map((assembly) => (
                                                <MenuItem key={assembly._id} value={assembly._id}>
                                                    {assembly.name}
                                                </MenuItem>
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
                                            <MenuItem value="">
                                                {!filterValues.assembly ? "Select Assembly First" : "All Blocks"}
                                            </MenuItem>
                                            {filteredBlocks.map((block) => (
                                                <MenuItem key={block._id} value={block._id}>
                                                    {block.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Booth</InputLabel>
                                        <Select
                                            value={filterValues.booth}
                                            onChange={(e) => setFilterValues(prev => ({ ...prev, booth: e.target.value }))}
                                            label="Booth"
                                            disabled={!filterValues.block}
                                        >
                                            <MenuItem value="">
                                                {!filterValues.block ? "Select Block First" : "All Booths"}
                                            </MenuItem>
                                            {filteredBooths.map((booth) => (
                                                <MenuItem key={booth._id} value={booth._id}>
                                                    {booth.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Village"
                                        value={filterValues.village}
                                        onChange={(e) => setFilterValues(prev => ({ ...prev, village: e.target.value }))}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Falia"
                                        value={filterValues.falia}
                                        onChange={(e) => setFilterValues(prev => ({ ...prev, falia: e.target.value }))}
                                    />
                                </Grid>

                                {/* Filter Buttons */}
                                <Grid item xs={12}>
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Button
                                            variant="contained"
                                            onClick={handleApplyFilters}
                                            size="small"
                                            color="primary"
                                        >
                                            Apply Filters
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={handleClearFilters}
                                            size="small"
                                        >
                                            Clear Filters
                                        </Button>
                                    </Stack>
                                </Grid>
                            </Grid>
                        </Stack>

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
                </Grid>
            </Grid>

            <SamitiModal
                open={openModal}
                modalToggler={setOpenModal}
                samiti={editData}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                refresh={() => fetchSamitis(pagination.pageIndex, pagination.pageSize, globalFilter)}
            />

            <AlertSamitiDelete
                open={deleteAlert.open}
                handleClose={() => setDeleteAlert({ open: false, id: null })}
                id={deleteAlert.id}
                refresh={() => fetchSamitis(pagination.pageIndex, pagination.pageSize, globalFilter)}
            />
        </>
    );
};

export default SamitiListPage;