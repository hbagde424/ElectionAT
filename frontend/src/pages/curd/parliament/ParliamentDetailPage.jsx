import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Grid, Chip, Divider, Button, Stack, Card, CardContent, Alert, CircularProgress
} from '@mui/material';
import { ArrowLeft, Edit } from 'iconsax-react';
import MainCard from 'components/MainCard';

export default function ParliamentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [parliament, setParliament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchParliament = async () => {
            try {
                const token = localStorage.getItem('serviceToken');
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments/${id}`, { headers });
                const json = await res.json();

                if (json.success) {
                    setParliament(json.data);
                } else {
                    setError(json.message || 'Failed to fetch parliament details');
                }
            } catch (err) {
                console.error('Error fetching parliament:', err);
                setError('An error occurred while fetching parliament details');
            } finally {
                setLoading(false);
            }
        };

        fetchParliament();
    }, [id]);

    if (loading) {
        return (
            <MainCard>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                    <CircularProgress />
                </Box>
            </MainCard>
        );
    }

    if (error || !parliament) {
        return (
            <MainCard>
                <Alert severity="error">{error || 'Parliament not found'}</Alert>
                <Button startIcon={<ArrowLeft />} onClick={() => navigate('/parliament')} sx={{ mt: 2 }}>
                    Back to Parliaments
                </Button>
            </MainCard>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <MainCard>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Button startIcon={<ArrowLeft />} onClick={() => navigate('/parliament')}>
                    Back to Parliaments
                </Button>
                <Button variant="contained" startIcon={<Edit />} onClick={() => navigate(`/parliament`)}>
                    Edit Parliament
                </Button>
            </Stack>

            <Card>
                <CardContent>
                    <Typography variant="h4" sx={{ mb: 3 }}>{parliament.name}</Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">PC Number</Typography>
                            <Chip label={parliament.parliament_no || 'N/A'} color="primary" sx={{ mt: 0.5 }} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">Category</Typography>
                            <Chip label={parliament.category || 'N/A'} color="secondary" sx={{ mt: 0.5 }} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">Regional Type</Typography>
                            <Chip label={parliament.regional_type || 'N/A'} sx={{ mt: 0.5 }} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">Division</Typography>
                            <Chip label={parliament.division_id?.name || 'N/A'} color="info" sx={{ mt: 0.5 }} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">State</Typography>
                            <Chip label={parliament.state_id?.name || 'N/A'} color="success" sx={{ mt: 0.5 }} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">Polygon Status</Typography>
                            <Chip
                                label={parliament.polygon ? 'Available' : 'Not Available'}
                                color={parliament.polygon ? 'success' : 'default'}
                                sx={{ mt: 0.5 }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                            <Typography
                                variant="body1"
                                sx={{ mt: 1 }}
                                dangerouslySetInnerHTML={{ __html: parliament.description || 'No description available' }}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">Created By</Typography>
                            <Typography variant="body1">{parliament.created_by?.username || 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">Created At</Typography>
                            <Typography variant="body1">{formatDate(parliament.created_at)}</Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">Updated By</Typography>
                            <Typography variant="body1">{parliament.updated_by?.username || 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">Updated At</Typography>
                            <Typography variant="body1">{formatDate(parliament.updated_at)}</Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </MainCard>
    );
}
