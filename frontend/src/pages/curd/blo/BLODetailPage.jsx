import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Grid,
    CardContent,
    Chip,
    Stack,
    Avatar,
    Divider,
    Button,
    IconButton,
    Paper,
    LinearProgress,
    Alert,
    Breadcrumbs,
    Link
} from '@mui/material';
import {
    ArrowBack,
    LocationOn,
    Description,
    CalendarToday,
    Business,
    HowToVote,
    Phone,
    Room
} from '@mui/icons-material';
import Map, { Marker } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import MapMarker from 'components/third-party/map/MapMarker';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';

const BLODetailPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [BLO, setBLO] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [boothCoords, setBoothCoords] = useState(null);
    const [mapLoading, setMapLoading] = useState(false);
    const [mapError, setMapError] = useState(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;
    const mapRef = React.useRef(null);

    useEffect(() => {
        console.log('BLODetailPage mounted with ID:', id);
        fetchBLODetails();
    }, [id]);

    const fetchBLODetails = async () => {
        try {
            setLoading(true);
            console.log('Fetching BLO details for ID:', id);
            const token = localStorage.getItem('serviceToken');
            console.log('Token available:', !!token);

            const response = await axiosServices.get(`/blos/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log('BLO API response:', response);
            if (response.data.success) {
                setBLO(response.data.data);
                setError(null);
                // After setting BLO, try to fetch booth info for map
                try {
                    const boothId = response.data.data?.booth_id?._id || response.data.data?.booth_id;
                    if (boothId) fetchBoothForMap(boothId);
                } catch (e) {
                    console.error('Failed to kick off booth fetch for map:', e);
                }
            } else {
                console.error('API returned success: false', response.data);
                setError('Failed to fetch BLO details');
            }
        } catch (error) {
            console.error('Error fetching BLO details:', error);
            // axiosServices response interceptor sometimes returns the response data or a string
            const errMessage = (error && (error.message || error)) || 'Error loading BLO details.';
            // If the error indicates missing/invalid auth, redirect to login for a better UX
            if (typeof errMessage === 'string' && errMessage.toLowerCase().includes('not authorized')) {
                // Use navigate to go to login page
                navigate('/election/login');
                return;
            }

            // Fallback: show generic message
            setError('Error loading BLO details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchBoothForMap = async (boothId) => {
        try {
            setMapLoading(true);
            setMapError(null);
            const token = localStorage.getItem('serviceToken');
            const res = await axiosServices.get(`/booths/${boothId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            // axiosServices returns full response; fallback to res.data
            const booth = res?.data?.data || res?.data;
            if (booth) {
                const lat = booth.latitude || booth.lat || booth.location?.coordinates?.[1];
                const lon = booth.longitude || booth.lng || booth.location?.coordinates?.[0];
                if (lat && lon) {
                    setBoothCoords({ latitude: Number(lat), longitude: Number(lon) });
                } else {
                    // no coordinates available
                    setMapError('No GPS coordinates available for the booth');
                }
            } else {
                setMapError('Booth details not found');
            }
        } catch (e) {
            console.error('Error fetching booth for map:', e);
            setMapError('Failed to load booth location');
        } finally {
            setMapLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleBack = () => {
        navigate('/blo');
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading BLO details...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
                    Back to BLOs
                </Button>
            </Container>
        );
    }

    if (!BLO) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    BLO not found
                </Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
                    Back to BLOs
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}>
                        <ArrowBack />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" component="h1">
                            BLO details
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {formatDateTime(BLO.created_at)}
                        </Typography>
                    </Box>
                </Stack>

                {/* Breadcrumbs */}
                <Breadcrumbs aria-label="breadcrumb">
                    <Link
                        underline="hover"
                        color="inherit"
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate('/');
                        }}
                    >
                        Dashboard
                    </Link>
                    <Link
                        underline="hover"
                        color="inherit"
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate('/blo');
                        }}
                    >
                        BLO Officers
                    </Link>
                    <Typography color="text.primary">
                        {BLO.blo_name}
                    </Typography>
                </Breadcrumbs>
            </Box>

            {/* BLO Information - Banner + Two-column layout */}
            <MainCard>
                <Box sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', p: 2, borderRadius: '8px 8px 0 0' }}>
                    <Grid container alignItems="center">
                        <Grid item xs>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>{BLO.blo_name || 'Unnamed BLO'}</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Contact: {BLO.contact_number || 'N/A'} • Booth: {BLO.booth_id?.name || 'N/A'}
                            </Typography>
                        </Grid>
                        <Grid item>
                            <Stack direction="row" spacing={1}>
                                {BLO.contact_number && (
                                    <Button variant="outlined" color="inherit" startIcon={<Phone />} href={`tel:${BLO.contact_number}`}>Call</Button>
                                )}
                            </Stack>
                        </Grid>
                    </Grid>
                </Box>

                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Paper elevation={0} sx={{ p: 2, borderLeft: 4, borderColor: 'primary.main' }}>
                                <Typography variant="subtitle2" color="text.secondary">BLO Officer Information</Typography>
                                <Grid container spacing={1} sx={{ mt: 1 }}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">BLO Name</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{BLO.blo_name || 'N/A'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Contact Number</Typography>
                                        <Typography variant="body2">{BLO.contact_number || 'N/A'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">State</Typography>
                                        <Typography variant="body2">{BLO.state_id?.name || 'N/A'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Division</Typography>
                                        <Typography variant="body2">{BLO.division_id?.name || 'N/A'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Parliament</Typography>
                                        <Typography variant="body2">{BLO.parliament_id?.name || 'N/A'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Assembly</Typography>
                                        <Typography variant="body2">{BLO.assembly_id?.name || 'N/A'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Block</Typography>
                                        <Typography variant="body2">{BLO.block_id?.name || 'N/A'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">Booth</Typography>
                                        <Typography variant="body2">{BLO.booth_id?.name || 'N/A'} (#{BLO.booth_id?.booth_number || 'N/A'})</Typography>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Paper elevation={0} sx={{ p: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Metadata</Typography>
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        <strong>Created:</strong> {formatDateTime(BLO.created_at)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        <strong>Updated:</strong> {formatDateTime(BLO.updated_at)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                                        <strong>Created By:</strong> {BLO.created_by?.username || BLO.created_by?.name || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Updated By:</strong> {BLO.updated_by?.username || BLO.updated_by?.name || 'N/A'}
                                    </Typography>
                                </Box>
                            </Paper>
                            {/* Map box for booth location (if coordinates exist) */}
                            {mapLoading && (
                                <Paper elevation={0} sx={{ p: 2, mt: 2 }}>
                                    <Typography variant="body2">Loading map...</Typography>
                                </Paper>
                            )}
                            {mapError && (
                                <Paper elevation={0} sx={{ p: 2, mt: 2 }}>
                                    <Typography variant="caption" color="error">{mapError}</Typography>
                                </Paper>
                            )}
                            {boothCoords && (
                                <Paper elevation={0} sx={{ p: 1.5, mt: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Booth Location</Typography>
                                    <Box sx={{ height: 260, width: '100%', mt: 1 }}>
                                        <Map
                                            ref={mapRef}
                                            initialViewState={{ longitude: boothCoords.longitude, latitude: boothCoords.latitude, zoom: 16 }}
                                            mapStyle={'mapbox://styles/mapbox/streets-v11'}
                                            mapboxAccessToken={mapboxToken}
                                        >
                                            <MapControl />
                                            <MapMarker longitude={boothCoords.longitude} latitude={boothCoords.latitude} />
                                        </Map>
                                    </Box>
                                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                        <Button size="small" variant="outlined" href={`https://www.google.com/maps?q=${boothCoords.latitude},${boothCoords.longitude}`} target="_blank" rel="noreferrer">Open in Google Maps</Button>
                                    </Stack>
                                </Paper>
                            )}
                        </Grid>
                    </Grid>
                </CardContent>
            </MainCard>
        </Container>
    );
};

export default BLODetailPage;

