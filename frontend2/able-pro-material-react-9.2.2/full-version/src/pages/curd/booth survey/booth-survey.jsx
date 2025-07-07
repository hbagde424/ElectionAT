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
import BoothSurveyModal from 'pages/curd/booth survey/SurveyModal';
import AlertBoothSurveyDelete from 'pages/curd/booth survey/AlertSurveyDelete';
import BoothSurveyView from 'pages/curd/booth survey/SurveyView';
import { Tooltip } from '@mui/material';

export default function BoothSurveyListPage() {
  const theme = useTheme();
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [surveyDeleteId, setSurveyDeleteId] = useState('');
  const [surveys, setSurveys] = useState([]);
  const [booths, setBooths] = useState([]);
  const [users, setUsers] = useState([]);
  const [states, setStates] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [parliaments, setParliaments] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const statusColors = {
    'Pending': 'default',
    'In Progress': 'info',
    'Completed': 'primary',
    'Verified': 'success',
    'Rejected': 'error'
  };

  const fetchSurveys = async (pageIndex, pageSize) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/booth-surveys?page=${pageIndex + 1}&limit=${pageSize}`);
      const json = await res.json();
      if (json.success) {
        setSurveys(json.data);
        setPageCount(json.pages);
      }
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const token = localStorage.getItem('serviceToken');
      const [boothsRes, usersRes, statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes] = await Promise.all([
        fetch('http://localhost:5000/api/booths'),
        fetch('http://localhost:5000/api/users', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch('http://localhost:5000/api/states'),
        fetch('http://localhost:5000/api/divisions'),
        fetch('http://localhost:5000/api/parliaments'),
        fetch('http://localhost:5000/api/assemblies'),
        fetch('http://localhost:5000/api/blocks')
      ]);

      const boothsJson = await boothsRes.json();
      const usersJson = await usersRes.json();
      const statesJson = await statesRes.json();
      const divisionsJson = await divisionsRes.json();
      const parliamentsJson = await parliamentsRes.json();
      const assembliesJson = await assembliesRes.json();
      const blocksJson = await blocksRes.json();

      if (boothsJson.success) setBooths(boothsJson.data);
      if (usersJson.success) setUsers(usersJson.data);
      if (statesJson.success) setStates(statesJson.data);
      if (divisionsJson.success) setDivisions(divisionsJson.data);
      if (parliamentsJson.success) setParliaments(parliamentsJson.data);
      if (assembliesJson.success) setAssemblies(assembliesJson.data);
      if (blocksJson.success) setBlocks(blocksJson.data);
    } catch (error) {
      console.error('Failed to fetch reference data:', error);
    }
  };

  useEffect(() => {
    fetchSurveys(pagination.pageIndex, pagination.pageSize);
    fetchReferenceData();
  }, [pagination.pageIndex, pagination.pageSize]);

  const handleDeleteOpen = (id) => {
    setSurveyDeleteId(id);
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
      header: 'Booth',
      accessorKey: 'booth_id',
      cell: ({ getValue }) => (
        getValue() ?
          <Typography variant="subtitle1">{getValue().name} (Booth: {getValue().booth_number})</Typography> :
          <Typography variant="caption">No booth</Typography>
      )
    },
    {
      header: 'Surveyor',
      accessorKey: 'survey_done_by',
      cell: ({ getValue }) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar sx={{ width: 24, height: 24 }}>
            <User size={16} />
          </Avatar>
          <Typography>{getValue()?.name || 'Unknown'}</Typography>
        </Stack>
      )
    },
    {
      header: 'Survey Date',
      accessorKey: 'survey_date',
      cell: ({ getValue }) => (
        <Typography>{new Date(getValue()).toLocaleDateString()}</Typography>
      )
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
      header: 'State',
      accessorKey: 'state_id',
      cell: ({ getValue }) => (
        <Chip
          label={getValue()?.name || 'N/A'}
          color="secondary"
          size="small"
          variant="outlined"
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
                  setSelectedSurvey(row.original);
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
    data: surveys,
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
            placeholder={`Search ${surveys.length} surveys...`}
          />
          <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedSurvey(null); setOpenModal(true); }}>
            Add Survey
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
                          <BoothSurveyView data={row.original} />
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

      <BoothSurveyModal
        open={openModal}
        modalToggler={setOpenModal}
        survey={selectedSurvey}
        booths={booths}
        users={users}
        states={states}
        divisions={divisions}
        parliaments={parliaments}
        assemblies={assemblies}
        blocks={blocks}
        refresh={() => fetchSurveys(pagination.pageIndex, pagination.pageSize)}
      />

      <AlertBoothSurveyDelete
        id={surveyDeleteId}
        open={openDelete}
        handleClose={handleDeleteClose}
        refresh={() => fetchSurveys(pagination.pageIndex, pagination.pageSize)}
      />
    </>
  );
}