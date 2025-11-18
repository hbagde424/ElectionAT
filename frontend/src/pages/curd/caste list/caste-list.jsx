import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, FormControl, InputLabel, Select, MenuItem, Tooltip, Alert
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
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';

import CasteModal from './CasteModal';
import AlertCasteDelete from './AlertCasteDelete';
import CasteView from './CasteView';
import { usePermissions } from 'contexts/PermissionContext';

export default function CasteListPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();

    const [selectedCaste, setSelectedCaste] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [casteDeleteId, setCasteDeleteId] = useState('');
    const [casteList, setCasteList] = useState([]);
    const [allCasteList, setAllCasteList] = useState([]);
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
    const [filters, setFilters] = useState({
        category: '',
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: '',
        booth: ''
    });

    // States for filtered options
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    const categoryOptions = ['SC', 'ST', 'OBC', 'GENERAL'];

    // Get user's access scope information
    const getUserAccessScope = () => {
        if (!userHierarchy) {
            return { level: 'All', description: 'You have access to all caste list data' };
        }

        const highestLevel = getUserHighestLevel();
        if (!highestLevel) {
            return { level: 'All', description: 'You have access to all caste list data' };
        }

        const levelNames = {
            state: 'State',
            division: 'Division',
            parliament: 'Parliament',
            assembly: 'Assembly',
            block: 'Block',
            booth: 'Booth'
        };

        const levelName = levelNames[highestLevel.level] || 'Unknown';
        const levelValue = highestLevel.value || 'Unknown';

        return {
            level: levelName,
            description: `You have access to caste list data for ${levelName}: ${levelValue}`
        };
    };

    const accessScope = getUserAccessScope();

    const fetchAllCasteListForFilters = async () => {
        try {
            const query = {};
            // Hierarchy scoping (backend accepts plain names and converts internally)
            if (userHierarchy?.state) query.state = userHierarchy.state._id || userHierarchy.state;
            if (userHierarchy?.division) query.division = userHierarchy.division._id || userHierarchy.division;
            if (userHierarchy?.parliament) query.parliament = userHierarchy.parliament._id || userHierarchy.parliament;
            if (userHierarchy?.assembly) query.assembly = userHierarchy.assembly._id || userHierarchy.assembly;
            if (userHierarchy?.block) query.block = userHierarchy.block._id || userHierarchy.block;
            if (userHierarchy?.booth) query.booth = userHierarchy.booth._id || userHierarchy.booth;
            // Current filters (backend accepts plain names)
            if (filters?.category) query.category = filters.category;
            if (filters?.state) query.state = filters.state;
            if (filters?.division) query.division = filters.division;
            if (filters?.parliament) query.parliament = filters.parliament;
            if (filters?.assembly) query.assembly = filters.assembly;
            if (filters?.block) query.block = filters.block;
            if (filters?.booth) query.booth = filters.booth;
            if (globalFilter) query.search = globalFilter;

            const data = await fetchAllDataForFilters('/caste-lists', query);
            setAllCasteList(data);
        } catch (error) {
            console.error('Failed to fetch all caste list for filters:', error);
        }
    };

    const fetchReferenceData = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/booths`, { headers })
            ]);

            const [statesData, divisionsData, parliamentsData, assembliesData, blocksData, boothsData] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                boothsRes.json()
            ]);

            if (statesData.success) {
                setStates(statesData.data);
            }
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

    // Handle state change
    const handleStateChange = (stateId) => {

        setFilters(prev => ({
            ...prev,
            state: stateId,
            division: '',
            parliament: '',
            assembly: '',
            block: '',
            booth: ''
        }));

        // Filter divisions based on selected state
        const filteredDivs = divisions.filter(div => div.state_id?._id === stateId);
        setFilteredDivisions(filteredDivs);
        setFilteredParliaments([]);
        setFilteredAssemblies([]);
        setFilteredBlocks([]);
        setFilteredBooths([]);
    };

    // Handle division change
    const handleDivisionChange = (divisionId) => {

        setFilters(prev => ({
            ...prev,
            division: divisionId,
            parliament: '',
            assembly: '',
            block: '',
            booth: ''
        }));

        // Filter parliaments based on selected division
        const filteredParls = parliaments.filter(parl => parl.division_id?._id === divisionId);
        setFilteredParliaments(filteredParls);
        setFilteredAssemblies([]);
        setFilteredBlocks([]);
        setFilteredBooths([]);
    };

    // Handle parliament change
    const handleParliamentChange = (parliamentId) => {
        setFilters(prev => ({
            ...prev,
            parliament: parliamentId,
            assembly: '',
            block: '',
            booth: ''
        }));

        // Filter assemblies based on selected parliament
        const filteredAsm = assemblies.filter(asm => asm.parliament_id?._id === parliamentId);
        setFilteredAssemblies(filteredAsm);
        setFilteredBlocks([]);
        setFilteredBooths([]);
    };

    // Handle assembly change
    const handleAssemblyChange = (assemblyId) => {
        setFilters(prev => ({
            ...prev,
            assembly: assemblyId,
            block: '',
            booth: ''
        }));
    };

    // Handle block change
    const handleBlockChange = (blockId) => {
        setFilters(prev => ({
            ...prev,
            block: blockId,
            booth: ''
        }));
    };

    // Update filteredBlocks when assembly or blocks change
    useEffect(() => {
        if (filters.assembly) {
            const filteredBlks = blocks.filter(blk => blk.assembly_id?._id === filters.assembly);
            setFilteredBlocks(filteredBlks);
        } else {
            setFilteredBlocks([]);
        }
        // Reset filteredBooths if assembly changes
        setFilteredBooths([]);
    }, [filters.assembly, blocks]);

    // Update filteredBooths when block or booths change
    useEffect(() => {
        if (filters.block) {
            const filteredBths = booths.filter(bth => bth.block_id?._id === filters.block);
            setFilteredBooths(filteredBths);
        } else {
            setFilteredBooths([]);
        }
    }, [filters.block, booths]);

    const fetchCasteList = async (pageIndex, pageSize, globalFilter = '', currentFilters = filters) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            let query = globalFilter ? `&search=${encodeURIComponent(globalFilter)}` : '';
            Object.entries(currentFilters).forEach(([key, value]) => {
                if (value) {
                    // Backend accepts plain names (state, division, etc.)
                    query += `&${key}=${encodeURIComponent(value)}`;
                }
            });

            // Add hierarchy-based filtering
            if (userHierarchy) {
                const highestLevel = getUserHighestLevel();
                if (highestLevel) {
                    switch (highestLevel.level) {
                        case 'state':
                            query += `&state_id=${highestLevel.value}`;
                            break;
                        case 'division':
                            query += `&division_id=${highestLevel.value}`;
                            break;
                        case 'parliament':
                            query += `&parliament_id=${highestLevel.value}`;
                            break;
                        case 'assembly':
                            query += `&assembly_id=${highestLevel.value}`;
                            break;
                        case 'block':
                            query += `&block_id=${highestLevel.value}`;
                            break;
                        case 'booth':
                            query += `&booth_id=${highestLevel.value}`;
                            break;
                    }
                }
            }

            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/caste-lists?page=${pageIndex + 1}&limit=${pageSize}${query}`, { headers });
            const json = await res.json();
            if (json.success) {
                setCasteList(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch caste list:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch reference data only once on mount
    useEffect(() => {
        fetchReferenceData();
    }, []);

    useEffect(() => {
        fetchCasteList(pagination.pageIndex, pagination.pageSize, globalFilter, filters);
        fetchAllCasteListForFilters();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    // Refresh filter options when current filters change (globalFilter already handled above)
    useEffect(() => {
        fetchAllCasteListForFilters();
    }, [JSON.stringify(filters)]);

    // Build filter options strictly from the same dataset that drives the table.
    // Fallback to the current page if the aggregated list is empty.
    const casteFilterSource = (allCasteList && allCasteList.length > 0) ? allCasteList : casteList;
    const filterOptions = useFilterOptionsFromData(casteFilterSource, {
        states: { field: 'state', nameField: 'name' },
        divisions: { field: 'division', nameField: 'name', parentField: 'state' },
        parliaments: { field: 'parliament', nameField: 'name', parentField: 'division' },
        assemblies: { field: 'assembly', nameField: 'name', parentField: 'parliament' },
        blocks: { field: 'block', nameField: 'name', parentField: 'assembly' },
        booths: { field: 'booth', nameField: 'name', parentField: 'block' }
    });

    const handleDeleteOpen = (id) => {
        setCasteDeleteId(id);
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
            header: 'Caste',
            accessorKey: 'caste',
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
            header: 'percentage',
            accessorKey: 'percentage',
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
            header: 'Category',
            accessorKey: 'category',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.toUpperCase() || 'N/A'}
                    size="small"
                    color={
                        getValue() === 'SC' ? 'primary' :
                            getValue() === 'ST' ? 'secondary' :
                                getValue() === 'OBC' ? 'warning' :
                                    'default'
                    }
                />
            )
        },
        {
            header: 'State',
            accessorKey: 'state',
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
            accessorKey: 'division',
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
            accessorKey: 'parliament',
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
            accessorKey: 'assembly',
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
            accessorKey: 'block',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="success"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Booth',
            accessorKey: 'booth',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="error"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Booth Number',
            accessorKey: 'booth',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.booth_number || 'N/A'}
                    color="error"
                    size="small"
                    variant="outlined"
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
                const isExpanded = row.getIsExpanded();
                const expandIcon = isExpanded ? <Add style={{ transform: 'rotate(45deg)', color: theme.palette.error.main }} /> : <Eye />;
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <Tooltip title="View Details">
                            <IconButton
                                color="secondary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/Caste-List/${row.original._id}`);
                                }}
                            >
                                <Eye />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit">
                            <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedCaste(row.original); setOpenModal(true); }}>
                                <Edit />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton color="error" onClick={(e) => { e.stopPropagation(); handleDeleteOpen(row.original._id); }}>
                                <Trash />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                );
            }
        }
    ], [theme]);

    const table = useReactTable({
        data: casteList,
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

    const fetchAllCastesForCsv = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/caste-lists?all=true`, { headers });
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all castes for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllCastesForCsv();
        setCsvData(allData.map(item => ({
            Caste: item.caste,
            Category: item.category,
            State: item.state?.name || '',
            Division: item.division?.name || '',
            Parliament: item.parliament?.name || '',
            Assembly: item.assembly?.name || '',
            Block: item.block?.name || '',
            Booth: item.booth?.name || '',
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

                <Stack spacing={2}>
                    {/* Top Actions */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        justifyContent="space-between"
                        sx={{ p: 2, gap: 2 }}
                    >
                        <DebouncedInput
                            value={globalFilter}
                            onFilterChange={setGlobalFilter}
                            placeholder={`Search ${casteList.length} caste entries...`}
                        />
                        <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            justifyContent="flex-end"
                        >
                            <CSVLink
                                data={csvData}
                                filename="caste_list_all.csv"
                                style={{ display: 'none' }}
                                ref={csvLinkRef}
                            />
                            <Button
                                variant="outlined"
                                onClick={handleDownloadCsv}
                                disabled={csvLoading}
                            >
                                {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => { setSelectedCaste(null); setOpenModal(true); }}
                            >
                                Add Caste Entry
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

                    {/* Filters */}
                    <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        sx={{ p: 2, flexWrap: "wrap", gap: 2 }}
                    >
                        <FormControl sx={{ minWidth: 200 }} size="small">
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={filters.category}
                                label="Category"
                                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                            >
                                <MenuItem value="">All Categories</MenuItem>
                                {categoryOptions.map((category) => (
                                    <MenuItem key={category} value={category}>{category}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 200 }} size="small">
                            <InputLabel>State</InputLabel>
                            <Select
                                value={filters.state}
                                label="State"
                                onChange={(e) => handleStateChange(e.target.value)}
                            >
                                <MenuItem value="">All States</MenuItem>
                                {filterOptions.states?.map((state) => (
                                    <MenuItem key={state._id} value={state._id}>{state.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 200 }} size="small" disabled={!filters.state}>
                            <InputLabel>Division</InputLabel>
                            <Select
                                value={filters.division}
                                label="Division"
                                onChange={(e) => handleDivisionChange(e.target.value)}
                            >
                                <MenuItem value="">All Divisions</MenuItem>
                                {filterOptions.divisions?.filter(division => {
                                    const stateId = division.state?._id || division.state_id?._id || division.state || division.state_id;
                                    return String(stateId) === String(filters.state);
                                }).map((division) => (
                                    <MenuItem key={division._id} value={division._id}>{division.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 200 }} size="small" disabled={!filters.division}>
                            <InputLabel>Parliament</InputLabel>
                            <Select
                                value={filters.parliament}
                                label="Parliament"
                                onChange={(e) => handleParliamentChange(e.target.value)}
                            >
                                <MenuItem value="">All Parliaments</MenuItem>
                                {filterOptions.parliaments?.filter(parliament => {
                                    const divisionId = parliament.division?._id || parliament.division_id?._id || parliament.division || parliament.division_id;
                                    return String(divisionId) === String(filters.division);
                                }).map((parliament) => (
                                    <MenuItem key={parliament._id} value={parliament._id}>{parliament.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 200 }} size="small" disabled={!filters.parliament}>
                            <InputLabel>Assembly</InputLabel>
                            <Select
                                value={filters.assembly}
                                label="Assembly"
                                onChange={(e) => handleAssemblyChange(e.target.value)}
                            >
                                <MenuItem value="">All Assemblies</MenuItem>
                                {filterOptions.assemblies?.filter(assembly => {
                                    const parliamentId = assembly.parliament?._id || assembly.parliament_id?._id || assembly.parliament || assembly.parliament_id;
                                    return String(parliamentId) === String(filters.parliament);
                                }).map((assembly) => (
                                    <MenuItem key={assembly._id} value={assembly._id}>{assembly.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 200 }} size="small" disabled={!filters.assembly}>
                            <InputLabel>Block</InputLabel>
                            <Select
                                value={filters.block}
                                label="Block"
                                onChange={(e) => handleBlockChange(e.target.value)}
                            >
                                <MenuItem value="">All Blocks</MenuItem>
                                {filterOptions.blocks?.filter(block => {
                                    const assemblyId = block.assembly?._id || block.assembly_id?._id || block.assembly || block.assembly_id;
                                    return String(assemblyId) === String(filters.assembly);
                                }).map((block) => (
                                    <MenuItem key={block._id} value={block._id}>{block.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl sx={{ minWidth: 200 }} size="small" disabled={!filters.block}>
                            <InputLabel>Booth</InputLabel>
                            <Select
                                value={filters.booth}
                                label="Booth"
                                onChange={(e) => setFilters(prev => ({ ...prev, booth: e.target.value }))}
                            >
                                <MenuItem value="">All Booths</MenuItem>
                                {filterOptions.booths?.filter(booth => {
                                    const blockId = booth.block?._id || booth.block_id?._id || booth.block || booth.block_id;
                                    return String(blockId) === String(filters.block);
                                }).map((booth) => (
                                    <MenuItem key={booth._id} value={booth._id}>{booth.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            variant="outlined"
                            onClick={() => {
                                const defaultFilters = {
                                    category: '',
                                    state: '',
                                    division: '',
                                    parliament: '',
                                    assembly: '',
                                    block: '',
                                    booth: ''
                                };
                                setFilters(defaultFilters);
                                fetchCasteList(pagination.pageIndex, pagination.pageSize, globalFilter, defaultFilters);
                            }}
                        >
                            Clear
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                fetchCasteList(pagination.pageIndex, pagination.pageSize, globalFilter, filters);
                            }}
                        >
                            Apply
                        </Button>
                    </Stack>
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
                                                    <CasteView data={row.original} />
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

            <CasteModal
                open={openModal}
                modalToggler={setOpenModal}
                casteEntry={selectedCaste}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                refresh={() => fetchCasteList(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertCasteDelete
                id={casteDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchCasteList(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}
