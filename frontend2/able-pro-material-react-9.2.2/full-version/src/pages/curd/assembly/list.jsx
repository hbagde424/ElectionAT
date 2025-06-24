import { useEffect, useMemo, useState } from 'react';
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
  Chip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table';
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import EmptyReactTable from 'pages/tables/react-table/empty';

function ReactTable({ data, columns }) {
  const theme = useTheme();
  const [sorting, setSorting] = useState([{ id: 'name', desc: false }]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <MainCard content={false}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 3 }}>
        <DebouncedInput
          value={globalFilter ?? ''}
          onFilterChange={(value) => setGlobalFilter(String(value))}
          placeholder={`Search ${data.length} assemblies...`}
        />
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
                      className="cursor-pointer prevent-select"
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
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))}
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

export default function AssemblyListPage() {
  const [assemblies, setAssemblies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/assemblies?populate=state_id,district_id,division_id,parliament_id')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAssemblies(data.data || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const columns = useMemo(
    () => [
      {
        header: 'S. No.',
        id: 'serial', // unique id for the column
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex;
          const pageSize = table.getState().pagination.pageSize;
          return <Typography>{pageIndex * pageSize + row.index + 1}</Typography>;
        }
      },
      {
        header: 'Name',
        accessorKey: 'name',
        cell: ({ getValue }) => <Typography variant="subtitle1">{getValue()}</Typography>
      },
      {
        header: 'Type',
        accessorKey: 'type',
        cell: ({ getValue }) => (
          <Chip
            label={getValue()}
            color={
              getValue() === 'Urban' ? 'primary' :
                getValue() === 'Rural' ? 'secondary' : 'default'
            }
          />
        )
      },
      {
        header: 'Category',
        accessorKey: 'category',
        cell: ({ getValue }) => (
          <Chip
            label={getValue()}
            variant="outlined"
            color={
              getValue() === 'General' ? 'success' :
                getValue() === 'Reserved' ? 'warning' : 'error'
            }
          />
        )
      },
      {
        header: 'State',
        accessorKey: 'state_id.name',
        cell: ({ row }) => <Typography>{row.original.state_id?.name}</Typography>
      },
      {
        header: 'District',
        accessorKey: 'district_id.name',
        cell: ({ row }) => <Typography>{row.original.district_id?.name}</Typography>
      },
      {
        header: 'Division',
        accessorKey: 'division_id.name',
        cell: ({ row }) => <Typography>{row.original.division_id?.name}</Typography>
      },
      {
        header: 'Parliament',
        accessorKey: 'parliament_id.name',
        cell: ({ row }) => <Typography>{row.original.parliament_id?.name}</Typography>
      },
      {
        header: 'Created At',
        accessorKey: 'created_at',
        cell: ({ getValue }) => (
          <Typography>
            {new Date(getValue()).toLocaleDateString()}
          </Typography>
        )
      },
      {
        header: 'Actions',
        accessorKey: '_id',
        cell: ({ getValue }) => (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" size="small">
              Edit
            </Button>
            <Button variant="outlined" color="error" size="small">
              Delete
            </Button>
          </Stack>
        )
      }
    ],
    []
  );

  if (loading) return <EmptyReactTable />;

  return <ReactTable data={assemblies} columns={columns} />;
}