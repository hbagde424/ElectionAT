import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Grid, Stack, Chip, Divider, Button, CircularProgress, Alert
} from '@mui/material';
import { ArrowLeft } from 'iconsax-react';
import MainCard from 'components/MainCard';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';

export default function BoothDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booth, setBooth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    useEffect(() => {
        const fetchBooth = async () => {
            try {
                const token = localStorage.getItem('serviceToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths/${id}`, { headers });
                const json = await res.json();

                if (json.success) {
                    setBooth(json.data);
                } else {
                    setError('Booth not found');
                }
            } catch (err) {
                setError('Failed to fetch booth details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchBooth();
    }, [id]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !booth) {
        return (
            <MainCard>
                <Alert severity="error">{error || 'Booth not found'}</Alert>
                <Button startIcon={<ArrowLeft />} onClick={() => navigate('/booth')} sx={{ mt: 2 }}>
                    Back to Booths
                </Button>
            </MainCard>
        );
    }

    const boothGeoJSON = booth.polygon ? {
        type: 'FeatureCollection',
        features: [booth.polygon]
    } : null;

    return (
        <MainCard>
            <Stack spacing={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h4">{booth.name}</Typography>
                    <Button startIcon={<ArrowLeft />} onClick={() => navigate('/booth')}>
                        Back to Booths
                    </Button>
                </Box>

                <Divider />

                {/* Map Section */}
                {boothGeoJSON && mapboxToken && (
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2 }}>Booth Location</Typography>
                        <MapContainerStyled sx={{ minHeight: 400 }}>
                            <Map
                                mapboxAccessToken={mapboxToken}
                                initialViewState={{
                                    longitude: booth.longitude || 77.0,
                                    latitude: booth.latitude || 23.5,
                                    zoom: 12
                                }}
                                mapStyle="mapbox://styles/mapbox/streets-v12"
                            >
                                <MapControl />
                                <Source id="booth-polygon" type="geojson" data={boothGeoJSON}>
                                    <Layer id="booth-fill" type="fill" paint={{ 'fill-color': '#4CAF50', 'fill-opacity': 0.3 }} />
                                    <Layer id="booth-outline" type="line" paint={{ 'line-color': '#388E3C', 'line-width': 3 }} />
                                </Source>
                            </Map>
                        </MapContainerStyled>
                    </Box>
                )}

                {/* Details Section */}
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Booth Number</Typography>
                            <Chip label={booth.booth_number || 'N/A'} color="primary" size="medium" />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Full Address</Typography>
                            <Typography variant="body1">{booth.full_address || 'N/A'}</Typography>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Coordinates</Typography>
                            <Typography variant="body2">Latitude: {booth.latitude || 0}</Typography>
                            <Typography variant="body2">Longitude: {booth.longitude || 0}</Typography>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Voter Statistics</Typography>
                            <Typography variant="body2">Male: {booth.Male_Count || 0}</Typography>
                            <Typography variant="body2">Female: {booth.Female_Count || 0}</Typography>
                            <Typography variant="body2">Others: {booth.others_Count || 0}</Typography>
                            <Typography variant="body1" fontWeight="bold">Total: {booth.Total || 0}</Typography>
                        </Stack>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Block</Typography>
                            <Chip label={booth.block_id?.name || 'N/A'} color="secondary" size="medium" variant="outlined" />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Assembly</Typography>
                            <Chip label={booth.assembly_id?.name || 'N/A'} color="info" size="medium" variant="outlined" />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Parliament</Typography>
                            <Chip label={booth.parliament_id?.name || 'N/A'} color="warning" size="medium" variant="outlined" />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Division</Typography>
                            <Chip label={booth.division_id?.name || 'N/A'} color="success" size="medium" variant="outlined" />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">State</Typography>
                            <Chip label={booth.state_id?.name || 'N/A'} color="primary" size="medium" variant="outlined" />
                        </Stack>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Created By</Typography>
                            <Typography variant="body2">{booth.created_by?.username || 'N/A'}</Typography>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Updated By</Typography>
                            <Typography variant="body2">{booth.updated_by?.username || 'N/A'}</Typography>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Created At</Typography>
                            <Typography variant="body2">
                                {booth.created_at ? new Date(booth.created_at).toLocaleString() : 'N/A'}
                            </Typography>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Updated At</Typography>
                            <Typography variant="body2">
                                {booth.updated_at ? new Date(booth.updated_at).toLocaleString() : 'N/A'}
                            </Typography>
                        </Stack>
                    </Grid>
                </Grid>
            </Stack>
        </MainCard>
    );
}
