


import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider, Chip, Avatar, Alert,
  FormControl, Select, MenuItem, TextField
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash, User, CalendarTick, DocumentDownload } from 'iconsax-react';

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
import PotentialCandidateModal from 'pages/curd/potentical candidate/PotentialCandidateModal';
import AlertPotentialCandidateDelete from 'pages/curd/potentical candidate/AlertPotentialCandidateDelete';
import PotentialCandidateView from 'pages/curd/potentical candidate/PotentialCandidateView';
import { Tooltip } from '@mui/material';
import { usePermissions } from 'contexts/PermissionContext';
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';

export default function PotentialCandidateListPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { userHierarchy, getUserHighestLevel } = usePermissions();
  const [searchInput, setSearchInput] = useState('');
  const searchDebounceRef = useRef(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [allCandidates, setAllCandidates] = useState([]);
  const [parties, setParties] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [electionYears, setElectionYears] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [error, setError] = useState('');
  const [filterValues, setFilterValues] = useState({
    party: '',
    constituency: '',
    year: '',
    status: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    party: '',
    constituency: '',
    year: '',
    status: ''
  });

  // Excel import states
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const importInputRef = useRef();

  const fetchCandidates = async (pageIndex, pageSize) => {
    setLoading(true);
    setError('');
    try {
      let url = `${import.meta.env.VITE_APP_API_URL}/potential-candidates?page=${pageIndex + 1}&limit=${pageSize}`;

      if (appliedFilters.party) url += `&party_id=${appliedFilters.party}`;
      if (appliedFilters.constituency) url += `&constituency_id=${appliedFilters.constituency}`;
      if (appliedFilters.year) url += `&election_year_id=${appliedFilters.year}`;
      if (appliedFilters.status) url += `&status=${appliedFilters.status}`;

      // hierarchy-based filtering
      if (userHierarchy) {
        const highest = getUserHighestLevel();
        if (highest) {
          switch (highest) {
            case 'state':
              url += `&state_id=${userHierarchy.state}`;
              break;
            case 'division':
              url += `&division_id=${userHierarchy.division}`;
              break;
            case 'parliament':
              url += `&parliament_id=${userHierarchy.parliament}`;
              break;
            case 'assembly':
              url += `&assembly_id=${userHierarchy.assembly}`;
              break;
            case 'block':
              url += `&block_id=${userHierarchy.block}`;
              break;
            case 'booth':
              url += `&booth_id=${userHierarchy.booth}`;
              break;
            default:
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
        setCandidates(json.data);
        setPageCount(json.pages);
      } else {
        setError('Failed to fetch potential candidates');
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
      setError('Failed to fetch potential candidates');
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const token = localStorage.getItem('serviceToken');
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const [partiesRes, assembliesRes, electionYearsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_APP_API_URL}/parties?all=true`, { headers }),
        fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies?all=true`, { headers }),
        fetch(`${import.meta.env.VITE_APP_API_URL}/election-years?all=true`, { headers })
      ]);

      const partiesJson = await partiesRes.json();
      const assembliesJson = await assembliesRes.json();
      const electionYearsJson = await electionYearsRes.json();

      if (partiesJson.success) setParties(partiesJson.data);
      if (assembliesJson.success) setAssemblies(assembliesJson.data);
      if (electionYearsJson?.success) setElectionYears(electionYearsJson.data || []);
    } catch (error) {
      console.error('Failed to fetch reference data:', error);
    }
  };

  const fetchAllCandidatesForFilters = async () => {
    const hierarchyFilters = {};
    if (userHierarchy?.state?._id) hierarchyFilters.state_id = userHierarchy.state._id;
    if (userHierarchy?.division?._id) hierarchyFilters.division_id = userHierarchy.division._id;
    if (userHierarchy?.parliament?._id) hierarchyFilters.parliament_id = userHierarchy.parliament._id;
    if (userHierarchy?.assembly?._id) hierarchyFilters.assembly_id = userHierarchy.assembly._id;
    if (userHierarchy?.block?._id) hierarchyFilters.block_id = userHierarchy.block._id;
    if (userHierarchy?.booth?._id) hierarchyFilters.booth_id = userHierarchy.booth._id;
    const data = await fetchAllDataForFilters('/potential-candidates', hierarchyFilters);
    setAllCandidates(data);
  };

  const filterOptions = useFilterOptionsFromData(allCandidates, {
    parties: { field: 'party_id', nameField: 'name' },
    assemblies: { field: 'constituency_id', nameField: 'name' },
    electionYears: { field: 'election_year_id', nameField: 'year' }
  });

  useEffect(() => {
    // Only fetch reference data once when component mounts
    fetchReferenceData();
    fetchAllCandidatesForFilters();
  }, []); // Empty dependency array for one-time fetch

  useEffect(() => {
    // Fetch candidates only when pagination changes or filters are applied
    fetchCandidates(pagination.pageIndex, pagination.pageSize);
  }, [pagination.pageIndex, pagination.pageSize, appliedFilters]);

  const handleDeleteOpen = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleDeleteClose = () => setOpenDelete(false);

  const handleApplyFilters = () => {
    // Update applied filters with current filter values
    setAppliedFilters(filterValues);
    // Reset to first page
    setPagination({ pageIndex: 0, pageSize: 10 });
    // Fetch with new filters
    fetchCandidates(0, 10);
  };

  const handleClearFilters = () => {
    // Clear both current and applied filters
    const emptyFilters = {
      party: '',
      constituency: '',
      year: '',
      status: ''
    };
    setFilterValues(emptyFilters);
    setAppliedFilters(emptyFilters);
    // Reset to first page
    setPagination({ pageIndex: 0, pageSize: 10 });
    // Fetch with cleared filters
    fetchCandidates(0, 10);
  };

  const handleCSVDownload = () => {
    if (candidates.length === 0) return;

    const headers = [
      'Name',
      'Party',
      'Constituency',
      'Election Year',
      'Post Name',
      'Place',
      'From Date',
      'To Date',
      'Political History',
      'Pros',
      'Cons',
      'Supporters Count',
      'Status',
      'Created By',
      'Created At',
      'Updated By',
      'Updated At'
    ];

    const csvData = candidates.map(candidate => [
      candidate.name || '',
      candidate.party_id?.name || '',
      candidate.constituency_id?.name || '',
      candidate.election_year_id?.year || '',
      candidate.post_details?.postname || '',
      candidate.post_details?.place || '',
      candidate.post_details?.from_date ? new Date(candidate.post_details.from_date).toLocaleDateString() : '',
      candidate.post_details?.to_date ? new Date(candidate.post_details.to_date).toLocaleDateString() : '',
      candidate.history || '',
      candidate.pros || '',
      candidate.cons || '',
      candidate.supporter_candidates?.length || 0,
      candidate.status || '',
      candidate.created_by?.username || '',
      candidate.created_at ? new Date(candidate.created_at).toLocaleString() : '',
      candidate.updated_by?.username || '',
      candidate.updated_at ? new Date(candidate.updated_at).toLocaleString() : ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `potential-candidates-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel Template Download
  const handleDownloadExcelTemplate = () => {
    const XLSX = require('xlsx');
    const headers = ['name', 'party_id', 'constituency_id', 'election_year_id', 'postname', 'place', 'from_date', 'to_date', 'history', 'pros', 'cons', 'status', 'description'];
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'potential-candidates-template.xlsx');
  };

  // Excel Import Handler
  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    try {
      const XLSX = require('xlsx');
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
      const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/potential-candidates/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ data: normalizedData })
      });

      const result = await response.json();
      setImportResult(result);
      if (result.success) {
        fetchCandidates(pagination.pageIndex, pagination.pageSize);
      }
    } catch (err) {
      setImportResult({ success: false, message: err.message || 'Import failed' });
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const columns = useMemo(() => [
    {
      header: '#',
      accessorKey: '_id',
      cell: ({ row }) => <Typography variant="body2" color="text.secondary">{row.index + 1}</Typography>
    },
    {
      header: 'Candidate',
      accessorKey: 'name',
      cell: ({ row }) => (
        <Stack direction="row" spacing={1} alignItems="center">
          {row.original.image && (
            <Avatar src={row.original.image} alt={row.original.name} sx={{ width: 40, height: 40 }}>
              <User size={20} />
            </Avatar>
          )}
          <Box>
            <Typography variant="subtitle1" fontWeight="medium">{row.original.name || 'Untitled'}</Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {row.original._id?.slice(-8)}
            </Typography>
          </Box>
        </Stack>
      )
    },
    {
      header: 'Party',
      accessorKey: 'party_id',
      cell: ({ getValue }) => (
        getValue() ?
          <Chip label={getValue().name} color="primary" size="small" variant="outlined" /> :
          <Typography variant="caption" color="text.secondary">No party</Typography>
      )
    },
    {
      header: 'Constituency',
      accessorKey: 'constituency_id',
      cell: ({ getValue }) => (
        getValue() ?
          <Chip label={getValue().name} color="secondary" size="small" variant="outlined" /> :
          <Typography variant="caption" color="text.secondary">No constituency</Typography>
      )
    },
    {
      header: 'Election Year',
      accessorKey: 'election_year_id',
      cell: ({ getValue }) => (
        getValue() ?
          <Chip label={getValue().year} color="info" size="small" variant="outlined" /> :
          <Typography variant="caption" color="text.secondary">No year</Typography>
      )
    },
    {
      header: 'Post Details',
      accessorKey: 'post_details',
      cell: ({ getValue }) => {
        const postDetails = getValue();
        if (!postDetails) return <Typography variant="caption" color="text.secondary">No post details</Typography>;

        return (
          <Box>
            <Typography variant="body2" fontWeight="medium">{postDetails.postname || 'N/A'}</Typography>
            <Typography variant="caption" color="text.secondary">{postDetails.place || 'N/A'}</Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              {postDetails.from_date ? new Date(postDetails.from_date).toLocaleDateString() : 'N/A'} - {postDetails.to_date ? new Date(postDetails.to_date).toLocaleDateString() : 'N/A'}
            </Typography>
          </Box>
        );
      }
    },
    {
      header: 'Political History',
      accessorKey: 'history',
      cell: ({ getValue }) => {
        const history = getValue();
        return (
          <Typography
            variant="body2"
            sx={{
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {history || 'No history'}
          </Typography>
        );
      }
    },
    {
      header: 'Pros',
      accessorKey: 'pros',
      cell: ({ getValue }) => {
        const pros = getValue();
        return (
          <Typography
            variant="body2"
            sx={{
              maxWidth: 150,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'success.main'
            }}
          >
            {pros || 'No pros'}
          </Typography>
        );
      }
    },
    {
      header: 'Cons',
      accessorKey: 'cons',
      cell: ({ getValue }) => {
        const cons = getValue();
        return (
          <Typography
            variant="body2"
            sx={{
              maxWidth: 150,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'error.main'
            }}
          >
            {cons || 'No cons'}
          </Typography>
        );
      }
    },
    {
      header: 'Supporters',
      accessorKey: 'supporter_candidates',
      cell: ({ getValue }) => {
        const supporters = getValue();
        if (!supporters || supporters.length === 0) {
          return <Typography variant="caption" color="text.secondary">No supporters</Typography>;
        }
        return (
          <Chip
            label={`${supporters.length} supporter${supporters.length > 1 ? 's' : ''}`}
            color="warning"
            size="small"
            variant="outlined"
          />
        );
      }
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => {
        const status = getValue();
        let color = 'default';
        if (status === 'active') color = 'success';
        if (status === 'inactive') color = 'error';
        if (status === 'under_review') color = 'warning';

        return (
          <Chip
            label={status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            color={color}
            size="small"
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
      cell: ({ getValue }) => {
        const createdBy = getValue();
        return (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <User size={14} />
            <Typography variant="caption">{createdBy?.username || 'Unknown'}</Typography>
          </Stack>
        );
      }
    },
    {
      header: 'Created',
      accessorKey: 'created_at',
      cell: ({ getValue }) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <CalendarTick size={14} />
          <Typography variant="caption">{formatDateTime(getValue())}</Typography>
        </Stack>
      )
    },
    {
      header: 'Updated By',
      accessorKey: 'updated_by',
      cell: ({ getValue }) => {
        const createdBy = getValue();
        return (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <User size={14} />
            <Typography variant="caption">{createdBy?.username || 'Unknown'}</Typography>
          </Stack>
        );
      }
    },
    {
      header: 'Updated',
      accessorKey: 'updated_at',
      cell: ({ getValue }) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <CalendarTick size={14} />
          <Typography variant="caption">{formatDateTime(getValue())}</Typography>
        </Stack>
      )
    },
    {
      header: 'Actions',
      meta: { className: 'cell-center' },
      cell: ({ row }) => {
        return (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
            <Tooltip title="View Detail Page">
              <IconButton
                color="info"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/Pontentcal-Candidate/${row.original._id}`);
                }}
              >
                <Eye />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Candidate">
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
            <Tooltip title="Delete Candidate">
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
    data: candidates,
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
    getPaginationRowModel: getPaginationRowModel()
  });

  if (loading) return <EmptyReactTable />;

  return (
    <>
      <MainCard content={false}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* Access Scope Information */}
        <Alert severity="info" sx={{ m: 2 }}>
          <Typography variant="body2">
            <strong>Data Access:</strong> {(() => {
              if (!userHierarchy) return 'You have access to all Potential Candidates data';
              const highest = getUserHighestLevel();
              const labelMap = { state: 'State', division: 'Division', parliament: 'Parliament', assembly: 'Assembly', block: 'Block', booth: 'Booth' };
              const idMap = { state: userHierarchy.state, division: userHierarchy.division, parliament: userHierarchy.parliament, assembly: userHierarchy.assembly, block: userHierarchy.block, booth: userHierarchy.booth };
              return `You have access to Potential Candidates data for ${labelMap[highest] || 'Unknown'}: ${idMap[highest] || 'Unknown'}`;
            })()}
          </Typography>
        </Alert>

        <Stack spacing={2} sx={{ padding: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <TextField
              size="small"
              variant="outlined"
              placeholder={`Search ${candidates.length} potential candidates...`}
              value={searchInput}
              onChange={(e) => {
                const v = e.target.value;
                setSearchInput(v);
                if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                searchDebounceRef.current = setTimeout(() => {
                  table.setGlobalFilter(String(v));
                }, 500);
              }}
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<DocumentDownload />}
                onClick={handleCSVDownload}
                disabled={candidates.length === 0}
              >
                Export CSV
              </Button>
              <Button variant="outlined" onClick={handleDownloadExcelTemplate}>
                Download Excel Template
              </Button>
              <Button variant="outlined" onClick={() => importInputRef.current?.click()} disabled={importing}>
                {importing ? 'Importing...' : 'Import Excel'}
              </Button>
              <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedCandidate(null); setOpenModal(true); }}>
                Add Candidate
              </Button>
            </Stack>
          </Stack>

          {importResult && (
            <Alert severity={importResult.success ? 'success' : 'error'} onClose={() => setImportResult(null)}>
              {importResult.message || (importResult.success ? 'Import successful' : 'Import failed')}
              {importResult.imported && ` (${importResult.imported} imported)`}
              {importResult.failed && ` (${importResult.failed} failed)`}
            </Alert>
          )}

          <Stack direction="row" spacing={2}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Party</Typography>
              <Select
                value={filterValues.party}
                onChange={(e) => setFilterValues(prev => ({ ...prev, party: e.target.value }))}
                displayEmpty
              >
                <MenuItem value="">All Parties</MenuItem>
                {filterOptions.parties?.map((party) => (
                  <MenuItem key={party._id} value={party._id}>{party.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Constituency</Typography>
              <Select
                value={filterValues.constituency}
                onChange={(e) => setFilterValues(prev => ({ ...prev, constituency: e.target.value }))}
                displayEmpty
              >
                <MenuItem value="">All Constituencies</MenuItem>
                {filterOptions.assemblies?.map((assembly) => (
                  <MenuItem key={assembly._id} value={assembly._id}>{assembly.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Election Year</Typography>
              <Select
                value={filterValues.year}
                onChange={(e) => setFilterValues(prev => ({ ...prev, year: e.target.value }))}
                displayEmpty
              >
                <MenuItem value="">All Years</MenuItem>
                {filterOptions.electionYears?.map((year) => (
                  <MenuItem key={year._id} value={year._id}>{year.year}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Status</Typography>
              <Select
                value={filterValues.status}
                onChange={(e) => setFilterValues(prev => ({ ...prev, status: e.target.value }))}
                displayEmpty

              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="under_review">Under Review</MenuItem>
              </Select>
            </FormControl>

            <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                size="small"
                color="primary"
              >
                Apply
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                size="small"
              >
                Clear
              </Button>
            </Stack>
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
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
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

      <PotentialCandidateModal
        open={openModal}
        modalToggler={setOpenModal}
        candidate={selectedCandidate}
        parties={parties}
        assemblies={assemblies}
        electionYears={electionYears} // Ensure this is passed
        refresh={() => fetchCandidates(pagination.pageIndex, pagination.pageSize)}
      />

      <AlertPotentialCandidateDelete
        id={deleteId}
        open={openDelete}
        handleClose={handleDeleteClose}
        refresh={() => fetchCandidates(pagination.pageIndex, pagination.pageSize)}
      />

      <input
        ref={importInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />
    </>
  );
}
