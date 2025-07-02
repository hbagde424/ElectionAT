import { useEffect, useMemo, useState, Fragment } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider, Chip, Avatar
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash, User } from 'iconsax-react';

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
import LocalIssueModal from 'pages/curd/local issue/LocalModal';
import AlertLocalIssueDelete from 'pages/curd/local issue/AlertLocalDelete';
import LocalIssueView from 'pages/curd/local issue/LocalView';
import { Tooltip } from '@mui/material';

export default function LocalIssueListPage() {
  const theme = useTheme();
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [issueDeleteId, setIssueDeleteId] = useState('');
  const [localIssues, setLocalIssues] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [parliaments, setParliaments] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [booths, setBooths] = useState([]);
  const [users, setUsers] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const statusColors = {
    'Reported': 'default',
    'In Progress': 'info',
    'Resolved': 'success',
    'Rejected': 'error'
  };

  const priorityColors = {
    'Low': 'success',
    'Medium': 'info',
    'High': 'warning',
    'Critical': 'error'
  };

  const fetchLocalIssues = async (pageIndex, pageSize) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/local-issues?page=${pageIndex + 1}&limit=${pageSize}`);
      const json = await res.json();
      if (json.success) {
        setLocalIssues(json.data);
        setPageCount(json.pages);
      }
    } catch (error) {
      console.error('Failed to fetch local issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes, usersRes] = await Promise.all([
        fetch('http://localhost:5000/api/divisions'),
        fetch('http://localhost:5000/api/parliaments'),
        fetch('http://localhost:5000/api/assemblies'),
        fetch('http://localhost:5000/api/blocks'),
        fetch('http://localhost:5000/api/booths'),
        fetch('http://localhost:5000/api/users')
      ]);

      const divisionsJson = await divisionsRes.json();
      const parliamentsJson = await parliamentsRes.json();
      const assembliesJson = await assembliesRes.json();
      const blocksJson = await blocksRes.json();
      const boothsJson = await boothsRes.json();
      const usersJson = await usersRes.json();

      if (divisionsJson.success) setDivisions(divisionsJson.data);
      if (parliamentsJson.success) setParliaments(parliamentsJson.data);
      if (assembliesJson.success) setAssemblies(assembliesJson.data);
      if (blocksJson.success) setBlocks(blocksJson.data);
      if (boothsJson.success) setBooths(boothsJson.data);
      if (usersJson.success) setUsers(usersJson.data);
    } catch (error) {
      console.error('Failed to fetch reference data:', error);
    }
  };

  useEffect(() => {
    fetchLocalIssues(pagination.pageIndex, pagination.pageSize);
    fetchReferenceData();
  }, [pagination.pageIndex, pagination.pageSize]);

  const handleDeleteOpen = (id) => {
    setIssueDeleteId(id);
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
      header: 'Issue Name',
      accessorKey: 'issue_name',
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
      header: 'Priority',
      accessorKey: 'priority',
      cell: ({ getValue }) => (
        <Chip 
          label={getValue()} 
          color={priorityColors[getValue()]} 
          size="small" 
          sx={{ minWidth: 100 }}
        />
      )
    },
    {
      header: 'Booth',
      accessorKey: 'booth_id',
      cell: ({ getValue }) => (
        getValue() ? 
          <Typography>{getValue().name} (Booth: {getValue().booth_number})</Typography> : 
          <Typography variant="caption">No booth</Typography>
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
                  setSelectedIssue(row.original);
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
    data: localIssues,
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
            placeholder={`Search ${localIssues.length} issues...`}
          />
          <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedIssue(null); setOpenModal(true); }}>
            Add Issue
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
                          <LocalIssueView data={row.original} />
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

      <LocalIssueModal
        open={openModal}
        modalToggler={setOpenModal}
        issue={selectedIssue}
        divisions={divisions}
        parliaments={parliaments}
        assemblies={assemblies}
        blocks={blocks}
        booths={booths}
        users={users}
        refresh={() => fetchLocalIssues(pagination.pageIndex, pagination.pageSize)}
      />

      <AlertLocalIssueDelete
        id={issueDeleteId}
        open={openDelete}
        handleClose={handleDeleteClose}
        refresh={() => fetchLocalIssues(pagination.pageIndex, pagination.pageSize)}
      />
    </>
  );
}