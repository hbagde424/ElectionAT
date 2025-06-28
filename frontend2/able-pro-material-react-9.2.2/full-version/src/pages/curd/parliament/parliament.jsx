import { useEffect, useMemo, useState, Fragment } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider, Chip
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
import ParliamentModal from 'pages/curd/parliament/ParliamentModal';
import AlertParliamentDelete from 'pages/curd/parliament/AlertParliamentDelete';
import ParliamentView from 'pages/curd/parliament/ParliamentView';
import { Tooltip } from '@mui/material';

export default function ParliamentListPage() {
  const theme = useTheme();

  const [selectedParliament, setSelectedParliament] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [parliamentDeleteId, setParliamentDeleteId] = useState('');
  const [parliaments, setParliaments] = useState([]);
  const [states, setStates] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const fetchParliaments = async (pageIndex, pageSize) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/parliaments?page=${pageIndex + 1}&limit=${pageSize}`);
      const json = await res.json();
      if (json.success) {
        setParliaments(json.data);
        setPageCount(json.pages);
      }
    } catch (error) {
      console.error('Failed to fetch parliaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [statesRes, divisionsRes, assembliesRes] = await Promise.all([
        fetch('http://localhost:5000/api/states'),
        fetch('http://localhost:5000/api/divisions'),
        fetch('http://localhost:5000/api/assemblies')
      ]);

      const statesJson = await statesRes.json();
      const divisionsJson = await divisionsRes.json();
      const assembliesJson = await assembliesRes.json();

      if (statesJson.success) setStates(statesJson.data);
      if (divisionsJson.success) setDivisions(divisionsJson.data);
      if (assembliesJson.success) setAssemblies(assembliesJson.data);
    } catch (error) {
      console.error('Failed to fetch reference data:', error);
    }
  };

  useEffect(() => {
    fetchParliaments(pagination.pageIndex, pagination.pageSize);
    fetchReferenceData();
  }, [pagination.pageIndex, pagination.pageSize]);

  const handleDeleteOpen = (id) => {
    setParliamentDeleteId(id);
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
      header: 'State',
      accessorKey: 'state_id',
      cell: ({ getValue }) => (
        getValue() ? 
          <Chip label={getValue().name} color="primary" size="small" /> : 
          <Typography variant="caption">No state</Typography>
      )
    },
    {
      header: 'Division',
      accessorKey: 'division_id',
      cell: ({ getValue }) => (
        getValue() ? 
          <Chip label={getValue().name} color="secondary" size="small" /> : 
          <Typography variant="caption">No division</Typography>
      )
    },
    {
      header: 'Category',
      accessorKey: 'category',
      cell: ({ getValue }) => (
        <Chip 
          label={getValue()} 
          color={
            getValue() === 'reserved' ? 'success' : 
            getValue() === 'special' ? 'warning' : 'info'
          } 
          size="small" 
        />
      )
    },
    {
      header: 'Regional Type',
      accessorKey: 'regional_type',
      cell: ({ getValue }) => (
        <Chip 
          label={getValue()} 
          color={
            getValue() === 'urban' ? 'primary' : 
            getValue() === 'rural' ? 'secondary' : 'default'
          } 
          size="small" 
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
                  setSelectedParliament(row.original);
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
    data: parliaments,
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
            placeholder={`Search ${parliaments.length} parliaments...`}
          />
          <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedParliament(null); setOpenModal(true); }}>
            Add Parliament
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
                          <ParliamentView data={row.original} />
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

      <ParliamentModal
        open={openModal}
        modalToggler={setOpenModal}
        parliament={selectedParliament}
        states={states}
        divisions={divisions}
        assemblies={assemblies}
        refresh={() => fetchParliaments(pagination.pageIndex, pagination.pageSize)}
      />

      <AlertParliamentDelete
        id={parliamentDeleteId}
        open={openDelete}
        handleClose={handleDeleteClose}
        refresh={() => fetchParliaments(pagination.pageIndex, pagination.pageSize)}
      />
    </>
  );
}