import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, Stack, Typography, Box, Tooltip, Divider, Chip, Avatar, Grid,
    IconButton, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import {
    getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
    useReactTable, flexRender
} from '@tanstack/react-table';
import { CSVLink } from 'react-csv';
import { Add, Edit, Trash, Eye } from 'iconsax-react';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import ScrollX from 'components/ScrollX';
import MainCard from 'components/MainCard';
import EmptyReactTable from 'pages/tables/react-table/empty';
import VisitModal from './VisitModal';
import VisitView from './VisitView';
import AlertVisitDelete from './AlertVisitDelete';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';

// Map components
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';

const mapConfiguration = {
    mapboxAccessToken: import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN,
    minZoom: 1
};

const MAPBOX_THEMES = {
    light: 'mapbox://styles/mapbox/light-v10',
    dark: 'mapbox://styles/mapbox/dark-v10',
    streets: 'mapbox://styles/mapbox/streets-v11',
    outdoors: 'mapbox://styles/mapbox/outdoors-v11',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v11'
};

const VisitListPage = () => {
    const theme = useTheme();
    const [visits, setVisits] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState({ open: false, id: null });
    const [globalFilter, setGlobalFilter] = useState('');
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [candidates, setCandidates] = useState([]);

    // Map state
    const [mapVisits, setMapVisits] = useState([]);
    const [popupInfo, setPopupInfo] = useState(null);
    const [selectedTheme, setSelectedTheme] = useState('streets');
    const [routeData, setRouteData] = useState(null);
    const [selectedCandidate, setSelectedCandidate] = useState('');
    const mapRef = useRef(null);

    // CSV functionality
    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const fetchVisits = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            const query = globalFilter ? `&search=${encodeURIComponent(globalFilter)}` : '';
            const res = await fetch(`http://localhost:5000/api/visits?page=${pageIndex + 1}&limit=${pageSize}${query}`);
            const json = await res.json();
            if (json.success) {
                setVisits(json.data);
                setPageCount(json.pages);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMapVisits = async (candidateId = null) => {
        try {
            const url = candidateId
                ? `http://localhost:5000/api/visits?all=true&candidate=${candidateId}`
                : 'http://localhost:5000/api/visits?all=true';

            const res = await fetch(url);
            const json = await res.json();
            if (json.success) {
                const visitsWithCoords = json.data.filter(v => v.latitude && v.longitude);
                setMapVisits(visitsWithCoords);

                if (visitsWithCoords.length > 1) {
                    const coordinates = visitsWithCoords.map(v => [v.longitude, v.latitude]);
                    setRouteData({
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: coordinates
                        }
                    });
                } else {
                    setRouteData(null);
                }

                // Center map on first visit if available
                if (visitsWithCoords.length > 0 && mapRef.current) {
                    mapRef.current.flyTo({
                        center: [visitsWithCoords[0].longitude, visitsWithCoords[0].latitude],
                        zoom: 12
                    });
                }
            }
        } catch (error) {
            console.error('Error loading visit data:', error);
        }
    };

    // Add this function right before the return statement in your component
    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        try {
            const url = selectedCandidate
                ? `http://localhost:5000/api/visits?all=true&candidate=${selectedCandidate}`
                : 'http://localhost:5000/api/visits?all=true';

            const res = await fetch(url);
            const json = await res.json();

            if (json.success) {
                const csvData = json.data.map(item => ({
                    'Candidate': item.candidate_id?.name || '',
                    'Post': item.post || '',
                    'Date': formatDate(item.date),
                    'Status': item.work_status || '',
                    'State': item.state_id?.name || '',
                    'Division': item.division_id?.name || '',
                    'Assembly': item.assembly_id?.name || '',
                    'Parliament': item.parliament_id?.name || '',
                    'Block': item.block_id?.name || '',
                    'Booth': item.booth_id?.name || '',
                    'Location': item.locationName || '',
                    'Coordinates': item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : '',
                    'Declaration': item.declaration || '',
                    'Remark': item.remark || '',
                    'Created At': item.created_at,
                    'Updated At': item.updated_at
                }));

                setCsvData(csvData);
                setTimeout(() => {
                    if (csvLinkRef.current) {
                        csvLinkRef.current.link.click();
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Failed to generate CSV:', error);
        } finally {
            setCsvLoading(false);
        }
    };

    const fetchReferenceData = async () => {
        try {
            const [
                statesRes, divisionsRes, parliamentsRes,
                assembliesRes, blocksRes, boothsRes,
                candidatesRes
            ] = await Promise.all([
                fetch('http://localhost:5000/api/states'),
                fetch('http://localhost:5000/api/divisions'),
                fetch('http://localhost:5000/api/parliaments'),
                fetch('http://localhost:5000/api/assemblies'),
                fetch('http://localhost:5000/api/blocks'),
                fetch('http://localhost:5000/api/booths'),
                fetch('http://localhost:5000/api/candidates')
            ]);

            const [
                statesData, divisionsData, parliamentsData,
                assembliesData, blocksData, boothsData,
                candidatesData
            ] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                boothsRes.json(),
                candidatesRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (blocksData.success) setBlocks(blocksData.data);
            if (boothsData.success) setBooths(boothsData.data);
            if (candidatesData.success) setCandidates(candidatesData.data);
        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    useEffect(() => {
        fetchVisits(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchMapVisits(selectedCandidate || null);
        fetchReferenceData();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, selectedCandidate]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    const workStatusColor = {
        'announced': 'default',
        'approved': 'info',
        'in progress': 'warning',
        'complete': 'success'
    };

    const handleCandidateChange = (event) => {
        setSelectedCandidate(event.target.value);
    };

    const handleMarkerClick = (visit) => {
        setPopupInfo({
            longitude: visit.longitude,
            latitude: visit.latitude,
            visit: visit
        });
    };

    const handleThemeChange = (theme) => {
        setSelectedTheme(theme);
    };

    const columns = useMemo(() => [
        {
            header: '#',
            accessorKey: '_id',
            cell: ({ row }) => <Typography>{row.index + 1}</Typography>
        },
        {
            header: 'Candidate',
            accessorKey: 'candidate_id',
            cell: ({ getValue }) => (
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                        src={getValue()?.photo}
                        sx={{ width: 32, height: 32 }}
                    />
                    <Typography fontWeight="medium">
                        {getValue()?.name || 'N/A'}
                    </Typography>
                </Stack>
            )
        },
        {
            header: 'Post',
            accessorKey: 'post',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Date',
            accessorKey: 'date',
            cell: ({ getValue }) => (
                <Typography>
                    {formatDate(getValue())}
                </Typography>
            )
        },
        {
            header: 'Status',
            accessorKey: 'work_status',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.toUpperCase() || 'N/A'}
                    color={workStatusColor[getValue()] || 'default'}
                    size="small"
                />
            )
        },
        {
            header: 'Booth',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.name || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Location',
            accessorKey: 'locationName',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Actions',
            meta: { className: 'cell-center' },
            cell: ({ row }) => {
                const isExpanded = row.getIsExpanded();
                const expandIcon = isExpanded
                    ? <Add style={{ transform: 'rotate(45deg)', color: theme.palette.error.main }} />
                    : <Eye />;
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <Tooltip title="View">
                            <IconButton color="secondary" onClick={row.getToggleExpandedHandler()}>
                                {expandIcon}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton color="primary" onClick={(e) => {
                                e.stopPropagation();
                                setEditData(row.original);
                                setOpenModal(true);
                            }}>
                                <Edit />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton color="error" onClick={(e) => {
                                e.stopPropagation();
                                setDeleteAlert({ open: true, id: row.original._id });
                            }}>
                                <Trash />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                );
            }
        }
    ], [theme]);

    const table = useReactTable({
        data: visits,
        columns,
        state: { pagination, globalFilter },
        pageCount,
        manualPagination: true,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getRowCanExpand: () => true
    });

    if (loading) return <EmptyReactTable />;

    return (
        <>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <MainCard
                        title="Visit Locations Map"
                        secondary={
                            <FormControl sx={{ minWidth: 200 }} size="small">
                                <InputLabel id="candidate-select-label">Filter by Candidate</InputLabel>
                                <Select
                                    labelId="candidate-select-label"
                                    value={selectedCandidate}
                                    onChange={handleCandidateChange}
                                    label="Filter by Candidate"
                                >
                                    <MenuItem value="">
                                        <em>All Candidates</em>
                                    </MenuItem>
                                    {candidates.map((candidate) => (
                                        <MenuItem key={candidate._id} value={candidate._id}>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Avatar src={candidate.photo} sx={{ width: 24, height: 24 }} />
                                                <Typography>{candidate.name}</Typography>
                                            </Stack>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        }
                    >
                        <MapContainerStyled>
                            <Map
  ref={mapRef}
  initialViewState={{
    latitude: 23.4707,
    longitude: 77.9455,
    zoom: 6
  }}
  mapStyle={MAPBOX_THEMES[selectedTheme]}
  mapboxAccessToken={mapConfiguration.mapboxAccessToken}
>
  <MapControl />

  {/* Route line (optional) */}
  {routeData && (
    <Source id="route" type="geojson" data={routeData}>
      <Layer
        id="route-line"
        type="line"
        paint={{
          'line-color': theme.palette.primary.main,
          'line-width': 2
        }}
      />
    </Source>
  )}

  {/* Marker for each visit */}
  {mapVisits.map((visit, idx) => (
    <Marker
      key={idx}
      longitude={visit.longitude}
      latitude={visit.latitude}
      anchor="bottom"
      onClick={() => {
        setPopupInfo({
          longitude: visit.longitude,
          latitude: visit.latitude,
          visit: visit
        });
      }}
    >
      <Avatar
        src={visit.candidate_id?.photo}
        sx={{
          width: 32,
          height: 32,
          border: `2px solid ${theme.palette.primary.main}`,
          cursor: 'pointer'
        }}
      />
    </Marker>
  ))}

  {/* Popup when a marker is clicked */}
  {popupInfo && (
    <Popup
      longitude={popupInfo.longitude}
      latitude={popupInfo.latitude}
      closeButton={true}
      anchor="bottom"
      onClose={() => setPopupInfo(null)}
    >
      <Box sx={{ p: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar src={popupInfo.visit.candidate_id?.photo} sx={{ width: 48, height: 48 }} />
          <Box>
            <Typography fontWeight="bold">{popupInfo.visit.candidate_id?.name}</Typography>
            <Typography variant="body2" color="text.secondary">{popupInfo.visit.post || 'N/A'}</Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 1 }} />

        <Typography variant="body2"><strong>📅 Visit Date:</strong> {formatDate(popupInfo.visit.date)}</Typography>
        <Typography variant="body2"><strong>📍 Location:</strong> {popupInfo.visit.locationName || 'N/A'}</Typography>
        <Typography variant="body2"><strong>📌 Booth:</strong> {popupInfo.visit.booth_id?.name || 'N/A'}</Typography>
        <Typography variant="body2"><strong>🔄 Status:</strong> 
          <Chip
            label={popupInfo.visit.work_status?.toUpperCase() || 'N/A'}
            size="small"
            sx={{
              ml: 1,
              backgroundColor: workStatusColor[popupInfo.visit.work_status] || theme.palette.grey[400],
              color: 'white'
            }}
          />
        </Typography>
        {popupInfo.visit.declaration && (
          <Typography variant="body2"><strong>🗒️ Declaration:</strong> {popupInfo.visit.declaration}</Typography>
        )}
        {popupInfo.visit.remark && (
          <Typography variant="body2"><strong>📝 Remark:</strong> {popupInfo.visit.remark}</Typography>
        )}
        <Typography variant="caption"><strong>🌐 Coordinates:</strong> {popupInfo.visit.latitude?.toFixed(4)}, {popupInfo.visit.longitude?.toFixed(4)}</Typography>
      </Box>
    </Popup>
  )}
</Map>


                            <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}>
                                <select
                                    value={selectedTheme}
                                    onChange={(e) => handleThemeChange(e.target.value)}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: `1px solid ${theme.palette.divider}`,
                                        backgroundColor: theme.palette.background.paper,
                                        color: theme.palette.text.primary
                                    }}
                                >
                                    {Object.keys(MAPBOX_THEMES).map((theme) => (
                                        <option key={theme} value={theme}>
                                            {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </Box>

                            <Box sx={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1 }}>
                                <Button
                                    variant="contained"
                                    onClick={() => fetchMapVisits(selectedCandidate || null)}
                                    size="small"
                                >
                                    Refresh Map Data
                                </Button>
                            </Box>
                        </MapContainerStyled>
                    </MainCard>
                </Grid>

                <Grid item xs={12}>
                    <MainCard content={false}>
                        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
                            <DebouncedInput
                                value={globalFilter}
                                onFilterChange={setGlobalFilter}
                                placeholder={`Search ${visits.length} records...`}
                            />
                            <Stack direction="row" spacing={1}>
                                <CSVLink
                                    data={csvData}
                                    filename="visits_all.csv"
                                    style={{ display: 'none' }}
                                    ref={csvLinkRef}
                                />
                                <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                                    {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                                </Button>
                                <Button variant="contained" startIcon={<Add />} onClick={() => { setEditData(null); setOpenModal(true); }}>
                                    Add Visit
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
                                                            <VisitView data={row.original} />
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
                </Grid>
            </Grid>

            <VisitModal
                open={openModal}
                modalToggler={setOpenModal}
                visit={editData}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                candidates={candidates}
                refresh={() => {
                    fetchVisits(pagination.pageIndex, pagination.pageSize);
                    fetchMapVisits(selectedCandidate || null);
                }}
            />
            <AlertVisitDelete
                open={deleteAlert.open}
                handleClose={() => setDeleteAlert({ open: false, id: null })}
                id={deleteAlert.id}
                refresh={() => {
                    fetchVisits(pagination.pageIndex, pagination.pageSize);
                    fetchMapVisits(selectedCandidate || null);
                }}
            />
        </>
    );
};

export default VisitListPage;