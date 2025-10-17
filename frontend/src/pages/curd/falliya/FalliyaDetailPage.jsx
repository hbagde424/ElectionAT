import {
    Container, Grid, Card, CardContent, Typography, Box,
    Chip, Stack, Divider, Alert, CircularProgress, Button,
    Breadcrumbs, Link, Paper
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Map, { Marker } from 'react-map-gl';
import axiosServices from 'utils/axios';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

const StyledCard = styled(Card)(({ theme }) => ({
    height: '100%',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
        boxShadow: theme.shadows[8],
        transform: 'translateY(-2px)'
    }
}));

const InfoRow = ({ label, value, children }) => (
    <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {label}:
        </Typography>
        {children || (
            <Typography variant="body1" fontWeight={value ? 'normal' : 'italic'}>
                {value || 'Not specified'}
            </Typography>
        )}
    </Box>
);

export default function FalliyaDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [falliya, setFalliya] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Map state
    const [viewport, setViewport] = useState({
        longitude: 77.2090,
        latitude: 28.6139,
        zoom: 10
    });

    useEffect(() => {
        fetchFalliyaDetails();
    }, [id]);

    useEffect(() => {
        if (falliya?.latitude && falliya?.longitude) {
            setViewport(prev => ({
                ...prev,
                longitude: falliya.longitude,
                latitude: falliya.latitude,
                zoom: 12
            }));
        }
    }, [falliya]);

    const fetchFalliyaDetails = async () => {
        if (!id) return;

        setLoading(true);
        setError('');

        try {
            const response = await axiosServices.get(`/falliyas/${id}`);
            setFalliya(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching falliya details:', error);
            setError(error.response?.data?.message || 'Failed to fetch falliya details');
        }
        setLoading(false);
    };

    const handleBack = () => {
        navigate('/falliya');
    };

    if (loading) {
        return (
            <Container maxWidth="lg">
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress size={60} />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg">
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
                <Button onClick={handleBack} sx={{ mt: 2 }}>
                    Back to Falliya List
                </Button>
            </Container>
        );
    }

    if (!falliya) {
        return (
            <Container maxWidth="lg">
                <Alert severity="warning" sx={{ mt: 2 }}>
                    Falliya not found
                </Alert>
                <Button onClick={handleBack} sx={{ mt: 2 }}>
                    Back to Falliya List
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            {/* Breadcrumbs */}
            <Breadcrumbs sx={{ mb: 3 }}>
                <Link 
                    color="inherit" 
                    href="#" 
                    onClick={handleBack}
                    sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                    Falliya Management
                </Link>
                <Typography color="text.primary">
                    {falliya.falliya_name}
                </Typography>
            </Breadcrumbs>

            {/* Header */}
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap">
                    <Box>
                        <Typography variant="h4" gutterBottom>
                            {falliya.falliya_name}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Falliya Details and Information
                        </Typography>
                    </Box>
                    <Button variant="outlined" onClick={handleBack}>
                        Back to List
                    </Button>
                </Box>
            </Paper>

            <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12} md={6}>
                    <StyledCard>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Basic Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            
                            <InfoRow label="Falliya Name" value={falliya.falliya_name} />
                            <InfoRow label="Location" value={falliya.location} />
                            
                            {(falliya.latitude && falliya.longitude) && (
                                <InfoRow label="Coordinates">
                                    <Typography variant="body1">
                                        Latitude: {falliya.latitude}<br />
                                        Longitude: {falliya.longitude}
                                    </Typography>
                                </InfoRow>
                            )}
                        </CardContent>
                    </StyledCard>
                </Grid>

                {/* Population Statistics */}
                <Grid item xs={12} md={6}>
                    <StyledCard>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Population Statistics
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box textAlign="center" p={2}>
                                        <Typography variant="h4" color="info.main">
                                            {falliya.male_count || 0}
                                        </Typography>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Male
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box textAlign="center" p={2}>
                                        <Typography variant="h4" color="success.main">
                                            {falliya.female_count || 0}
                                        </Typography>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Female
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box textAlign="center" p={2}>
                                        <Typography variant="h4" color="warning.main">
                                            {falliya.others_count || 0}
                                        </Typography>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Others
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box textAlign="center" p={2}>
                                        <Typography variant="h4" color="primary.main">
                                            {falliya.total_count || 0}
                                        </Typography>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Total
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </StyledCard>
                </Grid>

                {/* Hierarchy Information */}
                <Grid item xs={12}>
                    <StyledCard>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Administrative Hierarchy
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {falliya.state_id?.name && (
                                    <Chip 
                                        label={`State: ${falliya.state_id.name}`} 
                                        color="primary" 
                                        variant="outlined" 
                                        size="medium"
                                    />
                                )}
                                {falliya.division_id?.name && (
                                    <Chip 
                                        label={`Division: ${falliya.division_id.name}`} 
                                        color="secondary" 
                                        variant="outlined" 
                                        size="medium"
                                    />
                                )}
                                {falliya.parliament_id?.name && (
                                    <Chip 
                                        label={`Parliament: ${falliya.parliament_id.name}`} 
                                        color="info" 
                                        variant="outlined" 
                                        size="medium"
                                    />
                                )}
                                {falliya.assembly_id?.name && (
                                    <Chip 
                                        label={`Assembly: ${falliya.assembly_id.name}`} 
                                        color="warning" 
                                        variant="outlined" 
                                        size="medium"
                                    />
                                )}
                                {falliya.block_id?.name && (
                                    <Chip 
                                        label={`Block: ${falliya.block_id.name}`} 
                                        color="success" 
                                        variant="outlined" 
                                        size="medium"
                                    />
                                )}
                                {falliya.booth_id?.name && (
                                    <Chip 
                                        label={`Booth: ${falliya.booth_id.name}`} 
                                        color="error" 
                                        variant="outlined" 
                                        size="medium"
                                    />
                                )}
                                {falliya.panchayat_id?.panchayat_name && (
                                    <Chip 
                                        label={`Panchayat: ${falliya.panchayat_id.panchayat_name}`} 
                                        color="primary" 
                                        variant="filled" 
                                        size="medium"
                                    />
                                )}
                                {falliya.village_id?.village_name && (
                                    <Chip 
                                        label={`Village: ${falliya.village_id.village_name}`} 
                                        color="secondary" 
                                        variant="filled" 
                                        size="medium"
                                    />
                                )}
                            </Stack>
                        </CardContent>
                    </StyledCard>
                </Grid>

                {/* Map */}
                {(falliya.latitude && falliya.longitude && MAPBOX_ACCESS_TOKEN) && (
                    <Grid item xs={12}>
                        <StyledCard>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Location Map
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                
                                <Box sx={{ height: '400px', width: '100%' }}>
                                    <Map
                                        {...viewport}
                                        onMove={evt => setViewport(evt.viewState)}
                                        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
                                        style={{ width: '100%', height: '100%' }}
                                        mapStyle="mapbox://styles/mapbox/streets-v11"
                                    >
                                        <Marker
                                            longitude={falliya.longitude}
                                            latitude={falliya.latitude}
                                            color="red"
                                        />
                                    </Map>
                                </Box>
                                
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    <strong>Coordinates:</strong> {falliya.latitude}, {falliya.longitude}
                                </Typography>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                )}

                {/* Metadata */}
                <Grid item xs={12} md={6}>
                    <StyledCard>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Record Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            
                            <InfoRow label="Created At">
                                <Typography variant="body1">
                                    {falliya.created_at ? new Date(falliya.created_at).toLocaleString() : 'Unknown'}
                                </Typography>
                            </InfoRow>
                            
                            <InfoRow label="Created By">
                                <Typography variant="body1">
                                    {falliya.created_by?.email || 'Unknown'}
                                </Typography>
                            </InfoRow>
                            
                            {falliya.updated_at && (
                                <InfoRow label="Last Updated">
                                    <Typography variant="body1">
                                        {new Date(falliya.updated_at).toLocaleString()}
                                    </Typography>
                                </InfoRow>
                            )}
                            
                            {falliya.updated_by?.email && (
                                <InfoRow label="Updated By">
                                    <Typography variant="body1">
                                        {falliya.updated_by.email}
                                    </Typography>
                                </InfoRow>
                            )}
                        </CardContent>
                    </StyledCard>
                </Grid>

                {/* Quick Stats */}
                <Grid item xs={12} md={6}>
                    <StyledCard>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Quick Statistics
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            
                            <Stack spacing={2}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" color="text.secondary">
                                        Gender Ratio (M:F):
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {falliya.male_count && falliya.female_count ? 
                                            `${Math.round((falliya.male_count / falliya.female_count) * 1000)}:1000` : 
                                            'N/A'
                                        }
                                    </Typography>
                                </Box>
                                
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" color="text.secondary">
                                        Male Percentage:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {falliya.total_count > 0 ? 
                                            `${((falliya.male_count / falliya.total_count) * 100).toFixed(1)}%` : 
                                            'N/A'
                                        }
                                    </Typography>
                                </Box>
                                
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2" color="text.secondary">
                                        Female Percentage:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {falliya.total_count > 0 ? 
                                            `${((falliya.female_count / falliya.total_count) * 100).toFixed(1)}%` : 
                                            'N/A'
                                        }
                                    </Typography>
                                </Box>
                                
                                {falliya.location && (
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" color="text.secondary">
                                            Has Location Data:
                                        </Typography>
                                        <Chip 
                                            label="Yes" 
                                            color="success" 
                                            size="small" 
                                        />
                                    </Box>
                                )}
                                
                                {(falliya.latitude && falliya.longitude) && (
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" color="text.secondary">
                                            Has Coordinates:
                                        </Typography>
                                        <Chip 
                                            label="Yes" 
                                            color="success" 
                                            size="small" 
                                        />
                                    </Box>
                                )}
                            </Stack>
                        </CardContent>
                    </StyledCard>
                </Grid>
            </Grid>
        </Container>
    );
}