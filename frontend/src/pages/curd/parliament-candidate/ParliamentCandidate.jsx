import { useMemo, useState, useEffect, useRef, Fragment } from 'react';

// material-ui
import {
    Box,
    Button,
    Chip,
    Dialog,
    Divider,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    useTheme,
    CircularProgress,
    Paper,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import TextField from '@mui/material/TextField';

// third-party
import { 
    getCoreRowModel, 
    useReactTable, 
    getFilteredRowModel, 
    getPaginationRowModel, 
    getSortedRowModel,
    flexRender 
} from '@tanstack/react-table';
import { CSVLink } from 'react-csv';

// project-imports
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { PopupTransition } from 'components/@extended/Transitions';
import { HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';

// assets
import { Add, Edit, Eye, Trash, DocumentDownload } from 'iconsax-react';

// local imports
import ParliamentCandidateModal from './ParliamentCandidateModal';
import ParliamentCandidateView from './ParliamentCandidateView';
import AlertParliamentCandidateDelete from './AlertParliamentCandidateDelete';

export default function ParliamentCandidateListPage() {
    const theme = useTheme();

    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [candidateDeleteId, setCandidateDeleteId] = useState('');
    const [candidates, setCandidates] = useState([]);
    const [candidatesOptions, setCandidatesOptions] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const searchDebounceRef = useRef(null);
    const [filterYear, setFilterYear] = useState('');
    const [filterCandidate, setFilterCandidate] = useState('');
    const [yearOptions, setYearOptions] = useState([]);

    const fetchCandidates = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            const token = localStorage.getItem('serviceToken');
            // Build query params including filters
            const params = new URLSearchParams();
            params.set('page', String(pageIndex + 1));
            params.set('limit', String(pageSize));
            if (globalFilter) params.set('search', String(globalFilter));
            if (filterYear) params.set('election_year_id', String(filterYear));
            if (filterCandidate) params.set('candidate_id', String(filterCandidate));

            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliament-candidates?${params.toString()}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (result.success) {
                // Normalize each item to ensure numeric fields are actual numbers and mixed-case keys are handled
                const parseToNumberLocal = (val) => {
                    if (val === undefined || val === null || val === '') return 0;
                    if (typeof val === 'number') return val;
                    const s = String(val);
                    const percentMatch = s.match(/([\d.,]+)\s*%/);
                    if (percentMatch) {
                        const cleaned = percentMatch[1].replace(/,/g, '');
                        const n = Number(cleaned);
                        return isNaN(n) ? 0 : n;
                    }
                    const cleaned = s.replace(/[^0-9.-]/g, '');
                    const n = Number(cleaned);
                    return isNaN(n) ? 0 : n;
                };

                const normalize = (item) => {
                    const total = parseToNumberLocal(item.total_votes_parliament ?? item.Total_Votes_Polled ?? item.Total_Votes_Polled);
                    const candidateVotes = parseToNumberLocal(item.candidate_votes ?? item.Candidate_Votes);
                    const margin = parseToNumberLocal(item.margin ?? item.Margin);
                    // margin_percentage stored as decimal fraction or as percent string/number
                    let mp = item.margin_percentage ?? item.Margin_percentage ?? item.Margin_percentage ?? item['Margin_percentage'];
                    if (mp === undefined || mp === null || mp === '') {
                        mp = total > 0 ? (Math.abs(margin) / total) : 0;
                    } else {
                        const parsedMp = parseToNumberLocal(mp);
                        // if parsedMp looks like percent (e.g., 6.4) convert to decimal
                        mp = parsedMp > 1 ? (parsedMp <= 100 ? parsedMp / 100 : parsedMp) : parsedMp;
                    }

                    // compute vote_percentage if not present
                    let votePerc = item.vote_percentage ?? item.votePercentage ?? null;
                    if (votePerc === undefined || votePerc === null || votePerc === '') {
                        votePerc = total > 0 ? parseFloat(((candidateVotes / total) * 100).toFixed(2)) : 0;
                    } else {
                        const parsed = parseToNumberLocal(votePerc);
                        votePerc = parsed > 1 ? (parsed <= 100 ? parsed : parsed) : parsed;
                    }

                    return {
                        ...item,
                        candidate_votes: candidateVotes,
                        total_votes_parliament: total,
                        margin: margin,
                        margin_percentage: mp,
                        vote_percentage: votePerc,
                        electors: parseToNumberLocal(item.electors ?? item.Electors),
                        total_votes_polled: parseCount(
                            item.total_votes_polled ?? item.Total_Votes_Polled ?? item['Total Votes Polled'] ?? item['Total_Votes_Polled'] ?? item['Total Votes_Polled']
                        ),
                        valid_votes: parseCount(
                            item.valid_votes ?? item.Valid_Votes ?? item['Valid Votes'] ?? item['Valid_Votes'] ?? item['Valid Votes']
                        ),
                        male_electors: parseToNumberLocal(item.male_electors ?? item.Male_Electors),
                        female_electors: parseToNumberLocal(item.female_electors ?? item.Female_Electors),
                        total_male_voters: parseToNumberLocal(item.total_male_voters ?? item.Total_Male_Voters),
                        female_voters: parseToNumberLocal(item.female_voters ?? item.Female_Voters),
                        nota_votes: parseToNumberLocal(item.nota_votes ?? item.NOTA_Votes)
                    };
                };

                const normalized = Array.isArray(result.data) ? result.data.map(normalize) : [];
                setCandidates(normalized);
                setPageCount(Math.ceil(result.total / pageSize));
            }
        } catch (error) {
            console.error('Error fetching candidates:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCandidates(pagination.pageIndex, pagination.pageSize, globalFilter);
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, filterYear, filterCandidate]);

    useEffect(() => {
        setSearchInput(globalFilter || '');
    }, [globalFilter]);

    useEffect(() => () => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    }, []);

    // Fetch filter options (years and candidates)
    useEffect(() => {
        const token = localStorage.getItem('serviceToken');
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

        const fetchOptions = async () => {
            try {
                const yearsRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/election-years`, { headers });
                const yearsJson = await yearsRes.json();
                if (yearsJson.success && Array.isArray(yearsJson.data)) setYearOptions(yearsJson.data);

                const candRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/candidates`, { headers });
                const candJson = await candRes.json();
                if (candJson.success && Array.isArray(candJson.data)) setCandidatesOptions(candJson.data);
            } catch (err) {
                console.error('Error fetching filter options:', err);
            }
        };

        fetchOptions();
    }, []);

    const handleDeleteOpen = (id) => {
        setCandidateDeleteId(id);
        setOpenDelete(true);
    };

    const handleDeleteClose = () => setOpenDelete(false);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Parse a number that may be a number, numeric-string with commas, or a string containing extra text
    const parseToNumber = (val) => {
        if (val === undefined || val === null || val === '') return 0;
        if (typeof val === 'number') return val;
        // If already like "9,13,444 (62.7%)" or "62.70%" or "4,99,928"
        const s = String(val);
        // If contains percent and looks like percent, return numeric percent as fraction when needed by caller
        const percentMatch = s.match(/([\d.,]+)\s*%/);
        if (percentMatch) {
            const cleaned = percentMatch[1].replace(/,/g, '');
            const n = Number(cleaned);
            return isNaN(n) ? 0 : n; // return percent number (e.g., 62.7)
        }
        // Strip non-digit, non-dot, non-minus characters
        const cleaned = s.replace(/[^0-9.-]/g, '');
        const n = Number(cleaned);
        return isNaN(n) ? 0 : n;
    };

    // Parse a count-like value: prefer an explicit integer found before parentheses
    // e.g. "9,280 (0.5%)" -> 9280. Falls back to numeric extraction otherwise.
    const parseCount = (val) => {
        if (val === undefined || val === null || val === '') return 0;
        if (typeof val === 'number') return val;
        const s = String(val).trim();
        // If contains a pattern like "123,456 (0.5%)", extract the leading integer
        const leadingNumMatch = s.match(/([0-9][0-9,]*)\s*(?=\()/);
        if (leadingNumMatch) return Number(leadingNumMatch[1].replace(/,/g, ''));
        // Otherwise, try to find any integer-like group
        const anyNumMatch = s.match(/([0-9][0-9,]*)/);
        if (anyNumMatch) return Number(anyNumMatch[1].replace(/,/g, ''));
        // Fallback to parseToNumber which handles percent-only strings etc.
        return parseToNumber(s);
    };

    // Try extracting a count directly from the original item using multiple possible legacy keys.
    // Returns integer count or null if not found.
    const extractCountFromItem = (item, keys = []) => {
        if (!item) return null;
        for (const k of keys) {
            const v = item[k];
            if (v === undefined || v === null || v === '') continue;
            // If value already a number and > 1, return it
            if (typeof v === 'number' && Math.abs(v) > 1) return Math.round(v);
            const s = String(v);
            // Match leading integer like "14,55,658" (before parentheses)
            const mLead = s.match(/([0-9][0-9,]*)\s*(?=\()/);
            if (mLead) return Number(mLead[1].replace(/,/g, ''));
            // Match any integer group
            const mAny = s.match(/([0-9][0-9,]*)/);
            if (mAny) return Number(mAny[1].replace(/,/g, ''));
            // If string contains only a percent like "74.8%" skip
        }
        return null;
    };

    // Parse NOTA vote count: prefer the explicit count in strings like "9,280 (0.5%)" or the numeric field if >1.
    const parseNotaCount = (item) => {
        if (!item) return 0;
        // If original uppercase field exists and is a string like '9,280 (0.5%)', extract first number
        const orig = item.NOTA_Votes ?? item.Nota_Votes ?? item['NOTA_Votes'] ?? item.nota_votes_raw ?? null;
        if (typeof orig === 'string' && orig.length > 0) {
            const m = orig.match(/([0-9,]+)/);
            if (m) return Number(m[1].replace(/,/g, ''));
        }
        // If nota_votes is numeric and > 1, treat as count
        const n = parseToNumber(item.nota_votes);
        if (n > 1) return Math.round(n);
        // If nota_votes is a decimal fraction (e.g., 0.005) and total_votes_parliament exists, compute approximate count
        if (n > 0 && n <= 1) {
            const total = parseToNumber(item.total_votes_parliament);
            if (total > 0) return Math.round(n * total);
        }
        return 0;
    };

    const formatNumber = (num) => {
        const n = parseToNumber(num);
        return n.toLocaleString();
    };

    // Robust getter for margin percentage (decimal fraction).
    // Uses available fields if present, otherwise computes from margin/total.
    const getMarginPercentDecimal = (item) => {
        if (!item) return 0;
        // Try common keys or fallbacks (handle mixed-case DB keys too)
        const possibleVals = [
            item.margin_percentage,
            item.Margin_percentage,
            item.marginPercentage,
            item.margin_percent,
            item['Margin %'],
            item.Margin,
            item['Margin_percentage'],
            item['margin_percentage']
        ];

        for (const v of possibleVals) {
            if (v !== undefined && v !== null && v !== '') {
                const numeric = parseToNumber(v);
                if (!isNaN(numeric) && numeric !== 0) {
                    // If value looks like a percent (greater than 1) assume percent and convert
                    if (numeric > 1) return numeric <= 100 ? numeric / 100 : numeric;
                    return numeric; // already decimal fraction
                }
            }
        }

        // Fallback: compute from margin and total
        const margin = parseToNumber(item.margin) || 0;
        const total = parseToNumber(item.total_votes_parliament) || 0;
        if (total > 0) return Math.abs(margin) / total;
        return 0;
    };

    const getResultChipColor = (result) => {
        switch (result?.toLowerCase()) {
            case 'win':
                return 'success';
            case 'loss':
                return 'error';
            default:
                return 'default';
        }
    };

    const columns = useMemo(() => [
        {
            id: 'serial',
            header: '#',
            cell: ({ row, table }) => {
                const pageIndex = table.getState().pagination.pageIndex;
                const pageSize = table.getState().pagination.pageSize;
                return pageIndex * pageSize + row.index + 1;
            },
            meta: { className: 'cell-center' }
        },
        {
            id: 'candidate_name',
            header: 'Candidate',
            accessorKey: 'candidate_id.name',
            cell: ({ getValue }) => (
                <Typography sx={{
                    fontWeight: 500,
                    color: 'primary.main'
                }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            id: 'parliament_name', 
            header: 'Parliament',
            accessorKey: 'parliament_id.name',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            id: 'election_year',
            header: 'Election Year',
            accessorKey: 'election_year_id.year',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            id: 'party_name',
            header: 'Party',
            accessorKey: 'party_id.name',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: 500
                }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            id: 'position_result',
            header: 'Result',
            accessorKey: 'position_result',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.toUpperCase() || 'N/A'}
                    color={getResultChipColor(getValue())}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            id: 'candidate_votes',
            header: 'Candidate Votes',
            accessorKey: 'candidate_votes',
            cell: ({ getValue }) => (
                <Typography sx={{ fontWeight: 500 }}>
                    {formatNumber(getValue())}
                </Typography>
            )
        },
        {
            id: 'total_votes',
            header: 'Total Votes',
            accessorKey: 'total_votes_parliament',
            cell: ({ getValue }) => (
                <Typography>
                    {formatNumber(getValue())}
                </Typography>
            )
        },
        {
            id: 'electors',
            header: 'Electors',
            accessorKey: 'electors',
            cell: ({ getValue }) => (
                <Typography>
                    {formatNumber(getValue())}
                </Typography>
            )
        },
        {
            id: 'turnout',
            header: 'Turnout',
            accessorKey: 'turnout',
            cell: ({ getValue }) => (
                <Typography>
                    {(() => {
                        const v = getValue();
                        const n = parseToNumber(v);
                        if (n === 0) return '0%';
                        // If decimal fraction (e.g., 0.748) convert to percent
                        if (Math.abs(n) <= 1) return `${(n * 100).toFixed(1)}%`;
                        // If already percent number (e.g., 74.8) show with one decimal
                        return `${n.toFixed(1)}%`;
                    })()}
                </Typography>
            )
        },
        {
            id: 'total_votes_polled',
            header: 'Total Polled',
            accessorKey: 'total_votes_polled',
            cell: ({ getValue }) => (
                <Typography>
                    {(() => {
                        // Try to extract from original string fields first (legacy keys)
                        const item = arguments[0]?.row?.original; // not ideal but cell context unavailable here
                        // Safe fallback: use getValue()
                        try {
                            const origItem = item || {};
                            const keys = ['total_votes_polled', 'Total_Votes_Polled', 'Total Votes Polled', 'Total_Votes_Polled', 'Total Votes_Polled', 'Total_Votes_Polled_raw', 'Total Votes Polled_raw'];
                            const extracted = extractCountFromItem(origItem, keys);
                            if (extracted !== null) return extracted.toLocaleString();
                        } catch (e) {
                            // ignore
                        }
                        return formatNumber(getValue());
                    })()}
                </Typography>
            )
        },
        {
            id: 'valid_votes',
            header: 'Valid Votes',
            accessorKey: 'valid_votes',
            cell: ({ getValue }) => (
                <Typography>
                    {(() => {
                        const item = arguments[0]?.row?.original;
                        try {
                            const origItem = item || {};
                            const keys = ['valid_votes', 'Valid_Votes', 'Valid Votes', 'Valid_Votes', 'Valid Votes', 'Valid_Votes_raw', 'Valid Votes_raw'];
                            const extracted = extractCountFromItem(origItem, keys);
                            if (extracted !== null) return extracted.toLocaleString();
                        } catch (e) {
                            // ignore
                        }
                        return formatNumber(getValue());
                    })()}
                </Typography>
            )
        },
        {
            id: 'nota_votes',
            header: 'NOTA Votes',
            accessorKey: 'nota_votes',
            cell: ({ getValue, row }) => (
                <Typography>
                    {(() => {
                        const item = row.original;
                        const count = parseNotaCount(item);
                        return count ? count.toLocaleString() : '0';
                    })()}
                </Typography>
            )
        },
        
        {
            id: 'margin',
            header: 'Margin',
            accessorKey: 'margin',
            cell: ({ getValue, row }) => (
                <Typography sx={{
                    fontWeight: 500,
                    color: row.original.position_result === 'win' ? 'success.main' : 'error.main'
                }}>
                    {getValue() > 0 ? '+' : ''}{formatNumber(getValue())}
                </Typography>
            )
        },
        {
            id: 'created_by',
            header: 'Created By',
            accessorKey: 'created_by.username',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            id: 'created_at',
            header: 'Created At',
            accessorKey: 'created_at',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={0}>
                        <Tooltip title="View">
                            <IconButton
                                color="secondary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCandidate(row.original);
                                }}
                            >
                                <Eye />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton
                                color="primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCandidate(row.original);
                                    setOpenModal(true);
                                }}
                            >
                                <Edit />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton
                                color="error"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteOpen(row.original._id);
                                }}
                            >
                                <Trash />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                );
            },
            meta: { className: 'cell-center' }
        }
    ], [theme]);

    const table = useReactTable({
        data: candidates,
        columns,
        state: { pagination, globalFilter },
        pageCount,
        manualPagination: true,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel()
    });

    const fetchAllCandidatesForCsv = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliament-candidates?all=true`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (result.success && Array.isArray(result.data)) {
                // Normalize numeric/mixed-case fields for frontend usage
                const normalize = (item) => ({
                    ...item,
                    margin: parseToNumber(item.margin ?? item.Margin),
                    margin_percentage: (() => {
                        const mp = item.margin_percentage ?? item.Margin_percentage ?? item.Margin_percentage ?? item['Margin_percentage'];
                        if (mp !== undefined && mp !== null && mp !== '') {
                            const n = parseToNumber(mp);
                            if (!isNaN(n)) return n > 1 ? (n <= 100 ? n / 100 : n) : n;
                        }
                        return null;
                    })(),
                    total_votes_parliament: parseToNumber(item.total_votes_parliament ?? item.Total_Votes_Polled ?? item.Total_Votes_Polled),
                    electors: parseToNumber(item.electors ?? item.Electors),
                    candidate_votes: parseToNumber(item.candidate_votes ?? item.Candidate_Votes),
                    total_votes_polled: parseCount(
                        item.total_votes_polled ?? item.Total_Votes_Polled ?? item['Total Votes Polled'] ?? item['Total_Votes_Polled'] ?? item['Total Votes_Polled']
                    ),
                    valid_votes: parseCount(
                        item.valid_votes ?? item.Valid_Votes ?? item['Valid Votes'] ?? item['Valid_Votes'] ?? item['Valid Votes']
                    ),
                    male_electors: parseToNumber(item.male_electors ?? item.Male_Electors),
                    female_electors: parseToNumber(item.female_electors ?? item.Female_Electors),
                    total_male_voters: parseToNumber(item.total_male_voters ?? item.Total_Male_Voters),
                    female_voters: parseToNumber(item.female_voters ?? item.Female_Voters),
                    nota_votes: parseToNumber(item.nota_votes ?? item.NOTA_Votes)
                });
                return result.data.map(normalize);
            }
            return [];
        } catch (error) {
            console.error('Error fetching all candidates:', error);
            return [];
        }
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllCandidatesForCsv();
        const csvFormattedData = allData.map((item, index) => ({
            'Sr. No.': index + 1,
            'Candidate': item.candidate_id?.name || 'N/A',
            'Parliament': item.parliament_id?.name || 'N/A',
            'Election Year': item.election_year_id?.year || 'N/A',
            'Party': item.party_id?.name || 'N/A',
            'Result': item.position_result?.toUpperCase() || 'N/A',
            'Candidate Votes': formatNumber(item.candidate_votes),
            'Total Votes': formatNumber(item.total_votes_parliament),
                'Vote Percentage': item.vote_percentage ? `${item.vote_percentage}%` : '0%',
                'Margin': formatNumber(item.margin),
                'Margin %': `${(getMarginPercentDecimal(item) * 100).toFixed(2)}%`,
                'Electors': formatNumber(item.electors),
                'Turnout': (() => {
                    const n = parseToNumber(item.turnout);
                    if (n === 0) return '0%';
                    if (Math.abs(n) <= 1) return `${(n * 100).toFixed(1)}%`;
                    return `${n.toFixed(1)}%`;
                })(),
                'Male Electors': formatNumber(item.male_electors),
                'Female Electors': formatNumber(item.female_electors),
                'Total Votes Polled': formatNumber(item.total_votes_polled),
                'Valid Votes': formatNumber(item.valid_votes),
                'Total Male Voters': formatNumber(item.total_male_voters),
                'Female Voters': formatNumber(item.female_voters),
                'NOTA Votes': formatNumber(item.nota_votes),
            'Created By': item.created_by?.username || 'N/A',
            'Created At': formatDate(item.created_at)
        }));
        setCsvData(csvFormattedData);
        setCsvLoading(false);
        
        // Trigger download
        setTimeout(() => {
            csvLinkRef.current?.link.click();
        }, 100);
    };

    if (loading) return <CircularProgress />;

    return (
        <>
            <MainCard content={false}>
                <ScrollX>
                    <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ padding: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                                    <Typography variant="h5">Parliament Candidates</Typography>
                                    <TextField
                                        size="small"
                                        variant="outlined"
                                        placeholder="Search candidates..."
                                        value={searchInput}
                                        sx={{ width: 300 }}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setSearchInput(v);
                                            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                                            searchDebounceRef.current = setTimeout(() => {
                                                setGlobalFilter(String(v));
                                            }, 500);
                                        }}
                                    />
                                    <FormControl size="small" sx={{ minWidth: 160 }}>
                                        <InputLabel id="filter-year-label">Election Year</InputLabel>
                                        <Select
                                            labelId="filter-year-label"
                                            value={filterYear}
                                            label="Election Year"
                                            onChange={(e) => { setFilterYear(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
                                        >
                                            <MenuItem value="">All Years</MenuItem>
                                            {yearOptions.map((y) => (
                                                <MenuItem key={y._id || y.id || y.year} value={y._id || y.id || y.year}>{y.year}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl size="small" sx={{ minWidth: 220 }}>
                                        <InputLabel id="filter-candidate-label">Candidate</InputLabel>
                                        <Select
                                            labelId="filter-candidate-label"
                                            value={filterCandidate}
                                            label="Candidate"
                                            onChange={(e) => { setFilterCandidate(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
                                        >
                                            <MenuItem value="">All Candidates</MenuItem>
                                            {candidatesOptions.map((c) => (
                                                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>
                        <Stack direction="row" spacing={2}>
                            <Button
                                variant="outlined"
                                startIcon={csvLoading ? <CircularProgress size={18} /> : <DocumentDownload />}
                                onClick={handleDownloadCsv}
                                disabled={csvLoading}
                            >
                                {csvLoading ? 'Preparing...' : 'Export CSV'}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => {
                                    setSelectedCandidate(null);
                                    setOpenModal(true);
                                }}
                            >
                                Add Parliament Candidate
                            </Button>
                        </Stack>
                    </Stack>

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
                                                    cursor: header.column.getCanSort()
                                                        ? 'pointer'
                                                        : 'default',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    backgroundColor: 'primary.main'
                                                }}
                                            >
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                >
                                                    <Box>
                                                        {flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                    </Box>
                                                    {header.column.getCanSort() && (
                                                        <HeaderSort column={header.column} />
                                                    )}
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
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                        {row.getIsExpanded() && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={row.getVisibleCells().length}
                                                >
                                                    <ParliamentCandidateView data={row.original} />
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

            {/* CSV Download Link */}
            <CSVLink
                data={csvData}
                filename="parliament-candidates.csv"
                ref={csvLinkRef}
                style={{ display: 'none' }}
            />

            {/* Add/Edit Modal */}
            <Dialog
                maxWidth="md"
                fullWidth
                TransitionComponent={PopupTransition}
                onClose={() => setOpenModal(false)}
                open={openModal}
                sx={{ '& .MuiDialog-paper': { p: 0 } }}
            >
                <ParliamentCandidateModal
                    open={openModal}
                    modalToggler={setOpenModal}
                    candidate={selectedCandidate}
                    refresh={() => fetchCandidates(pagination.pageIndex, pagination.pageSize, globalFilter)}
                />
            </Dialog>

            {/* View Modal */}
            <Dialog
                maxWidth="md"
                fullWidth
                TransitionComponent={PopupTransition}
                onClose={() => setSelectedCandidate(null)}
                open={selectedCandidate && !openModal}
                sx={{ '& .MuiDialog-paper': { p: 0 } }}
            >
                {selectedCandidate && !openModal && (
                    <ParliamentCandidateView 
                        data={selectedCandidate} 
                        onClose={() => setSelectedCandidate(null)}
                    />
                )}
            </Dialog>

            {/* Delete Confirmation */}
            <AlertParliamentCandidateDelete
                id={candidateDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchCandidates(pagination.pageIndex, pagination.pageSize, globalFilter)}
            />
        </>
    );
}