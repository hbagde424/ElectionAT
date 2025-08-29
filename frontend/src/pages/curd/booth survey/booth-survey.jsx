import { useEffect, useMemo, useState, Fragment } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider, Chip, Avatar, Alert,
  TextField, MenuItem
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
  const [filters, setFilters] = useState({
    state_id: '',
    division_id: '',
    parliament_id: '',
    assembly_id: '',
    block_id: '',
    booth_id: ''
  });

  const statusColors = {
    'Pending': 'default',
    'In Progress': 'info',
    'Completed': 'primary',
    'Verified': 'success',
    'Rejected': 'error'
  };

  const fetchSurveys = async (pageIndex, pageSize, filterParams = filters) => {
    setLoading(true);
    setError('');
    try {
      let url = `${import.meta.env.VITE_APP_API_URL}/booth-surveys?page=${pageIndex + 1}&limit=${pageSize}`;
      if (filterParams.state_id) url += `&state_id=${filterParams.state_id}`;
      if (filterParams.division_id) url += `&division=${filterParams.division_id}`;
      if (filterParams.parliament_id) url += `&parliament_id=${filterParams.parliament_id}`;
      if (filterParams.assembly_id) url += `&assembly_id=${filterParams.assembly_id}`;
      if (filterParams.block_id) url += `&block_id=${filterParams.block_id}`;
      if (filterParams.booth_id) url += `&booth_id=${filterParams.booth_id}`;
      const res = await fetch(url);
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
        fetch(`${import.meta.env.VITE_APP_API_URL}/booths`),
        fetch(`${import.meta.env.VITE_APP_API_URL}/users`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch(`${import.meta.env.VITE_APP_API_URL}/states`),
        fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`),
        fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`),
        fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`),
        fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`)
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
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          sx={{ p: 2, gap: 2 }}
        >

          <DebouncedInput
            value={table.getState().globalFilter || ''}
            onFilterChange={(value) => table.setGlobalFilter(String(value))}
            placeholder={`Search ${surveys.length} booth surveys...`}
            sx={{ width: { xs: '100%', sm: 250 } }}
          />
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            justifyContent="flex-end"
          >
            <Button
              variant="outlined"
              startIcon={<DocumentDownload />}
              onClick={handleCSVDownload}
              disabled={surveys.length === 0}
              size="small"
            >
              Download All CSV

            </Button>
            <Button variant="contained"
              startIcon={<Add />}
              onClick={() => { setSelectedSurvey(null); setOpenModal(true); }}
              size="small">
              Add Survey
            </Button>
          </Stack>
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ p: 2, flexWrap: 'wrap', gap: 2 }}
        >
          <TextField
            select
            label="State"
            value={filters.state_id}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                state_id: e.target.value,
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
              }));
            }}
            sx={{ minWidth: 150 }}
            size="small"
          >
            <MenuItem value="">All States</MenuItem>
            {states.map((state) => (
              <MenuItem key={state._id} value={state._id}>
                {state.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Division"
            value={filters.division_id}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                division_id: e.target.value,
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
              }));
            }}
            sx={{ minWidth: 150 }}
            size="small"
            disabled={!filters.state_id}
          >
            <MenuItem value="">All Divisions</MenuItem>
            {divisions
              .filter(division => !filters.state_id || division.state_id?._id === filters.state_id)
              .map((division) => (
                <MenuItem key={division._id} value={division._id}>
                  {division.name}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            select
            label="Parliament"
            value={filters.parliament_id}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                parliament_id: e.target.value,
                assembly_id: '',
                block_id: '',
                booth_id: ''
              }));
            }}
            sx={{ minWidth: 150 }}
            size="small"
            disabled={!filters.division_id}
          >
            <MenuItem value="">All Parliaments</MenuItem>
            {parliaments
              .filter(parliament => !filters.division_id || parliament.division_id?._id === filters.division_id)
              .map((parliament) => (
                <MenuItem key={parliament._id} value={parliament._id}>
                  {parliament.name}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            select
            label="Assembly"
            value={filters.assembly_id}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                assembly_id: e.target.value,
                block_id: '',
                booth_id: ''
              }));
            }}
            sx={{ minWidth: 150 }}
            size="small"
            disabled={!filters.parliament_id}
          >
            <MenuItem value="">All Assemblies</MenuItem>
            {assemblies
              .filter(assembly => !filters.parliament_id || assembly.parliament_id?._id === filters.parliament_id)
              .map((assembly) => (
                <MenuItem key={assembly._id} value={assembly._id}>
                  {assembly.name}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            select
            label="Block"
            value={filters.block_id}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                block_id: e.target.value,
                booth_id: ''
              }));
            }}
            sx={{ minWidth: 150 }}
            size="small"
            disabled={!filters.assembly_id}
          >
            <MenuItem value="">All Blocks</MenuItem>
            {blocks
              .filter(block => !filters.assembly_id || block.assembly_id?._id === filters.assembly_id)
              .map((block) => (
                <MenuItem key={block._id} value={block._id}>
                  {block.name}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            select
            label="Booth"
            value={filters.booth_id}
            onChange={(e) => setFilters(prev => ({ ...prev, booth_id: e.target.value }))}
            sx={{ minWidth: 150 }}
            size="small"
            disabled={!filters.block_id}
          >
            <MenuItem value="">All Booths</MenuItem>
            {booths
              .filter(booth => !filters.block_id || booth.block_id?._id === filters.block_id)
              .map((booth) => (
                <MenuItem key={booth._id} value={booth._id}>
                  {booth.name}
                </MenuItem>
              ))}
          </TextField>

          <Button
            variant="contained"
            onClick={() => fetchSurveys(pagination.pageIndex, pagination.pageSize, filters)}
            size="small"
          >
            Apply
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setFilters({
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
              });
              fetchSurveys(pagination.pageIndex, pagination.pageSize, {
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
              });
            }}
            size="small"
          >
            Clear
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
