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

export default function AssemblyDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assembly, setAssembly] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    useEffect(() => {
        const fetchAssembly = async () => {
            try {
                const token = localStorage.getItem('serviceToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies/${id}`, { headers });
                const json = await res.json();

                if (json.success) {
                    setAssembly(json.data);
                } else {
                    setError('Assembly not found');
                }
            } catch (err) {
                setError('Failed to fetch assembly details');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAssembly();
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
                <Alert severity="error">{error || 'Assembly not found'}</Alert>
                <Button startIcon={<ArrowLeft />} onClick={() => navigate('/assembly')} sx={{ mt: 2 }}>
                    Back to Assemblies
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
                        Back to Assemblies
                    </Button>
                </Box>

                <Divider />

                {assemblyGeoJSON && mapboxToken && (
                    <Box>
                        <Typography variant="h6" sx={{ mb: 2 }}>Assembly Location</Typography>
                        <MapContainerStyled sx={{ minHeight: 400 }}>
                            <Map
                                mapboxAccessToken={mapboxToken}
                                initialViewState={{
                                    longitude: 77.0,
                                    latitude: 23.5,
                                    zoom: 8
                                }}
                                mapStyle="mapbox://styles/mapbox/streets-v12"
                            >
                                <MapControl />
                                <Source id="assembly-polygon" type="geojson" data={assemblyGeoJSON}>
                                    <Layer id="assembly-fill" type="fill" paint={{ 'fill-color': '#9C27B0', 'fill-opacity': 0.3 }} />
                                    <Layer id="assembly-outline" type="line" paint={{ 'line-color': '#7B1FA2', 'line-width': 3 }} />
                                </Source>
                            </Map>
                        </MapContainerStyled>
                    </Box>
                )}

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">AC Number</Typography>
                            <Chip label={assembly.AC_NO || 'N/A'} color="primary" size="medium" />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Type</Typography>
                            <Chip label={assembly.type || 'N/A'} size="medium" variant="outlined" />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Category</Typography>
                            <Chip label={assembly.category || 'N/A'} color="secondary" size="medium" variant="outlined" />
                        </Stack>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider />
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
                            <Chip label={assembly.division_id?.name || 'N/A'} color="info" size="medium" variant="outlined" />
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">State</Typography>
                            <Chip label={assembly.state_id?.name || 'N/A'} color="success" size="medium" variant="outlined" />
                        </Stack>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider />
                    </Grid>

                    <Grid item xs={12}>
                        <Stack spacing={1}>
                            <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                            <Typography variant="body2">{assembly.description ? assembly.description.replace(/<[^>]+>/g, '') : 'N/A'}</Typography>
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
