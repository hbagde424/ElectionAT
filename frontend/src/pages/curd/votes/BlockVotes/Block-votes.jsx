import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
  Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider, TextField, MenuItem
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
import BlockVotesModal from 'pages/curd/votes/BlockVotes/BlockVotesModal';
import AlertBlockVotesDelete from 'pages/curd/votes/BlockVotes/AlertBlockVotesDelete';
import BlockVotesView from 'pages/curd/votes/BlockVotes/BlockVotesView';
import { Tooltip } from '@mui/material';

export default function BlockVotesListPage() {
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
  const [filters, setFilters] = useState({
    state_id: '',
    division_id: '',
    parliament_id: '',
    assembly_id: '',
    block_id: ''
  });

  const fetchVotes = async (pageIndex, pageSize, currentFilters = filters) => {
    setLoading(true);
    try {
      const queryParams = [];
      if (currentFilters.state_id) queryParams.push(`state=${encodeURIComponent(currentFilters.state_id)}`);
      if (currentFilters.division_id) queryParams.push(`division=${encodeURIComponent(currentFilters.division_id)}`);
      if (currentFilters.parliament_id) queryParams.push(`parliament=${encodeURIComponent(currentFilters.parliament_id)}`);
      if (currentFilters.assembly_id) queryParams.push(`assembly=${encodeURIComponent(currentFilters.assembly_id)}`);
      if (currentFilters.block_id) queryParams.push(`block=${encodeURIComponent(currentFilters.block_id)}`);

      const queryString = queryParams.length > 0 ? `&${queryParams.join('&')}` : '';
      const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/block-votes?page=${pageIndex + 1}&limit=${pageSize}${queryString}`);
      const json = await res.json();
      if (json.success) {
        setVotes(json.data);
        setPageCount(json.pages);
      }
    } catch (error) {
      console.error('Failed to fetch block votes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllVotesForCsv = async () => {
    setCsvLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/block-votes?all=true`);
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
      'Block': item.block?.name || 'N/A',
      'Booth': `${item.booth?.name || 'N/A'} (No: ${item.booth?.booth_number || 'N/A'})`,
      'Votes': item.total_votes,
      'Election Year': item.election_year?.year || 'N/A',
      'State': item.state?.name || 'N/A',
      'Division': item.division?.name || 'N/A',
      'Parliament': item.parliament?.name || 'N/A',
      'Assembly': item.assembly?.name || 'N/A',
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
      header: 'Block',
      accessorKey: 'block.name',
      cell: ({ row }) => <Typography>{row.original?.block?.name || 'N/A'}</Typography>
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
      header: 'Assembly',
      accessorKey: 'assembly.name',
      cell: ({ row }) => <Typography>{row.original?.assembly?.name || 'N/A'}</Typography>
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
          spacing={40}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          sx={{ p: 2 }}
        >
          <DebouncedInput
            value={table.getState().globalFilter || ''}
            onFilterChange={(value) => table.setGlobalFilter(String(value))}
            placeholder={`Search ${votes.length} votes...`}
            sx={{ width: '100%', maxWidth: 250 }}

          />
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            justifyContent="flex-end"
          >
            <CSVLink
              data={csvData}
              filename="block_votes.csv"
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
              Add Block Vote Record
            </Button>
          </Stack>
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ p: 2, flexWrap: 'wrap' }}
        >
          <TextField
            select
            label="State"
            value={filters.state_id}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                state_id: e.target.value,
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: ''
              }));
            }}
            sx={{ minWidth: 150 }}
            size="small"
          >
            <MenuItem value="">All States</MenuItem>
            {states.map((state) => (
              <MenuItem key={state._id} value={state._id}>
                {state.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Division"
            value={filters.division_id}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                division_id: e.target.value,
                parliament_id: '',
                assembly_id: '',
                block_id: ''
              }));
            }}
            sx={{ minWidth: 150 }}
            size="small"
            disabled={!filters.state_id}
          >
            <MenuItem value="">All Divisions</MenuItem>
            {divisions
              .filter(division => !filters.state_id || division.state_id?._id === filters.state_id)
              .map((division) => (
                <MenuItem key={division._id} value={division._id}>
                  {division.name}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            select
            label="Parliament"
            value={filters.parliament_id}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                parliament_id: e.target.value,
                assembly_id: '',
                block_id: ''
              }));
            }}
            sx={{ minWidth: 150 }}
            size="small"
            disabled={!filters.division_id}
          >
            <MenuItem value="">All Parliaments</MenuItem>
            {parliaments
              .filter(parliament => !filters.division_id || parliament.division_id?._id === filters.division_id)
              .map((parliament) => (
                <MenuItem key={parliament._id} value={parliament._id}>
                  {parliament.name}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            select
            label="Assembly"
            value={filters.assembly_id}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                assembly_id: e.target.value,
                block_id: ''
              }));
            }}
            sx={{ minWidth: 150 }}
            size="small"
            disabled={!filters.parliament_id}
          >
            <MenuItem value="">All Assemblies</MenuItem>
            {assemblies
              .filter(assembly => !filters.parliament_id || assembly.parliament_id?._id === filters.parliament_id)
              .map((assembly) => (
                <MenuItem key={assembly._id} value={assembly._id}>
                  {assembly.name}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            select
            label="Block"
            value={filters.block_id}
            onChange={(e) => setFilters(prev => ({ ...prev, block_id: e.target.value }))}
            sx={{ minWidth: 150 }}
            size="small"
            disabled={!filters.assembly_id}
          >
            <MenuItem value="">All Blocks</MenuItem>
            {blocks
              .filter(block => !filters.assembly_id || block.assembly_id?._id === filters.assembly_id)
              .map((block) => (
                <MenuItem key={block._id} value={block._id}>
                  {block.name}
                </MenuItem>
              ))}
          </TextField>

          <Button
            variant="contained"
            onClick={() => fetchVotes(pagination.pageIndex, pagination.pageSize, filters)}
            size="small"
          >
            Apply
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setFilters({
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: ''
              });
              fetchVotes(pagination.pageIndex, pagination.pageSize, {
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: ''
              });
            }}
            size="small"
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
                          <BlockVotesView data={row.original} />
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

      <BlockVotesModal
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

      <AlertBlockVotesDelete
        id={voteDeleteId}
        open={openDelete}
        handleClose={handleDeleteClose}
        refresh={() => fetchVotes(pagination.pageIndex, pagination.pageSize)}
      />
    </>
  );
}
