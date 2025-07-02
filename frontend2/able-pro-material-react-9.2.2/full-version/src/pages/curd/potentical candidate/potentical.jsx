


import { useEffect, useMemo, useState, Fragment } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider, Chip, Avatar
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash } from 'iconsax-react';

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
import PotentialCandidateModal from 'pages/curd/potentical candidate/PotentialCandidateModal';
import AlertPotentialCandidateDelete from 'pages/curd/potentical candidate/AlertPotentialCandidateDelete';
import PotentialCandidateView from 'pages/curd/potentical candidate/PotentialCandidateView';
import { Tooltip } from '@mui/material';

export default function PotentialCandidateListPage() {
  const theme = useTheme();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [parties, setParties] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [electionYears, setElectionYears] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const fetchCandidates = async (pageIndex, pageSize) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/potential-candidates?page=${pageIndex + 1}&limit=${pageSize}`);
      const json = await res.json();
      if (json.success) {
        setCandidates(json.data);
        setPageCount(json.pages);
      }
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [partiesRes, assembliesRes, electionYearsRes] = await Promise.all([
        fetch('http://localhost:5000/api/parties'),
        fetch('http://localhost:5000/api/assemblies'),
        fetch('http://localhost:5000/api/election-years')
      ]);

      const partiesJson = await partiesRes.json();
      const assembliesJson = await assembliesRes.json();
      const electionYearsJson = await electionYearsRes.json();

      console.log('Election Years Data:', electionYearsJson); // Add this for debugging

      if (partiesJson.success) setParties(partiesJson.data);
      if (assembliesJson.success) setAssemblies(assembliesJson.data);
      if (electionYearsJson.success) setElectionYears(electionYearsJson.data);
    } catch (error) {
      console.error('Failed to fetch reference data:', error);
    }
  };

  useEffect(() => {
    fetchCandidates(pagination.pageIndex, pagination.pageSize);
    fetchReferenceData();
  }, [pagination.pageIndex, pagination.pageSize]);

  const handleDeleteOpen = (id) => {
    setDeleteId(id);
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
      accessorKey: 'name',
      cell: ({ row }) => (
        <Stack direction="row" spacing={1} alignItems="center">
          {row.original.image && (
            <Avatar src={row.original.image} alt={row.original.name} sx={{ width: 40, height: 40 }} />
          )}
          <Typography variant="subtitle1">{row.original.name}</Typography>
        </Stack>
      )
    },
    {
      header: 'Party',
      accessorKey: 'party_id',
      cell: ({ getValue }) => (
        getValue() ?
          <Chip label={getValue().name} color="primary" size="small" /> :
          <Typography variant="caption">No party</Typography>
      )
    },
    {
      header: 'Constituency',
      accessorKey: 'constituency_id',
      cell: ({ getValue }) => (
        getValue() ?
          <Chip label={getValue().name} color="secondary" size="small" /> :
          <Typography variant="caption">No constituency</Typography>
      )
    },
    {
      header: 'Election Year',
      accessorKey: 'election_year_id',
      cell: ({ getValue }) => (
        getValue() ?
          <Typography>{getValue().year}</Typography> :
          <Typography variant="caption">No year</Typography>
      )
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
            placeholder={`Search ${candidates.length} candidates...`}
          />
          <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedCandidate(null); setOpenModal(true); }}>
            Add Candidate
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
                          <PotentialCandidateView data={row.original} />
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
    </>
  );
}