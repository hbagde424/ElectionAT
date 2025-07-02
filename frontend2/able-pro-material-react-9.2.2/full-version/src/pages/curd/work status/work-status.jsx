

import { useEffect, useMemo, useState, Fragment } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider, Chip, Link
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash } from 'iconsax-react';
import { DatePicker } from '@mui/x-date-pickers';

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
  const [selectedWork, setSelectedWork] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [workDeleteId, setWorkDeleteId] = useState('');
  const [workStatuses, setWorkStatuses] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [parliaments, setParliaments] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [booths, setBooths] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const statusColors = {
    'Pending': 'default',
    'In Progress': 'info',
    'Completed': 'success',
    'Halted': 'warning',
    'Cancelled': 'error'
  };

  const fundSourceColors = {
    'vidhayak nidhi': 'primary',
    'swechcha nidhi': 'secondary'
  };

  const fetchWorkStatuses = async (pageIndex, pageSize) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/work-statuses?page=${pageIndex + 1}&limit=${pageSize}`);
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
    setWorkDeleteId(id);
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
      header: 'Work Name',
      accessorKey: 'work_name',
      cell: ({ getValue }) => <Typography variant="subtitle1">{getValue()}</Typography>
    },
    {
      header: 'Department',
      accessorKey: 'department',
      cell: ({ getValue }) => <Typography>{getValue()}</Typography>
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => (
        <Chip 
          label={getValue()} 
          color={statusColors[getValue()]} 
          size="small" 
          sx={{ minWidth: 100 }}
        />
      )
    },
    {
      header: 'Budget',
      cell: ({ row }) => (
        <Typography>
          ₹{row.original.spent_amount.toLocaleString()} / ₹{row.original.total_budget.toLocaleString()}
        </Typography>
      )
    },
    {
      header: 'Fund Source',
      accessorKey: 'approved_fund_from',
      cell: ({ getValue }) => (
        <Chip 
          label={getValue()} 
          color={fundSourceColors[getValue()]} 
          size="small" 
          sx={{ textTransform: 'capitalize' }}
        />
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
                  setSelectedWork(row.original);
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
          <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedWork(null); setOpenModal(true); }}>
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
        work={selectedWork}
        divisions={divisions}
        parliaments={parliaments}
        assemblies={assemblies}
        blocks={blocks}
        booths={booths}
        refresh={() => fetchWorkStatuses(pagination.pageIndex, pagination.pageSize)}
      />

      <AlertWorkStatusDelete
        id={workDeleteId}
        open={openDelete}
        handleClose={handleDeleteClose}
        refresh={() => fetchWorkStatuses(pagination.pageIndex, pagination.pageSize)}
      />
    </>
  );
}