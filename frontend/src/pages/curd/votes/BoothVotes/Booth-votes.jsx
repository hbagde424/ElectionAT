import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
  Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider, FormControl, InputLabel, Select, MenuItem
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
import BoothVotesModal from 'pages/curd/votes/BoothVotes/BoothVotesModal';
import AlertBoothVotesDelete from 'pages/curd/votes/BoothVotes/AlertBoothVotesDelete';
import BoothVotesView from 'pages/curd/votes/BoothVotes/BoothVotesView';
import { Tooltip } from '@mui/material';

export default function BoothVotesListPage() {
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
  const [parties, setParties] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedBooth, setSelectedBooth] = useState('');
  const [selectedAssembly, setSelectedAssembly] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [tempFilters, setTempFilters] = useState({
    candidate: '',
    booth: '',
    assembly: '',
    party: ''
  });

  const fetchVotes = async (pageIndex, pageSize) => {
    setLoading(true);
    try {
      let url = `http://localhost:5000/api/booth-votes?page=${pageIndex + 1}&limit=${pageSize}`;
      if (selectedCandidate) url += `&candidate=${selectedCandidate}`;
      if (selectedBooth) url += `&booth=${selectedBooth}`;
      if (selectedAssembly) url += `&assembly=${selectedAssembly}`;
      if (selectedParty) url += `&party=${selectedParty}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setVotes(json.data);
        setPageCount(json.pages);
      }
    } catch (error) {
      console.error('Failed to fetch booth votes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllVotesForCsv = async () => {
    setCsvLoading(true);
    try {
      let url = 'http://localhost:5000/api/booth-votes?all=true';
      if (selectedCandidate) url += `&candidate=${selectedCandidate}`;
      if (selectedBooth) url += `&booth=${selectedBooth}`;
      if (selectedAssembly) url += `&assembly=${selectedAssembly}`;
      if (selectedParty) url += `&party=${selectedParty}`;

      const res = await fetch(url);
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

  const fetchReferenceData = async () => {
    try {
      const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes, candidatesRes, electionYearsRes, usersRes, partiesRes] = await Promise.all([
        fetch('http://localhost:5000/api/states'),
        fetch('http://localhost:5000/api/divisions'),
        fetch('http://localhost:5000/api/parliaments'),
        fetch('http://localhost:5000/api/assemblies'),
        fetch('http://localhost:5000/api/blocks'),
        fetch('http://localhost:5000/api/booths'),
        fetch('http://localhost:5000/api/candidates'),
        fetch('http://localhost:5000/api/election-years'),
        fetch('http://localhost:5000/api/users'),
        fetch('http://localhost:5000/api/parties')
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
      const partiesJson = await partiesRes.json();

      console.log('Fetched reference data:', candidatesJson.data);

      if (statesJson.success) setStates(statesJson.data);
      if (divisionsJson.success) setDivisions(divisionsJson.data);
      if (parliamentsJson.success) setParliaments(parliamentsJson.data);
      if (assembliesJson.success) setAssemblies(assembliesJson.data);
      if (blocksJson.success) setBlocks(blocksJson.data);
      if (boothsJson.success) setBooths(boothsJson.data);
      if (candidatesJson.success) setCandidates(candidatesJson.data);
      if (electionYearsJson?.success) setElectionYears(electionYearsJson.data || []);
      if (usersJson.success) setUsers(usersJson.data);
      if (partiesJson.success) setParties(partiesJson.data);
    } catch (error) {
      console.error('Failed to fetch reference data:', error);
    }
  };

  useEffect(() => {
    fetchVotes(pagination.pageIndex, pagination.pageSize);
  }, [pagination.pageIndex, pagination.pageSize, selectedCandidate, selectedBooth, selectedAssembly, selectedParty]);

  useEffect(() => {
    fetchReferenceData();
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
      cell: ({ row }) => <Typography>{row.index + 1}</Typography>
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
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          sx={{ p: 2, gap: 2 }}
        >

          <DebouncedInput
            value={table.getState().globalFilter || ''}
            onFilterChange={(value) => table.setGlobalFilter(String(value))}
            placeholder={`Search ${votes.length} votes...`}
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
              Add Booth Vote Record
            </Button>

          </Stack>
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ p: 2, flexWrap: 'wrap', gap: 2 }}
        >
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Candidate</InputLabel>
            <Select
              value={tempFilters.candidate}
              label="Candidate"
              onChange={(e) => {
                setTempFilters(prev => ({ ...prev, candidate: e.target.value }));
              }}
            >
              <MenuItem value="">All Candidates</MenuItem>
              {candidates.map((candidate) => (
                <MenuItem key={candidate._id} value={candidate._id}>
                  {candidate.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Booth</InputLabel>
            <Select
              value={tempFilters.booth}
              label="Booth"
              onChange={(e) => {
                setTempFilters(prev => ({ ...prev, booth: e.target.value }));
              }}
            >
              <MenuItem value="">All Booths</MenuItem>
              {booths.map((booth) => (
                <MenuItem key={booth._id} value={booth._id}>
                  {booth.name} (No: {booth.booth_number})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Assembly</InputLabel>
            <Select
              value={tempFilters.assembly}
              label="Assembly"
              onChange={(e) => {
                setTempFilters(prev => ({ ...prev, assembly: e.target.value }));
              }}
            >
              <MenuItem value="">All Assemblies</MenuItem>
              {assemblies.map((assembly) => (
                <MenuItem key={assembly._id} value={assembly._id}>
                  {assembly.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Party</InputLabel>
            <Select
              value={tempFilters.party}
              label="Party"
              onChange={(e) => {
                setTempFilters(prev => ({ ...prev, party: e.target.value }));
              }}
            >
              <MenuItem value="">All Parties</MenuItem>
              {parties.map((party) => (
                <MenuItem key={party._id} value={party._id}>
                  {party.name} ({party.abbreviation})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={() => {
              setSelectedCandidate(tempFilters.candidate);
              setSelectedBooth(tempFilters.booth);
              setSelectedAssembly(tempFilters.assembly);
              setSelectedParty(tempFilters.party);
              setPagination(prev => ({ ...prev, pageIndex: 0 }));
            }}
          >
            Apply
          </Button>

          <Button
            variant="outlined"
            onClick={() => {
              setTempFilters({
                candidate: '',
                booth: '',
                assembly: '',
                party: ''
              });
              setSelectedCandidate('');
              setSelectedBooth('');
              setSelectedAssembly('');
              setSelectedParty('');
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