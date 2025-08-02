


import { useEffect, useMemo, useState, Fragment } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider, Chip, Avatar, Alert
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
  const [error, setError] = useState('');

  const fetchCandidates = async (pageIndex, pageSize) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:5000/api/potential-candidates?page=${pageIndex + 1}&limit=${pageSize}`);
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
      const [partiesRes, assembliesRes, electionYearsRes] = await Promise.all([
        fetch('http://localhost:5000/api/parties'),
        fetch('http://localhost:5000/api/assemblies'),
        fetch('http://localhost:5000/api/election-years')
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

  useEffect(() => {
    fetchCandidates(pagination.pageIndex, pagination.pageSize);
    fetchReferenceData();
  }, [pagination.pageIndex, pagination.pageSize]);

  const handleDeleteOpen = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleDeleteClose = () => setOpenDelete(false);

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
        const isExpanded = row.getIsExpanded();
        const expandIcon = isExpanded ? <Add style={{ transform: 'rotate(45deg)', color: theme.palette.error.main }} /> : <Eye />;
        return (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
            <Tooltip title="View Details">
              <IconButton color="secondary" onClick={row.getToggleExpandedHandler()}>
                {expandIcon}
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
    getPaginationRowModel: getPaginationRowModel(),
    getRowCanExpand: () => true
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

        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
          <DebouncedInput
            value={table.getState().globalFilter || ''}
            onFilterChange={(value) => table.setGlobalFilter(String(value))}
            placeholder={`Search ${candidates.length} potential candidates...`}
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
            <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedCandidate(null); setOpenModal(true); }}>
              Add Candidate
            </Button>
          </Stack>
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