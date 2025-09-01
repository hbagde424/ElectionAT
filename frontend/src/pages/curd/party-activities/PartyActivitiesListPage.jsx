// PartyActivitiesListPage.jsx
import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, TextField,
    FormControl, InputLabel, Select, MenuItem
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

import PartyActivitiesModal from './PartyActivitiesModal';
import AlertPartyActivitiesDelete from './AlertPartyActivitiesDelete';
import PartyActivitiesView from './PartyActivitiesView';

export default function PartyActivitiesListPage() {
    const theme = useTheme();

    const [selectedPartyActivity, setSelectedPartyActivity] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [partyActivityDeleteId, setPartyActivityDeleteId] = useState('');
    const [partyActivities, setPartyActivities] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [parties, setParties] = useState([]);
    const [users, setUsers] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState({});
    const [appliedFilters, setAppliedFilters] = useState({});

    // Handle filter changes
    const handleFilterChange = (field, value) => {
        const newFilters = { ...filters, [field]: value };

        // Clear dependent fields when parent field changes
        switch (field) {
            case 'state_id':
                newFilters.division_id = '';
                newFilters.parliament_id = '';
                newFilters.assembly_id = '';
                newFilters.block_id = '';
                newFilters.booth_id = '';
                break;
            case 'division_id':
                newFilters.parliament_id = '';
                newFilters.assembly_id = '';
                newFilters.block_id = '';
                newFilters.booth_id = '';
                break;
            case 'parliament_id':
                newFilters.assembly_id = '';
                newFilters.block_id = '';
                newFilters.booth_id = '';
                break;
            case 'assembly_id':
                newFilters.block_id = '';
                newFilters.booth_id = '';
                break;
            case 'block_id':
                newFilters.booth_id = '';
                break;
            default:
                break;
        }

        setFilters(newFilters);
    };

    const fetchReferenceData = async () => {
        try {
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes, partiesRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/booths`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parties`)
            ]);


            const token = localStorage.getItem('serviceToken');

            const [usersRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/users`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            ]);

            const usersData = await usersRes.json();
            if (usersData.success) setUsers(usersData.data);

            const [statesData, divisionsData, parliamentsData, assembliesData, blocksData, boothsData, partiesData] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                boothsRes.json(),
                partiesRes.json()
            ]);


            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (blocksData.success) setBlocks(blocksData.data);
            if (boothsData.success) setBooths(boothsData.data);
            if (partiesData.success) setParties(partiesData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };



    const fetchPartyActivities = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            // Build query parameters
            const queryParams = new URLSearchParams({
                page: pageIndex + 1,
                limit: pageSize,
                ...(globalFilter && { search: globalFilter }),
                // Filters
                ...(appliedFilters.state_id && { state_id: appliedFilters.state_id }),
                ...(appliedFilters.division_id && { division_id: appliedFilters.division_id }),
                ...(appliedFilters.parliament_id && { parliament_id: appliedFilters.parliament_id }),
                ...(appliedFilters.assembly_id && { assembly_id: appliedFilters.assembly_id }),
                ...(appliedFilters.block_id && { block_id: appliedFilters.block_id }),
                ...(appliedFilters.booth_id && { booth_id: appliedFilters.booth_id }),
                ...(appliedFilters.activity_type && { activity_type: appliedFilters.activity_type }),
                ...(appliedFilters.status && { status: appliedFilters.status })
            });

            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/party-activities?${queryParams}`);
            const json = await res.json();
            if (json.success) {
                setPartyActivities(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch party activities:', error);
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchPartyActivities(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, appliedFilters]);

    const handleDeleteOpen = (id) => {
        setPartyActivityDeleteId(id);
        setOpenDelete(true);
    };

    const handleDeleteClose = () => setOpenDelete(false);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'scheduled':
                return 'info';
            case 'ongoing':
                return 'warning';
            case 'completed':
                return 'success';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

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
            header: 'Title',
            accessorKey: 'title',
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
            header: 'Activity Type',
            accessorKey: 'activity_type',
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
            header: 'Block',
            accessorKey: 'block_id',
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
            header: 'Booth',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() ? `${getValue().name} (${getValue().booth_number})` : 'N/A'}
                    color="success"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Description',
            accessorKey: 'description',
            cell: ({ getValue }) => (
                <Typography sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Activity Date',
            accessorKey: 'activity_date',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'End Date',
            accessorKey: 'end_date',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'Location',
            accessorKey: 'location',
            cell: ({ getValue }) => <Typography>{getValue() || 'N/A'}</Typography>
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.toUpperCase() || 'N/A'}
                    color={getStatusColor(getValue())}
                    size="small"
                />
            )
        },
        {
            header: 'Attendance',
            accessorKey: 'attendance_count',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() ? getValue().toLocaleString() : 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Media Coverage',
            accessorKey: 'media_coverage',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() ? 'Yes' : 'No'}
                    color={getValue() ? 'success' : 'default'}
                    size="small"
                />
            )
        },
        {
            header: 'Media Links',
            accessorKey: 'media_links',
            cell: ({ getValue }) => (
                Array.isArray(getValue()) && getValue().length > 0
                    ? getValue().map((link, idx) => (
                        <img key={idx} src={link} alt={`media-link-${idx}`} style={{ maxWidth: '100px', display: 'block', marginBottom: '4px' }} />
                    ))
                    : 'N/A'
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
            cell: ({ getValue }) => {
                const value = getValue();
                if (!value) return <Typography>N/A</Typography>;
                const date = new Date(value);
                const formatted = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                return <Typography>{formatted}</Typography>;
            }
        },
        {
            header: 'Updated At',
            accessorKey: 'updated_at',
            cell: ({ getValue }) => {
                const value = getValue();
                if (!value) return <Typography>N/A</Typography>;
                const date = new Date(value);
                const formatted = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                return <Typography>{formatted}</Typography>;
            }
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
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedPartyActivity(row.original); setOpenModal(true); }}>
                            <Edit />
                        </IconButton>
                        <IconButton color="error" onClick={(e) => { e.stopPropagation(); handleDeleteOpen(row.original._id); }}>
                            <Trash />
                        </IconButton>
                    </Stack>
                );
            }
        }
    ], [theme]);

    const table = useReactTable({
        data: partyActivities,
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

    // Helper to fetch all party activities for CSV
    const fetchAllPartyActivitiesForCsv = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/party-activities?all=true`);
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all party activities for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllPartyActivitiesForCsv();
        setCsvData(allData.map(item => ({
            Title: item.title,
            'Activity Type': item.activity_type,
            State: item.state_id?.name || '',
            Division: item.division_id?.name || '',
            Parliament: item.parliament_id?.name || '',
            Assembly: item.assembly_id?.name || '',
            Block: item.block_id?.name || '',
            Booth: item.booth_id ? `${item.booth_id.name} (${item.booth_id.booth_number})` : '',
            Description: item.description,
            'Activity Date': item.activity_date,
            'End Date': item.end_date,
            Location: item.location,
            Status: item.status,
            Attendance: item.attendance_count,
            'Media Coverage': item.media_coverage ? 'Yes' : 'No',
            'Media Links': Array.isArray(item.media_links) ? item.media_links.join(', ') : '',
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
                        placeholder={`Search ${partyActivities.length} party activities...`}
                    />

                    <Stack direction="row" spacing={1}>
                        <CSVLink
                            data={csvData}
                            filename="party_activities_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
                        <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                            {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedPartyActivity(null); setOpenModal(true); }}>
                            Add Party Activity
                        </Button>

                    </Stack>
                </Stack>
                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ p: 2, flexWrap: "wrap", gap: 2 }}
                >

                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Activity Type</InputLabel>
                        <Select
                            value={filters?.activity_type || ''}
                            onChange={(e) => handleFilterChange('activity_type', e.target.value)}
                            label="Activity Type"
                            size="small"
                        >
                            <MenuItem value="">All Types</MenuItem>
                            <MenuItem value="rally">Rally</MenuItem>
                            <MenuItem value="sabha">Sabha</MenuItem>
                            <MenuItem value="meeting">Meeting</MenuItem>
                            <MenuItem value="campaign">Campaign</MenuItem>
                            <MenuItem value="door_to_door">Door to Door</MenuItem>
                            <MenuItem value="press_conference">Press Conference</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Status Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filters?.status || ''}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            label="Status"
                            size="small"
                        >
                            <MenuItem value="">All Status</MenuItem>
                            <MenuItem value="scheduled">Scheduled</MenuItem>
                            <MenuItem value="ongoing">Ongoing</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                    </FormControl>

                    {/* State Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>State</InputLabel>
                        <Select
                            value={filters?.state_id || ''}
                            onChange={(e) => handleFilterChange('state_id', e.target.value)}
                            label="State"
                            size="small"
                        >
                            <MenuItem value="">All States</MenuItem>
                            {states?.map((state) => (
                                <MenuItem key={state._id} value={state._id}>{state.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Division Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Division</InputLabel>
                        <Select
                            value={filters?.division_id || ''}
                            onChange={(e) => handleFilterChange('division_id', e.target.value)}
                            label="Division"
                            size="small"
                            disabled={!filters?.state_id}
                        >
                            <MenuItem value="">All Divisions</MenuItem>
                            {divisions?.filter(d => {
                                const stateId = d.state_id?._id || d.state_id;
                                return stateId === filters?.state_id;
                            }).map((division) => (
                                <MenuItem key={division._id} value={division._id}>{division.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Parliament Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Parliament</InputLabel>
                        <Select
                            value={filters?.parliament_id || ''}
                            onChange={(e) => handleFilterChange('parliament_id', e.target.value)}
                            label="Parliament"
                            size="small"
                            disabled={!filters?.division_id}
                        >
                            <MenuItem value="">All Parliaments</MenuItem>
                            {parliaments?.filter(p => {
                                const divisionId = p.division_id?._id || p.division_id;
                                return divisionId === filters?.division_id;
                            }).map((parliament) => (
                                <MenuItem key={parliament._id} value={parliament._id}>{parliament.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Assembly Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Assembly</InputLabel>
                        <Select
                            value={filters?.assembly_id || ''}
                            onChange={(e) => handleFilterChange('assembly_id', e.target.value)}
                            label="Assembly"
                            size="small"
                            disabled={!filters?.parliament_id}
                        >
                            <MenuItem value="">All Assemblies</MenuItem>
                            {assemblies?.filter(a => {
                                const parliamentId = a.parliament_id?._id || a.parliament_id;
                                return parliamentId === filters?.parliament_id;
                            }).map((assembly) => (
                                <MenuItem key={assembly._id} value={assembly._id}>{assembly.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Block Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Block</InputLabel>
                        <Select
                            value={filters?.block_id || ''}
                            onChange={(e) => handleFilterChange('block_id', e.target.value)}
                            label="Block"
                            size="small"
                            disabled={!filters?.assembly_id}
                        >
                            <MenuItem value="">All Blocks</MenuItem>
                            {blocks?.filter(b => {
                                const assemblyId = b.assembly_id?._id || b.assembly_id;
                                return assemblyId === filters?.assembly_id;
                            }).map((block) => (
                                <MenuItem key={block._id} value={block._id}>{block.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Booth Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Booth</InputLabel>
                        <Select
                            value={filters?.booth_id || ''}
                            onChange={(e) => handleFilterChange('booth_id', e.target.value)}
                            label="Booth"
                            size="small"
                            disabled={!filters?.block_id}
                        >
                            <MenuItem value="">All Booths</MenuItem>
                            {booths?.filter(b => {
                                const blockId = b.block_id?._id || b.block_id;
                                return blockId === filters?.block_id;
                            }).map((booth) => (
                                <MenuItem key={booth._id} value={booth._id}>
                                    {booth.name} (No: {booth.booth_number})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        onClick={() => {
                            setAppliedFilters(filters);
                            setPagination(prev => ({ ...prev, pageIndex: 0 }));
                        }}
                    >
                        Apply
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setFilters({});
                            setAppliedFilters({});
                            setPagination(prev => ({ ...prev, pageIndex: 0 }));
                        }}
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
                                                    <PartyActivitiesView data={row.original} />
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

            <PartyActivitiesModal
                open={openModal}
                modalToggler={setOpenModal}
                partyActivity={selectedPartyActivity}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                parties={parties}
                users={users}
                refresh={() => fetchPartyActivities(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertPartyActivitiesDelete
                id={partyActivityDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchPartyActivities(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}

