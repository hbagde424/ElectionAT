import { useEffect, useMemo, useState, Fragment } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider, Chip, LinearProgress
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
import WorkStatusModal from 'pages/curd/work status/WorkStatusModal';
import AlertWorkStatusDelete from 'pages/curd/work status/AlertWorkStatusDelete';
import WorkStatusView from 'pages/curd/work status/WorkStatusView';
import { Tooltip } from '@mui/material';

export default function WorkStatusListPage() {
  const theme = useTheme();
  const [selectedWorkStatus, setSelectedWorkStatus] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [workStatusDeleteId, setWorkStatusDeleteId] = useState('');
  const [workStatuses, setWorkStatuses] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [parliaments, setParliaments] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [booths, setBooths] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const fetchWorkStatuses = async (pageIndex, pageSize) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/work-status?page=${pageIndex + 1}&limit=${pageSize}`);
      const json = await res.json();
      if (json.success) {
        setWorkStatuses(json.data);
        setPageCount(json.pages);
      }
    } catch (error) {
      console.error('Failed to fetch work statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes] = await Promise.all([
        fetch('http://localhost:5000/api/divisions'),
        fetch('http://localhost:5000/api/parliaments'),
        fetch('http://localhost:5000/api/assemblies'),
        fetch('http://localhost:5000/api/blocks'),
        fetch('http://localhost:5000/api/booths')
      ]);

      const divisionsJson = await divisionsRes.json();
      const parliamentsJson = await parliamentsRes.json();
      const assembliesJson = await assembliesRes.json();
      const blocksJson = await blocksRes.json();
      const boothsJson = await boothsRes.json();

      if (divisionsJson.success) setDivisions(divisionsJson.data);
      if (parliamentsJson.success) setParliaments(parliamentsJson.data);
      if (assembliesJson.success) setAssemblies(assembliesJson.data);
      if (blocksJson.success) setBlocks(blocksJson.data);
      if (boothsJson.success) setBooths(boothsJson.data);
    } catch (error) {
      console.error('Failed to fetch reference data:', error);
    }
  };

  useEffect(() => {
    fetchWorkStatuses(pagination.pageIndex, pagination.pageSize);
    fetchReferenceData();
  }, [pagination.pageIndex, pagination.pageSize]);

  const handleDeleteOpen = (id) => {
    setWorkStatusDeleteId(id);
    setOpenDelete(true);
  };

  const handleDeleteClose = () => setOpenDelete(false);

  const statusColors = {
    'Pending': 'default',
    'In Progress': 'primary',
    'Completed': 'success',
    'Halted': 'warning',
    'Cancelled': 'error'
  };

  const columns = useMemo(() => [
  {
    header: '#',
    accessorKey: '_id',
    cell: ({ row }) => <Typography>{row.index + 1}</Typography>,
    size: 60
  },
  {
    header: 'Work Name',
    accessorKey: 'work_name',
    cell: ({ getValue }) => <Typography variant="subtitle1">{getValue()}</Typography>,
    size: 200
  },
  {
    header: 'Department',
    accessorKey: 'department',
    cell: ({ getValue }) => <Typography>{getValue()}</Typography>,
    size: 150
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ getValue }) => (
      <Chip 
        label={getValue()} 
        color={
          getValue() === 'Completed' ? 'success' : 
          getValue() === 'In Progress' ? 'primary' : 
          getValue() === 'Halted' ? 'warning' : 
          getValue() === 'Cancelled' ? 'error' : 'default'
        } 
        size="small" 
        sx={{ minWidth: 100 }}
      />
    ),
    size: 120
  },
  {
    header: 'Approved Fund',
    accessorKey: 'approved_fund',
    cell: ({ getValue }) => (
      <Typography fontWeight="500">
        ₹{new Intl.NumberFormat('en-IN').format(getValue())}
      </Typography>
    ),
    size: 120
  },
  {
    header: 'Total Budget',
    accessorKey: 'total_budget',
    cell: ({ getValue }) => (
      <Typography fontWeight="500">
        ₹{new Intl.NumberFormat('en-IN').format(getValue())}
      </Typography>
    ),
    size: 120
  },
  {
    header: 'Progress',
    accessorKey: 'progress',
    cell: ({ row }) => {
      const approved = row.original.approved_fund;
      const total = row.original.total_budget;
      const progress = Math.min(100, (approved / total) * 100);
      
      return (
        <Stack spacing={1} sx={{ minWidth: 150 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption" color="textSecondary">
              {progress.toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="textSecondary">
              ₹{new Intl.NumberFormat('en-IN').format(approved)}/₹{new Intl.NumberFormat('en-IN').format(total)}
            </Typography>
          </Stack>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            color={
              progress === 100 ? 'success' : 
              progress > 70 ? 'primary' : 
              progress > 30 ? 'warning' : 'error'
            }
            sx={{ height: 6 }}
          />
        </Stack>
      );
    },
    size: 180
  },
  {
    header: 'Falia',
    accessorKey: 'falia',
    cell: ({ getValue }) => (
      <Typography noWrap sx={{ maxWidth: 150 }}>
        {getValue() || '-'}
      </Typography>
    ),
    size: 120
  },
  {
    header: 'Division',
    accessorKey: 'division_id',
    cell: ({ getValue }) => (
      getValue() ? 
        <Chip label={getValue().name} color="primary" size="small" /> : 
        <Typography variant="caption">-</Typography>
    ),
    size: 150
  },
  {
    header: 'Parliament',
    accessorKey: 'parliament_id',
    cell: ({ getValue }) => (
      getValue() ? 
        <Chip label={getValue().name} color="secondary" size="small" /> : 
        <Typography variant="caption">-</Typography>
    ),
    size: 150
  },
  {
    header: 'Assembly',
    accessorKey: 'assembly_id',
    cell: ({ getValue }) => (
      getValue() ? 
        <Chip label={getValue().name} color="info" size="small" /> : 
        <Typography variant="caption">-</Typography>
    ),
    size: 150
  },
  {
    header: 'Block',
    accessorKey: 'block_id',
    cell: ({ getValue }) => (
      getValue() ? 
        <Chip label={getValue().name} color="warning" size="small" /> : 
        <Typography variant="caption">-</Typography>
    ),
    size: 150
  },
  {
    header: 'Booth',
    accessorKey: 'booth_id',
    cell: ({ getValue }) => (
      getValue() ? (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Chip 
            label={`${getValue().name}`} 
            color="success" 
            size="small" 
          />
          <Typography variant="caption" color="textSecondary">
            (Booth: {getValue().booth_number})
          </Typography>
        </Stack>
      ) : (
        <Typography variant="caption">-</Typography>
      )
    ),
    size: 180
  },
  {
    header: 'Actions',
    cell: ({ row }) => {
      const isExpanded = row.getIsExpanded();
      const expandIcon = isExpanded ? 
        <Add style={{ transform: 'rotate(45deg)', color: theme.palette.error.main }} /> : 
        <Eye />;
      
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
                setSelectedWorkStatus(row.original);
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
    size: 120
  }
], [theme]);

  const table = useReactTable({
    data: workStatuses,
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
            placeholder={`Search ${workStatuses.length} work statuses...`}
          />
          <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedWorkStatus(null); setOpenModal(true); }}>
            Add Work Status
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
                          <WorkStatusView data={row.original} />
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

      <WorkStatusModal
        open={openModal}
        modalToggler={setOpenModal}
        workStatus={selectedWorkStatus}
        divisions={divisions}
        parliaments={parliaments}
        assemblies={assemblies}
        blocks={blocks}
        booths={booths}
        refresh={() => fetchWorkStatuses(pagination.pageIndex, pagination.pageSize)}
      />

      <AlertWorkStatusDelete
        id={workStatusDeleteId}
        open={openDelete}
        handleClose={handleDeleteClose}
        refresh={() => fetchWorkStatuses(pagination.pageIndex, pagination.pageSize)}
      />
    </>
  );
}