import { useEffect, useMemo, useState, Fragment } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider, Chip, Avatar, Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash, User, CalendarTick, DocumentDownload, MessageText1 } from 'iconsax-react';

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
  const [error, setError] = useState('');

  const statusColors = {
    'Pending': 'default',
    'In Progress': 'info',
    'Completed': 'primary',
    'Verified': 'success',
    'Rejected': 'error'
  };

  const fetchSurveys = async (pageIndex, pageSize) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:5000/api/booth-surveys?page=${pageIndex + 1}&limit=${pageSize}`);
      const json = await res.json();
      if (json.success) {
        setSurveys(json.data);
        setPageCount(json.pages);
      } else {
        setError('Failed to fetch booth surveys');
      }
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
      setError('Failed to fetch booth surveys');
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

  const handleCSVDownload = () => {
    if (surveys.length === 0) return;

    const headers = [
      'Survey ID',
      'Booth',
      'Surveyor',
      'Survey Date',
      'Status',
      'Remark',
      'Poll Result',
      'State',
      'Division',
      'Parliament',
      'Assembly',
      'Block',
      'Created By',
      'Updated By',
      'Created At',
      'Updated At'
    ];

    const csvData = surveys.map(survey => [
      survey._id?.slice(-8) || '',
      survey.booth_id?.name || 'No booth',
      survey.survey_done_by?.email || 'Unknown',
      survey.survey_date ? new Date(survey.survey_date).toLocaleDateString() : '',
      survey.status || '',
      survey.remark || '',
      survey.poll_result || '',
      survey.state_id?.name || '',
      survey.division_id?.name || '',
      survey.parliament_id?.name || '',
      survey.assembly_id?.name || '',
      survey.block_id?.name || '',
      survey.created_by?.username || '',
      survey.updated_by?.username || '',
      survey.created_at ? new Date(survey.created_at).toLocaleString() : '',
      survey.updated_at ? new Date(survey.updated_at).toLocaleString() : ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `booth-surveys-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const columns = useMemo(() => [
    {
      header: '#',
      accessorKey: '_id',
      cell: ({ row }) => <Typography variant="body2" color="text.secondary">{row.index + 1}</Typography>
    },
    {
      header: 'Survey ID',
      accessorKey: '_id',
      cell: ({ getValue }) => (
        <Typography variant="body2" fontWeight="medium" color="primary.main">
          {getValue()?.slice(-8)}
        </Typography>
      )
    },
    {
      header: 'Booth',
      accessorKey: 'booth_id',
      cell: ({ getValue }) => (
        getValue() ?
          <Box>
            <Typography variant="body2" fontWeight="medium">{getValue().name}</Typography>
            <Typography variant="caption" color="text.secondary">Booth: {getValue().booth_number}</Typography>
          </Box> :
          <Typography variant="caption" color="text.secondary">No booth assigned</Typography>
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
          <Box>
            <Typography variant="body2" fontWeight="medium">{getValue()?.email || 'Unknown'}</Typography>
            <Typography variant="caption" color="text.secondary">Surveyor</Typography>
          </Box>
        </Stack>
      )
    },
    {
      header: 'Survey Date',
      accessorKey: 'survey_date',
      cell: ({ getValue }) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <CalendarTick size={14} />
          <Typography variant="body2">{new Date(getValue()).toLocaleDateString()}</Typography>
        </Stack>
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
      header: 'Remark',
      accessorKey: 'remark',
      cell: ({ getValue }) => {
        const remark = getValue();
        return (
          <Typography
            variant="body2"
            sx={{
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {remark || 'No remark'}
          </Typography>
        );
      }
    },
    {
      header: 'Poll Result',
      accessorKey: 'poll_result',
      cell: ({ getValue }) => {
        const pollResult = getValue();
        return (
          <Typography
            variant="body2"
            sx={{
              maxWidth: 250,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'info.main'
            }}
          >
            {pollResult || 'No poll result'}
          </Typography>
        );
      }
    },
    {
      header: 'State',
      accessorKey: 'state_id',
      cell: ({ getValue }) => (
        getValue() ?
          <Chip label={getValue().name} color="secondary" size="small" variant="outlined" /> :
          <Typography variant="caption" color="text.secondary">No state</Typography>
      )
    },
    {
      header: 'Division',
      accessorKey: 'division_id',
      cell: ({ getValue }) => (
        getValue() ?
          <Chip label={getValue().name} color="info" size="small" variant="outlined" /> :
          <Typography variant="caption" color="text.secondary">No division</Typography>
      )
    },
    {
      header: 'Parliament',
      accessorKey: 'parliament_id',
      cell: ({ getValue }) => (
        getValue() ?
          <Chip label={getValue().name} color="warning" size="small" variant="outlined" /> :
          <Typography variant="caption" color="text.secondary">No parliament</Typography>
      )
    },
    {
      header: 'Assembly',
      accessorKey: 'assembly_id',
      cell: ({ getValue }) => (
        getValue() ?
          <Chip label={getValue().name} color="success" size="small" variant="outlined" /> :
          <Typography variant="caption" color="text.secondary">No assembly</Typography>
      )
    },
    {
      header: 'Block',
      accessorKey: 'block_id',
      cell: ({ getValue }) => (
        getValue() ?
          <Chip label={getValue().name} color="error" size="small" variant="outlined" /> :
          <Typography variant="caption" color="text.secondary">No block</Typography>
      )
    },
    {
      header: 'Created By',
      accessorKey: 'created_by',
      cell: ({ getValue }) => {
        const createdBy = getValue();
        return (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <User size={14} />
            <Typography variant="caption">{createdBy?.username || 'Unknown'}</Typography>
          </Stack>
        );
      }
    },
    {
      header: 'Updated By',
      accessorKey: 'updated_by',
      cell: ({ getValue }) => {
        const updatedBy = getValue();
        return (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <User size={14} />
            <Typography variant="caption">{updatedBy?.username || 'Unknown'}</Typography>
          </Stack>
        );
      }
    },
    {
      header: 'Created At',
      accessorKey: 'created_at',
      cell: ({ getValue }) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <CalendarTick size={14} />
          <Typography variant="caption">{formatDateTime(getValue())}</Typography>
        </Stack>
      )
    },
    {
      header: 'Updated At',
      accessorKey: 'updated_at',
      cell: ({ getValue }) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <CalendarTick size={14} />
          <Typography variant="caption">{formatDateTime(getValue())}</Typography>
        </Stack>
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
            <Tooltip title="View Details">
              <IconButton color="secondary" onClick={row.getToggleExpandedHandler()}>
                {expandIcon}
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Survey">
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
            <Tooltip title="Delete Survey">
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
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
          <DebouncedInput
            value={table.getState().globalFilter || ''}
            onFilterChange={(value) => table.setGlobalFilter(String(value))}
            placeholder={`Search ${surveys.length} booth surveys...`}
          />
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<DocumentDownload />}
              onClick={handleCSVDownload}
              disabled={surveys.length === 0}
            >
              Export CSV
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedSurvey(null); setOpenModal(true); }}>
              Add Survey
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