import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
  Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash, User } from 'iconsax-react';
import { useNavigate } from 'react-router-dom';

// third-party
import {
  getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
  useReactTable, flexRender
} from '@tanstack/react-table';
import { CSVLink } from 'react-csv';

// project imports
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';
import EmptyReactTable from 'pages/tables/react-table/empty';

// custom views and modals
import UserModal from 'pages/curd/user/UserModal';
import AlertUserDelete from 'pages/curd/user/AlertUserDelete';
import UserView from 'pages/curd/user/UserView';
import { Tooltip } from '@mui/material';

export default function UserListPage() {
  const theme = useTheme();

  const [selectedUser, setSelectedUser] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [userDeleteId, setUserDeleteId] = useState('');
  const [users, setUsers] = useState([]);
  const [states, setStates] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [parliaments, setParliaments] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [booths, setBooths] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState('');

  const fetchUsers = async (pageIndex, pageSize, globalFilter = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('serviceToken');
      const query = globalFilter ? `&search=${encodeURIComponent(globalFilter)}` : '';
      const res = await fetch(`http://localhost:5000/api/users?page=${pageIndex + 1}&limit=${pageSize}${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
        setPageCount(json.pages);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes] = await Promise.all([
        fetch('http://localhost:5000/api/states'),
        fetch('http://localhost:5000/api/divisions'),
        fetch('http://localhost:5000/api/parliaments'),
        fetch('http://localhost:5000/api/assemblies'),
        fetch('http://localhost:5000/api/blocks'),
        fetch('http://localhost:5000/api/booths')
      ]);

      const [statesData, divisionsData, parliamentsData, assembliesData, blocksData, boothsData] = await Promise.all([
        statesRes.json(),
        divisionsRes.json(),
        parliamentsRes.json(),
        assembliesRes.json(),
        blocksRes.json(),
        boothsRes.json()
      ]);

      if (statesData.success) setStates(statesData.data);
      if (divisionsData.success) setDivisions(divisionsData.data);
      if (parliamentsData.success) setParliaments(parliamentsData.data);
      if (assembliesData.success) setAssemblies(assembliesData.data);
      if (blocksData.success) setBlocks(blocksData.data);
      if (boothsData.success) setBooths(boothsData.data);
    } catch (error) {
      console.error('Failed to fetch reference data:', error);
    }
  };

  useEffect(() => {
    fetchUsers(pagination.pageIndex, pagination.pageSize, globalFilter);
    fetchReferenceData();
  }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

  const handleDeleteOpen = (id) => {
    setUserDeleteId(id);
    setOpenDelete(true);
  };

  const handleDeleteClose = () => setOpenDelete(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatArray = (items) => {
    if (!items || items.length === 0) return 'None';
    return items.map(item => item.name).join(', ');
  };

  const columns = useMemo(() => [
    {
      header: '#',
      accessorKey: '_id',
      cell: ({ row }) => <Typography>{row.index + 1}</Typography>
    },
    {
      header: 'Username',
      accessorKey: 'username',
      cell: ({ getValue }) => (
        <Typography sx={{
          maxWidth: 150,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {getValue()}
        </Typography>
      )
    },
    {
      header: 'Mobile',
      accessorKey: 'mobile',
      cell: ({ getValue }) => <Typography>{getValue()}</Typography>
    },
    {
      header: 'Email',
      accessorKey: 'email',
      cell: ({ getValue }) => (
        <Typography sx={{
          maxWidth: 150,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {getValue() || 'N/A'}
        </Typography>
      )
    },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: ({ getValue }) => (
        <Chip
          label={getValue()}
          color={
            getValue() === 'superAdmin' ? 'error' :
              getValue() === 'Admin' ? 'warning' : 'primary'
          }
          size="small"
        />
      )
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: ({ getValue }) => (
        <Chip
          label={getValue() ? 'Active' : 'Inactive'}
          color={getValue() ? 'success' : 'error'}
          size="small"
        />
      )
    },
    {
      header: 'States',
      accessorKey: 'state_ids',
      cell: ({ getValue }) => (
        <Typography sx={{
          maxWidth: 150,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {formatArray(getValue())}
        </Typography>
      )
    },
    {
      header: 'Divisions',
      accessorKey: 'division_ids',
      cell: ({ getValue }) => (
        <Typography sx={{
          maxWidth: 150,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {formatArray(getValue())}
        </Typography>
      )
    },
    {
      header: 'Parliaments',
      accessorKey: 'parliament_ids',
      cell: ({ getValue }) => (
        <Typography sx={{
          maxWidth: 150,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {formatArray(getValue())}
        </Typography>
      )
    },
    {
      header: 'Assemblies',
      accessorKey: 'assembly_ids',
      cell: ({ getValue }) => (
        <Typography sx={{
          maxWidth: 150,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {formatArray(getValue())}
        </Typography>
      )
    },
    {
      header: 'Blocks',
      accessorKey: 'block_ids',
      cell: ({ getValue }) => (
        <Typography sx={{
          maxWidth: 150,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {formatArray(getValue())}
        </Typography>
      )
    },
    {
      header: 'Booths',
      accessorKey: 'booth_ids',
      cell: ({ getValue }) => (
        <Typography sx={{
          maxWidth: 150,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {formatArray(getValue())}
        </Typography>
      )
    },
    {
      header: 'Created By',
      accessorKey: 'created_by',
      cell: ({ getValue }) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar sx={{ width: 24, height: 24 }}>
            <User size={16} />
          </Avatar>
          <Typography>{getValue()?.username || 'Unknown'}</Typography>
        </Stack>
      )
    },
    {
      header: 'Created At',
      accessorKey: 'created_at',
      cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
    },
    {
      header: 'Updated At',
      accessorKey: 'updated_at',
      cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
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
                  setSelectedUser(row.original);
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
    data: users,
    columns,
    state: { pagination, globalFilter },
    pageCount,
    manualPagination: true,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowCanExpand: () => true
  });

  // Helper to fetch all users for CSV
  const fetchAllUsersForCsv = async () => {
    try {
      const token = localStorage.getItem('serviceToken');
      const res = await fetch('http://localhost:5000/api/users?all=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        return json.data;
      }
    } catch (error) {
      console.error('Failed to fetch all users for CSV:', error);
    }
    return [];
  };

  const [csvData, setCsvData] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const csvLinkRef = useRef();

  const handleDownloadCsv = async () => {
    setCsvLoading(true);
    const allData = await fetchAllUsersForCsv();
    setCsvData(allData.map(item => ({
      Username: item.username,
      Mobile: item.mobile,
      Email: item.email || '',
      Role: item.role,
      Status: item.isActive ? 'Active' : 'Inactive',
      States: formatArray(item.state_ids),
      Divisions: formatArray(item.division_ids),
      Parliaments: formatArray(item.parliament_ids),
      Assemblies: formatArray(item.assembly_ids),
      Blocks: formatArray(item.block_ids),
      Booths: formatArray(item.booth_ids),
      'Created By': item.created_by?.username || '',
      'Created At': item.created_at,
      'Updated At': item.updated_at
    })));
    setCsvLoading(false);
    setTimeout(() => {
      if (csvLinkRef.current) {
        csvLinkRef.current.link.click();
      }
    }, 100);
  };

  if (loading) return <EmptyReactTable />;

  return (
    <>
      <MainCard content={false}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
          <DebouncedInput
            value={globalFilter}
            onFilterChange={setGlobalFilter}
            placeholder={`Search ${users.length} users...`}
          />
          <Stack direction="row" spacing={1}>
            <CSVLink
              data={csvData}
              filename="users_all.csv"
              style={{ display: 'none' }}
              ref={csvLinkRef}
            />
            <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
              {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedUser(null); setOpenModal(true); }}>
              Add User
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
                          <UserView data={row.original} />
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

      <UserModal
        open={openModal}
        modalToggler={setOpenModal}
        user={selectedUser}
        states={states}
        divisions={divisions}
        parliaments={parliaments}
        assemblies={assemblies}
        blocks={blocks}
        booths={booths}
        refresh={() => fetchUsers(pagination.pageIndex, pagination.pageSize)}
      />

      <AlertUserDelete
        id={userDeleteId}
        open={openDelete}
        handleClose={handleDeleteClose}
        refresh={() => fetchUsers(pagination.pageIndex, pagination.pageSize)}
      />
    </>
  );
}