import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, TextField, MenuItem, Tooltip, Alert
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
import { usePermissions } from 'contexts/PermissionContext';
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';

import DistrictModal from './DistrictModal';
import AlertDistrictDelete from './AlertDistrictDelete';
import DistrictView from './DistritView';

export default function DistrictListPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel } = usePermissions();
    // Clear all filters and reload districts
    const handleClearFilter = () => {
        setFilters({
            state_id: '',
            division_id: '',
            parliament_id: '',
            assembly_id: ''
        });
        setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
        fetchDistricts(0, pagination.pageSize, globalFilter, {
            state_id: '',
            division_id: '',
            parliament_id: '',
            assembly_id: ''
        });
    };
    // Apply filters and fetch filtered districts
    const handleFilterApply = () => {
        setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
        fetchDistricts(0, pagination.pageSize, globalFilter, filters);
    };

    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [districtDeleteId, setDistrictDeleteId] = useState('');
    const [districts, setDistricts] = useState([]);
    const [allDistricts, setAllDistricts] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [users, setUsers] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState({
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: ''
    });

    const fetchAllDistrictsForFilters = async () => {
        try {
            const data = await fetchAllDataForFilters('/districts', {});
            setAllDistricts(data);
        } catch (error) {
            console.error('Failed to fetch all districts for filters:', error);
        }
    };

    const fetchReferenceData = async () => {
        try {
            const getAuthHeaders = () => {
                const token = localStorage.getItem('serviceToken');
                return token ? { Authorization: `Bearer ${token}` } : {};
            };

            const [statesRes, divisionsRes, parliamentsRes, assembliesRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`, { headers: getAuthHeaders() })
            ]);

            const [usersRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/users`, { headers: getAuthHeaders() })
            ]);

            const usersData = await usersRes.json();
            if (usersData.success) setUsers(usersData.data);

            const [statesData, divisionsData, parliamentsData, assembliesData] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    // Get user's access scope information
    const getUserAccessScope = () => {
        if (!userHierarchy) {
            return { level: 'All', description: 'You have access to all district data' };
        }

        const highestLevel = getUserHighestLevel();
        if (!highestLevel) {
            return { level: 'All', description: 'You have access to all district data' };
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
        const entity = userHierarchy[highestLevel];
        const entityName = entity?.name || (typeof entity === 'object' && entity !== null ? (entity.displayName || entity.title || String(entity._id || entity.id || '')) : String(entity || 'Unknown'));

        return {
            level: levelName,
            entity: entityName,
            description: `You have access to district data for ${entityName} ${levelName} and all areas within it`
        };
    };

    const accessScope = getUserAccessScope();

    const fetchDistricts = async (pageIndex, pageSize, globalFilter = '', currentFilters = filters) => {
        setLoading(true);
        try {
            const queryParams = [];
            if (globalFilter) queryParams.push(`search=${encodeURIComponent(globalFilter)}`);
            if (currentFilters.state_id) queryParams.push(`state=${encodeURIComponent(currentFilters.state_id)}`);
            if (currentFilters.division_id) queryParams.push(`division=${encodeURIComponent(currentFilters.division_id)}`);
            if (currentFilters.parliament_id) queryParams.push(`parliament=${encodeURIComponent(currentFilters.parliament_id)}`);
            if (currentFilters.assembly_id) queryParams.push(`assembly=${encodeURIComponent(currentFilters.assembly_id)}`);

            // Hierarchy-based filtering is handled automatically by the backend
            // via getUserPermissionsAndHierarchy middleware, so no need to add filters here

            const queryString = queryParams.length > 0 ? `&${queryParams.join('&')}` : '';
            const token = localStorage.getItem('serviceToken');
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/districts?page=${pageIndex + 1}&limit=${pageSize}${queryString}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            const json = await res.json();
            if (json.success) {
                setDistricts(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch districts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDistricts(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
        fetchAllDistrictsForFilters();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    const filterOptions = useFilterOptionsFromData(allDistricts, {
        states: { field: 'state_id', nameField: 'name' },
        divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
        parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
        assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' }
    });

    const handleDeleteOpen = (id) => {
        setDistrictDeleteId(id);
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
                                onClick={() => navigate(`/district/${row.original._id}`)}
                            >
                                <Eye />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton color="primary" onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDistrict(row.original);
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
        data: districts,
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

    const fetchAllDistrictsForCsv = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/districts?all=true`);
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all districts for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        try {
            const allData = await fetchAllDistrictsForCsv();
            setCsvData(allData.map(item => ({
                Name: item.name,
                State: item.state_id?.name || '',
                Division: item.division_id?.name || '',
                Parliament: item.parliament_id?.name || '',
                Assembly: item.assembly_id?.name || '',
                // Status: item.is_active ? 'Active' : 'Inactive',
                'Created By': item.created_by?.username || '',
                'Created At': item.created_at,
                'Updated At': item.updated_at
            })));
            setTimeout(() => {
                if (csvLinkRef.current) {
                    csvLinkRef.current.link.click();
                }
            }, 100);
        } catch (error) {
            console.error('Failed to generate CSV:', error);
        } finally {
            setCsvLoading(false);
        }
    };

    return (
        <>
            <MainCard content={false}>

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={40}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    justifyContent="space-between"
                    sx={{ p: 2 }}
                >     <DebouncedInput
                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={`Search ${districts.length} districts...`}
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
                            onClick={() => { setSelectedDistrict(null); setOpenModal(true); }}
                            size="small"
                        >
                            Add District
                        </Button>
                    </Stack>
                </Stack>

                {/* Access Scope Information */}
                <Alert
                    severity="info"
                    sx={{ m: 2 }}
                >
                    <Typography variant="body2">
                        <strong>Data Access:</strong> {accessScope.description}
                    </Typography>
                </Alert>

                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ p: 2, flexWrap: 'wrap' }}
                >
                    <TextField
                        select
                        label="State"
                        value={filters.state_id}
                        onChange={(e) => {
                            setFilters(prev => ({
                                ...prev,
                                state_id: e.target.value,
                                division_id: '',
                                parliament_id: '',
                                assembly_id: ''
                            }));
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

                    <TextField
                        select
                        label="Division"
                        value={filters.division_id}
                        onChange={(e) => {
                            setFilters(prev => ({
                                ...prev,
                                division_id: e.target.value,
                                parliament_id: '',
                                assembly_id: ''
                            }));
                        }}
                        sx={{ minWidth: 150 }}
                        size="small"
                        disabled={!filters.state_id}
                    >
                        <MenuItem value="">All Divisions</MenuItem>
                        {filterOptions.divisions?.filter(division => {
                            const stateId = division.state_id?._id || division.state_id;
                            return stateId === filters.state_id;
                        }).map((division) => (
                            <MenuItem key={division._id} value={division._id}>
                                {division.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Parliament"
                        value={filters.parliament_id}
                        onChange={(e) => {
                            setFilters(prev => ({
                                ...prev,
                                parliament_id: e.target.value,
                                assembly_id: ''
                            }));
                        }}
                        sx={{ minWidth: 150 }}
                        size="small"
                        disabled={!filters.division_id}
                    >
                        <MenuItem value="">All Parliaments</MenuItem>
                        {filterOptions.parliaments?.filter(parliament => {
                            const divisionId = parliament.division_id?._id || parliament.division_id;
                            return divisionId === filters.division_id;
                        }).map((parliament) => (
                            <MenuItem key={parliament._id} value={parliament._id}>
                                {parliament.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Assembly"
                        value={filters.assembly_id}
                        onChange={(e) => setFilters(prev => ({ ...prev, assembly_id: e.target.value }))}
                        sx={{ minWidth: 150 }}
                        size="small"
                        disabled={!filters.parliament_id}
                    >
                        <MenuItem value="">All Assemblies</MenuItem>
                        {filterOptions.assemblies?.filter(assembly => {
                            const parliamentId = assembly.parliament_id?._id || assembly.parliament_id;
                            return parliamentId === filters.parliament_id;
                        }).map((assembly) => (
                            <MenuItem key={assembly._id} value={assembly._id}>
                                {assembly.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <Button
                        variant="contained"
                        onClick={handleFilterApply}
                        size="small"
                    >
                        Apply
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={handleClearFilter}
                        size="small"
                    >
                        Clear
                    </Button>
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
                                        {row.getIsExpanded() && (
                                            <TableRow>
                                                <TableCell colSpan={row.getVisibleCells().length}>
                                                    <DistrictView data={row.original} />
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

            <DistrictModal
                open={openModal}
                modalToggler={setOpenModal}
                district={selectedDistrict}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                users={users}
                refresh={() => fetchDistricts(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertDistrictDelete
                id={districtDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchDistricts(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}
