import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
  Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider, TextField, MenuItem
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash, User } from 'iconsax-react';
import { useNavigate } from 'react-router-dom';

// third-party
import {
  getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
  useReactTable, flexRender
} from '@tanstack/react-table';
import { CSVLink } from 'react-csv';

// project imports
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';
import EmptyReactTable from 'pages/tables/react-table/empty';

// custom views and modals
import BoothVolunteerModal from 'pages/curd/volunteer/VolunteerModal';
import AlertBoothVolunteerDelete from 'pages/curd/volunteer/AlertVolunteerDelete';
import BoothVolunteerView from 'pages/curd/volunteer/VolunteerView';
import { Tooltip } from '@mui/material';

export default function BoothVolunteerListPage() {
  const theme = useTheme();

  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [volunteerDeleteId, setVolunteerDeleteId] = useState('');
  const [volunteers, setVolunteers] = useState([]);
  const [states, setStates] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [parliaments, setParliaments] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [booths, setBooths] = useState([]);
  const [parties, setParties] = useState([]);
  const [users, setUsers] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState({
    state_id: '',
    division_id: '',
    parliament_id: '',
    assembly_id: '',
    block_id: '',
    booth_id: ''
  });

  const fetchVolunteers = async (pageIndex, pageSize, globalFilter = '', filterParams = filters) => {
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_APP_API_URL}/booth-volunteers?page=${pageIndex + 1}&limit=${pageSize}`;
      if (globalFilter) url += `&search=${encodeURIComponent(globalFilter)}`;
      if (filterParams.state_id) url += `&state_id=${filterParams.state_id}`;
      if (filterParams.division_id) url += `&division_id=${filterParams.division_id}`;
      if (filterParams.parliament_id) url += `&parliament_id=${filterParams.parliament_id}`;
      if (filterParams.assembly_id) url += `&assembly_id=${filterParams.assembly_id}`;
      if (filterParams.block_id) url += `&block_id=${filterParams.block_id}`;
      if (filterParams.booth_id) url += `&booth_id=${filterParams.booth_id}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setVolunteers(json.data);
        setPageCount(json.pages);
      }
    } catch (error) {
      console.error('Failed to fetch booth volunteers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes, partiesRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_APP_API_URL}/states`),
        fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`),
        fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`),
        fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`),
        fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`),
        fetch(`${import.meta.env.VITE_APP_API_URL}/booths`),
        fetch(`${import.meta.env.VITE_APP_API_URL}/parties`)
      ]);

      const token = localStorage.getItem('serviceToken');

      const [usersRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_APP_API_URL}/users`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ]);

      const usersData = await usersRes.json();
      if (usersData.success) setUsers(usersData.data);

      const [statesData, divisionsData, parliamentsData, assembliesData, blocksData, boothsData, partiesData] = await Promise.all([
        statesRes.json(),
        divisionsRes.json(),
        parliamentsRes.json(),
        assembliesRes.json(),
        blocksRes.json(),
        boothsRes.json(),
        partiesRes.json()
      ]);

      if (statesData.success) setStates(statesData.data);
      if (divisionsData.success) setDivisions(divisionsData.data);
      if (parliamentsData.success) setParliaments(parliamentsData.data);
      if (assembliesData.success) setAssemblies(assembliesData.data);
      if (blocksData.success) setBlocks(blocksData.data);
      if (boothsData.success) setBooths(boothsData.data);
      if (partiesData.success) setParties(partiesData.data);
    } catch (error) {
      console.error('Failed to fetch reference data:', error);
    }
  };

  useEffect(() => {
    fetchVolunteers(pagination.pageIndex, pagination.pageSize, globalFilter);
    fetchReferenceData();
  }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

  const handleDeleteOpen = (id) => {
    setVolunteerDeleteId(id);
    setOpenDelete(true);
  };

  const handleDeleteClose = () => setOpenDelete(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const columns = useMemo(() => [
    {
      header: '#',
      accessorKey: '_id',
         cell: ({ row, table }) => {
                    const { pageIndex, pageSize } = table.getState().pagination;
                    const serialNumber = pageIndex * pageSize + row.index + 1;
                    return <Typography>{serialNumber}</Typography>;
                }
    },
    {
      header: 'Name',
      accessorKey: 'name',
      cell: ({ getValue }) => (
        <Typography sx={{
          maxWidth: 150,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {getValue()}
        </Typography>
      )
    },
    {
      header: 'Phone',
      accessorKey: 'phone',
      cell: ({ getValue }) => <Typography>{getValue()}</Typography>
    },
    {
      header: 'Email',
      accessorKey: 'email',
      cell: ({ getValue }) => (
        <Typography sx={{
          maxWidth: 150,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {getValue() || 'N/A'}
        </Typography>
      )
    },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: ({ getValue }) => (
        <Chip
          label={getValue() || 'N/A'}
          size="small"
          variant="outlined"
        />
      )
    },
    {
      header: 'Area Responsibility',
      accessorKey: 'area_responsibility',
      cell: ({ getValue }) => (
        <Typography sx={{
          maxWidth: 150,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {getValue() || 'N/A'}
        </Typography>
      )
    },
    {
      header: 'Activity Level',
      accessorKey: 'activity_level',
      cell: ({ getValue }) => (
        <Chip
          label={getValue()}
          color={
            getValue() === 'High' ? 'success' :
              getValue() === 'Medium' ? 'warning' : 'error'
          }
          size="small"
        />
      )
    },
    {
      header: 'State',
      accessorKey: 'state',
      cell: ({ getValue }) => (
        <Chip
          label={getValue()?.name || 'N/A'}
          color="primary"
          size="small"
          variant="outlined"
        />
      )
    },
    {
      header: 'Division',
      accessorKey: 'division',
      cell: ({ getValue }) => (
        <Chip
          label={getValue()?.name || 'N/A'}
          color="warning"
          size="small"
          variant="outlined"
        />
      )
    },
    {
      header: 'Parliament',
      accessorKey: 'parliament',
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
      header: 'Assembly',
      accessorKey: 'assembly',
      cell: ({ getValue }) => (
        <Chip
          label={getValue()?.name || 'N/A'}
          color="info"
          size="small"
          variant="outlined"
        />
      )
    },
    {
      header: 'Block',
      accessorKey: 'block',
      cell: ({ getValue }) => (
        <Chip
          label={getValue()?.name || 'N/A'}
          color="primary"
          size="small"
          variant="outlined"
        />
      )
    },
    {
      header: 'Booth',
      accessorKey: 'booth',
      cell: ({ getValue }) => (
        <Chip
          label={getValue() ? `${getValue().name} (${getValue().booth_number})` : 'N/A'}
          color="success"
          size="small"
          variant="outlined"
        />
      )
    },
    {
      header: 'Party',
      accessorKey: 'party',
      cell: ({ getValue }) => (
        getValue() ?
          <Chip label={getValue().name || 'N/A'} color="primary" size="small" /> :
          <Typography variant="caption">No party</Typography>
      )
    },
    {
      header: 'Remarks',
      accessorKey: 'remarks',
      cell: ({ getValue }) => (
        <Typography sx={{
          maxWidth: 150,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {getValue() || 'N/A'}
        </Typography>
      )
    },
    {
      header: 'Created By',
      accessorKey: 'created_by',
      cell: ({ getValue }) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar sx={{ width: 24, height: 24 }}>
            <User size={16} />
          </Avatar>
          <Typography>{getValue()?.username || 'Unknown'}</Typography>
        </Stack>
      )
    },
    {
      header: 'Updated By',
      accessorKey: 'updated_by',
      cell: ({ getValue }) => (
        <Typography>
          {getValue()?.username || 'N/A'}
        </Typography>
      )
    },
    {
      header: 'Created At',
      accessorKey: 'created_at',
      cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
    },
    {
      header: 'Updated At',
      accessorKey: 'updated_at',
      cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
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
                  setSelectedVolunteer(row.original);
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
    data: volunteers,
    columns,
    state: { pagination, globalFilter },
    pageCount,
    manualPagination: true,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowCanExpand: () => true
  });

  // Helper to fetch all volunteers for CSV
  const fetchAllVolunteersForCsv = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booth-volunteers?all=true`);
      const json = await res.json();
      if (json.success) {
        return json.data;
      }
    } catch (error) {
      console.error('Failed to fetch all volunteers for CSV:', error);
    }
    return [];
  };

  const [csvData, setCsvData] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const csvLinkRef = useRef();

  const handleDownloadCsv = async () => {
    setCsvLoading(true);
    const allData = await fetchAllVolunteersForCsv();
    setCsvData(allData.map(item => ({
      Name: item.name,
      Phone: item.phone,
      Email: item.email || '',
      Role: item.role || '',
      'Area Responsibility': item.area_responsibility || '',
      'Activity Level': item.activity_level,
      State: item.state?.name || '',
      Division: item.division?.name || '',
      Parliament: item.parliament?.name || '',
      Assembly: item.assembly?.name || '',
      Block: item.block?.name || '',
      Booth: item.booth ? `${item.booth.name} (${item.booth.booth_number})` : '',
      Party: item.party?.name || '',
      Remarks: item.remarks || '',
      'Created By': item.created_by?.username || '',
      'Updated By': item.updated_by?.username || '',
      'Created At': item.created_at,
      'Updated At': item.updated_at
    })));
    setCsvLoading(false);
    setTimeout(() => {
      if (csvLinkRef.current) {
        csvLinkRef.current.link.click();
      }
    }, 100);
  };

  if (loading) return <EmptyReactTable />;

  const handleFilterApply = () => {
    fetchVolunteers(pagination.pageIndex, pagination.pageSize, globalFilter, filters);
  };

  return (
    <>
      <MainCard content={false}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          sx={{ p: 2, gap: 2 }}
        >
          <DebouncedInput
            value={globalFilter}
            onFilterChange={setGlobalFilter}
            placeholder={`Search ${volunteers.length} volunteers...`}
            sx={{ width: { xs: '100%', sm: 250 } }}
          />
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            justifyContent="flex-end"
          >
            <CSVLink
              data={csvData}
              filename="booth_volunteers_all.csv"
              style={{ display: 'none' }}
              ref={csvLinkRef}
            />
            <Button
              variant="outlined"
              onClick={handleDownloadCsv}
              disabled={csvLoading}
              size="small"
            >
              {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setSelectedVolunteer(null);
                setOpenModal(true);
              }}
              size="small"
            >
              Add Volunteer
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
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                booth_id: e.target.value
              }));
            }}
            sx={{ minWidth: 150 }}
            size="small"
            disabled={!filters.block_id}
          >
            <MenuItem value="">All Booths</MenuItem>
            {booths
              .filter(booth => !filters.block_id || booth.block_id?._id === filters.block_id)
              .map((booth) => (
                <MenuItem key={booth._id} value={booth._id}>
                  {booth.name} (#{booth.booth_number})
                </MenuItem>
              ))}
          </TextField>

          <Button variant="contained" onClick={handleFilterApply} size="small">
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
              fetchVolunteers(pagination.pageIndex, pagination.pageSize, globalFilter, {
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
                          <BoothVolunteerView data={row.original} />
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

      <BoothVolunteerModal
        open={openModal}
        modalToggler={setOpenModal}
        volunteer={selectedVolunteer}
        states={states}
        divisions={divisions}
        parliaments={parliaments}
        assemblies={assemblies}
        blocks={blocks}
        booths={booths}
        parties={parties}
        users={users}
        refresh={() => fetchVolunteers(pagination.pageIndex, pagination.pageSize)}
      />

      <AlertBoothVolunteerDelete
        id={volunteerDeleteId}
        open={openDelete}
        handleClose={handleDeleteClose}
        refresh={() => fetchVolunteers(pagination.pageIndex, pagination.pageSize)}
      />
    </>
  );
}
