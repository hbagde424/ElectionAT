import { useEffect, useMemo, useState, Fragment } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider, Chip, Switch
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
import BlockModal from 'pages/curd/block/BlockModal';
import AlertBlockDelete from 'pages/curd/block/AlertBlockDelete';
import BlockView from 'pages/curd/block/BlockView';
import { Tooltip } from '@mui/material';

export default function BlockListPage() {
  const theme = useTheme();
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [blockDeleteId, setBlockDeleteId] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [parliaments, setParliaments] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const fetchBlocks = async (pageIndex, pageSize) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/blocks?page=${pageIndex + 1}&limit=${pageSize}`);
      const json = await res.json();
      if (json.success) {
        setBlocks(json.data);
        setPageCount(json.pages);
      }
    } catch (error) {
      console.error('Failed to fetch blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [statesRes, districtsRes, divisionsRes, assembliesRes, parliamentsRes] = await Promise.all([
        fetch('http://localhost:5000/api/states'),
        fetch('http://localhost:5000/api/districts'),
        fetch('http://localhost:5000/api/divisions'),
        fetch('http://localhost:5000/api/assemblies'),
        fetch('http://localhost:5000/api/parliaments')
      ]);

      const statesJson = await statesRes.json();
      const districtsJson = await districtsRes.json();
      const divisionsJson = await divisionsRes.json();
      const assembliesJson = await assembliesRes.json();
      const parliamentsJson = await parliamentsRes.json();

      if (statesJson.success) setStates(statesJson.data);
      if (districtsJson.success) setDistricts(districtsJson.data);
      if (divisionsJson.success) setDivisions(divisionsJson.data);
      if (assembliesJson.success) setAssemblies(assembliesJson.data);
      if (parliamentsJson.success) setParliaments(parliamentsJson.data);
    } catch (error) {
      console.error('Failed to fetch reference data:', error);
    }
  };

  const toggleBlockStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('serviceToken');
      const res = await fetch(`http://localhost:5000/api/blocks/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (res.ok) {
        fetchBlocks(pagination.pageIndex, pagination.pageSize);
      }
    } catch (error) {
      console.error('Failed to toggle block status:', error);
    }
  };

  useEffect(() => {
    fetchBlocks(pagination.pageIndex, pagination.pageSize);
    fetchReferenceData();
  }, [pagination.pageIndex, pagination.pageSize]);

  const handleDeleteOpen = (id) => {
    setBlockDeleteId(id);
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
      header: 'Name',
      accessorKey: 'name',
      cell: ({ getValue }) => <Typography variant="subtitle1">{getValue()}</Typography>
    },
    {
      header: 'Category',
      accessorKey: 'category',
      cell: ({ getValue }) => (
        <Chip 
          label={getValue()} 
          color={
            getValue() === 'Urban' ? 'primary' : 
            getValue() === 'Rural' ? 'secondary' : 
            getValue() === 'Semi-Urban' ? 'info' : 'warning'
          } 
          size="small" 
        />
      )
    },
    {
      header: 'State',
      accessorKey: 'state_id',
      cell: ({ getValue }) => (
        getValue() ? 
          <Chip label={getValue().name} color="primary" size="small" /> : 
          <Typography variant="caption">No state</Typography>
      )
    },
    {
      header: 'District',
      accessorKey: 'district_id',
      cell: ({ getValue }) => (
        getValue() ? 
          <Chip label={getValue().name} color="secondary" size="small" /> : 
          <Typography variant="caption">No district</Typography>
      )
    },
    {
      header: 'Division',
      accessorKey: 'division_id',
      cell: ({ getValue }) => (
        getValue() ? 
          <Chip label={getValue().name} color="info" size="small" /> : 
          <Typography variant="caption">No division</Typography>
      )
    },
    {
      header: 'Assembly',
      accessorKey: 'assembly_id',
      cell: ({ getValue }) => (
        getValue() ? 
          <Chip label={getValue().name} color="success" size="small" /> : 
          <Typography variant="caption">No assembly</Typography>
      )
    },
    {
      header: 'Status',
      accessorKey: 'is_active',
      cell: ({ row }) => (
        <Switch
          checked={row.original.is_active}
          onChange={() => toggleBlockStatus(row.original._id, row.original.is_active)}
          color="success"
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
                  setSelectedBlock(row.original);
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
    data: blocks,
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
            placeholder={`Search ${blocks.length} blocks...`}
          />
          <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedBlock(null); setOpenModal(true); }}>
            Add Block
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
                          <BlockView data={row.original} />
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

      <BlockModal
        open={openModal}
        modalToggler={setOpenModal}
        block={selectedBlock}
        states={states}
        districts={districts}
        divisions={divisions}
        assemblies={assemblies}
        parliaments={parliaments}
        refresh={() => fetchBlocks(pagination.pageIndex, pagination.pageSize)}
      />

      <AlertBlockDelete
        id={blockDeleteId}
        open={openDelete}
        handleClose={handleDeleteClose}
        refresh={() => fetchBlocks(pagination.pageIndex, pagination.pageSize)}
      />
    </>
  );
}