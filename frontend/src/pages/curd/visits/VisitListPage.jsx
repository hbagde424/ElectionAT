import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Stack, Typography, Box, Tooltip, Divider, Chip, Avatar, Grid,
    IconButton, Select, MenuItem, FormControl, InputLabel, TextField, Alert, Drawer
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import axiosServices from 'utils/axios';
import { usePermissions } from 'contexts/PermissionContext';
import {
    getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
    useReactTable, flexRender
} from '@tanstack/react-table';
import { CSVLink } from 'react-csv';
import { Add, Edit, Trash, Eye } from 'iconsax-react';
import { useNavigate } from 'react-router-dom';
import { HeaderSort, TablePagination } from 'components/third-party/react-table';
import ScrollX from 'components/ScrollX';
import MainCard from 'components/MainCard';
import EmptyReactTable from 'pages/tables/react-table/empty';
import AlertVisitDelete from './AlertVisitDelete';
import VisitMapTabs from './VisitMapTabs';
import VisitModal from './VisitModal';

const VisitListPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();
    const [visits, setVisits] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState({ open: false, id: null });
    const [globalFilter, setGlobalFilter] = useState('');
    // Local input for search so we can debounce API/table requests
    const [searchInput, setSearchInput] = useState('');
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [electionYears, setElectionYears] = useState([]);
    const [users, setUsers] = useState([]);
    const [yearFilter, setYearFilter] = useState('');
    // Drawer state managed here to avoid child unmounting closing it
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerType, setDrawerType] = useState(null);
    const [drawerData, setDrawerData] = useState(null);

    const handleOpenDrawer = ({ open, type, data }) => {
        setDrawerOpen(!!open);
        setDrawerType(type || null);
        setDrawerData(data || null);
    };

    // Keep local input in sync when globalFilter changes from outside (clear, pagination, etc.)
    // Get user's access scope information
    const getUserAccessScope = () => {
        if (!userHierarchy) {
            return { level: 'All', description: 'You have access to all visit data' };
        }

        const highestLevel = getUserHighestLevel();
        if (!highestLevel) {
            return { level: 'All', description: 'You have access to all visit data' };
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
            description: `You have access to visit data for ${entityName} ${levelName} and all areas within it`
        };
    };

    const accessScope = getUserAccessScope();

    // Filter states
    const [filterValues, setFilterValues] = useState({
        candidate: '',
        status: '',
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: '',
        booth: '',
        year: '',
        startDate: '',
        endDate: ''
    });
    const [appliedFilters, setAppliedFilters] = useState({
        candidate: '',
        status: '',
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: '',
        booth: '',
        year: '',
        startDate: '',
        endDate: ''
    });

    // Filtered data for cascading dropdowns
    const filteredDivisions = filterValues.state
        ? divisions.filter(division => {
            const stateId = division.state_id?._id || division.state_id;
            return stateId === filterValues.state;
        })
        : []; // Empty array when no state selected

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
            : []; // Empty array when no division selected

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
            : []; // Empty array when no assembly selected

    // CSV functionality
    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef(); const fetchVisits = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            let queryParams = [
                `page=${pageIndex + 1}`,
                `limit=${pageSize}`
            ];

            if (globalFilter) {
                queryParams.push(`search=${encodeURIComponent(globalFilter)}`);
            }

            if (appliedFilters.candidate) {
                queryParams.push(`candidate=${appliedFilters.candidate}`);
            }
            if (appliedFilters.status) {
                queryParams.push(`status=${appliedFilters.status}`);
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
            if (appliedFilters.year) {
                queryParams.push(`year=${appliedFilters.year}`);
            }
            if (appliedFilters.startDate) {
                // Convert YYYY-MM-DD to ISO string for proper backend comparison
                const startDate = new Date(appliedFilters.startDate + 'T00:00:00.000Z').toISOString();
                queryParams.push(`startDate=${encodeURIComponent(startDate)}`);
            }
            if (appliedFilters.endDate) {
                // Convert YYYY-MM-DD to end of day ISO string for proper backend comparison
                const endDate = new Date(appliedFilters.endDate + 'T23:59:59.999Z').toISOString();
                queryParams.push(`endDate=${encodeURIComponent(endDate)}`);
            }

            const url = `/visits?${queryParams.join('&')}`;
            const { data: json } = await axiosServices.get(url);
            if (json.success) {
                setVisits(json.data);
                setPageCount(json.pages);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Add this function right before the return statement in your component
    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        try {
            let queryParams = ['all=true'];

            // Apply all the same filters as the visit list for CSV export
            if (appliedFilters.candidate) {
                queryParams.push(`candidate=${appliedFilters.candidate}`);
            }
            if (appliedFilters.status) {
                queryParams.push(`status=${appliedFilters.status}`);
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
            if (appliedFilters.year) {
                queryParams.push(`year=${appliedFilters.year}`);
            }
            if (appliedFilters.startDate) {
                const startDate = new Date(appliedFilters.startDate + 'T00:00:00.000Z').toISOString();
                queryParams.push(`startDate=${encodeURIComponent(startDate)}`);
            }
            if (appliedFilters.endDate) {
                const endDate = new Date(appliedFilters.endDate + 'T23:59:59.999Z').toISOString();
                queryParams.push(`endDate=${encodeURIComponent(endDate)}`);
            }

            const path = `/visits?${queryParams.join('&')}`;
            const { data: json } = await axiosServices.get(path);

            if (json.success) {
                // Helper to remove HTML tags and normalize whitespace
                const stripHtml = (input) => {
                    if (input === null || input === undefined) return '';
                    if (typeof input !== 'string') return String(input);
                    // Remove tags and collapse whitespace
                    return input.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                };

                // Helper to render user fields safely (avoid [object Object]).
                // If created_by/updated_by is an id string, try to resolve it
                // from the cached `users` list fetched by `fetchReferenceData`.
                const formatUser = (user) => {
                    if (!user) return '';
                    // If it's a simple id (string/number), try to lookup
                    if (typeof user === 'string' || typeof user === 'number') {
                        const id = String(user);
                        const found = users.find(u => String(u._id) === id || String(u.id) === id);
                        return found ? (found.name || found.displayName || found.email || id) : id;
                    }
                    if (typeof user === 'object') {
                        if (user.name) return user.name;
                        if (user.displayName) return user.displayName;
                        if (user.fullName) return user.fullName;
                        if (user.email) return user.email;
                        const uid = user._id || user.id;
                        if (uid) {
                            const found = users.find(u => String(u._id) === String(uid) || String(u.id) === String(uid));
                            if (found) return found.name || found.displayName || found.email || String(uid);
                            return String(uid);
                        }
                        try {
                            return JSON.stringify(user);
                        } catch (e) {
                            return String(user);
                        }
                    }
                    return String(user);
                };

                const csvData = json.data.map(item => ({
                    'Candidate': stripHtml(item.candidate_id?.name || ''),
                    // 'Candidate ID': item.candidate_id?._id || '',
                    'Post': stripHtml(item.post || ''),
                    'Election Year': item.election_year_id?.year || '',
                    'Election Type': item.election_year_id?.election_type || '',
                    'Date': item.date ? formatDate(item.date) : '',
                    'Status': item.work_status || '',
                    'State': item.state_id?.name || '',
                    'Division': item.division_id?.name || '',
                    'Assembly': item.assembly_id?.name || '',
                    'Parliament': item.parliament_id?.name || '',
                    'Block': item.block_id?.name || '',
                    'Booth': item.booth_id?.name || '',
                    'Location': stripHtml(item.locationName || ''),
                    'Longitude': item.longitude ?? '',
                    'Latitude': item.latitude ?? '',
                    'Coordinates': (item.latitude != null && item.longitude != null) ? `${item.latitude}, ${item.longitude}` : '',
                    'Work Name': stripHtml(item.workName || ''),
                    'Visit Agenda': stripHtml(item.visitAgenda || item.declaration || ''),
                    'Speech (5 lines)': stripHtml(item.speechFiveLines || ''),
                    'Speech Issue': stripHtml(item.speechIssue || ''),
                    'Announcement Date': item.announcementDate ? formatDate(item.announcementDate) : '',
                    'Completion Date': item.completionDate ? formatDate(item.completionDate) : '',
                    'Budget Announced Date': item.budgetAnnouncedDate ? formatDate(item.budgetAnnouncedDate) : '',
                    'Documents': Array.isArray(item.documents) ? item.documents.map(d => d.name || d.filePath || '').filter(Boolean).join('; ') : '',
                    'Description': stripHtml(item.description || ''),
                    'Remark': stripHtml(item.remark || ''),
                    'Created By': formatUser(item.created_by),
                    'Updated By': formatUser(item.updated_by),
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

    const fetchReferenceData = async () => {
        try {
            const [
                statesRes, divisionsRes, parliamentsRes,
                assembliesRes, blocksRes, boothsRes,
                candidatesRes, electionYearsRes
            ] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/booths`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/candidates`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/election-years`)
            ]);

            const [
                statesData, divisionsData, parliamentsData,
                assembliesData, blocksData, boothsData,
                candidatesData, electionYearsData, usersData
            ] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                boothsRes.json(),
                candidatesRes.json(),
                electionYearsRes.json(),
                // users may be used to resolve created_by/updated_by ids -> names
                fetch(`${import.meta.env.VITE_APP_API_URL}/users`).then(r => r.json())
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (blocksData.success) setBlocks(blocksData.data);
            if (boothsData.success) setBooths(boothsData.data);
            if (candidatesData.success) setCandidates(candidatesData.data);
            if (electionYearsData.success) setElectionYears(electionYearsData.data);
            if (usersData && usersData.success) setUsers(usersData.data);
        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    useEffect(() => {
        fetchVisits(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, appliedFilters]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    const workStatusColor = {
        'announced': 'default',
        'approved': 'info',
        'in progress': 'warning',
        'complete': 'success',
        'other': 'default',
        'speech subject': 'primary'
    };


    const handleApplyFilters = () => {
        setAppliedFilters(filterValues);
        setPagination({ pageIndex: 0, pageSize: 10 });
        fetchVisits(0, 10, globalFilter);
    };

    const handleClearFilters = () => {
        const emptyFilters = {
            candidate: '',
            status: '',
            state: '',
            division: '',
            parliament: '',
            assembly: '',
            block: '',
            booth: '',
            year: '',
            startDate: '',
            endDate: ''
        };
        setFilterValues(emptyFilters);
        setAppliedFilters(emptyFilters);
        setPagination({ pageIndex: 0, pageSize: 10 });
        fetchVisits(0, 10, globalFilter);
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

    const handleSearch = () => {
        const searchTerm = searchInput.trim();
        setGlobalFilter(searchTerm);
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    };

    // Receive filter signals from map selections (marker, polygon, etc.)
    const handleMapSelection = (selection) => {
        if (!selection) return;
        // If a booth was selected via polygon click, prefer filtering by booth id
        if (selection.type === 'booth' && selection.boothId) {
            const booth = selection.booth || {};
            const updates = {
                state: booth.state_id?._id || booth.state_id || '',
                division: booth.division_id?._id || booth.division_id || '',
                parliament: booth.parliament_id?._id || booth.parliament_id || '',
                assembly: booth.assembly_id?._id || booth.assembly_id || '',
                block: booth.block_id?._id || booth.block_id || '',
                booth: String(selection.boothId)
            };
            setFilterValues(prev => ({ ...prev, ...updates }));
            setAppliedFilters(prev => ({ ...prev, ...updates }));
            // Clear any free-text search when applying hard filters
            setGlobalFilter('');
            setSearchInput('');
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
            return;
        }

        // Fallback: booth number only
        if (selection.type === 'booth-number' && selection.boothNumber) {
            const text = String(selection.boothNumber);
            setGlobalFilter(text);
            setSearchInput(text);
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
            return;
        }

        // Location selection from marker clusters -> use global search with location name
        if (selection.type === 'location' && selection.locationName) {
            const text = selection.locationName;
            setGlobalFilter(text);
            setSearchInput(text);
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
            return;
        }

        // Year selection from map's dropdown
        if (selection.type === 'year') {
            const y = selection.year || '';
            setFilterValues(prev => ({ ...prev, year: y }));
            setAppliedFilters(prev => ({ ...prev, year: y }));
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
            return;
        }
    };

    const columns = useMemo(() => [
        {
            header: '#',
            accessorKey: '_id',
            cell: ({ row }) => <Typography>{row.index + 1}</Typography>
        },
        {
            header: 'Candidate',
            accessorKey: 'candidate_id',
            cell: ({ getValue }) => (
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                        src={getValue()?.photo}
                        sx={{ width: 32, height: 32 }}
                    />
                    <Typography fontWeight="medium">
                        {getValue()?.name || 'N/A'}
                    </Typography>
                </Stack>
            )
        },
        {
            header: 'Post',
            accessorKey: 'post',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Election Year',
            accessorKey: 'election_year_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.year ? `${getValue().year} (${getValue().election_type})` : 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Date',
            accessorKey: 'date',
            cell: ({ getValue }) => (
                <Typography>
                    {formatDate(getValue())}
                </Typography>
            )
        },
        {
            header: 'Status',
            accessorKey: 'work_status',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.toUpperCase() || 'N/A'}
                    color={workStatusColor[getValue()] || 'default'}
                    size="small"
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
            header: 'Parliament',
            accessorKey: 'parliament_id',
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
            header: 'Panchayat',
            accessorKey: 'panchayat_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.panchayat_name || 'N/A'}
                    color="info"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Village',
            accessorKey: 'village_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.village_name || 'N/A'}
                    color="success"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Falliya',
            accessorKey: 'falliya_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.falliya_name || 'N/A'}
                    color="warning"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Year',
            accessorKey: 'year',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 'N/A'}
                    color="primary"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Location',
            accessorKey: 'locationName',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Longitude',
            accessorKey: 'longitude',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Latitude',
            accessorKey: 'latitude',
            cell: ({ getValue }) => (
                <Typography>
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
            header: 'Visit Agenda',
            accessorKey: 'visitAgenda',
            cell: ({ getValue }) => (
                <Typography sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic', color: 'text.secondary' }}>
                    {getValue() ? getValue().slice(0, 100) : ''}
                </Typography>
            )
        },
        {
            header: 'Remark',
            accessorKey: 'remark',
            cell: ({ getValue }) => (
                <Typography sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic', color: 'text.secondary' }}>
                    {getValue() ? getValue().slice(0, 100) : ''}
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
                                onClick={() => navigate(`/visits/${row.original._id}`)}
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
        data: visits,
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

    // Render full page even while table data is loading so child components (map/drawers)
    // don't get unmounted during fetch cycles. Table shows its own inline loader row.
    return (
        <>
            <Grid container spacing={3}>


                <Grid item xs={12}>
                    <VisitMapTabs onFilterFromMap={handleMapSelection} onOpenDrawer={handleOpenDrawer} />
                </Grid>

                <Grid item xs={12}>
                    <MainCard content={false}>
                        <Stack spacing={2} sx={{ padding: 3 }}>
                            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                                <TextField
                                    size="small"
                                    variant="outlined"
                                    placeholder={`Search all fields (candidate, state, division, etc.) - Press Enter to search...`}
                                    value={searchInput}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setSearchInput(value);
                                        // Clear search if input is empty
                                        if (value.trim() === '') {
                                            setGlobalFilter('');
                                            setPagination(prev => ({ ...prev, pageIndex: 0 }));
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearch();
                                        }
                                    }}
                                    InputProps={{
                                        // optionally you can add a clear button or icon here
                                    }}
                                    sx={{ minWidth: 400 }}
                                />
                                <Stack direction="row" spacing={1}>
                                    <CSVLink
                                        data={csvData}
                                        filename="visits_all.csv"
                                        style={{ display: 'none' }}
                                        ref={csvLinkRef}
                                    />
                                    <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                                        {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                                    </Button>
                                    <Button variant="contained" startIcon={<Add />} onClick={() => { setEditData(null); setOpenModal(true); }}>
                                        Add Visit
                                    </Button>
                                </Stack>
                            </Stack>

                            {/* Access Scope Information */}
                            <Alert
                                severity="info"
                                sx={{ mb: 2 }}
                            >
                                <Typography variant="body2">
                                    <strong>Data Access:</strong> {accessScope.description}
                                </Typography>
                            </Alert>

                            {/* Filters Section */}
                            <Grid container spacing={2}>
                                {/* First Row */}
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Candidate</InputLabel>
                                        <Select
                                            value={filterValues.candidate}
                                            onChange={(e) => setFilterValues(prev => ({ ...prev, candidate: e.target.value }))}
                                            label="Candidate"
                                        >
                                            <MenuItem value="">All Candidates</MenuItem>
                                            {candidates.map((candidate) => (
                                                <MenuItem key={candidate._id} value={candidate._id}>
                                                    {candidate.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={filterValues.status}
                                            onChange={(e) => setFilterValues(prev => ({ ...prev, status: e.target.value }))}
                                            label="Status"
                                        >
                                            <MenuItem value="">All Status</MenuItem>
                                            <MenuItem value="announced">Announced</MenuItem>
                                            <MenuItem value="approved">Approved</MenuItem>
                                            <MenuItem value="in progress">In Progress</MenuItem>
                                            <MenuItem value="complete">Complete</MenuItem>
                                            <MenuItem value="other">Other</MenuItem>
                                            <MenuItem value="speech subject">Speech Subject</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Start Date"
                                        type="date"
                                        value={filterValues.startDate}
                                        onChange={(e) => setFilterValues(prev => ({ ...prev, startDate: e.target.value }))}
                                        InputLabelProps={{ shrink: true }}
                                        variant="outlined"
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="End Date"
                                        type="date"
                                        value={filterValues.endDate}
                                        onChange={(e) => setFilterValues(prev => ({ ...prev, endDate: e.target.value }))}
                                        InputLabelProps={{ shrink: true }}
                                        variant="outlined"
                                    />
                                </Grid>

                                {/* Second Row */}
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
                                        <InputLabel>Assembly</InputLabel>
                                        <Select
                                            value={filterValues.assembly}
                                            onChange={(e) => handleAssemblyChange(e.target.value)}
                                            label="Assembly"
                                            disabled={!filterValues.division}
                                        >
                                            <MenuItem value="">
                                                {!filterValues.division ? "Select Division First" : "All Assemblies"}
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
                                        <InputLabel>Booth</InputLabel>
                                        <Select
                                            value={filterValues.booth}
                                            onChange={(e) => setFilterValues(prev => ({ ...prev, booth: e.target.value }))}
                                            label="Booth"
                                            disabled={!filterValues.assembly}
                                        >
                                            <MenuItem value="">
                                                {!filterValues.assembly ? "Select Assembly First" : "All Booths"}
                                            </MenuItem>
                                            {filteredBooths.map((booth) => (
                                                <MenuItem key={booth._id} value={booth._id}>
                                                    {booth.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
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
                        </Stack>                        <ScrollX>
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

            <VisitModal
                open={openModal}
                modalToggler={setOpenModal}
                visit={editData}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                candidates={candidates}
                electionYears={electionYears}
                refresh={() => {
                    fetchVisits(pagination.pageIndex, pagination.pageSize);
                }}
            />
            <AlertVisitDelete
                open={deleteAlert.open}
                handleClose={() => setDeleteAlert({ open: false, id: null })}
                id={deleteAlert.id}
                refresh={() => {
                    fetchVisits(pagination.pageIndex, pagination.pageSize);
                }}
            />
            {/* Drawer moved to parent so it stays mounted across fetches */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                ModalProps={{ keepMounted: true }}
                PaperProps={{ sx: { zIndex: 2000 } }}
            >
                <Box sx={{ width: 420, p: 2 }}>
                    {drawerType === 'booth' && drawerData && (
                        <>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="h6" fontWeight="bold">Visit Data</Typography>
                                <Button size="small" onClick={() => setDrawerOpen(false)} sx={{ ml: 'auto' }}>
                                    <CloseIcon />
                                </Button>
                            </Stack>
                            {drawerData.loading ? (
                                <Typography variant="body2" color="text.secondary">Loading booth details...</Typography>
                            ) : drawerData.error ? (
                                <Typography variant="body2" color="error">Error: {drawerData.error}</Typography>
                            ) : (
                                <>
                                    {drawerData.details?.booth ? (
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Booth Information</Typography>
                                            <Stack spacing={1.5}>
                                                <Box sx={{ p: 1.5, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                                                    <Typography variant="body2"><strong>Name:</strong> {drawerData.details.booth.name || 'N/A'}</Typography>
                                                </Box>
                                                <Box sx={{ p: 1.5, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                                                    <Typography variant="body2"><strong>Booth No:</strong> {drawerData.details.booth.booth_number || 'N/A'}</Typography>
                                                </Box>
                                                <Box sx={{ p: 1.5, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                                                    <Typography variant="body2"><strong>Block:</strong> {drawerData.details.booth.block_id?.name || 'N/A'}</Typography>
                                                </Box>
                                                <Box sx={{ p: 1.5, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                                                    <Typography variant="body2"><strong>Assembly:</strong> {drawerData.details.booth.assembly_id?.name || 'N/A'}</Typography>
                                                </Box>
                                                <Box sx={{ p: 1.5, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                                                    <Typography variant="body2"><strong>Parliament:</strong> {drawerData.details.booth.parliament_id?.name || 'N/A'}</Typography>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                            No booth found for Booth No: {drawerData.boothNo}
                                        </Typography>
                                    )}
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                                            Visit Data ({drawerData.details?.visits?.length || 0})
                                        </Typography>
                                        {drawerData.details?.visits && drawerData.details.visits.length > 0 ? (
                                            <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
                                                <Stack spacing={1.5}>
                                                    {drawerData.details.visits.map((visit, index) => (
                                                        <Box key={index} sx={{ p: 1.5, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                                <Box sx={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${theme.palette.primary.main}` }}>
                                                                    <img src={visit.candidate_id?.photo} alt={visit.candidate_id?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                </Box>
                                                                <Typography variant="body2" fontWeight="bold">{visit.candidate_id?.name || 'Unknown'}</Typography>
                                                            </Stack>
                                                            <Typography variant="body2"><strong>📅</strong> {formatDate(visit.date)}</Typography>
                                                            <Typography variant="body2"><strong>📍</strong> {visit.locationName || 'N/A'}</Typography>
                                                            <Typography variant="body2"><strong>🔄 Status:</strong> <span style={{ color: visit.work_status === 'complete' ? 'green' : visit.work_status === 'in progress' ? 'orange' : 'inherit', fontWeight: 'bold' }}>{visit.work_status?.toUpperCase() || 'N/A'}</span></Typography>
                                                            {visit.visitAgenda && (<Typography variant="body2"><strong>🗒️</strong> {visit.visitAgenda}</Typography>)}
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">No visits found for this booth.</Typography>
                                        )}
                                    </Box>
                                </>
                            )}
                        </>
                    )}

                    {drawerType === 'visit' && drawerData && (
                        <>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="h6" fontWeight="bold">Visit Data</Typography>
                                <Button size="small" onClick={() => setDrawerOpen(false)} sx={{ ml: 'auto' }}>
                                    <CloseIcon />
                                </Button>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                <Box sx={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${theme.palette.primary.main}` }}>
                                    <img src={drawerData.candidate?.photo} alt={drawerData.candidate?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </Box>
                                <Typography fontWeight="bold">{drawerData.candidate?.name}</Typography>
                            </Stack>
                            <Typography variant="body2"><strong>📅</strong> {formatDate(drawerData.visit?.date)}</Typography>
                            <Typography variant="body2"><strong>📍</strong> {drawerData.visit?.locationName || 'N/A'}</Typography>
                            <Typography variant="body2"><strong>📌 Booth:</strong> {drawerData.visit?.booth_id?.name || 'N/A'}</Typography>
                            <Typography variant="body2"><strong>🔄 Status:</strong> {drawerData.visit?.work_status?.toUpperCase() || 'N/A'}</Typography>
                            {drawerData.visit?.visitAgenda && (<Typography variant="body2"><strong>🗒️ Agenda:</strong> {drawerData.visit.visitAgenda}</Typography>)}
                            {drawerData.visit?.remark && (<Typography variant="body2"><strong>📝 Remark:</strong> {drawerData.visit.remark}</Typography>)}
                        </>
                    )}

                    {drawerType === 'location' && drawerData && (
                        <>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="h6" fontWeight="bold">Visit Data</Typography>
                                <Button size="small" onClick={() => setDrawerOpen(false)} sx={{ ml: 'auto' }}>
                                    <CloseIcon />
                                </Button>
                            </Stack>
                            {drawerData.locationName && (
                                <Typography variant="body2" sx={{ mb: 1 }}><strong>📍</strong> {drawerData.locationName}</Typography>
                            )}
                            {(drawerData.latitude !== undefined && drawerData.longitude !== undefined) && (
                                <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>
                                    <strong>🌐</strong> {Number(drawerData.latitude).toFixed(4)}, {Number(drawerData.longitude).toFixed(4)}
                                </Typography>
                            )}
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                                Visits at this location ({(drawerData.visits || []).length})
                            </Typography>
                            <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
                                <Stack spacing={1.5}>
                                    {(drawerData.visits || []).map((visit, idx) => (
                                        <Box key={idx} sx={{ p: 1.5, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                <Box sx={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${theme.palette.primary.main}` }}>
                                                    <img src={visit.candidate_id?.photo} alt={visit.candidate_id?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </Box>
                                                <Typography variant="body2" fontWeight="bold">{visit.candidate_id?.name || 'Unknown'}</Typography>
                                            </Stack>
                                            <Typography variant="body2"><strong>📅</strong> {formatDate(visit.date)}</Typography>
                                            <Typography variant="body2"><strong>🔄 Status:</strong> <span style={{ color: visit.work_status === 'complete' ? 'green' : visit.work_status === 'in progress' ? 'orange' : 'inherit', fontWeight: 'bold' }}>{visit.work_status?.toUpperCase() || 'N/A'}</span></Typography>
                                            {visit.visitAgenda && (<Typography variant="body2"><strong>🗒️</strong> {visit.visitAgenda}</Typography>)}
                                            {visit.remark && (<Typography variant="body2"><strong>📝</strong> {visit.remark}</Typography>)}
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        </>
                    )}
                </Box>
            </Drawer>
        </>
    );
};

export default VisitListPage;
