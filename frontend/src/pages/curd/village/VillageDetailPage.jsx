import {
    Grid, Stack, Typography, Divider, Card, CardContent,
    Chip, Box, Button, Paper, Alert, CircularProgress
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, ArrowLeft, Location } from 'iconsax-react';
import axiosServices from 'utils/axios';
import MainCard from 'components/MainCard';
import VillageModal from './VillageModal';

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

const VillageDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [village, setVillage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openEditModal, setOpenEditModal] = useState(false);
    
    // Hierarchy data for edit modal
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [panchayats, setPanchayats] = useState([]);

    // Map state
    const [mapStyle, setMapStyle] = useState(MAPBOX_THEMES.streets);
    const [showMarkerPopup, setShowMarkerPopup] = useState(false);

    useEffect(() => {
        fetchVillage();
        fetchHierarchyData();
    }, [id]);

    const fetchVillage = async () => {
        setLoading(true);
        try {
            const response = await axiosServices.get(`/villages/${id}`);
            setVillage(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching village:', error);
            setError(error.response?.data?.message || 'Failed to fetch village details');
        }
        setLoading(false);
    };

    const fetchHierarchyData = async () => {
        try {
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes, panchayatsRes] = await Promise.all([
                axiosServices.get('/states?all=true'),
                axiosServices.get('/divisions?all=true'),
                axiosServices.get('/parliaments?all=true'),
                axiosServices.get('/assemblies?all=true'),
                axiosServices.get('/blocks?all=true'),
                axiosServices.get('/booths?all=true'),
                axiosServices.get('/panchayats?all=true')
            ]);

            setStates(statesRes.data.data || []);
            setDivisions(divisionsRes.data.data || []);
            setParliaments(parliamentsRes.data.data || []);
            setAssemblies(assembliesRes.data.data || []);
            setBlocks(blocksRes.data.data || []);
            setBooths(boothsRes.data.data || []);
            setPanchayats(panchayatsRes.data.data || []);
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

    if (!village) {
        return (
            <MainCard>
                <Alert severity="warning">Village not found</Alert>
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
                            onClick={() => navigate('/village')}
                            variant="outlined"
                        >
                            Back to List
                        </Button>
                        <Typography variant="h4">
                            Village Details: {village.village_name}
                        </Typography>
                    </Stack>
                    <Button
                        startIcon={<Edit />}
                        variant="contained"
                        onClick={() => setOpenEditModal(true)}
                    >
                        Edit Village
                    </Button>
                </Stack>

                <Divider />

                {/* Content Grid */}
                <Grid container spacing={3}>
                    {/* Basic Information */}
                    <Grid item xs={12} md={6}>
                        <InfoCard title="Basic Information">
                            <InfoItem label="Village Name" value={village.village_name} />
                            <InfoItem label="Panchayat" value={village.panchayat_id?.panchayat_name} />
                            <InfoItem label="Location" value={village.location} />
                            <InfoItem 
                                label="Coordinates" 
                                value={
                                    village.latitude && village.longitude 
                                        ? `${village.latitude}, ${village.longitude}`
                                        : 'Not available'
                                } 
                            />
                            <InfoItem 
                                label="Created At" 
                                value={new Date(village.created_at).toLocaleDateString()} 
                            />
                            <InfoItem 
                                label="Updated At" 
                                value={new Date(village.updated_at).toLocaleDateString()} 
                            />
                        </InfoCard>
                    </Grid>

                    {/* Population Information */}
                    <Grid item xs={12} md={6}>
                        <InfoCard title="Population Information">
                            <InfoItem 
                                label="Total Population" 
                                value={village.total_count || 0} 
                                chip 
                                chipColor="primary" 
                            />
                            <InfoItem 
                                label="Male Count" 
                                value={village.male_count || 0} 
                                chip 
                                chipColor="info" 
                            />
                            <InfoItem 
                                label="Female Count" 
                                value={village.female_count || 0} 
                                chip 
                                chipColor="secondary" 
                            />
                            <InfoItem 
                                label="Others Count" 
                                value={village.others_count || 0} 
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
                                    <InfoItem label="State" value={village.state_id?.name} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <InfoItem label="Division" value={village.division_id?.name} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <InfoItem label="Parliament" value={village.parliament_id?.name} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <InfoItem label="Assembly" value={village.assembly_id?.name} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <InfoItem label="Block" value={village.block_id?.name} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <InfoItem label="Booth" value={village.booth_id?.name} />
                                </Grid>
                            </Grid>
                        </InfoCard>
                    </Grid>

                    {/* Map View - Only show if coordinates are available */}
                    {village.latitude && village.longitude && (
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
                                                    latitude: parseFloat(village.latitude),
                                                    longitude: parseFloat(village.longitude),
                                                    zoom: 12
                                                }}
                                                style={{ width: '100%', height: '100%' }}
                                                mapStyle={mapStyle}
                                            >
                                                <MapControl />
                                                
                                                <Marker
                                                    latitude={parseFloat(village.latitude)}
                                                    longitude={parseFloat(village.longitude)}
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
                                                        latitude={parseFloat(village.latitude)}
                                                        longitude={parseFloat(village.longitude)}
                                                        onClose={() => setShowMarkerPopup(false)}
                                                        closeButton={true}
                                                        closeOnClick={false}
                                                    >
                                                        <Box sx={{ p: 1 }}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                {village.village_name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Panchayat: {village.panchayat_id?.panchayat_name}
                                                            </Typography>
                                                            {village.location && (
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {village.location}
                                                                </Typography>
                                                            )}
                                                            <Typography variant="caption" color="text.secondary">
                                                                {village.latitude}, {village.longitude}
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

            {/* Edit Modal */}
            <VillageModal
                open={openEditModal}
                modalToggler={() => setOpenEditModal(false)}
                village={village}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                panchayats={panchayats}
                refresh={fetchVillage}
            />
        </MainCard>
    );
};

export default VillageDetailPage;