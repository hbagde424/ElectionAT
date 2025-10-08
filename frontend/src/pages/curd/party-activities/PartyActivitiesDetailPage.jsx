import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, CardContent, Stack, Button, IconButton, LinearProgress, Alert, Breadcrumbs, Link, Chip } from '@mui/material';
import { ArrowBack, Edit, Campaign, People, LocationOn, CalendarToday } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';
import DetailRenderer from 'components/DetailRenderer';

export default function PartyActivitiesDetailPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [activity, setActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            console.log('Fetching party activity details for ID:', id);
            const token = localStorage.getItem('serviceToken');
            const res = await axiosServices.get(`/party-activities/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Party activity API response:', res);
            if (res.data.success) {
                setActivity(res.data.data);
                setError('');
            } else {
                console.error('API returned success: false', res.data);
                setError('Failed to fetch party activity details');
            }
        } catch (err) {
            console.error('Error fetching party activity details:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
            setError('Error loading party activity details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateString) => { if (!dateString) return 'N/A'; return new Date(dateString).toLocaleString(); };
    const formatDate = (dateString) => { if (!dateString) return 'N/A'; return new Date(dateString).toLocaleDateString(); };

    const getActivityTypeColor = (type) => {
        switch (type) {
            case 'rally': return 'error';
            case 'sabha': return 'warning';
            case 'meeting': return 'info';
            case 'campaign': return 'primary';
            case 'door_to_door': return 'secondary';
            case 'press_conference': return 'success';
            default: return 'default';
        }
    };

    const getActivityTypeLabel = (type) => {
        switch (type) {
            case 'rally': return 'Rally';
            case 'sabha': return 'Sabha';
            case 'meeting': return 'Meeting';
            case 'campaign': return 'Campaign';
            case 'door_to_door': return 'Door to Door';
            case 'press_conference': return 'Press Conference';
            default: return type || 'Unknown';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'success';
            case 'ongoing': return 'warning';
            case 'planned': return 'info';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    const handleBack = () => navigate('/Party-Activities');


    if (loading) return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            <LinearProgress />
            <Box sx={{ mt: 2 }}><Typography>Loading party activity details...</Typography></Box>
        </Container>
    );

    if (error) return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Party Activities</Button>
        </Container>
    );

    if (!activity) return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>Party activity not found</Alert>
            <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Party Activities</Button>
        </Container>
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}><ArrowBack /></IconButton>
                    <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>Party Activity Details</Typography>
                </Stack>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/Party-Activities'); }}>Party Activities</Link>
                    <Typography color="text.primary">{activity.activity_type || activity._id}</Typography>
                </Breadcrumbs>
            </Box>

            <MainCard>
                <CardContent>
                    <DetailRenderer data={activity} />
                </CardContent>
            </MainCard>
        </Container>
    );
}
