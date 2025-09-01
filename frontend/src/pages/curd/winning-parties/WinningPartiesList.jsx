import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Stack, Typography, Box, Tooltip, Divider, Chip, Avatar,
    FormControl, InputLabel, Select, MenuItem, Grid
} from '@mui/material';
import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import {
    getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
    useReactTable, flexRender
} from '@tanstack/react-table';
import { CSVLink } from 'react-csv';
import IconButton from 'components/@extended/IconButton';
import { Add, Edit, Trash, Eye } from 'iconsax-react';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import ScrollX from 'components/ScrollX';
import MainCard from 'components/MainCard';
import EmptyReactTable from 'pages/tables/react-table/empty';
import WinningPartyModal from './WinningPartyModal';
import WinningPartyView from './WinningPartyView';
import AlertWinningPartyDelete from './AlertWinningPartyDelete';

const WinningPartyListPage = () => {
    const theme = useTheme();
    const [winningParties, setWinningParties] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState({ open: false, id: null });
    const [globalFilter, setGlobalFilter] = useState('');
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [parties, setParties] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [electionYears, setElectionYears] = useState([]);

    // Filter states
    const [filterValues, setFilterValues] = useState({
        party: '',
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: '',
        booth: '',
        electionYear: '',
        candidate: ''
    });

    const [appliedFilters, setAppliedFilters] = useState({
        party: '',
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: '',
        booth: '',
        electionYear: '',
        candidate: ''
    });

    // Filtered data for cascading dropdowns
    const filteredDivisions = filterValues.state
        ? divisions.filter(division => {
            // Handle both populated and non-populated state_id
            const stateId = division.state_id?._id || division.state_id;
            return stateId === filterValues.state;
        })
        : divisions;

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
            : parliaments;

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
            : filterValues.state
                ? assemblies.filter(assembly => {
                    const stateId = assembly.state_id?._id || assembly.state_id;
                    return stateId === filterValues.state;
                })
                : assemblies;

    const filteredBlocks = filterValues.assembly
        ? blocks.filter(block => {
            const assemblyId = block.assembly_id?._id || block.assembly_id;
            return assemblyId === filterValues.assembly;
        })
        : filterValues.division
            ? blocks.filter(block => {
                const divisionId = block.division_id?._id || block.division_id;
                return divisionId === filterValues.division;
            })
            : filterValues.state
                ? blocks.filter(block => {
                    const stateId = block.state_id?._id || block.state_id;
                    return stateId === filterValues.state;
                })
                : blocks;

    const filteredBooths = filterValues.block
        ? booths.filter(booth => {
            const blockId = booth.block_id?._id || booth.block_id;
            return blockId === filterValues.block;
        })
        : filterValues.assembly
            ? booths.filter(booth => {
                const assemblyId = booth.assembly_id?._id || booth.assembly_id;
                return assemblyId === filterValues.assembly;
            })
            : filterValues.division
                ? booths.filter(booth => {
                    const divisionId = booth.division_id?._id || booth.division_id;
                    return divisionId === filterValues.division;
                })
                : filterValues.state
                    ? booths.filter(booth => {
                        const stateId = booth.state_id?._id || booth.state_id;
                        return stateId === filterValues.state;
                    })
                    : booths;

    // CSV functionality
    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const fetchWinningParties = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            let queryParams = [
                `page=${pageIndex + 1}`,
                `limit=${pageSize}`
            ];

            if (globalFilter) {
                queryParams.push(`search=${encodeURIComponent(globalFilter)}`);
            }

            if (appliedFilters.party) {
                queryParams.push(`party=${appliedFilters.party}`);
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
            if (appliedFilters.electionYear) {
                queryParams.push(`electionYear=${appliedFilters.electionYear}`);
            }
            if (appliedFilters.candidate) {
                queryParams.push(`candidate=${appliedFilters.candidate}`);
            }

            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/winning-parties?${queryParams.join('&')}`);
            const json = await res.json();
            if (json.success) {
                setWinningParties(json.data);
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
                assembliesRes, blocksRes, boothsRes,
                partiesRes, candidatesRes, electionYearsRes
            ] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/booths`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parties`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/candidates`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/election-years`)
            ]);

            const [
                statesData, divisionsData, parliamentsData,
                assembliesData, blocksData, boothsData,
                partiesData, candidatesData, electionYearsData
            ] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                boothsRes.json(),
                partiesRes.json(),
                candidatesRes.json(),
                electionYearsRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (blocksData.success) setBlocks(blocksData.data);
            if (boothsData.success) setBooths(boothsData.data);
            if (partiesData.success) setParties(partiesData.data);
            if (candidatesData.success) setCandidates(candidatesData.data);
            if (electionYearsData.success) setElectionYears(electionYearsData.data);
        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    const handleApplyFilters = () => {
        setAppliedFilters(filterValues);
        setPagination({ pageIndex: 0, pageSize: 10 });
        fetchWinningParties(0, 10, globalFilter);
    };

    const handleClearFilters = () => {
        const emptyFilters = {
            party: '',
            state: '',
            division: '',
            parliament: '',
            assembly: '',
            block: '',
            booth: '',
            electionYear: '',
            candidate: ''
        };
        setFilterValues(emptyFilters);
        setAppliedFilters(emptyFilters);
        setPagination({ pageIndex: 0, pageSize: 10 });
        fetchWinningParties(0, 10, globalFilter);
    };

    // Handle cascading filter changes
    const handleStateChange = (stateValue) => {
        setFilterValues({
            ...filterValues,
            state: stateValue,
            division: '', // Clear dependent filters
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
            parliament: '', // Clear dependent filters
            assembly: '',
            block: '',
            booth: ''
        });
    };

    const handleParliamentChange = (parliamentValue) => {
        setFilterValues({
            ...filterValues,
            parliament: parliamentValue,
            assembly: '', // Clear dependent filters
            block: '',
            booth: ''
        });
    };

    const handleAssemblyChange = (assemblyValue) => {
        setFilterValues({
            ...filterValues,
            assembly: assemblyValue,
            block: '', // Clear dependent filters
            booth: ''
        });
    };

    const handleBlockChange = (blockValue) => {
        setFilterValues({
            ...filterValues,
            block: blockValue,
            booth: '' // Clear dependent filters
        });
    };

    useEffect(() => {
        fetchWinningParties(pagination.pageIndex, pagination.pageSize, globalFilter);
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, appliedFilters]);

    useEffect(() => {
        fetchReferenceData();
    }, []);

    const formatNumber = (number) => {
        if (!number) return 'N/A';
        return number.toLocaleString();
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
            header: 'Candidate',
            accessorKey: 'candidate_id',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue()?.name || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Party',
            accessorKey: 'party_id',
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
            header: 'Parliament',
            accessorKey: 'parliament_id',
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
            header: 'Booth Number',
            accessorKey: 'booth_number',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Election Year',
            accessorKey: 'election_year',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.year || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Votes',
            accessorKey: 'votes',
            cell: ({ getValue }) => (
                <Typography fontWeight="bold">
                    {formatNumber(getValue())}
                </Typography>
            )
        },
        {
            header: 'Margin',
            accessorKey: 'margin',
            cell: ({ getValue }) => (
                <Typography fontWeight="bold" color="success.main">
                    {formatNumber(getValue())}
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
            cell: ({ getValue }) => <Typography>{new Date(getValue()).toLocaleString()}</Typography>
        },
        {
            header: 'Updated At',
            accessorKey: 'updated_at',
            cell: ({ getValue }) => <Typography>{new Date(getValue()).toLocaleString()}</Typography>
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
                        <Tooltip title="View">
                            <IconButton color="secondary" onClick={row.getToggleExpandedHandler()}>
                                {expandIcon}
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
        data: winningParties,
        columns,
        state: { pagination, globalFilter },
        pageCount,
        manualPagination: true,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getRowCanExpand: () => true
    });

    const fetchAllWinningPartiesForCsv = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/winning-parties?all=true`);
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all winning parties for CSV:', error);
        }
        return [];
    };

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllWinningPartiesForCsv();
        setCsvData(allData.map(item => ({
            'Candidate': item.candidate_id?.name || '',
            'Party': item.party_id?.name || '',
            'State': item.state_id?.name || '',
            'Division': item.division_id?.name || '',
            'Parliament': item.parliament_id?.name || '',
            'Assembly': item.assembly_id?.name || '',
            'Block': item.block_id?.name || '',
            'Booth': item.booth_id?.name || '',
            'Booth Number': item.booth_number || '',
            'Election Year': item.election_year?.year || '',
            'Votes': item.votes || 0,
            'Margin': item.margin || 0,
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
                        placeholder={`Search ${winningParties.length} records...`}
                    />
                    <Stack direction="row" spacing={1}>
                        <CSVLink
                            data={csvData}
                            filename="winning_parties_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
                        <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                            {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditData(null); setOpenModal(true); }}>
                            Add Record
                        </Button>
                    </Stack>
                </Stack>

                <Grid container spacing={2} sx={{ px: 3, pb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Party</InputLabel>
                            <Select
                                value={filterValues.party}
                                onChange={(e) => setFilterValues({ ...filterValues, party: e.target.value })}
                                label="Party"
                            >
                                <MenuItem value="">All</MenuItem>
                                {parties.map((party) => (
                                    <MenuItem key={party._id} value={party._id}>{party.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
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
                    <Grid item xs={12} sm={6} md={3} sx={{ display: { xs: filterValues.state ? 'block' : 'none', md: 'block' } }}>
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
                    <Grid item xs={12} sm={6} md={3} sx={{ display: { xs: filterValues.state ? 'block' : 'none', md: 'block' } }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Parliament</InputLabel>
                            <Select
                                value={filterValues.parliament}
                                onChange={(e) => handleParliamentChange(e.target.value)}
                                label="Parliament"
                                disabled={!filterValues.state}
                            >
                                <MenuItem value="">All</MenuItem>
                                {filteredParliaments.map((parliament) => (
                                    <MenuItem key={parliament._id} value={parliament._id}>{parliament.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} sx={{ display: { xs: filterValues.state ? 'block' : 'none', md: 'block' } }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Assembly</InputLabel>
                            <Select
                                value={filterValues.assembly}
                                onChange={(e) => handleAssemblyChange(e.target.value)}
                                label="Assembly"
                                disabled={!filterValues.state}
                            >
                                <MenuItem value="">All</MenuItem>
                                {filteredAssemblies.map((assembly) => (
                                    <MenuItem key={assembly._id} value={assembly._id}>{assembly.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} sx={{ display: { xs: filterValues.state ? 'block' : 'none', md: 'block' } }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Block</InputLabel>
                            <Select
                                value={filterValues.block}
                                onChange={(e) => handleBlockChange(e.target.value)}
                                label="Block"
                                disabled={!filterValues.state}
                            >
                                <MenuItem value="">All</MenuItem>
                                {filteredBlocks.map((block) => (
                                    <MenuItem key={block._id} value={block._id}>{block.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3} sx={{ display: { xs: filterValues.state ? 'block' : 'none', md: 'block' } }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Booth</InputLabel>
                            <Select
                                value={filterValues.booth}
                                onChange={(e) => setFilterValues({ ...filterValues, booth: e.target.value })}
                                label="Booth"
                                disabled={!filterValues.state}
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
                            <InputLabel>Election Year</InputLabel>
                            <Select
                                value={filterValues.electionYear}
                                onChange={(e) => setFilterValues({ ...filterValues, electionYear: e.target.value })}
                                label="Election Year"
                            >
                                <MenuItem value="">All</MenuItem>
                                {electionYears.map((year) => (
                                    <MenuItem key={year._id} value={year._id}>{year.year}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Candidate</InputLabel>
                            <Select
                                value={filterValues.candidate}
                                onChange={(e) => setFilterValues({ ...filterValues, candidate: e.target.value })}
                                label="Candidate"
                            >
                                <MenuItem value="">All</MenuItem>
                                {candidates.map((candidate) => (
                                    <MenuItem key={candidate._id} value={candidate._id}>{candidate.name}</MenuItem>
                                ))}
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
                                                    <WinningPartyView data={row.original} />
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

            <WinningPartyModal
                open={openModal}
                modalToggler={setOpenModal}
                winningParty={editData}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                parties={parties}
                candidates={candidates}
                electionYears={{ data: electionYears }}
                refresh={() => fetchWinningParties(pagination.pageIndex, pagination.pageSize)}
            />
            <AlertWinningPartyDelete
                open={deleteAlert.open}
                handleClose={() => setDeleteAlert({ open: false, id: null })}
                id={deleteAlert.id}
                refresh={() => fetchWinningParties(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
};

export default WinningPartyListPage;
