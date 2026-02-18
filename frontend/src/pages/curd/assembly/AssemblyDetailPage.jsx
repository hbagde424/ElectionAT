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

export default function assemblyDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assembly, setassembly] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    useEffect(() => {
        const fetchassembly = async () => {
            try {
                const token = localStorage.getItem('serviceToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblys/${id}`, { headers });
                const json = await res.json();

                if (json.success) {
                    setassembly(json.data);
                } else {
                    setError('assembly not found');
                }
            } catch (err) {
                setError('Failed to fetch assembly details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchassembly();
    }, [id]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !assembly) {
        return (
            <MainCard>
                <Alert severity="error">{error || 'assembly not found'}</Alert>
                <Button startIcon={<ArrowLeft />} onClick={() => navigate('/assembly')} sx={{ mt: 2 }}>
                    Back to assemblys
                </Button>
            </MainCard>
        );
    }

    const assemblyGeoJSON = assembly.polygon ? {
        type: 'FeatureCollection',
        features: [assembly.polygon]
    } : null;

    return (
        <MainCard>
            <Stack spacing={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h4">{assembly.name}</Typography>
                    <Button startIcon={<ArrowLeft />} onClick={() => navigate('/assembly')}>
                        Back to assemblys
                    </Button>
                </Box>

                <Divider />

                {/* Map Section */}
                {assemblyGeoJSON && mapboxToken && (
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2 }}>assembly Location</Typography>
                        <MapContainerStyled sx={{ minHeight: 400 }}>
                            <Map
                                mapboxAccessToken={mapboxToken}
                                initialViewState={{
                                    longitude: assembly.longitude || 77.0,
                                    latitude: assembly.latitude || 23.5,
                                    zoom: 12
                                }}
                                mapStyle="mapbox://styles/mapbox/streets-v12"
                            >
                                <MapControl />
                                <Source id="assembly-polygon" type="geojson" data={assemblyGeoJSON}>
                                    <Layer id="assembly-fill" type="fill" paint={{ 'fill-color': '#4CAF50', 'fill-opacity': 0.3 }} />
                                    <Layer id="assembly-outline" type="line" paint={{ 'line-color': '#388E3C', 'line-width': 3 }} />
                                </Source>
                            </Map>
                        </MapContainerStyled>
                    </Box>
                )}

                {/* Details Section */}
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">assembly Number</Typography>
                            <Chip label={assembly.assembly_number || 'N/A'} color="primary" size="medium" />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Full Address</Typography>
                            <Typography variant="body1">{assembly.description || 'N/A'}</Typography>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Coordinates</Typography>
                            <Typography variant="body2">Latitude: {assembly.latitude || 0}</Typography>
                            <Typography variant="body2">Longitude: {assembly.longitude || 0}</Typography>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Voter Statistics</Typography>
                            <Typography variant="body2">Male: {assembly.type || 0}</Typography>
                            <Typography variant="body2">Female: {assembly.Fetype || 0}</Typography>
                            <Typography variant="body2">Others: {assembly.others_Count || 0}</Typography>
                            <Typography variant="body1" fontWeight="bold">Total: {assembly.Total || 0}</Typography>
                        </Stack>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Block</Typography>
                            <Chip label={assembly.parliament_id?.name || 'N/A'} color="secondary" size="medium" variant="outlined" />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Assembly</Typography>
                            <Chip label={assembly.assembly_id?.name || 'N/A'} color="info" size="medium" variant="outlined" />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Parliament</Typography>
                            <Chip label={assembly.parliament_id?.name || 'N/A'} color="warning" size="medium" variant="outlined" />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Division</Typography>
                            <Chip label={assembly.division_id?.name || 'N/A'} color="success" size="medium" variant="outlined" />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">State</Typography>
                            <Chip label={assembly.state_id?.name || 'N/A'} color="primary" size="medium" variant="outlined" />
                        </Stack>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Created By</Typography>
                            <Typography variant="body2">{assembly.created_by?.username || 'N/A'}</Typography>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Updated By</Typography>
                            <Typography variant="body2">{assembly.updated_by?.username || 'N/A'}</Typography>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Created At</Typography>
                            <Typography variant="body2">
                                {assembly.created_at ? new Date(assembly.created_at).toLocaleString() : 'N/A'}
                            </Typography>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Updated At</Typography>
                            <Typography variant="body2">
                                {assembly.updated_at ? new Date(assembly.updated_at).toLocaleString() : 'N/A'}
                            </Typography>
                        </Stack>
                    </Grid>
                </Grid>
            </Stack>
        </MainCard>
    );
}

