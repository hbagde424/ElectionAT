import {
    Grid, Stack, Typography, Divider, Card, CardContent,
    Chip, Box, Button, Paper, Alert, CircularProgress
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, ArrowLeft, Location } from 'iconsax-react';
import axiosServices from 'utils/axios';
import MainCard from 'components/MainCard';
import PanchayatModal from './PanchayatModal';

// Map components for location display
import Map, { Marker, Popup } from 'react-map-gl';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import MapControl from 'components/third-party/map/MapControl';

const mapConfiguration = {
    mapboxAccessToken: import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN,
    minZoom: 1
};

const MAPBOX_THEMES = {
    streets: 'mapbox://styles/mapbox/streets-v11',
    satellite: 'mapbox://styles/mapbox/satellite-v9'
};

const PanchayatDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [panchayat, setPanchayat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Hierarchy data for edit modal
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);

    // Map state
    const [mapStyle, setMapStyle] = useState(MAPBOX_THEMES.streets);
    const [showMarkerPopup, setShowMarkerPopup] = useState(false);

    useEffect(() => {
        fetchPanchayat();
        fetchHierarchyData();
    }, [id]);

    const fetchPanchayat = async () => {
        setLoading(true);
        try {
            const response = await axiosServices.get(`/panchayats/${id}`);
            setPanchayat(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching panchayat:', error);
            setError(error.response?.data?.message || 'Failed to fetch panchayat details');
        }
        setLoading(false);
    };

    const fetchHierarchyData = async () => {
        try {
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes] = await Promise.all([
                axiosServices.get('/states?all=true'),
                axiosServices.get('/divisions?all=true'),
                axiosServices.get('/parliaments?all=true'),
                axiosServices.get('/assemblies?all=true'),
                axiosServices.get('/blocks?all=true'),
                axiosServices.get('/booths?all=true')
            ]);

            setStates(statesRes.data.data || []);
            setDivisions(divisionsRes.data.data || []);
            setParliaments(parliamentsRes.data.data || []);
            setAssemblies(assembliesRes.data.data || []);
            setBlocks(blocksRes.data.data || []);
            setBooths(boothsRes.data.data || []);
        } catch (error) {
            console.error('Error fetching hierarchy data:', error);
        }
    };

    const InfoCard = ({ title, children }) => (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                    {title}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {children}
            </CardContent>
        </Card>
    );

    const InfoItem = ({ label, value, chip = false, chipColor = 'default' }) => (
        <Stack direction="row" justifyContent="space-between" alignItems="center" py={1}>
            <Typography variant="body2" color="text.secondary">
                {label}:
            </Typography>
            {chip ? (
                <Chip label={value || 'N/A'} color={chipColor} size="small" />
            ) : (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {value || 'N/A'}
                </Typography>
            )}
        </Stack>
    );

    if (loading) {
        return (
            <MainCard>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </MainCard>
        );
    }

    if (error) {
        return (
            <MainCard>
                <Alert severity="error">{error}</Alert>
            </MainCard>
        );
    }

    if (!panchayat) {
        return (
            <MainCard>
                <Alert severity="warning">Panchayat not found</Alert>
            </MainCard>
        );
    }

    return (
        <MainCard content={false}>
            <Stack spacing={3} sx={{ p: 3 }}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Button
                            startIcon={<ArrowLeft />}
                            onClick={() => navigate('/panchayat')}
                            variant="outlined"
                        >
                            Back to List
                        </Button>
                        <Typography variant="h4">
                            Panchayat Details: {panchayat.panchayat_name}
                        </Typography>
                    </Stack>
                </Stack>

                <Divider />

                {/* Content Grid */}
                <Grid container spacing={3}>
                    {/* Basic Information */}
                    <Grid item xs={12} md={6}>
                        <InfoCard title="Basic Information">
                            <InfoItem label="Panchayat Name" value={panchayat.panchayat_name} />
                            <InfoItem label="Location" value={panchayat.location} />
                            <InfoItem 
                                label="Coordinates" 
                                value={
                                    panchayat.latitude && panchayat.longitude 
                                        ? `${panchayat.latitude}, ${panchayat.longitude}`
                                        : 'Not available'
                                } 
                            />
                            <InfoItem 
                                label="Created At" 
                                value={new Date(panchayat.created_at).toLocaleDateString()} 
                            />
                            <InfoItem 
                                label="Updated At" 
                                value={new Date(panchayat.updated_at).toLocaleDateString()} 
                            />
                        </InfoCard>
                    </Grid>

                    {/* Population Information */}
                    <Grid item xs={12} md={6}>
                        <InfoCard title="Population Information">
                            <InfoItem 
                                label="Total Population" 
                                value={panchayat.total_count || 0} 
                                chip 
                                chipColor="primary" 
                            />
                            <InfoItem 
                                label="Male Count" 
                                value={panchayat.male_count || 0} 
                                chip 
                                chipColor="info" 
                            />
                            <InfoItem 
                                label="Female Count" 
                                value={panchayat.female_count || 0} 
                                chip 
                                chipColor="secondary" 
                            />
                            <InfoItem 
                                label="Others Count" 
                                value={panchayat.others_count || 0} 
                                chip 
                                chipColor="warning" 
                            />
                        </InfoCard>
                    </Grid>

                    {/* Hierarchy Information */}
                    <Grid item xs={12}>
                        <InfoCard title="Administrative Hierarchy">
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={2}>
                                    <InfoItem label="State" value={panchayat.state_id?.name} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <InfoItem label="Division" value={panchayat.division_id?.name} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <InfoItem label="Parliament" value={panchayat.parliament_id?.name} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <InfoItem label="Assembly" value={panchayat.assembly_id?.name} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <InfoItem label="Block" value={panchayat.block_id?.name} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <InfoItem label="Booth" value={panchayat.booth_id?.name} />
                                </Grid>
                            </Grid>
                        </InfoCard>
                    </Grid>

                    {/* Map View - Only show if coordinates are available */}
                    {panchayat.latitude && panchayat.longitude && (
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                                        Location Map
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    
                                    <Box sx={{ height: 400, position: 'relative' }}>
                                        <MapContainerStyled>
                                            <Map
                                                {...mapConfiguration}
                                                initialViewState={{
                                                    latitude: parseFloat(panchayat.latitude),
                                                    longitude: parseFloat(panchayat.longitude),
                                                    zoom: 12
                                                }}
                                                style={{ width: '100%', height: '100%' }}
                                                mapStyle={mapStyle}
                                            >
                                                <MapControl />
                                                
                                                <Marker
                                                    latitude={parseFloat(panchayat.latitude)}
                                                    longitude={parseFloat(panchayat.longitude)}
                                                    onClick={() => setShowMarkerPopup(true)}
                                                >
                                                    <Box sx={{ cursor: 'pointer' }}>
                                                        <Location 
                                                            size={32} 
                                                            variant="Bold" 
                                                            style={{ color: '#1976d2' }} 
                                                        />
                                                    </Box>
                                                </Marker>

                                                {showMarkerPopup && (
                                                    <Popup
                                                        latitude={parseFloat(panchayat.latitude)}
                                                        longitude={parseFloat(panchayat.longitude)}
                                                        onClose={() => setShowMarkerPopup(false)}
                                                        closeButton={true}
                                                        closeOnClick={false}
                                                    >
                                                        <Box sx={{ p: 1 }}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                {panchayat.panchayat_name}
                                                            </Typography>
                                                            {panchayat.location && (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {panchayat.location}
                                                                </Typography>
                                                            )}
                                                            <Typography variant="caption" color="text.secondary">
                                                                {panchayat.latitude}, {panchayat.longitude}
                                                            </Typography>
                                                        </Box>
                                                    </Popup>
                                                )}
                                            </Map>
                                        </MapContainerStyled>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </Stack>
        </MainCard>
    );
};

export default PanchayatDetailPage;