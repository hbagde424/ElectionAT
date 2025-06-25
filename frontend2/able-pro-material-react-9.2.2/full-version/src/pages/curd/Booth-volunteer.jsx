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
import { rankItem } from '@tanstack/match-sorter-utils';
// project import
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import EmptyReactTable from 'pages/tables/react-table/empty';
import { useNavigate } from 'react-router-dom';
import { Add } from 'iconsax-react';

// ==============================|| REACT TABLE - PRODUCT LIST ||============================== //
function fuzzyFilter(row, columnId, value) {
  return rankItem(row.getValue(columnId), value).passed;
}
function ReactTable({ data, columns }) {
  const theme = useTheme();
  const [sorting, setSorting] = useState([{ id: 'name', desc: false }]);
  const [globalFilter, setGlobalFilter] = useState('');
  const navigate = useNavigate();

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
    getPaginationRowModel: getPaginationRowModel(),
    getGlobalFilteredRowModel: true, // enable global filtering
    globalFilterFn: fuzzyFilter       // plug in the fuzzy search
  });


  return (

    <MainCard content={false}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ p: 3 }}
      >
        <DebouncedInput
          value={globalFilter ?? ''}
          onFilterChange={(value) => setGlobalFilter(String(value))}
          placeholder={`Search ${data.length} volunteers...`}
        />

        {/* ✅ Correctly placed inside the Stack */}
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/add-volunteer')}
        >
          Add Volunteer
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

// ==============================|| VOLUNTEER LIST PAGE ||============================== //

export default function VolunteerListPage() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch volunteers from API
  useEffect(() => {
    fetch('http://localhost:5000/api/booth-volunteers')
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
        header: 'Name',
        accessorKey: 'name',
        cell: ({ getValue }) => <Typography variant="subtitle1">{getValue()}</Typography>
      },
      {
        header: 'Role',
        accessorKey: 'role',
        cell: ({ getValue }) => <Typography>{getValue()}</Typography>
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
      }
    ],
    []
  );

  if (loading) return <EmptyReactTable />;

  return <ReactTable data={volunteers} columns={columns} />;
}
