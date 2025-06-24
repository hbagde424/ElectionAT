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
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

// third-party
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable
} from '@tanstack/react-table';

// project import
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import EmptyReactTable from 'pages/tables/react-table/empty';

// ==============================|| REACT TABLE - PRODUCT LIST ||============================== //

function ReactTable({ data, columns }) {
  const theme = useTheme();
  const [sorting, setSorting] = useState([]); // Removed initial sorting to prevent potential issues
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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false, // Add this to prevent page reset on sorting
    debugTable: true // Optional: helps with debugging
  });

  return (
    <MainCard content={false}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 3 }}>
        <DebouncedInput
          value={globalFilter ?? ''}
          onFilterChange={(value) => setGlobalFilter(String(value))}
          placeholder={`Search ${data.length} volunteers...`}
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
            {table.getRowModel().rows.length > 0 ? (
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            ) : (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    No records found
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>
        </TableContainer>

        <Box sx={{ p: 2 }}>
          <TablePagination
            {...{
              setPageSize: table.setPageSize,
              setPageIndex: table.setPageIndex,
              getState: table.getState,
              getPageCount: table.getPageCount,
              getRowModel: table.getRowModel
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

  // Fetch volunteers from API
  useEffect(() => {
    fetch('http://localhost:5000/api/states') // Note: Typo here - should be 'states'?
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setVolunteers(data.data || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const columns = useMemo(
    () => [
      {
        header: 'S. No.',
        id: 'serial',
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex;
          const pageSize = table.getState().pagination.pageSize;
          return <Typography>{pageIndex * pageSize + row.index + 1}</Typography>;
        },
        enableSorting: false // Disable sorting for serial number column
      },
      {
        header: 'Name',
        accessorKey: 'name',
        cell: ({ getValue }) => <Typography variant="subtitle1">{getValue()}</Typography>,
        enableSorting: true // Explicitly enable sorting for name column
      }
    ],
    []
  );

  if (loading) return <EmptyReactTable />;

  return <ReactTable data={volunteers} columns={columns} />;
}