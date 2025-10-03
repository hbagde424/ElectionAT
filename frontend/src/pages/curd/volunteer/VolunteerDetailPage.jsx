import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Grid,
    CardContent,
    Stack,
    Divider,
    Button,
    IconButton,
    LinearProgress,
    Alert,
    Breadcrumbs,
    Link,
    Paper
} from '@mui/material';
import { ArrowBack, CalendarToday, Phone, Room } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';
import BoothVolunteerView from './VolunteerView';
import DetailRenderer from 'components/DetailRenderer';

const VolunteerDetailPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [volunteer, setVolunteer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchVolunteer();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchVolunteer = async () => {
        try {
            setLoading(true);
            const res = await axiosServices.get(`/booth-volunteers/${id}`);
            if (res.data?.success) {
                setVolunteer(res.data.data);
            } else {
                setError('Volunteer not found');
            }
        } catch (err) {
            console.error('Error fetching volunteer:', err);
            setError(`Failed to load volunteer details: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const filteredVolunteer = useMemo(() => {
        if (!volunteer) return null;
        const exclude = new Set(['created_at', 'updated_at', 'created_by', 'updated_by', 'phone', 'latitude', 'longitude', 'documents', 'remarks']);
        const out = {};
        Object.keys(volunteer).forEach((k) => { if (!exclude.has(k)) out[k] = volunteer[k]; });
        return out;
    }, [volunteer]);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <LinearProgress />
                <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
                    Loading volunteer details...
                </Typography>
            </Container>
        );
    }

    if (error || !volunteer) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error || 'Volunteer not found'}
                </Alert>
                <Button
                    variant="contained"
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/booth-volunteer')}
                >
                    Back to Volunteers
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Breadcrumbs sx={{ mb: 3 }}>
                <Link
                    color="inherit"
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        navigate('/booth-volunteer');
                    }}
                    sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                >
                    Booth Volunteers
                </Link>
                <Typography color="text.primary">Volunteer Details</Typography>
            </Breadcrumbs>

            <MainCard sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <IconButton onClick={() => navigate('/booth-volunteer')}>
                        <ArrowBack />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" component="h1" color="primary">
                            Volunteer Details
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {formatDateTime(volunteer.created_at)}
                        </Typography>
                    </Box>
                </Box>
            </MainCard>

            <MainCard>
                <Box sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', p: 2, borderRadius: '8px 8px 0 0' }}>
                    <Grid container alignItems="center">
                        <Grid item xs>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>{volunteer.name || 'Volunteer'}</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>{volunteer.role || volunteer.post || ''}</Typography>
                        </Grid>
                        <Grid item>
                            <Stack direction="row" spacing={1}>
                                <Button variant="contained" color="secondary" startIcon={<CalendarToday />}>Assign</Button>
                                {volunteer.phone && (
                                    <Button variant="outlined" color="inherit" startIcon={<Phone />} href={`tel:${volunteer.phone}`}>Call</Button>
                                )}
                                {volunteer.latitude && volunteer.longitude && (
                                    <Button variant="outlined" color="inherit" startIcon={<Room />} onClick={() => window.open(`https://www.google.com/maps?q=${volunteer.latitude},${volunteer.longitude}`, '_blank')}>Open Map</Button>
                                )}
                            </Stack>
                        </Grid>
                    </Grid>
                </Box>

                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Paper elevation={0} sx={{ p: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">All Fields</Typography>
                                <Box sx={{ mt: 1 }}>
                                    <DetailRenderer data={filteredVolunteer} />
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Paper elevation={0} sx={{ p: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Metadata & Actions</Typography>
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2">Created: {formatDateTime(volunteer.created_at)}</Typography>
                                    <Typography variant="body2">Updated: {formatDateTime(volunteer.updated_at)}</Typography>
                                    <Typography variant="body2">Created By: {volunteer.created_by?.username || volunteer.created_by?.name || 'N/A'}</Typography>
                                    <Typography variant="body2">Updated By: {volunteer.updated_by?.username || volunteer.updated_by?.name || 'N/A'}</Typography>
                                    {volunteer.phone && (
                                        <Typography variant="body2" sx={{ mt: 1 }}>Contact: {volunteer.phone}</Typography>
                                    )}
                                    {volunteer.latitude && volunteer.longitude && (
                                        <Typography variant="body2" sx={{ mt: 1 }}>Coordinates: {volunteer.latitude}, {volunteer.longitude}</Typography>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            {volunteer.remarks && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Remarks</Typography>
                                    <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-line' }}>{volunteer.remarks}</Typography>
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                </CardContent>
            </MainCard>
        </Container>
    );
};

export default VolunteerDetailPage;
