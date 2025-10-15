import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, CardContent, Stack, Button, IconButton, LinearProgress, Alert, Breadcrumbs, Link, Chip } from '@mui/material';
import { ArrowBack, Edit, Event, LocationOn, CalendarToday, Person } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';
import DetailRenderer from 'components/DetailRenderer';
import { usePermissions } from 'contexts/PermissionContext';

export default function EventDetailPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const { userHierarchy, getUserHighestLevel } = usePermissions();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            console.log('Fetching event details for ID:', id);
            const token = localStorage.getItem('serviceToken');
            const res = await axiosServices.get(`/events/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Event API response:', res);
            if (res.data.success) {
                setEvent(res.data.data);
                setError('');
            } else {
                console.error('API returned success: false', res.data);
                setError('Failed to fetch event details');
            }
        } catch (err) {
            console.error('Error fetching event details:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
            setError('Error loading event details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'done': return 'success';
            case 'incomplete': return 'warning';
            case 'cancelled': return 'error';
            case 'postponed': return 'info';
            default: return 'default';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'event': return 'primary';
            case 'campaign': return 'secondary';
            case 'activity': return 'info';
            default: return 'default';
        }
    };

    const handleBack = () => navigate('/Events');

    // Get user's access scope information
    const getUserAccessScope = () => {
        if (!userHierarchy) {
            return { level: 'All', description: 'You have access to all events data' };
        }

        const highestLevel = getUserHighestLevel();
        if (!highestLevel) {
            return { level: 'All', description: 'You have access to all events data' };
        }

        const levelNames = {
            state: 'State',
            division: 'Division',
            parliament: 'Parliament',
            assembly: 'Assembly',
            block: 'Block',
            booth: 'Booth'
        };

        const levelName = levelNames[highestLevel.level] || 'Unknown';
        const levelValue = highestLevel.value || 'Unknown';

        return {
            level: levelName,
            description: `You have access to events data for ${levelName}: ${levelValue}`
        };
    };

    const accessScope = getUserAccessScope();

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading event details...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Events</Button>
            </Container>
        );
    }

    if (!event) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>Event not found</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Events</Button>
            </Container>
        );
    }

    // Safety check to prevent white screen
    console.log('Rendering event details:', event);

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                        Event Details
                    </Typography>
                </Stack>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/Events'); }}>Events</Link>
                    <Typography color="text.primary">{event.name || event._id}</Typography>
                </Breadcrumbs>
            </Box>

            {/* Access Scope Information */}
            <Alert
                severity="info"
                sx={{ mb: 3 }}
            >
                <Typography variant="body2">
                    <strong>Data Access:</strong> {accessScope.description}
                </Typography>
            </Alert>

            <MainCard>
                <CardContent>
                    <DetailRenderer data={event} />
                </CardContent>
            </MainCard>
        </Container>
    );
}
