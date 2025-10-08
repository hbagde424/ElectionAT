import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, CardContent, Stack, Button, IconButton, LinearProgress, Alert, Breadcrumbs, Link, Chip } from '@mui/material';
import { ArrowBack, Edit, CalendarToday, Description, Person, Business } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';

export default function YearDetailPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [year, setYear] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            console.log('Fetching year details for ID:', id);
            const token = localStorage.getItem('serviceToken');
            const res = await axiosServices.get(`/election-years/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Year API response:', res);
            if (res.data.success) {
                setYear(res.data.data);
                setError('');
            } else {
                console.error('API returned success: false', res.data);
                setError('Failed to fetch year details');
            }
        } catch (err) {
            console.error('Error fetching year details:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
            setError('Error loading year details. Please try again.');
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

    const getElectionTypeColor = (type) => {
        switch (type) {
            case 'Assembly': return 'primary';
            case 'Parliament': return 'secondary';
            default: return 'default';
        }
    };

    const handleBack = () => navigate('/year');


    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading year details...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Years</Button>
            </Container>
        );
    }

    if (!year) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>Year not found</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Years</Button>
            </Container>
        );
    }

    // Safety check to prevent white screen
    console.log('Rendering year details:', year);

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>Election Year Details</Typography>
                </Stack>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/year'); }}>Years</Link>
                    <Typography color="text.primary">{year.year || year._id}</Typography>
                </Breadcrumbs>
            </Box>

            <MainCard>
                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Year</Typography>
                            <Chip
                                label={year.year || 'N/A'}
                                color="primary"
                                size="large"
                                sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Election Type</Typography>
                            <Chip
                                label={year.election_type || 'N/A'}
                                color={year.election_type === 'Assembly' ? 'success' : 'secondary'}
                                size="medium"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                            <Typography 
                                variant="body1" 
                                sx={{ 
                                    fontStyle: year.description ? 'normal' : 'italic',
                                    color: year.description ? 'text.primary' : 'text.secondary'
                                }}
                            >
                                {year.description ? (
                                    <div dangerouslySetInnerHTML={{ __html: year.description }} />
                                ) : 'No description provided'}
                            </Typography>
                        </Grid>

                        {/* Metadata section - moved to bottom */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                            <Typography variant="body1">{year.created_by?.username || year.created_by?.name || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Updated By</Typography>
                            <Typography variant="body1">{year.updated_by?.username || year.updated_by?.name || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                            <Typography variant="body1">{formatDateTime(year.created_at)}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                            <Typography variant="body1">{formatDateTime(year.updated_at)}</Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </MainCard>
        </Container>
    );
}
