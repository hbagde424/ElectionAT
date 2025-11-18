import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
  Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider, TextField, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash, User } from 'iconsax-react';
import { useNavigate } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import { usePermissions } from 'contexts/PermissionContext';

// third-party
import {
  getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
  useReactTable, flexRender
} from '@tanstack/react-table';

// project imports
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';
import EmptyReactTable from 'pages/tables/react-table/empty';

// custom views and modals
import BoothVotesModal from 'pages/curd/votes/BoothVotes/BoothVotesModal';
import AlertBoothVotesDelete from 'pages/curd/votes/BoothVotes/AlertBoothVotesDelete';
import BoothVotesView from 'pages/curd/votes/BoothVotes/BoothVotesView';
import { Tooltip } from '@mui/material';

export default function BoothVotesListPage() {
  const theme = useTheme();
  const csvLinkRef = useRef();
  const importInputRef = useRef(null);
  const navigate = useNavigate();
  const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();
  const [csvData, setCsvData] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedVote, setSelectedVote] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [voteDeleteId, setVoteDeleteId] = useState('');
  const [votes, setVotes] = useState([]);
  const [allVotes, setAllVotes] = useState([]); // Store all votes for filtering
  const [states, setStates] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [parliaments, setParliaments] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [booths, setBooths] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [electionYears, setElectionYears] = useState([]);
  const [users, setUsers] = useState([]);
  const [parties, setParties] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [searchInput, setSearchInput] = useState('');
  // debounce ref for search input to avoid updating table on every keystroke
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);
  const [selectedBooth, setSelectedBooth] = useState('');
  const [selectedAssembly, setSelectedAssembly] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [tempFilters, setTempFilters] = useState({
    candidate: '',
    booth: '',
    assembly: '',
    party: '',
    party_name: ''
  });
  const [selectedPartyName, setSelectedPartyName] = useState('');

  // Get user's access scope information
  const getUserAccessScope = () => {
    if (!userHierarchy) {
      return { level: 'All', description: 'You have access to all booth vote data' };
    }

    const highestLevel = getUserHighestLevel();
    if (!highestLevel) {
      return { level: 'All', description: 'You have access to all booth vote data' };
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
      description: `You have access to booth vote data for ${levelName}: ${levelValue}`
    };
  };

  const accessScope = getUserAccessScope();

  const fetchVotes = async (pageIndex, pageSize) => {
    setLoading(true);
    try {
      let ignorePagination = !!(selectedCandidate || selectedBooth || selectedAssembly || selectedParty || selectedPartyName);
      let url;
      if (ignorePagination) {
        url = `${import.meta.env.VITE_APP_API_URL}/booth-votes?page=1&limit=10000`;
      } else {
        url = `${import.meta.env.VITE_APP_API_URL}/booth-votes?page=${pageIndex + 1}&limit=${pageSize}`;
      }
      if (selectedCandidate) url += `&candidate=${selectedCandidate}`;
      if (selectedBooth) url += `&booth=${selectedBooth}`;
      if (selectedAssembly) url += `&assembly=${selectedAssembly}`;
      if (selectedParty) url += `&party=${selectedParty}`;
      if (selectedPartyName) url += `&party_name=${encodeURIComponent(selectedPartyName)}`;

      // Add hierarchy-based filtering
      if (userHierarchy) {
        const highestLevel = getUserHighestLevel();
        if (highestLevel) {
          switch (highestLevel.level) {
            case 'state':
              url += `&state_id=${highestLevel.value}`;
              break;
            case 'division':
              url += `&division_id=${highestLevel.value}`;
              break;
            case 'parliament':
              url += `&parliament_id=${highestLevel.value}`;
              break;
            case 'assembly':
              url += `&assembly_id=${highestLevel.value}`;
              break;
            case 'block':
              url += `&block_id=${highestLevel.value}`;
              break;
            case 'booth':
              url += `&booth_id=${highestLevel.value}`;
              break;
          }
        }
      }

      const token = localStorage.getItem('serviceToken');
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(url, { headers });
      const json = await res.json();
      if (json.success) {
        setVotes(json.data);
        setPageCount(ignorePagination ? 1 : json.pages);
        // Don't update filter options when filters are applied - they should remain from initial load
      }
    } catch (error) {
      console.error('Failed to fetch booth votes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update filter options based on available votes data
  const updateFilterOptions = (votesData) => {
    if (!votesData || votesData.length === 0) {
      setCandidates([]);
      setBooths([]);
      setAssemblies([]);
      setParties([]);
      return;
    }

    // Extract unique candidates
    const uniqueCandidates = [];
    const candidateIds = new Set();
    votesData.forEach(vote => {
      if (vote.candidate && vote.candidate._id && !candidateIds.has(vote.candidate._id)) {
        candidateIds.add(vote.candidate._id);
        uniqueCandidates.push({
          _id: vote.candidate._id,
          name: vote.candidate.name
        });
      }
    });
    setCandidates(uniqueCandidates);

    // Extract unique booths
    const uniqueBooths = [];
    const boothIds = new Set();
    votesData.forEach(vote => {
      if (vote.booth && vote.booth._id && !boothIds.has(vote.booth._id)) {
        boothIds.add(vote.booth._id);
        uniqueBooths.push({
          _id: vote.booth._id,
          name: vote.booth.name,
          booth_number: vote.booth.booth_number
        });
      }
    });
    setBooths(uniqueBooths);

    // Extract unique assemblies
    const uniqueAssemblies = [];
    const assemblyIds = new Set();
    votesData.forEach(vote => {
      if (vote.assembly && vote.assembly._id && !assemblyIds.has(vote.assembly._id)) {
        assemblyIds.add(vote.assembly._id);
        uniqueAssemblies.push({
          _id: vote.assembly._id,
          name: vote.assembly.name
        });
      }
    });
    setAssemblies(uniqueAssemblies);

    // Extract unique parties (from candidates)
    const uniqueParties = [];
    const partyIds = new Set();
    votesData.forEach(vote => {
      if (vote.candidate && vote.candidate.party_id && vote.candidate.party_id._id && !partyIds.has(vote.candidate.party_id._id)) {
        partyIds.add(vote.candidate.party_id._id);
        uniqueParties.push({
          _id: vote.candidate.party_id._id,
          name: vote.candidate.party_id.name,
          abbreviation: vote.candidate.party_id.abbreviation
        });
      }
    });
    setParties(uniqueParties);
  };

  const fetchAllVotesForCsv = async () => {
    setCsvLoading(true);
    try {
      let url = `${import.meta.env.VITE_APP_API_URL}/booth-votes?all=true`;
      if (selectedCandidate) url += `&candidate=${selectedCandidate}`;
      if (selectedBooth) url += `&booth=${selectedBooth}`;
      if (selectedAssembly) url += `&assembly=${selectedAssembly}`;
      if (selectedParty) url += `&party=${selectedParty}`;

  const token = localStorage.getItem('serviceToken');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
      const json = await res.json();
      if (json.success) {
        return json.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch all votes for CSV:', error);
      return [];
    } finally {
      setCsvLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    const allData = await fetchAllVotesForCsv();
    const formattedData = allData.map(item => ({
      'Candidate': item.candidate?.name || 'N/A',
      'Party': item.candidate?.party_id?.name || 'N/A',
      'Booth': `${item.booth?.name || 'N/A'} (No: ${item.booth?.booth_number || 'N/A'})`,
      'Block number': item.booth?.booth_number || 'N/A',
      'Block': item.block?.name || 'N/A',
      'Assembly': item.assembly?.name || 'N/A',
      'Votes': item.total_votes,
      'Election Year': item.election_year?.year || 'N/A',
      'State': item.state?.name || 'N/A',
      'Division': item.division?.name || 'N/A',
      'Parliament': item.parliament?.name || 'N/A',
      'Created By': item.created_by?.username || 'N/A',
      'Updated By': item.updated_by?.username || 'N/A',
      'Created At': new Date(item.created_at).toLocaleString(),
      'Updated At': new Date(item.updated_at).toLocaleString()
    }));
    setCsvData(formattedData);

    setTimeout(() => {
      if (csvLinkRef.current) {
        csvLinkRef.current.link.click();
      }
    }, 100);
  };

  const handleDownloadExcelTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      const headers = [
        'state',
        'division_code',
        'parliament_no',
        'assembly_no',
        'block',
        'booth_number',
        'candidate',
        'election_year',
        'total_votes'
      ];

      const example = [{
        state: 'Rajasthan',
        division_code: 'JP',
        parliament_no: 1,
        assembly_no: '1',
        block: 'Amber',
        booth_number: '12',
        candidate: 'John Doe',
        election_year: 2023,
        total_votes: 1234
      }];

      const ws = XLSX.utils.json_to_sheet(example, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'booth_votes_template.xlsx');
    } catch (err) {
      console.error('Failed to download template:', err);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const rowsRaw = XLSX.utils.sheet_to_json(ws, { defval: '' });

      // normalize headers to snake_case lower
      const normalizeKey = (k) => String(k)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      const rows = rowsRaw.map((r) => {
        const o = {};
        Object.keys(r).forEach((k) => { o[normalizeKey(k)] = r[k]; });
        return o;
      });

      const token = localStorage.getItem('serviceToken');
      const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booth-votes/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ rows })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Import failed');
      setImportResult(json);
      // refresh list
      await fetchVotes(pagination.pageIndex, pagination.pageSize);
    } catch (err) {
      console.error('Import error:', err);
      setImportResult({ success: false, error: err?.message || String(err) });
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const fetchReferenceData = async () => {
    try {
      const token = localStorage.getItem('serviceToken');
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      
      // Fetch reference data needed for modals
      const [statesRes, divisionsRes, parliamentsRes, blocksRes, electionYearsRes, usersRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_APP_API_URL}/states`, { headers }),
        fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`, { headers }),
        fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`, { headers }),
        fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`, { headers }),
        fetch(`${import.meta.env.VITE_APP_API_URL}/election-years`, { headers }),
        fetch(`${import.meta.env.VITE_APP_API_URL}/users`, { headers })
      ]);

      const statesJson = await statesRes.json();
      const divisionsJson = await divisionsRes.json();
      const parliamentsJson = await parliamentsRes.json();
      const blocksJson = await blocksRes.json();
      const electionYearsJson = await electionYearsRes.json();
      const usersJson = await usersRes.json();

      if (statesJson.success) setStates(statesJson.data);
      if (divisionsJson.success) setDivisions(divisionsJson.data);
      if (parliamentsJson.success) setParliaments(parliamentsJson.data);
      if (blocksJson.success) setBlocks(blocksJson.data);
      if (electionYearsJson?.success) setElectionYears(electionYearsJson.data || []);
      if (usersJson.success) setUsers(usersJson.data);
      
      // Filter options (candidates, booths, assemblies, parties) will be populated from votes data
    } catch (error) {
      console.error('Failed to fetch reference data:', error);
    }
  };

  // Fetch all available votes on initial load to populate filter options
  const fetchAllAvailableVotes = async () => {
    try {
      let url = `${import.meta.env.VITE_APP_API_URL}/booth-votes?page=1&limit=10000`;
      
      // Add hierarchy-based filtering
      if (userHierarchy) {
        const highestLevel = getUserHighestLevel();
        if (highestLevel) {
          switch (highestLevel.level) {
            case 'state':
              url += `&state_id=${highestLevel.value}`;
              break;
            case 'division':
              url += `&division_id=${highestLevel.value}`;
              break;
            case 'parliament':
              url += `&parliament_id=${highestLevel.value}`;
              break;
            case 'assembly':
              url += `&assembly_id=${highestLevel.value}`;
              break;
            case 'block':
              url += `&block_id=${highestLevel.value}`;
              break;
            case 'booth':
              url += `&booth_id=${highestLevel.value}`;
              break;
          }
        }
      }

      const token = localStorage.getItem('serviceToken');
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(url, { headers });
      const json = await res.json();
      if (json.success) {
        setAllVotes(json.data);
        updateFilterOptions(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch all votes for filters:', error);
    }
  };

  useEffect(() => {
    fetchVotes(pagination.pageIndex, pagination.pageSize);
  }, [pagination.pageIndex, pagination.pageSize, selectedCandidate, selectedBooth, selectedAssembly, selectedParty, selectedPartyName]);

  useEffect(() => {
    fetchReferenceData();
    fetchAllAvailableVotes(); // Fetch all votes to populate filter options
  }, []);

  const handleDeleteOpen = (id) => {
    setVoteDeleteId(id);
    setOpenDelete(true);
  };

  const handleDeleteClose = () => setOpenDelete(false);

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
      accessorKey: 'candidate.name',
      cell: ({ row }) => <Typography>{row.original?.candidate?.name || 'N/A'}</Typography>
    },
    {
      header: 'Candidate Party Name',
      accessorKey: 'candidate.party_id.name',
      cell: ({ row }) => <Typography>{row.original?.candidate?.party_id?.name || 'N/A'}</Typography>
    },
    {
      header: 'Booth',
      accessorKey: 'booth.name',
      cell: ({ row }) => (
        <Typography>
          {row.original?.booth?.name || 'N/A'} (No: {row.original?.booth?.booth_number || 'N/A'})
        </Typography>
      )
    },
    {
      header: 'Block',
      accessorKey: 'block.name',
      cell: ({ row }) => <Typography>{row.original?.block?.name || 'N/A'}</Typography>
    },
    {
      header: 'Assembly',
      accessorKey: 'assembly.name',
      cell: ({ row }) => <Typography>{row.original?.assembly?.name || 'N/A'}</Typography>
    },
    {
      header: 'Votes',
      accessorKey: 'total_votes',
      cell: ({ getValue }) => <Typography>{getValue()}</Typography>
    },
    {
      header: 'Election Year',
      accessorKey: 'election_year.year',
      cell: ({ row }) => <Typography>{row.original?.election_year?.year || 'N/A'}</Typography>
    },
    {
      header: 'State',
      accessorKey: 'state.name',
      cell: ({ row }) => (
        row.original?.state ?
          <Chip label={row.original.state.name} color="success" size="small" variant="outlined" /> :
          <Typography variant="caption">No state</Typography>
      )
    },
    {
      header: 'Division',
      accessorKey: 'division.name',
      cell: ({ row }) => (
        row.original?.division ?
          <Chip label={row.original.division.name} color="warning" size="small" /> :
          <Typography variant="caption">No division</Typography>
      )
    },
    {
      header: 'Parliament',
      accessorKey: 'parliament.name',
      cell: ({ row }) => (
        row.original?.parliament ?
          <Chip label={row.original.parliament.name} color="info" size="small" /> :
          <Typography variant="caption">No parliament</Typography>
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
        const expandIcon = isExpanded ? <Add style={{ transform: 'rotate(45deg)', color: theme.palette.error.main }} /> : <Eye />;
        return (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
            <Tooltip title="View Details">
              <IconButton
                color="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/Booth-Votes/${row.original._id}`);
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
                  setSelectedVote(row.original);
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
      }
    }
  ], [theme]);

  const table = useReactTable({
    data: votes,
    columns,
    state: {
      pagination
    },
    pageCount,
    manualPagination: true,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowCanExpand: () => true
  });

  if (loading) return <EmptyReactTable />;

  return (
    <>
      <MainCard content={false}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          sx={{ p: 2, gap: 2 }}
        >
          <TextField
            size="small"
            variant="outlined"
            placeholder={`Search ${votes.length} votes...`}
            value={searchInput}
            onChange={(e) => {
              const v = e.target.value;
              setSearchInput(v);
              if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
              searchDebounceRef.current = setTimeout(() => {
                table.setGlobalFilter(String(v));
              }, 500);
            }}
            sx={{ minWidth: 300 }}
          />

          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            justifyContent="flex-end"
          >
            <CSVLink
              data={csvData}
              filename="booth_votes.csv"
              style={{ display: "none" }}
              ref={csvLinkRef}
            />
            <input
              type="file"
              ref={importInputRef}
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
            <Button
              variant="outlined"
              onClick={handleDownloadCsv}
              disabled={csvLoading}
            >
              {csvLoading ? "Preparing CSV..." : "Download CSV"}
            </Button>
            <Button variant="outlined" onClick={handleDownloadExcelTemplate}>
              Excel Template
            </Button>
            <Button
              variant="outlined"
              disabled={importing}
              onClick={() => importInputRef.current && importInputRef.current.click()}
            >
              {importing ? 'Importing…' : 'Import Excel'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setSelectedVote(null);
                setOpenModal(true);
              }}
            >
              Add Booth Vote Record
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

        {importResult && (
          <Alert
            severity={importResult.success ? 'success' : 'error'}
            sx={{ mx: 2, mb: 2 }}
          >
            {importResult.success ? (
              <Typography variant="body2">
                Imported {importResult.created || importResult.imported || 0} of {importResult.total || 0}. Skipped {importResult.skipped || 0}.
              </Typography>
            ) : (
              <Typography variant="body2">Import failed: {importResult.error || 'Unknown error'}</Typography>
            )}
          </Alert>
        )}

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ p: 2, flexWrap: "wrap", gap: 2 }}
        >
          {/* Candidate */}
          <TextField
            select
            label="Candidate"
            value={tempFilters.candidate}
            onChange={(e) =>
              setTempFilters((prev) => ({ ...prev, candidate: e.target.value }))
            }
            sx={{ minWidth: 180 }}
            size="small"
          >
            <MenuItem value="">All Candidates</MenuItem>
            {candidates.map((candidate) => (
              <MenuItem key={candidate._id} value={candidate._id}>
                {candidate.name}
              </MenuItem>
            ))}
          </TextField>

          {/* Booth */}
          <TextField
            select
            label="Booth"
            value={tempFilters.booth}
            onChange={(e) =>
              setTempFilters((prev) => ({ ...prev, booth: e.target.value }))
            }
            sx={{ minWidth: 180 }}
            size="small"
          >
            <MenuItem value="">All Booths</MenuItem>
            {booths.map((booth) => (
              <MenuItem key={booth._id} value={booth._id}>
                {booth.name} (No: {booth.booth_number})
              </MenuItem>
            ))}
          </TextField>

          {/* Assembly */}
          <TextField
            select
            label="Assembly"
            value={tempFilters.assembly}
            onChange={(e) =>
              setTempFilters((prev) => ({ ...prev, assembly: e.target.value }))
            }
            sx={{ minWidth: 180 }}
            size="small"
          >
            <MenuItem value="">All Assemblies</MenuItem>
            {assemblies.map((assembly) => (
              <MenuItem key={assembly._id} value={assembly._id}>
                {assembly.name}
              </MenuItem>
            ))}
          </TextField>

          {/* Party */}
          <TextField
            select
            label="Party"
            value={tempFilters.party}
            onChange={(e) =>
              setTempFilters((prev) => ({ ...prev, party: e.target.value }))
            }
            sx={{ minWidth: 180 }}
            size="small"
          >
            <MenuItem value="">All Parties</MenuItem>
            {parties.map((party) => (
              <MenuItem key={party._id} value={party._id}>
                {party.name} ({party.abbreviation})
              </MenuItem>
            ))}
          </TextField>

          {/* Buttons */}
          <Button
            variant="contained"
            onClick={() => {
              setSelectedCandidate(tempFilters.candidate);
              setSelectedBooth(tempFilters.booth);
              setSelectedAssembly(tempFilters.assembly);
              setSelectedParty(tempFilters.party);
              setSelectedPartyName(tempFilters.party_name);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            Apply
          </Button>

          <Button
            variant="outlined"
            onClick={() => {
              setTempFilters({
                candidate: "",
                booth: "",
                assembly: "",
                party: "",
                party_name: ""
              });
              setSelectedCandidate("");
              setSelectedBooth("");
              setSelectedAssembly("");
              setSelectedParty("");
              setSelectedPartyName("");
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
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
                          <BoothVotesView data={row.original} />
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

      <BoothVotesModal
        open={openModal}
        modalToggler={setOpenModal}
        vote={selectedVote}
        states={states}
        divisions={divisions}
        parliaments={parliaments}
        assemblies={assemblies}
        blocks={blocks}
        booths={booths}
        candidates={candidates}
        electionYears={electionYears}
        users={users}
        refresh={() => fetchVotes(pagination.pageIndex, pagination.pageSize)}
      />

      <AlertBoothVotesDelete
        id={voteDeleteId}
        open={openDelete}
        handleClose={handleDeleteClose}
        refresh={() => fetchVotes(pagination.pageIndex, pagination.pageSize)}
      />
    </>
  );
}
