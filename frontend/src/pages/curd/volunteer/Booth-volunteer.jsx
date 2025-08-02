import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
  Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider
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

  const fetchVolunteers = async (pageIndex, pageSize, globalFilter = '') => {
    setLoading(true);
    try {
      const query = globalFilter ? `&search=${encodeURIComponent(globalFilter)}` : '';
      const res = await fetch(`http://localhost:5000/api/booth-volunteers?page=${pageIndex + 1}&limit=${pageSize}${query}`);
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
        fetch('http://localhost:5000/api/states'),
        fetch('http://localhost:5000/api/divisions'),
        fetch('http://localhost:5000/api/parliaments'),
        fetch('http://localhost:5000/api/assemblies'),
        fetch('http://localhost:5000/api/blocks'),
        fetch('http://localhost:5000/api/booths'),
        fetch('http://localhost:5000/api/parties')
      ]);

      const token = localStorage.getItem('serviceToken');

      const [usersRes] = await Promise.all([
        fetch('http://localhost:5000/api/users', {
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
      cell: ({ row }) => <Typography>{row.index + 1}</Typography>
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
      const res = await fetch('http://localhost:5000/api/booth-volunteers?all=true');
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

  return (
    <>
      <MainCard content={false}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
          <DebouncedInput
            value={globalFilter}
            onFilterChange={setGlobalFilter}
            placeholder={`Search ${volunteers.length} volunteers...`}
          />
          <Stack direction="row" spacing={1}>
            <CSVLink
              data={csvData}
              filename="booth_volunteers_all.csv"
              style={{ display: 'none' }}
              ref={csvLinkRef}
            />
            <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
              {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedVolunteer(null); setOpenModal(true); }}>
              Add Volunteer
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