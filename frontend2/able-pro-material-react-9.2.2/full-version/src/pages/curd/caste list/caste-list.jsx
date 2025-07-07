import { useEffect, useMemo, useState, Fragment } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider, Chip, Avatar, Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash, User } from 'iconsax-react';

import {
  getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
  useReactTable, flexRender
} from '@tanstack/react-table';

import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';
import EmptyReactTable from 'pages/tables/react-table/empty';

import CasteListModal from 'pages/curd/caste list/CasteModal';
import AlertCasteListDelete from 'pages/curd/caste list/AlertCasteDelete';
import CasteListView from 'pages/curd/caste list/CasteView';

export default function CasteListPage() {
  const theme = useTheme();
  const [selectedCaste, setSelectedCaste] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [casteDeleteId, setCasteDeleteId] = useState('');
  const [casteLists, setCasteLists] = useState([]);
  const [states, setStates] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [parliaments, setParliaments] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [booths, setBooths] = useState([]);
  const [users, setUsers] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const categoryColors = {
    'SC': 'error',
    'ST': 'warning',
    'OBC': 'info',
    'General': 'success',
    'Other': 'default'
  };

  const fetchCasteLists = async (pageIndex, pageSize) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/caste-lists?page=${pageIndex + 1}&limit=${pageSize}`);
      const json = await res.json();
      if (json.success) {
        setCasteLists(json.data);
        setPageCount(json.pages);
      }
    } catch (error) {
      console.error('Failed to fetch caste lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes, usersRes] = await Promise.all([
        fetch('http://localhost:5000/api/states'),
        fetch('http://localhost:5000/api/divisions'),
        fetch('http://localhost:5000/api/parliaments'),
        fetch('http://localhost:5000/api/assemblies'),
        fetch('http://localhost:5000/api/blocks'),
        fetch('http://localhost:5000/api/booths'),
        fetch('http://localhost:5000/api/users')
      ]);

      const statesJson = await statesRes.json();
      const divisionsJson = await divisionsRes.json();
      const parliamentsJson = await parliamentsRes.json();
      const assembliesJson = await assembliesRes.json();
      const blocksJson = await blocksRes.json();
      const boothsJson = await boothsRes.json();
      const usersJson = await usersRes.json();

      if (statesJson.success) setStates(statesJson.data);
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
    fetchCasteLists(pagination.pageIndex, pagination.pageSize);
    fetchReferenceData();
  }, [pagination.pageIndex, pagination.pageSize]);

  const handleDeleteOpen = (id) => {
    setCasteDeleteId(id);
    setOpenDelete(true);
  };

  const columns = useMemo(() => [
    {
      header: '#',
      accessorKey: '_id',
      cell: ({ row }) => <Typography>{row.index + 1}</Typography>
    },
    {
      header: 'Category',
      accessorKey: 'category',
      cell: ({ getValue }) => (
        <Chip label={getValue()} color={categoryColors[getValue()] || 'default'} size="small" sx={{ minWidth: 80 }} />
      )
    },
    {
      header: 'Caste',
      accessorKey: 'caste',
      cell: ({ getValue }) => <Typography variant="subtitle1">{getValue()}</Typography>
    },
    {
      header: 'Booth',
      accessorKey: 'booth',
      cell: ({ getValue }) => {
        const booth = getValue();
        return booth
          ? <Typography>{booth.name} (Booth: {booth.booth_number})</Typography>
          : <Typography variant="caption">No booth</Typography>;
      }
    },

    {
      header: 'Block',
      accessorKey: 'block',
      cell: ({ getValue }) => {
        const block = getValue();
        return block
          ? <Chip label={block.name} color="primary" size="small" />
          : <Typography variant="caption">No block</Typography>;
      }
    }
    ,
    {
      header: 'State',
      accessorKey: 'state',
      cell: ({ getValue }) => {
        const state = getValue();
        return state
          ? <Chip label={state.name} color="success" size="small" variant="outlined" />
          : <Typography variant="caption">No state</Typography>;
      }
    }
    ,
    {
      header: 'Created By',
      accessorKey: 'created_by',
      cell: ({ getValue }) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar sx={{ width: 24, height: 24 }}><User size={16} /></Avatar>
          <Typography>{getValue()?.name || 'Unknown'}</Typography>
        </Stack>
      )
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
          <Tooltip title="View"><IconButton color="secondary" onClick={row.getToggleExpandedHandler()}><Eye /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton color="primary" onClick={() => { setSelectedCaste(row.original); setOpenModal(true); }}><Edit /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton color="error" onClick={() => handleDeleteOpen(row.original._id)}><Trash /></IconButton></Tooltip>
        </Stack>
      )
    }
  ], [theme]);

  const table = useReactTable({
    data: casteLists,
    columns,
    state: { pagination },
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
            placeholder={`Search ${casteLists.length} caste entries...`}
          />
          <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedCaste(null); setOpenModal(true); }}>
            Add Caste
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
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && (
                      <TableRow>
                        <TableCell colSpan={row.getVisibleCells().length}>
                          <CasteListView data={row.original} />
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

      <CasteListModal
        open={openModal}
        modalToggler={setOpenModal}
        caste={selectedCaste}
        states={states}
        divisions={divisions}
        parliaments={parliaments}
        assemblies={assemblies}
        blocks={blocks}
        booths={booths}
        users={users}
        refresh={() => fetchCasteLists(pagination.pageIndex, pagination.pageSize)}
      />

      <AlertCasteListDelete
        id={casteDeleteId}
        open={openDelete}
        handleClose={() => setOpenDelete(false)}
        refresh={() => fetchCasteLists(pagination.pageIndex, pagination.pageSize)}
      />
    </>
  );
}