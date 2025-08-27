import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
  Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider, FormControl, InputLabel, Select, MenuItem,
  TextField
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash, User } from 'iconsax-react';
import { useNavigate } from 'react-router-dom';
import { CSVLink } from 'react-csv';

// third-party
import {
  getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
  useReactTable, flexRender
} from '@tanstack/react-table';

// project imports
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';
import EmptyReactTable from 'pages/tables/react-table/empty';

// custom views and modals
import ParliamentVotesModal from 'pages/curd/votes/ParliamentVotes/ParliamentVotesModal';
import AlertParliamentVotesDelete from 'pages/curd/votes/ParliamentVotes/AlertParliamentVotesDelete';
import ParliamentVotesView from 'pages/curd/votes/ParliamentVotes/ParliamentVotesView';
import { Tooltip } from '@mui/material';

export default function ParliamentVotesListPage() {
  const theme = useTheme();
  const csvLinkRef = useRef();
  const [csvData, setCsvData] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [selectedVote, setSelectedVote] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [voteDeleteId, setVoteDeleteId] = useState('');
  const [votes, setVotes] = useState([]);
  const [states, setStates] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [parliaments, setParliaments] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [booths, setBooths] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [electionYears, setElectionYears] = useState([]);
  const [users, setUsers] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState({});
  const [textFilters, setTextFilters] = useState({
    state: '',
    division: '',
    parliament: '',
    assembly: '',
    block: '',
    booth: '',
    candidate: '',
    votes: { min: '', max: '' }
  });

  // Handle text filter changes
  const handleTextFilterChange = (field, value) => {
    setTextFilters(prev => ({ ...prev, [field]: value }));
  };

  // Handle votes range changes
  const handleVotesChange = (type, value) => {
    setTextFilters(prev => ({
      ...prev,
      votes: { ...prev.votes, [type]: value }
    }));
  };
  const [searchText, setSearchText] = useState({
    state: '',
    division: '',
    parliament: '',
    assembly: '',
    block: '',
    booth: '',
    candidate: '',
    votes: { min: '', max: '' }
  });
  const [filteredDivisions, setFilteredDivisions] = useState([]);
  const [filteredParliaments, setFilteredParliaments] = useState([]);
  const [filteredAssemblies, setFilteredAssemblies] = useState([]);
  const [filteredBlocks, setFilteredBlocks] = useState([]);
  const [filteredBooths, setFilteredBooths] = useState([]);

  // Handle filter changes and update dependent dropdowns
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

  // Update filtered options when filters change
  useEffect(() => {
    if (filters.state_id) {
      const filtered = divisions?.filter(division => division.state_id?._id === filters.state_id) || [];
      setFilteredDivisions(filtered);
    } else {
      setFilteredDivisions([]);
    }
  }, [filters.state_id, divisions]);

  useEffect(() => {
    if (filters.division_id) {
      const filtered = parliaments?.filter(parliament => parliament.division_id?._id === filters.division_id) || [];
      setFilteredParliaments(filtered);
    } else {
      setFilteredParliaments([]);
    }
  }, [filters.division_id, parliaments]);

  useEffect(() => {
    if (filters.parliament_id) {
      const filtered = assemblies?.filter(assembly => assembly.parliament_id?._id === filters.parliament_id) || [];
      setFilteredAssemblies(filtered);
    } else {
      setFilteredAssemblies([]);
    }
  }, [filters.parliament_id, assemblies]);

  useEffect(() => {
    if (filters.assembly_id) {
      const filtered = blocks?.filter(block => block.assembly_id?._id === filters.assembly_id) || [];
      setFilteredBlocks(filtered);
    } else {
      setFilteredBlocks([]);
    }
  }, [filters.assembly_id, blocks]);

  useEffect(() => {
    if (filters.block_id) {
      const filtered = booths?.filter(booth => booth.block_id?._id === filters.block_id) || [];
      setFilteredBooths(filtered);
    } else {
      setFilteredBooths([]);
    }
  }, [filters.block_id, booths]);

  const fetchVotes = async (pageIndex, pageSize) => {
    setLoading(true);
    try {
      // Build query string with filters
      const queryParams = new URLSearchParams({
        page: pageIndex + 1,
        limit: pageSize,
        ...(filters.state_id && { state_id: filters.state_id }),
        ...(filters.division_id && { division_id: filters.division_id }),
        ...(filters.parliament_id && { parliament_id: filters.parliament_id }),
        ...(filters.assembly_id && { assembly_id: filters.assembly_id }),
        ...(filters.block_id && { block_id: filters.block_id }),
        ...(filters.booth_id && { booth_id: filters.booth_id }),
        ...(filters.candidate_id && { candidate_id: filters.candidate_id }),
        ...(filters.election_year_id && { election_year_id: filters.election_year_id })
      });

      const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliament-votes?${queryParams}`);
      const json = await res.json();
      if (json.success) {
        setVotes(json.data);
        setPageCount(json.pages);
      }
    } catch (error) {
      console.error('Failed to fetch parliament votes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllVotesForCsv = async () => {
    setCsvLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliament-votes?all=true`);
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
      'Parliament': item.parliament?.name || 'N/A',
      'Booth': `${item.booth?.name || 'N/A'} (No: ${item.booth?.booth_number || 'N/A'})`,
      'Block': item.block?.name || 'N/A',
      'Assembly': item.assembly?.name || 'N/A',
      'Votes': item.total_votes,
      'Election Year': item.election_year?.year || 'N/A',
      'State': item.state?.name || 'N/A',
      'Division': item.division?.name || 'N/A',
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

  const fetchReferenceData = async () => {
    try {
      const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes, candidatesRes, electionYearsRes, usersRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_APP_API_URL}/states`),
        fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`),
        fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`),
        fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`),
        fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`),
        fetch(`${import.meta.env.VITE_APP_API_URL}/booths`),
        fetch(`${import.meta.env.VITE_APP_API_URL}/candidates`),
        fetch(`${import.meta.env.VITE_APP_API_URL}/election-years`),
        fetch(`${import.meta.env.VITE_APP_API_URL}/users`)
      ]);

      const statesJson = await statesRes.json();
      const divisionsJson = await divisionsRes.json();
      const parliamentsJson = await parliamentsRes.json();
      const assembliesJson = await assembliesRes.json();
      const blocksJson = await blocksRes.json();
      const boothsJson = await boothsRes.json();
      const candidatesJson = await candidatesRes.json();
      const electionYearsJson = await electionYearsRes.json();
      const usersJson = await usersRes.json();

      if (statesJson.success) setStates(statesJson.data);
      if (divisionsJson.success) setDivisions(divisionsJson.data);
      if (parliamentsJson.success) setParliaments(parliamentsJson.data);
      if (assembliesJson.success) setAssemblies(assembliesJson.data);
      if (blocksJson.success) setBlocks(blocksJson.data);
      if (boothsJson.success) setBooths(boothsJson.data);
      if (candidatesJson.success) setCandidates(candidatesJson.data);
      if (electionYearsJson?.success) setElectionYears(electionYearsJson.data || []);
      if (usersJson.success) setUsers(usersJson.data);
    } catch (error) {
      console.error('Failed to fetch reference data:', error);
    }
  };

  useEffect(() => {
    fetchVotes(pagination.pageIndex, pagination.pageSize);
    fetchReferenceData();
  }, [pagination.pageIndex, pagination.pageSize]);

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
      header: 'Parliament',
      accessorKey: 'parliament.name',
      cell: ({ row }) => (
        row.original?.parliament ?
          <Chip label={row.original.parliament.name} color="primary" size="small" /> :
          <Typography variant="caption">No parliament</Typography>
      )
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
            <Tooltip title="View">
              <IconButton color="secondary" onClick={row.getToggleExpandedHandler()}>
                {expandIcon}
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
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
          <DebouncedInput
            value={table.getState().globalFilter || ''}
            onFilterChange={(value) => table.setGlobalFilter(String(value))}
            placeholder={`Search ${votes.length} votes...`}
          />
          <Stack direction="row" spacing={1}>
            <CSVLink
              data={csvData}
              filename="parliament_votes.csv"
              style={{ display: 'none' }}
              ref={csvLinkRef}
            />
            <Button
              variant="outlined"
              onClick={handleDownloadCsv}
              disabled={csvLoading}
            >
              {csvLoading ? 'Preparing CSV...' : 'Download CSV'}
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedVote(null); setOpenModal(true); }}>
              Add Parliament Vote Record
            </Button>
          </Stack>
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ p: 2, flexWrap: "wrap", gap: 2 }}
        >
          <TextField
            select
            label="State"
            value={filters?.state_id || ''}
            onChange={(e) => handleFilterChange('state_id', e.target.value)}
            sx={{ minWidth: 200 }}
            size="small"
          >
            <MenuItem value="">All States</MenuItem>
            {states?.map((state) => (
              <MenuItem key={state._id} value={state._id}>
                {state.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Division"
            value={filters?.division_id || ''}
            onChange={(e) => handleFilterChange('division_id', e.target.value)}
            sx={{ minWidth: 200 }}
            size="small"
            disabled={!filters?.state_id}
          >
            <MenuItem value="">All Divisions</MenuItem>
            {filteredDivisions?.map((division) => (
              <MenuItem key={division._id} value={division._id}>
                {division.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Parliament"
            value={filters?.parliament_id || ''}
            onChange={(e) => handleFilterChange('parliament_id', e.target.value)}
            sx={{ minWidth: 200 }}
            size="small"
            disabled={!filters?.division_id}
          >
            <MenuItem value="">All Parliaments</MenuItem>
            {filteredParliaments?.map((parliament) => (
              <MenuItem key={parliament._id} value={parliament._id}>
                {parliament.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Assembly"
            value={filters?.assembly_id || ''}
            onChange={(e) => handleFilterChange('assembly_id', e.target.value)}
            sx={{ minWidth: 200 }}
            size="small"
            disabled={!filters?.parliament_id}
          >
            <MenuItem value="">All Assemblies</MenuItem>
            {filteredAssemblies?.map((assembly) => (
              <MenuItem key={assembly._id} value={assembly._id}>
                {assembly.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Block"
            value={filters?.block_id || ''}
            onChange={(e) => handleFilterChange('block_id', e.target.value)}
            sx={{ minWidth: 200 }}
            size="small"
            disabled={!filters?.assembly_id}
          >
            <MenuItem value="">All Blocks</MenuItem>
            {filteredBlocks?.map((block) => (
              <MenuItem key={block._id} value={block._id}>
                {block.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Booth"
            value={filters?.booth_id || ''}
            onChange={(e) => handleFilterChange('booth_id', e.target.value)}
            sx={{ minWidth: 200 }}
            size="small"
            disabled={!filters?.block_id}
          >
            <MenuItem value="">All Booths</MenuItem>
            {filteredBooths?.map((booth) => (
              <MenuItem key={booth._id} value={booth._id}>
                {booth.name} (No: {booth.booth_number})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Candidate"
            value={filters?.candidate_id || ''}
            onChange={(e) => handleFilterChange('candidate_id', e.target.value)}
            sx={{ minWidth: 200 }}
            size="small"
          >
            <MenuItem value="">All Candidates</MenuItem>
            {candidates?.map((candidate) => (
              <MenuItem key={candidate._id} value={candidate._id}>
                {candidate.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Election Year"
            value={filters?.election_year_id || ''}
            onChange={(e) => handleFilterChange('election_year_id', e.target.value)}
            sx={{ minWidth: 200 }}
            size="small"
          >
            <MenuItem value="">All Years</MenuItem>
            {electionYears?.map((year) => (
              <MenuItem key={year._id} value={year._id}>
                {year.year}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            onClick={() => {
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              fetchVotes(0, pagination.pageSize);
            }}
          >
            Apply
          </Button>

          <Button
            variant="outlined"
            onClick={() => {
              setFilters({});
              setFilteredDivisions([]);
              setFilteredParliaments([]);
              setFilteredAssemblies([]);
              setFilteredBlocks([]);
              setFilteredBooths([]);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              fetchVotes(0, pagination.pageSize);
            }}
          >
            Clear
          </Button>
        </Stack>

        <Divider />

        {/* Search and Actions Section */}


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
                          <ParliamentVotesView data={row.original} />
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

      <ParliamentVotesModal
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

      <AlertParliamentVotesDelete
        id={voteDeleteId}
        open={openDelete}
        handleClose={handleDeleteClose}
        refresh={() => fetchVotes(pagination.pageIndex, pagination.pageSize)}
      />
    </>
  );
}
