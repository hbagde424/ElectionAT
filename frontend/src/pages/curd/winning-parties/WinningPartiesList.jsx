import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Stack, Typography, Box, Tooltip, Divider, Chip, Avatar,
    FormControl, InputLabel, Select, MenuItem, Grid, TextField, Alert
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import { useCsvOtp } from 'hooks/useCsvOtp';
import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';
import { useTheme } from '@mui/material/styles';
import {
    getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
    useReactTable, flexRender
} from '@tanstack/react-table';
import { CSVLink } from 'react-csv';
import IconButton from 'components/@extended/IconButton';
import { Add, Edit, Trash, Eye } from 'iconsax-react';
import { useNavigate } from 'react-router-dom';
import { HeaderSort, TablePagination } from 'components/third-party/react-table';
import ScrollX from 'components/ScrollX';
import MainCard from 'components/MainCard';
import EmptyReactTable from 'pages/tables/react-table/empty';
import WinningPartyModal from './WinningPartyModal';
import AlertWinningPartyDelete from './AlertWinningPartyDelete';
import { usePermissions } from 'contexts/PermissionContext';

const WinningPartyListPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel } = usePermissions();
    const [winningParties, setWinningParties] = useState([]);
    const [allWinningParties, setAllWinningParties] = useState([]);
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

    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => setGlobalFilter(searchInput), 500);
        return () => clearTimeout(handler);
    }, [searchInput]);

    useEffect(() => setSearchInput(globalFilter || ''), [globalFilter]);

    // Fetch all winning parties for filters
    const fetchAllWinningPartiesForFilters = async () => {
        try {
            const hierarchyFilters = {};
            if (userHierarchy?.state) hierarchyFilters.state_id = userHierarchy.state._id;
            if (userHierarchy?.division) hierarchyFilters.division_id = userHierarchy.division._id;
            if (userHierarchy?.parliament) hierarchyFilters.parliament_id = userHierarchy.parliament._id;
            if (userHierarchy?.assembly) hierarchyFilters.assembly_id = userHierarchy.assembly._id;
            if (userHierarchy?.block) hierarchyFilters.block_id = userHierarchy.block._id;
            if (userHierarchy?.booth) hierarchyFilters.booth_id = userHierarchy.booth._id;
            
            const data = await fetchAllDataForFilters('/winning-parties', hierarchyFilters);
            setAllWinningParties(data);
        } catch (error) {
            console.error('Error fetching all winning parties for filters:', error);
        }
    };

    // Extract filter options from allWinningParties
    const filterOptionsData = useFilterOptionsFromData(allWinningParties, {
        parties: { field: 'party_id', nameField: 'name' },
        states: { field: 'state_id', nameField: 'name' },
        divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
        parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
        assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
        blocks: { field: 'block_id', nameField: 'name', parentField: 'assembly_id' },
        booths: { field: 'booth_id', nameField: 'name', parentField: 'block_id' },
        electionYears: { field: 'election_year_id', nameField: 'year' },
        candidatesData: { field: 'candidate_id', nameField: 'name' }
    });

    // Filtered data for cascading dropdowns
    const filteredDivisions = filterValues.state
        ? filterOptionsData.divisions?.filter(division => {
            // Handle both populated and non-populated state_id
            const stateId = division.state_id?._id || division.state_id;
            return stateId === filterValues.state;
        }) || []
        : filterOptionsData.divisions || [];

    const filteredParliaments = filterValues.division
        ? filterOptionsData.parliaments?.filter(parliament => {
            const divisionId = parliament.division_id?._id || parliament.division_id;
            return divisionId === filterValues.division;
        }) || []
        : filterValues.state
            ? filterOptionsData.parliaments?.filter(parliament => {
                const stateId = parliament.state_id?._id || parliament.state_id;
                return stateId === filterValues.state;
            }) || []
            : filterOptionsData.parliaments || [];

    const filteredAssemblies = filterValues.parliament
        ? filterOptionsData.assemblies?.filter(assembly => {
            const parliamentId = assembly.parliament_id?._id || assembly.parliament_id;
            return parliamentId === filterValues.parliament;
        }) || []
        : filterValues.division
            ? filterOptionsData.assemblies?.filter(assembly => {
                const divisionId = assembly.division_id?._id || assembly.division_id;
                return divisionId === filterValues.division;
            }) || []
            : filterValues.state
                ? filterOptionsData.assemblies?.filter(assembly => {
                    const stateId = assembly.state_id?._id || assembly.state_id;
                    return stateId === filterValues.state;
                }) || []
                : filterOptionsData.assemblies || [];

    const filteredBlocks = filterValues.assembly
        ? filterOptionsData.blocks?.filter(block => {
            const assemblyId = block.assembly_id?._id || block.assembly_id;
            return assemblyId === filterValues.assembly;
        }) || []
        : filterValues.division
            ? filterOptionsData.blocks?.filter(block => {
                const divisionId = block.division_id?._id || block.division_id;
                return divisionId === filterValues.division;
            }) || []
            : filterValues.state
                ? filterOptionsData.blocks?.filter(block => {
                    const stateId = block.state_id?._id || block.state_id;
                    return stateId === filterValues.state;
                }) || []
                : filterOptionsData.blocks || [];

    const filteredBooths = filterValues.block
        ? filterOptionsData.booths?.filter(booth => {
            const blockId = booth.block_id?._id || booth.block_id;
            return blockId === filterValues.block;
        }) || []
        : filterValues.assembly
            ? filterOptionsData.booths?.filter(booth => {
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

    const fetchWinningParties = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            let queryParams = [];
            // If searching, fetch all results on first page
            if (globalFilter) {
                queryParams.push('page=1');
                queryParams.push('limit=10000');
                queryParams.push(`search=${encodeURIComponent(globalFilter)}`);
            } else {
                queryParams.push(`page=${pageIndex + 1}`);
                queryParams.push(`limit=${pageSize}`);
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

            // Hierarchy-based filtering is handled automatically by the backend
            // via getUserPermissionsAndHierarchy middleware, so no need to add filters here

            const token = localStorage.getItem('serviceToken');
            const headers = {};
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/winning-parties?${queryParams.join('&')}`, { headers });
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
            const token = localStorage.getItem('serviceToken');
            const headers = {};
            if (token) headers.Authorization = `Bearer ${token}`;
            const [
                statesRes, divisionsRes, parliamentsRes,
                assembliesRes, blocksRes, boothsRes,
                partiesRes, candidatesRes, electionYearsRes
            ] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/booths`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parties?limit=10000`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/candidates`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/election-years`, { headers })
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
        fetchAllWinningPartiesForFilters();
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
            header: 'Electors',
            accessorKey: 'electors',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Male Electors',
            accessorKey: 'male_electors',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Female Electors',
            accessorKey: 'female_electors',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'NOTA Votes',
            accessorKey: 'nota_votes',
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
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <Tooltip title="View Details">
                            <IconButton
                                color="info"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/WinningPartiesList/${row.original._id}`);
                                }}
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
        getPaginationRowModel: getPaginationRowModel()
    });

    const fetchAllWinningPartiesForCsv = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            if (!token) {
                console.warn('No authentication token found. Cannot fetch winning parties.');
                return [];
            }
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/winning-parties?all=true`, { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all winning parties for CSV:', error);
            if (error.response?.status === 401) {
                console.error('Authentication failed. Please log in again.');
            }
        }
        return [];
    };

    const startCsvDownload = async () => {
        setCsvLoading(true);
        const allData = await fetchAllWinningPartiesForCsv();
        setCsvData(allData.map(item => ({
            'Candidate': item.candidate_id?.name || '',
            'Party': item.party_id?.name || '',
            // numeric geography identifiers
            'State No': item.state_id?.state_no || item.state_no || '',
            'Division Code': item.division_id?.division_code || item.division_code || '',
            'Parliament No': item.parliament_id?.parliament_no || item.parliament_no || '',
            'Assembly AC_NO': item.assembly_id?.AC_NO || item.assembly_id?.ac_no || item.AC_NO || item.ac_no || '',
            'Block No': item.block_id?.block_number || item.block_number || '',
            'Booth No': item.booth_id?.booth_number || item.booth_number || '',
            'Booth Name': item.booth_id?.name || '',
            'Booth Number': item.booth_number || '',
            'Election Year': item.election_year?.year || '',
            'Votes': item.votes || 0,
            'Margin': item.margin || 0,
            'Electors': item.electors || 'N/A',
            'Male Electors': item.male_electors || 'N/A',
            'Female Electors': item.female_electors || 'N/A',
            'NOTA Votes': item.nota_votes || 'N/A',
            'Description': item.description || '',
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

    const handleDownloadCsv = async () => {
        await requestOtp(startCsvDownload);
    };

    // Excel Template Download
    const handleDownloadExcelTemplate = async () => {
        try {
            const XLSX = await import('xlsx');
            const templateData = [
                {
                    candidate_name: 'Ramesh Kumar',
                    party_name: 'Example Party',
                    votes: 12500,
                    margin: 2500,
                    electors: 20000,
                    male_electors: 10000,
                    female_electors: 10000,
                    nota_votes: 10,
                    description: 'Sample import record',
                    election_year: 2024,
                    // Numeric identifiers
                    state_no: 6,
                    division_code: '12',
                    parliament_no: 3,
                    AC_NO: 45,
                    block_number: 7,
                    booth_number: 102
                }
            ];
            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
            XLSX.writeFile(workbook, 'winning-parties-template.xlsx');
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
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/winning-parties/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` })
                },
                body: JSON.stringify({ rows: normalizedData })
            });

            const result = await response.json();
            setImportResult(result);
            if (result.success) {
                fetchWinningParties(pagination.pageIndex, pagination.pageSize, globalFilter);
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
                {/* Access Scope Information */}
                {(() => {
                    const getUserAccessScope = () => {
                        if (!userHierarchy) {
                            return { level: 'All', description: 'You have access to all winning parties data' };
                        }
                        const highestLevel = getUserHighestLevel();
                        if (!highestLevel) {
                            return { level: 'All', description: 'You have access to all winning parties data' };
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
                            description: `You have access to winning parties data for ${entityName} ${levelName} and all areas within it`
                        };
                    };
                    const accessScope = getUserAccessScope();
                    return (
                        <Alert severity="info" sx={{ m: 2 }}>
                            <Typography variant="body2">
                                <strong>Data Access:</strong> {accessScope.description}
                            </Typography>
                        </Alert>
                    );
                })()}

                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
                    <TextField
                        size="small"
                        variant="outlined"
                        placeholder={`Search ${winningParties.length} records...`}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        sx={{ minWidth: 300 }}
                    />
                    <Stack direction="row" spacing={1}>
                        <CSVLink
                            data={csvData}
                            filename="winning_parties_all.csv"
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
                                                        <Button onClick={() => verifyOtp()} variant="contained" disabled={otpLoading || !otpCode.trim()}>
                                                            {otpLoading ? <CircularProgress size={20} /> : 'Verify & Download'}
                                                        </Button>
                                                    </DialogActions>
                                                </Dialog>
                        <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                            {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                        </Button>
                        <Button variant="outlined" onClick={handleDownloadExcelTemplate}>
                            Download Excel Template
                        </Button>
                        <Button variant="outlined" component="label" disabled={importing}>
                            {importing ? 'Importing...' : 'Import Excel'}
                            <input
                                ref={importInputRef}
                                type="file"
                                hidden
                                accept=".xlsx,.xls"
                                onChange={handleImportFile}
                            />
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
                                {filterOptionsData.parties?.map((party) => (
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
                                {filterOptionsData.states?.map((state) => (
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
                                {filterOptionsData.electionYears?.map((year) => (
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
                                {filterOptionsData.candidatesData?.map((candidate) => (
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
