import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Drawer, Alert, MenuItem, TextField, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash } from 'iconsax-react';
import {
    getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
    useReactTable, flexRender
} from '@tanstack/react-table';
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';
import EmptyReactTable from 'pages/tables/react-table/empty';
import { CSVLink } from 'react-csv';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import { usePermissions } from 'contexts/PermissionContext';

import StateModal from './StateModal';
import AlertStateDelete from './AlertStateDelete';
import StateView from './StateView';
import StatePolygonUpload from './StatePolygonUpload';
import { useCsvOtp } from 'hooks/useCsvOtp';

export default function StatesListPage() {
    const theme = useTheme();
    const { userHierarchy } = usePermissions();

    const [selectedState, setSelectedState] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [stateDeleteId, setStateDeleteId] = useState('');
    const [states, setStates] = useState([]);
    const [users, setUsers] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [openPolygonUpload, setOpenPolygonUpload] = useState(false);

    // Map & Drawer state
    const [stateGeoJSON, setStateGeoJSON] = useState(null);
    const [allStateGeoJSON, setAllStateGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = {};
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/users`, { headers });
            const json = await res.json();
            if (json.success) setUsers(json.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const fetchStates = async (pageIndex, pageSize, searchTerm = '') => {
        setLoading(true);
        try {
            // Always fetch all states first to apply hierarchy filter correctly
            const query = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
            const token = localStorage.getItem('serviceToken');
            const headers = {};
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/states?page=1&limit=10000${query}`, { headers });
            const json = await res.json();
            if (json.success) {
                // Filter states based on user hierarchy
                let filteredStates = json.data;
                if (userHierarchy?.state) {
                    // User has state-level access - show only their state
                    filteredStates = json.data.filter(s => String(s._id) === String(userHierarchy.state._id || userHierarchy.state));
                }
                // If no hierarchy, show all states (superAdmin)

                // Now apply pagination to filtered data
                const totalCount = filteredStates.length;
                const calculatedPages = Math.ceil(totalCount / pageSize);
                const startIndex = pageIndex * pageSize;
                const endIndex = startIndex + pageSize;
                const paginatedStates = filteredStates.slice(startIndex, endIndex);

                setStates(paginatedStates);
                setPageCount(calculatedPages);
            }
        } catch (error) {
            console.error('Failed to fetch states:', error);
            setStates([]);
            setPageCount(0);
        } finally {
            setLoading(false);
        }
    };

    const debouncedFetchStates = useRef(null);

    useEffect(() => {
        // Clear any existing timeout
        if (debouncedFetchStates.current) {
            clearTimeout(debouncedFetchStates.current);
        }

        // Set a new timeout
        debouncedFetchStates.current = setTimeout(() => {
            fetchStates(pagination.pageIndex, pagination.pageSize, globalFilter);
        }, 300); // Wait for 300ms after the user stops typing

        // Cleanup
        return () => {
            if (debouncedFetchStates.current) {
                clearTimeout(debouncedFetchStates.current);
            }
        };
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, userHierarchy]);

    // keep local input synced with globalFilter
    useEffect(() => {
        setSearchInput(globalFilter || '');
    }, [globalFilter]);

    useEffect(() => {
        fetchUsers();
    }, []);

    // Load state polygons from states table - filtered by user hierarchy
    useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem('serviceToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                
                const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/states?limit=10000`, { headers });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                
                if (!json.success || !Array.isArray(json.data)) {
                    throw new Error('Invalid response format');
                }

                // Filter states based on user hierarchy
                let statesToUse = json.data;
                if (userHierarchy?.state) {
                    // User has state-level access - show only their state
                    statesToUse = json.data.filter(s => String(s._id) === String(userHierarchy.state._id || userHierarchy.state));
                }
                // If no hierarchy, show all states (superAdmin)

                // Extract polygons from states that have polygon data
                const features = [];
                statesToUse.forEach(state => {
                    if (state.polygon) {
                        let featureToAdd = null;
                        
                        if (state.polygon.type === 'Feature') {
                            featureToAdd = {
                                ...state.polygon,
                                properties: {
                                    ...state.polygon.properties,
                                    state_id: state._id,
                                    state_name: state.name,
                                    state_no: state.state_no
                                }
                            };
                        } else if (state.polygon.type === 'FeatureCollection' && Array.isArray(state.polygon.features)) {
                            state.polygon.features.forEach(feat => {
                                features.push({
                                    ...feat,
                                    properties: {
                                        ...feat.properties,
                                        state_id: state._id,
                                        state_name: state.name,
                                        state_no: state.state_no
                                    }
                                });
                            });
                            return;
                        }
                        
                        if (featureToAdd) {
                            features.push(featureToAdd);
                        }
                    }
                });

                if (!features.length) {
                    setMapError('No states with polygon data available');
                    setAllStateGeoJSON(null);
                    setStateGeoJSON(null);
                } else {
                    const geoJSON = { type: 'FeatureCollection', features };
                    setAllStateGeoJSON(geoJSON);
                    setStateGeoJSON(geoJSON);
                    setMapError('');
                }
            } catch (e) {
                console.error('Failed to load state polygons:', e);
                setMapError(`Failed to load polygon data: ${e.message}`);
                setAllStateGeoJSON(null);
                setStateGeoJSON(null);
            }
        })();
    }, [userHierarchy]);

    // Filter polygons based on current table data
    useEffect(() => {
        if (!allStateGeoJSON) {
            return;
        }

        // Show all polygons on map, not just current page
        setStateGeoJSON(allStateGeoJSON);
    }, [allStateGeoJSON]);

    const handleDeleteOpen = (id) => {
        setStateDeleteId(id);
        setOpenDelete(true);
    };

    const fetchStateDetailsByPolygon = async (stateId, stateName) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Fetch state by ID
            let state = null;
            let divisions = [];

            if (stateId) {
                try {
                    const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/states/${stateId}`, { headers });
                    const json = await res.json();
                    if (json?.success && json.data) {
                        state = json.data;
                    }
                } catch (e) {
                    console.warn('Failed to fetch state by ID:', e);
                }

                if (state && state._id) {
                    const sid = state._id;
                    try {
                        const dRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/divisions?state=${encodeURIComponent(sid)}&all=true&limit=10000`, { headers });
                        const dJson = await dRes.json();
                        if (dJson?.success && Array.isArray(dJson.data)) divisions = dJson.data;
                    } catch (e) {
                        console.warn('Failed to fetch divisions:', e);
                    }

                    setDrawerData({ loading: false, stateName: stateName, stateNo: state.state_no, details: { state, divisions } });
                    setDrawerOpen(true);
                } else {
                    setDrawerData({ loading: false, stateName: stateName, details: null, error: 'State not found' });
                    setDrawerOpen(true);
                }
            } else {
                setDrawerData({ loading: false, stateName: stateName, details: null, error: 'Invalid state ID' });
                setDrawerOpen(true);
            }
        } catch (err) {
            console.error('Failed to fetch state details by polygon:', err);
            setDrawerData({ loading: false, stateName: stateName, details: null, error: err.message });
            setDrawerOpen(true);
        }
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
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'State No',
            accessorKey: 'state_no',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 'N/A'}
                    color="primary"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Description',
            accessorKey: 'description',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 250,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontStyle: 'italic',
                    color: 'text.secondary'
                }}>
                    {/* Strip HTML tags for table preview */}
                    {getValue() ? getValue().replace(/<[^>]+>/g, '').slice(0, 100) : ''}
                </Typography>
            )
        },
        {
            header: 'Created By',
            accessorKey: 'created_by',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.username || 'N/A'}
                </Typography>
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
            header: 'Polygon',
            accessorKey: 'polygon',
            cell: ({ getValue }) => {
                const hasPolygon = !!getValue();
                return (
                    <Chip
                        label={hasPolygon ? 'Yes' : 'No'}
                        color={hasPolygon ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                    />
                );
            }
        },
        {
            header: 'Actions',
            meta: { className: 'cell-center' },
            cell: ({ row }) => {
                const isExpanded = row.getIsExpanded();
                const expandIcon = isExpanded ? <Add style={{ transform: 'rotate(45deg)', color: theme.palette.error.main }} /> : <Eye />;
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <IconButton color="secondary" onClick={row.getToggleExpandedHandler()}>
                            {expandIcon}
                        </IconButton>
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedState(row.original); setOpenModal(true); }}>
                            <Edit />
                        </IconButton>
                        <IconButton color="error" onClick={(e) => { e.stopPropagation(); handleDeleteOpen(row.original._id); }}>
                            <Trash />
                        </IconButton>
                    </Stack>
                );
            }
        }
    ], [theme]);

    const table = useReactTable({
        data: states,
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

    const fetchAllStatesForCsv = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = {};
            if (token) headers.Authorization = `Bearer ${token}`;
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/states?all=true`, { headers });
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all states for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();
    const {
        otpDialogOpen,
        otpCode,
        setOtpCode,
        loading: otpLoading,
        maskedDest,
        error: otpError,
        requestOtp,
        verifyOtp,
        closeDialog
    } = useCsvOtp();

    const startCsvDownload = async () => {
        setCsvLoading(true);
        const allData = await fetchAllStatesForCsv();
        setCsvData(allData.map(item => ({
            Name: item.name,
            'State No': item.state_no || 'N/A',
            Description: item.description ? item.description.replace(/<[^>]+>/g, '') : '',
            Status: item.is_active ? 'Active' : 'Inactive',
            'Created By': item.created_by?.username || '',
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

    const handleDownloadCsv = async () => {
        await requestOtp(startCsvDownload);
    };

    if (loading) return <EmptyReactTable />;

    return (
        <>
            <MainCard content={false}>
                {/* State Map section above the table */}
                <Box sx={{ p: 2, pb: 0 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>State Map</Typography>
                    {mapError && <Alert severity="warning" sx={{ mb: 1 }}>{mapError}</Alert>}
                    {!stateGeoJSON && !mapError && (
                        <Alert severity="info" sx={{ mb: 1 }}>Loading map data...</Alert>
                    )}
                    <MapContainerStyled sx={{ minHeight: 400 }}>
                        {mapboxToken ? (
                            <Map
                                ref={mapRef}
                                mapboxAccessToken={mapboxToken}
                                initialViewState={{ longitude: 77.0, latitude: 23.5, zoom: 5 }}
                                mapStyle="mapbox://styles/mapbox/streets-v12"
                                interactiveLayerIds={stateGeoJSON ? ['state-fill'] : []}
                                onClick={(e) => {
                                    if (!stateGeoJSON) return;
                                    try {
                                        const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                                        const point = e.point || { x: e.originalEvent?.clientX, y: e.originalEvent?.clientY };
                                        let features = e.features || [];
                                        if ((!features || features.length === 0) && map && point) {
                                            features = map.queryRenderedFeatures([point.x, point.y], { layers: ['state-fill'] }) || [];
                                        }
                                        const f = features.find(f => f.layer && f.layer.id === 'state-fill') || features[0];
                                        if (f) {
                                            const props = f.properties || {};
                                            const stateId = props.state_id || '';
                                            const stateName = props.state_name || '';
                                            setDrawerData({ loading: true, stateName: stateName, details: null });
                                            setDrawerOpen(true);
                                            fetchStateDetailsByPolygon(stateId, stateName);
                                        }
                                    } catch (err) {
                                        console.warn('Map click handler error:', err);
                                    }
                                }}
                            >
                                <MapControl />
                                {stateGeoJSON && (
                                    <Source id="state-polygons" type="geojson" data={stateGeoJSON}>
                                        <Layer id="state-fill" type="fill" paint={{ 'fill-color': '#FF9800', 'fill-opacity': 0.22 }} />
                                        <Layer id="state-outline" type="line" paint={{ 'line-color': '#F57C00', 'line-width': 2 }} />
                                        <Layer
                                            id="state-label"
                                            type="symbol"
                                            layout={{ 'text-field': ['concat', ['coalesce', ['get', 'state_name'], ['get', 'name'], ''], '\n', ['coalesce', ['get', 'state_no'], ['get', 'no'], '']], 'text-size': 10, 'text-allow-overlap': true, 'text-anchor': 'center' }}
                                            paint={{
                                                'text-color': '#000',
                                                'text-halo-color': '#ffffff',
                                                'text-halo-width': 2
                                            }}
                                        />
                                    </Source>
                                )}
                            </Map>
                        ) : (
                            <Alert severity="error">Mapbox token not configured</Alert>
                        )}
                    </MapContainerStyled>
                </Box>

                {/* Drawer for State Details */}
                <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} sx={{ '& .MuiDrawer-paper': { width: 400 } }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
                        <Typography variant="h6">State Details</Typography>
                        <IconButton onClick={() => setDrawerOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Box sx={{ p: 2, overflowY: 'auto', height: 'calc(100% - 60px)' }}>
                        {drawerData?.loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                <CircularProgress />
                            </Box>
                        ) : drawerData?.error ? (
                            <Alert severity="error">{drawerData.error}</Alert>
                        ) : drawerData?.details ? (
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">State Name</Typography>
                                    <Typography variant="body1">{drawerData.stateName || 'N/A'}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">State No</Typography>
                                    <Typography variant="body1">{drawerData.stateNo || 'N/A'}</Typography>
                                </Box>
                                <Divider />
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                                    <Typography variant="body2">{drawerData.details.state?.description ? drawerData.details.state.description.replace(/<[^>]+>/g, '') : 'N/A'}</Typography>
                                </Box>
                                <Divider />
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Divisions ({drawerData.details.divisions?.length || 0})</Typography>
                                    {drawerData.details.divisions && drawerData.details.divisions.length > 0 ? (
                                        <Stack spacing={1}>
                                            {drawerData.details.divisions.map((division) => (
                                                <Chip key={division._id} label={division.name} size="small" variant="outlined" />
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Typography variant="body2" color="textSecondary">No divisions found</Typography>
                                    )}
                                </Box>
                            </Stack>
                        ) : (
                            <Typography variant="body2" color="textSecondary">Click on a state on the map to view details</Typography>
                        )}
                    </Box>
                </Drawer>

                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
                    <TextField
                        size="small"
                        variant="outlined"
                        placeholder={`Search ${states.length} states...`}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        sx={{ minWidth: 300 }}
                    />
                    <Stack direction="row" spacing={1}>
                        <CSVLink
                            data={csvData}
                            filename="states_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
                        {/* OTP Dialog for CSV export */}
                        <Dialog open={otpDialogOpen} onClose={() => !otpLoading && closeDialog()} maxWidth="xs" fullWidth>
                            <DialogTitle>Enter OTP to Download CSV</DialogTitle>
                            <DialogContent>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    OTP sent to: <strong>{maskedDest || '**********'}</strong>
                                </Typography>
                                <TextField
                                    autoFocus
                                    fullWidth
                                    label="OTP"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value)}
                                    disabled={otpLoading}
                                    inputProps={{ maxLength: 8 }}
                                />
                                {otpError && (
                                    <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                                        {otpError}
                                    </Typography>
                                )}
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => closeDialog()} disabled={otpLoading}>Cancel</Button>
                                <Button onClick={() => verifyOtp()} variant="contained" disabled={otpLoading || !otpCode?.trim()}>
                                    {otpLoading ? <CircularProgress size={20} /> : 'Verify & Download'}
                                </Button>
                            </DialogActions>
                        </Dialog>
                        <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                            {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                        </Button>
                        <Button variant="outlined" onClick={() => setOpenPolygonUpload(true)}>
                            Upload Polygon
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedState(null); setOpenModal(true); }}>
                            Add State
                        </Button>
                    </Stack>
                </Stack>

                <ScrollX>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ backgroundColor: 'primary.main' }}>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableCell
                                                key={header.id}
                                                onClick={header.column.getToggleSortingHandler()}
                                                sx={{
                                                    cursor: header.column.getCanSort() ? 'pointer' : 'default',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    backgroundColor: 'primary.main'
                                                }}
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
                                                    <StateView data={row.original} />
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

            <StateModal
                open={openModal}
                modalToggler={setOpenModal}
                state={selectedState}
                refresh={() => fetchStates(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertStateDelete
                id={stateDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchStates(pagination.pageIndex, pagination.pageSize)}
            />

            <StatePolygonUpload
                open={openPolygonUpload}
                onClose={() => setOpenPolygonUpload(false)}
                onSuccess={() => {
                    // Refresh states if needed
                    fetchStates(pagination.pageIndex, pagination.pageSize);
                }}
            />
        </>
    );
}
