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
import BoothModal from 'pages/curd/booth/BoothModal';
import AlertBoothDelete from 'pages/curd/booth/AlertBoothDelete';
import BoothView from 'pages/curd/booth/BoothView';
import { Tooltip } from '@mui/material';

export default function BoothListPage() {
  const theme = useTheme();
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [boothDeleteId, setBoothDeleteId] = useState('');
  const [booths, setBooths] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [parliaments, setParliaments] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const fetchBooths = async (pageIndex, pageSize) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/booths?page=${pageIndex + 1}&limit=${pageSize}`);
      const json = await res.json();
      if (json.success) {
        setBooths(json.data);
        setPageCount(json.pages);
      }
    } catch (error) {
      console.error('Failed to fetch booths:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [statesRes, districtsRes, divisionsRes, blocksRes, assembliesRes, parliamentsRes] = await Promise.all([
        fetch('http://localhost:5000/api/states'),
        fetch('http://localhost:5000/api/districts'),
        fetch('http://localhost:5000/api/divisions'),
        fetch('http://localhost:5000/api/blocks'),
        fetch('http://localhost:5000/api/assemblies'),
        fetch('http://localhost:5000/api/parliaments')
      ]);

      const statesJson = await statesRes.json();
      const districtsJson = await districtsRes.json();
      const divisionsJson = await divisionsRes.json();
      const blocksJson = await blocksRes.json();
      const assembliesJson = await assembliesRes.json();
      const parliamentsJson = await parliamentsRes.json();

      if (statesJson.success) setStates(statesJson.data);
      if (districtsJson.success) setDistricts(districtsJson.data);
      if (divisionsJson.success) setDivisions(divisionsJson.data);
      if (blocksJson.success) setBlocks(blocksJson.data);
      if (assembliesJson.success) setAssemblies(assembliesJson.data);
      if (parliamentsJson.success) setParliaments(parliamentsJson.data);
    } catch (error) {
      console.error('Failed to fetch reference data:', error);
    }
  };

  useEffect(() => {
    fetchBooths(pagination.pageIndex, pagination.pageSize);
    fetchReferenceData();
  }, [pagination.pageIndex, pagination.pageSize]);

  const handleDeleteOpen = (id) => {
    setBoothDeleteId(id);
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
      header: 'Booth Number',
      accessorKey: 'booth_number',
      cell: ({ getValue }) => <Typography>{getValue()}</Typography>
    },
    {
      header: 'Block',
      accessorKey: 'block_id',
      cell: ({ getValue }) => (
        getValue() ? 
          <Chip label={getValue().name} color="primary" size="small" /> : 
          <Typography variant="caption">No block</Typography>
      )
    },
    {
      header: 'Assembly',
      accessorKey: 'assembly_id',
      cell: ({ getValue }) => (
        getValue() ? 
          <Chip label={getValue().name} color="secondary" size="small" /> : 
          <Typography variant="caption">No assembly</Typography>
      )
    },
    {
      header: 'Location',
      accessorKey: 'full_address',
      cell: ({ getValue }) => (
        <Typography noWrap sx={{ maxWidth: 200 }}>
          {getValue()}
        </Typography>
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
                  setSelectedBooth(row.original);
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
    data: booths,
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
            placeholder={`Search ${booths.length} booths...`}
          />
          <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedBooth(null); setOpenModal(true); }}>
            Add Booth
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
                          <BoothView data={row.original} />
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

      <BoothModal
        open={openModal}
        modalToggler={setOpenModal}
        booth={selectedBooth}
        states={states}
        districts={districts}
        divisions={divisions}
        blocks={blocks}
        assemblies={assemblies}
        parliaments={parliaments}
        refresh={() => fetchBooths(pagination.pageIndex, pagination.pageSize)}
      />

      <AlertBoothDelete
        id={boothDeleteId}
        open={openDelete}
        handleClose={handleDeleteClose}
        refresh={() => fetchBooths(pagination.pageIndex, pagination.pageSize)}
      />
    </>
  );
}