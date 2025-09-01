import Grid from '@mui/material/Grid';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import ChangeTheme from 'sections/maps/change-theme copy';
import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions,
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


import WinningCandidateModal from './WinningCandidatesModal';
import AlertWinningCandidateDelete from './AlertWinningCandidatesDelete';
import WinningCandidateView from './WinningCandidatesView';

// Beautiful details modal for State, Division, Parliament, Assembly, Party
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';

const EntityDetailsModal = ({ open, onClose, details, title }) => {
    if (!details) return null;

    // Helper to show name if value is object with name, else string
    const renderValue = (value) => {
        if (value && typeof value === 'object') {
            if (value.name) return value.name;
            if (value.username) return value.username;
            if (value.year) return value.year;
            return JSON.stringify(value);
        }
        return String(value);
    };

    // Pick main fields to highlight at top
    const mainField = details.name || details.abbreviation || details.title || '';
    const subField = details.abbreviation && details.abbreviation !== details.name ? details.abbreviation : '';

    // Fields to show in grid (skip _id, __v, etc)
    const skipFields = ['_id', '__v', 'photo', 'symbol'];
    const fields = Object.entries(details).filter(([key]) => !skipFields.includes(key));

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 0 }}>
                <InfoOutlinedIcon color="primary" />
                <Box sx={{ flexGrow: 1 }}>{title} Details</Box>
            </DialogTitle>
            <DialogContent dividers sx={{ background: '#f7f9fa', pt: 2 }}>
                <Stack spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h5" fontWeight={700} color="primary.main" gutterBottom>
                        {mainField}
                    </Typography>
                    {subField && (
                        <Chip label={subField} color="secondary" size="small" />
                    )}
                </Stack>
                {/* Show description if present */}
                {details.description && (
                    <Box mb={2} sx={{ width: '100%' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Description</Typography>
                        <Box sx={{ border: '1px solid #eee', borderRadius: 1, p: 2, bgcolor: 'background.default', minHeight: 60 }}>
                            <div dangerouslySetInnerHTML={{ __html: details.description }} />
                        </Box>
                    </Box>
                )}
                <Grid container spacing={2}>
                    {Array.isArray(fields) && fields.map(([key, value]) => (
                        key === 'name' || key === 'abbreviation' || key === 'description' ? null : (
                            <Grid item xs={12} sm={6} key={key}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: 13 }}>
                                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, fontSize: 15 }}>
                                    {renderValue(value)}
                                </Typography>
                            </Grid>
                        )
                    ))}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary" variant="contained">Close</Button>
            </DialogActions>
        </Dialog>
    );
};

const mapConfiguration = {
    mapboxAccessToken: import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN,
    minZoom: 1
};

const MAPBOX_THEMES = {
    //   light: 'mapbox://styles/mapbox/light-v10',
    //   dark: 'mapbox://styles/mapbox/dark-v10',
    //   streets: 'mapbox://styles/mapbox/streets-v11',
    outdoors: 'mapbox://styles/mapbox/outdoors-v11',
    //   satellite: 'mapbox://styles/mapbox/satellite-v9',
    //   satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v11'
};

export default function WinningCandidateListPage() {
    const theme = useTheme();

    const [selectedCandidate, setSelectedCandidate] = useState(null); // for edit modal
    const [openModal, setOpenModal] = useState(false); // for edit modal
    const [candidateDetails, setCandidateDetails] = useState(null); // for details modal
    const [openDetailsModal, setOpenDetailsModal] = useState(false); // for details modal
    const [openDelete, setOpenDelete] = useState(false);
    const [candidateDeleteId, setCandidateDeleteId] = useState('');
    const [candidateList, setCandidateList] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [parties, setParties] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [years, setYears] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');

    // Filter states
    const [filterValues, setFilterValues] = useState({
        party: '',
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        candidate: '',
        electionYear: ''
    });

    const [appliedFilters, setAppliedFilters] = useState({
        party: '',
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        candidate: '',
        electionYear: ''
    });

    // Filtered data for cascading dropdowns
    const filteredDivisions = filterValues.state
        ? divisions.filter(division => {
            // Handle both populated and non-populated state_id
            const stateId = division.state_id?._id || division.state_id;
            const matches = stateId === filterValues.state;
            if (process.env.NODE_ENV === 'development') {

            }
            return matches;
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

    const handleApplyFilters = () => {
        setAppliedFilters(filterValues);
        setPagination({ pageIndex: 0, pageSize: 10 });
        fetchCandidateList(0, 10, globalFilter);
    };

    const handleClearFilters = () => {
        const emptyFilters = {
            party: '',
            state: '',
            division: '',
            parliament: '',
            assembly: '',
            candidate: '',
            electionYear: ''
        };
        setFilterValues(emptyFilters);
        setAppliedFilters(emptyFilters);
        setPagination({ pageIndex: 0, pageSize: 10 });
        fetchCandidateList(0, 10, globalFilter);
    };

    // Handle cascading filter changes
    const handleStateChange = (stateValue) => {
        setFilterValues({
            ...filterValues,
            state: stateValue,
            division: '', // Clear dependent filters
            parliament: '',
            assembly: ''
        });
    };

    const handleDivisionChange = (divisionValue) => {
        setFilterValues({
            ...filterValues,
            division: divisionValue,
            parliament: '', // Clear dependent filters
            assembly: ''
        });
    };

    const handleParliamentChange = (parliamentValue) => {
        setFilterValues({
            ...filterValues,
            parliament: parliamentValue,
            assembly: '' // Clear dependent filter
        });
    };

    // For entity popups
    const [entityDetails, setEntityDetails] = useState(null);
    const [openEntityModal, setOpenEntityModal] = useState(false);
    const [entityTitle, setEntityTitle] = useState('');

    const fetchReferenceData = async () => {
        try {
            const [
                statesRes,
                partiesRes,
                candidatesRes,
                yearsRes
            ] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parties`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/candidates`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/election-years`)
            ]);

            const [
                statesData,
                partiesData,
                candidatesData,
                yearsData
            ] = await Promise.all([
                statesRes.json(),
                partiesRes.json(),
                candidatesRes.json(),
                yearsRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (partiesData.success) setParties(partiesData.data);
            if (candidatesData.success) setCandidates(candidatesData.data);
            if (yearsData.success) {
                setYears(yearsData.data);
                if (process.env.NODE_ENV === 'development') {
                }
            }

            // Fetch all divisions, parliaments, and assemblies initially
            const [divisionsRes, parliamentsRes, assembliesRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`)
            ]);

            const [divisionsData, parliamentsData, assembliesData] = await Promise.all([
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json()
            ]);

            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    const fetchCandidateList = async (pageIndex, pageSize, globalFilter = '') => {
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
            if (appliedFilters.candidate) {
                queryParams.push(`candidate=${appliedFilters.candidate}`);
            }
            if (appliedFilters.electionYear) {
                queryParams.push(`electionYear=${appliedFilters.electionYear}`);
                if (process.env.NODE_ENV === 'development') {
                }
            }

            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/winning-candidates?${queryParams.join('&')}`);
            const json = await res.json();
            if (json.success) {
                setCandidateList(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch winning candidate list:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCandidateList(pagination.pageIndex, pagination.pageSize, globalFilter);
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, appliedFilters]);

    useEffect(() => {
        fetchReferenceData();
    }, []);

    const handleDeleteOpen = (id) => {
        setCandidateDeleteId(id);
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

    // Candidate Details Modal (moved above columns for correct scope)
    // Dedicated modal for full candidate details (fetched from API)
    const CandidateDetailsModal = ({ open, onClose, details }) => {
        if (!details) return null;
        return (
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>Candidate Details</Box>
                </DialogTitle>
                <DialogContent dividers sx={{ background: '#f7f9fa' }}>
                    <Stack spacing={3} alignItems="center">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                            {details.photo ? (
                                <Box
                                    component="img"
                                    src={details.photo}
                                    alt="Candidate"
                                    sx={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', boxShadow: 2, mb: 1 }}
                                />
                            ) : (
                                <Box sx={{ width: 110, height: 110, borderRadius: '50%', bgcolor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: 'grey.500', mb: 1 }}>
                                    {details.name?.[0] || '?'}
                                </Box>
                            )}
                            <Typography variant="h5" fontWeight={700} gutterBottom>{details.name}</Typography>
                            <Chip label={details.is_active ? 'Active' : 'Inactive'} color={details.is_active ? 'success' : 'default'} size="small" sx={{ mt: 0.5 }} />
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Caste</Typography>
                                <Typography variant="body1" fontWeight={500}>{details.caste || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Criminal Cases</Typography>
                                <Typography variant="body1" fontWeight={500}>{details.criminal_cases || 0}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Assets</Typography>
                                <Typography variant="body1" fontWeight={500}>{details.assets || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Liabilities</Typography>
                                <Typography variant="body1" fontWeight={500}>{details.liabilities || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary">Education</Typography>
                                <Typography variant="body1" fontWeight={500}>{details.education || 'N/A'}</Typography>
                            </Grid>
                        </Grid>
                        <Divider sx={{ width: '100%', my: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                                <Typography variant="body2">{formatDate(details.created_at)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                                <Typography variant="body2">{formatDate(details.updated_at)}</Typography>
                            </Grid>
                        </Grid>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="primary" variant="contained">Close</Button>
                </DialogActions>
            </Dialog>
        );
    };

    const handleEntityClick = async (type, id) => {
        if (!id) return;
        let url = '';
        let title = '';
        switch (type) {
            case 'state':
                url = `${import.meta.env.VITE_APP_API_URL}/states/${id}`;
                title = 'State';
                break;
            case 'division':
                url = `${import.meta.env.VITE_APP_API_URL}/divisions/${id}`;
                title = 'Division';
                break;
            case 'parliament':
                url = `${import.meta.env.VITE_APP_API_URL}/parliaments/${id}`;
                title = 'Parliament';
                break;
            case 'assembly':
                url = `${import.meta.env.VITE_APP_API_URL}/assemblies/${id}`;
                title = 'Assembly';
                break;
            case 'party':
                url = `${import.meta.env.VITE_APP_API_URL}/parties/${id}`;
                title = 'Party';
                break;
            default:
                return;
        }
        try {
            const res = await fetch(url);
            const json = await res.json();
            if (json.success) {
                setEntityDetails(json.data);
                setEntityTitle(title);
                setOpenEntityModal(true);
            }
        } catch (err) {
            console.error(`Error fetching ${title} details:`, err);
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
            }
        },
        {
            header: 'Candidate',
            accessorKey: 'candidate_id',
            cell: ({ getValue }) => {
                const candidate = getValue();
                return (
                    <Typography
                        fontWeight="medium"
                        sx={{ cursor: candidate ? 'pointer' : 'default', color: candidate ? 'primary.main' : 'inherit', textDecoration: candidate ? 'underline' : 'none' }}
                        onClick={async () => {
                            if (candidate && candidate._id) {
                                try {
                                    const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/candidates/${candidate._id}`);
                                    const json = await res.json();
                                    if (json.success) {
                                        setCandidateDetails(json.data);
                                        setOpenDetailsModal(true);
                                    } else {
                                        console.error('API did not return success for candidate details:', json);
                                    }
                                } catch (err) {
                                    console.error('Error fetching candidate details:', err);
                                }
                            }
                        }}
                    >
                        {candidate?.name || 'N/A'}
                    </Typography>
                );
            }
        },
        {
            header: 'Party',
            accessorKey: 'party_id',
            cell: ({ getValue }) => {
                const party = getValue();
                return (
                    <Chip
                        label={party?.name || 'N/A'}
                        color="primary"
                        size="small"
                        variant="outlined"
                        sx={{ cursor: party?._id ? 'pointer' : 'default', textDecoration: party?._id ? 'underline' : 'none' }}
                        onClick={() => party?._id && handleEntityClick('party', party._id)}
                    />
                );
            }
        },
        {
            header: 'Year',
            accessorKey: 'year_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.year || 'N/A'}
                    color="primary"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Assembly No',
            accessorKey: 'assembly_id',
            cell: ({ getValue }) => {
                const assembly = getValue();
                return (
                    <Typography fontWeight="medium">
                        {assembly?.AC_NO || 'N/A'}
                    </Typography>
                );
            }
        },
        {
            header: 'Election Type',
            accessorKey: 'type',
            cell: ({ getValue }) => (
                <Stack direction="row" spacing={0.5}>
                    {(Array.isArray(getValue()) ? getValue() : []).map((type, index) => (
                        <Chip
                            key={index}
                            label={type}
                            size="small"
                            color="info"
                            variant="outlined"
                        />
                    ))}
                </Stack>
            )
        },
        {
            header: 'Poll %',
            accessorKey: 'poll_percentage',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Total Votes',
            accessorKey: 'total_votes',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'Voting %',
            accessorKey: 'voting_percentage',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue()}%
                </Typography>
            )
        },
        {
            header: 'Margin',
            accessorKey: 'margin',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'Margin %',
            accessorKey: 'margin_percentage',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue()}%
                </Typography>
            )
        },
        {
            header: 'State',
            accessorKey: 'state_id',
            cell: ({ getValue }) => {
                const state = getValue();
                return (
                    <Chip
                        label={state?.name || 'N/A'}
                        color="primary"
                        size="small"
                        variant="outlined"
                        sx={{ cursor: state?._id ? 'pointer' : 'default', textDecoration: state?._id ? 'underline' : 'none' }}
                        onClick={() => state?._id && handleEntityClick('state', state._id)}
                    />
                );
            }
        },
        {
            header: 'Division',
            accessorKey: 'division_id',
            cell: ({ getValue }) => {
                const division = getValue();
                return (
                    <Chip
                        label={division?.name || 'N/A'}
                        color="warning"
                        size="small"
                        variant="outlined"
                        sx={{ cursor: division?._id ? 'pointer' : 'default', textDecoration: division?._id ? 'underline' : 'none' }}
                        onClick={() => division?._id && handleEntityClick('division', division._id)}
                    />
                );
            }
        },
        {
            header: 'Parliament',
            accessorKey: 'parliament_id',
            cell: ({ getValue }) => {
                const parliament = getValue();
                return (
                    <Chip
                        label={parliament?.name || 'N/A'}
                        color="secondary"
                        size="small"
                        variant="outlined"
                        sx={{ cursor: parliament?._id ? 'pointer' : 'default', textDecoration: parliament?._id ? 'underline' : 'none' }}
                        onClick={() => parliament?._id && handleEntityClick('parliament', parliament._id)}
                    />
                );
            }
        },
        {
            header: 'Assembly',
            accessorKey: 'assembly_id',
            cell: ({ getValue }) => {
                const assembly = getValue();
                return (
                    <Chip
                        label={assembly?.name || 'N/A'}
                        color="info"
                        size="small"
                        variant="outlined"
                        sx={{ cursor: assembly?._id ? 'pointer' : 'default', textDecoration: assembly?._id ? 'underline' : 'none' }}
                        onClick={() => assembly?._id && handleEntityClick('assembly', assembly._id)}
                    />
                );
            }
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
                        <IconButton color="secondary" onClick={row.getToggleExpandedHandler()}>
                            {expandIcon}
                        </IconButton>
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedCandidate(row.original); setOpenModal(true); }}>
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
        data: candidateList,
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

    const fetchAllCandidatesForCsv = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/winning-candidates?all=true`);
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all winning candidates for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const [shouldDownload, setShouldDownload] = useState(false);

    useEffect(() => {
        if (shouldDownload && csvData.length > 0) {
            csvLinkRef.current?.link.click();
            setShouldDownload(false);
        }
    }, [csvData, shouldDownload]);

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllCandidatesForCsv();
        setCsvData(allData.map(item => ({
            'Candidate': item.candidate_id?.name || '',
            'Party': item.party_id?.name || '',
            'Year': item.year_id?.year || '',
            'Assembly No': item.assembly_id?.AC_NO || '',
            'Election Type': item.type?.join(', ') || '',
            'Poll Percentage': item.poll_percentage || '',
            'Total Votes': item.total_votes,
            'Voting Percentage': item.voting_percentage,
            'Margin': item.margin,
            'Margin Percentage': item.margin_percentage,
            'State': item.state_id?.name || '',
            'Division': item.division_id?.name || '',
            'Parliament': item.parliament_id?.name || '',
            'Assembly': item.assembly_id?.name || '',
            'Created By': item.created_by?.username || '',
            'Created At': item.created_at
        })));
        setCsvLoading(false);
        setShouldDownload(true);
    };

    if (loading) return <EmptyReactTable />;

    return (
        <>
            {/* Candidate Details Modal */}
            {openDetailsModal && (
                <CandidateDetailsModal
                    open={openDetailsModal}
                    onClose={() => setOpenDetailsModal(false)}
                    details={candidateDetails}
                />
            )}

            {/* Entity Details Modal (State, Division, Parliament, Assembly) */}
            {openEntityModal && (
                <EntityDetailsModal
                    open={openEntityModal}
                    onClose={() => setOpenEntityModal(false)}
                    details={entityDetails}
                    title={entityTitle}
                />
            )}

            <Grid item xs={12}>
                <MainCard title="Theme Variants">
                    <MapContainerStyled>
                        <ChangeTheme {...mapConfiguration} themes={MAPBOX_THEMES} />
                    </MapContainerStyled>
                </MainCard>
            </Grid>
            <MainCard content={false}>
                <Stack spacing={2} sx={{ padding: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                        <DebouncedInput
                            value={globalFilter}
                            onFilterChange={setGlobalFilter}
                            placeholder={`Search ${candidateList.length} winning candidate entries...`}
                        />
                        <Stack direction="row" spacing={1}>
                            <CSVLink
                                data={csvData}
                                filename="winning_candidates_list_all.csv"
                                style={{ display: 'none' }}
                                ref={csvLinkRef}
                            />
                            <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                                {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                            </Button>
                            <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedCandidate(null); setOpenModal(true); }}>
                                Add Winning Candidate
                            </Button>
                        </Stack>
                    </Stack>

                    <Grid container spacing={2}>
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
                                    disabled={!filterValues.state}
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
                                    onChange={(e) => setFilterValues({ ...filterValues, assembly: e.target.value })}
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
                            <FormControl fullWidth size="small">
                                <InputLabel>Election Year</InputLabel>
                                <Select
                                    value={filterValues.electionYear}
                                    onChange={(e) => setFilterValues({ ...filterValues, electionYear: e.target.value })}
                                    label="Election Year"
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {years.map((year) => (
                                        <MenuItem key={year._id} value={year._id}>{year.year}</MenuItem>
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
                                                    <WinningCandidateView data={row.original} />
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

            <WinningCandidateModal
                open={openModal}
                modalToggler={setOpenModal}
                candidateEntry={selectedCandidate}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                parties={parties}
                candidates={candidates}
                years={years}
                refresh={() => fetchCandidateList(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertWinningCandidateDelete
                id={candidateDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchCandidateList(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}
