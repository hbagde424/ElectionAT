import React, { useState, useEffect } from 'react';
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
    Link
} from '@mui/material';
import { ArrowBack, CalendarToday } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';
import BoothVolunteerView from './VolunteerView';

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
                <CardContent>
                    {/* Use the existing view component to render the detailed layout */}
                    <BoothVolunteerView data={volunteer} />

                    {/* Additional full-width sections (remarks, bio, etc.) if present */}
                    {volunteer.remarks && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Remarks
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                                {volunteer.remarks}
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </MainCard>
        </Container>
    );
};

export default VolunteerDetailPage;
