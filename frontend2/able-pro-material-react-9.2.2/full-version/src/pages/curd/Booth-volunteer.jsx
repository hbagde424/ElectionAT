import { useEffect, useMemo, useState } from 'react';

// material-ui
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Stack,
  Box,
  Typography,
  Paper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// third-party
import {
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  flexRender,
  useReactTable,
  sortingFns
} from '@tanstack/react-table';
import { rankItem, compareItems } from '@tanstack/match-sorter-utils';

// project import
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { DebouncedInput, Filter, HeaderSort, TablePagination } from 'components/third-party/react-table';
import EmptyReactTable from 'pages/tables/react-table/empty';
import { useNavigate } from 'react-router-dom';
import { Add } from 'iconsax-react';

// ==============================|| FILTER & SORT FUNCTIONS ||============================== //
const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);
  addMeta(itemRank);
  return itemRank.passed;
};

const fuzzySort = (rowA, rowB, columnId) => {
  let dir = 0;
  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(rowA.columnFiltersMeta[columnId], rowB.columnFiltersMeta[columnId]);
  }
  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
};

// ==============================|| REACT TABLE COMPONENT ||============================== //
function ReactTable({ data, columns }) {
  const theme = useTheme();
  const [sorting, setSorting] = useState([{ id: 'name', desc: false }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: fuzzyFilter,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  });

  return (
    <MainCard content={false}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 3 }}>
        <DebouncedInput
          value={globalFilter ?? ''}
          onFilterChange={(value) => setGlobalFilter(String(value))}
          placeholder={`Search ${data.length} volunteers...`}
        />
        <Button variant="contained" startIcon={<Add />} onClick={() => useNavigate()('/add-volunteer')}>
          Add Volunteer
        </Button>
      </Stack>

      <ScrollX>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableCell key={header.id} onClick={header.column.getToggleSortingHandler()} sx={{ cursor: 'pointer' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box>{flexRender(header.column.columnDef.header, header.getContext())}</Box>
                        {header.column.getCanSort() && <HeaderSort column={header.column} />}
                      </Stack>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>

            {/* Filter Row */}
            <TableHead>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={`filter-${headerGroup.id}`}>
                  {headerGroup.headers.map((header) => (
                    <TableCell key={header.id}>
                      {header.column.getCanFilter() ? <Filter column={header.column} table={table} /> : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>

            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <EmptyReactTable />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ p: 2 }}>
          <TablePagination
            {...{
              setPageSize: table.setPageSize,
              setPageIndex: table.setPageIndex,
              getState: table.getState,
              getPageCount: table.getPageCount
            }}
          />
        </Box>
      </ScrollX>
    </MainCard>
  );
}

// ==============================|| VOLUNTEER LIST PAGE ||============================== //

export default function VolunteerListPage() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/booth-volunteers')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setVolunteers(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const navigate = useNavigate();

  const columns = useMemo(
    () => [
      {
        header: 'Name',
        accessorKey: 'name',
        cell: ({ getValue }) => <Typography variant="subtitle1">{getValue()}</Typography>,
        filterFn: fuzzyFilter,
        sortingFn: fuzzySort
      },
      {
        header: 'Role',
        accessorKey: 'role',
        cell: ({ getValue }) => <Typography>{getValue()}</Typography>,
        filterFn: fuzzyFilter,
        sortingFn: fuzzySort
      },
      {
        header: 'Phone',
        accessorKey: 'phone',
        cell: ({ getValue }) => <Typography>{getValue()}</Typography>
      },
      {
        header: 'Email',
        accessorKey: 'email',
        cell: ({ getValue }) => <Typography>{getValue()}</Typography>
      },
      {
        header: 'Booth',
        accessorKey: 'booth_id.name',
        cell: ({ row }) => <Typography>{row.original.booth_id?.name}</Typography>
      },
      {
        header: 'Party',
        accessorKey: 'party_id.name',
        cell: ({ row }) => <Typography>{row.original.party_id?.name}</Typography>
      },
      {
        header: 'Area Responsibility',
        accessorKey: 'area_responsibility',
        cell: ({ getValue }) => <Typography>{getValue()}</Typography>
      },
      {
        header: 'Remarks',
        accessorKey: 'remarks',
        cell: ({ getValue }) => <Typography>{getValue()}</Typography>
      },
      {
        header: 'Actions',
        id: 'actions',
        cell: ({ row }) => (
          <Button variant="outlined" color="primary" size="small" onClick={() => navigate(`/edit-volunteer/${row.original._id}`)}>
            Edit
          </Button>
        )
      }
    ],
    [navigate]
  );

  if (loading) return <EmptyReactTable />;
  return <ReactTable data={volunteers} columns={columns} />;
}
