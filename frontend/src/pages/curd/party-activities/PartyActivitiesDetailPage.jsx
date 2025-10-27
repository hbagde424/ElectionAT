import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, CardContent, Stack, Button, IconButton, LinearProgress, Alert, Breadcrumbs, Link, Chip } from '@mui/material';
import { ArrowBack, Edit, Campaign, People, LocationOn, CalendarToday } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';
import DetailRenderer from 'components/DetailRenderer';
import { usePermissions } from 'contexts/PermissionContext';

export default function PartyActivitiesDetailPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const { userHierarchy, getUserHighestLevel } = usePermissions();
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

            {/* Access Scope Information */}
            <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                    <strong>Data Access:</strong> {(() => {
                        if (!userHierarchy) return 'You have access to all Party Activities data';
                        const highest = getUserHighestLevel();
                        const labelMap = { state: 'State', division: 'Division', parliament: 'Parliament', assembly: 'Assembly', block: 'Block', booth: 'Booth' };
                        const idMap = { state: userHierarchy.state, division: userHierarchy.division, parliament: userHierarchy.parliament, assembly: userHierarchy.assembly, block: userHierarchy.block, booth: userHierarchy.booth };
                        return `You have access to Party Activities data for ${labelMap[highest] || 'Unknown'}: ${idMap[highest] || 'Unknown'}`;
                    })()}
                </Typography>
            </Alert>

            <MainCard>
                <CardContent>
                    <DetailRenderer data={activity} />
                </CardContent>
            </MainCard>

            {/* Media Gallery */}
            {activity.media && activity.media.length > 0 && (
                <MainCard sx={{ mt: 3 }}>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>
                            Photos & Videos ({activity.media.length})
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            {activity.media.map((item, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Box
                                        sx={{
                                            border: '1px solid #ddd',
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            '&:hover': {
                                                boxShadow: 3
                                            }
                                        }}
                                    >
                                        {item.type === 'photo' ? (
                                            <img
                                                src={`${import.meta.env.VITE_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/media/${item.filename}`}
                                                alt={item.caption || 'Activity photo'}
                                                style={{
                                                    width: '100%',
                                                    height: '200px',
                                                    objectFit: 'cover'
                                                }}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : (
                                            <Box
                                                sx={{
                                                    width: '100%',
                                                    height: '200px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    bgcolor: '#f5f5f5'
                                                }}
                                            >
                                                <a
                                                    href={`${import.meta.env.VITE_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/media/${item.filename}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        fontSize: '48px',
                                                        textDecoration: 'none'
                                                    }}
                                                >
                                                    🎥
                                                </a>
                                            </Box>
                                        )}
                                        <Box
                                            sx={{
                                                display: 'none',
                                                width: '100%',
                                                height: '200px',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: '#f5f5f5',
                                                color: '#999'
                                            }}
                                        >
                                            Image not available
                                        </Box>
                                        {item.caption && (
                                            <Box sx={{ p: 1.5, bgcolor: '#fafafa' }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {item.caption}
                                                </Typography>
                                            </Box>
                                        )}
                                        <Box sx={{ p: 1, bgcolor: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Chip
                                                label={item.type === 'photo' ? 'Photo' : 'Video'}
                                                size="small"
                                                color={item.type === 'photo' ? 'primary' : 'secondary'}
                                            />
                                            <Button
                                                size="small"
                                                href={`${import.meta.env.VITE_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}/uploads/media/${item.filename}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                View
                                            </Button>
                                        </Box>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </MainCard>
            )}
        </Container>
    );
}
