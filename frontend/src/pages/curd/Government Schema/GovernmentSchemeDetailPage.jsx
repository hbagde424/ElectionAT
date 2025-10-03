import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, CardContent, Stack, Button, IconButton, LinearProgress, Alert, Breadcrumbs, Link, Chip } from '@mui/material';
import { ArrowBack, Edit, Business, AttachMoney, CalendarToday, Description } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';

export default function GovernmentSchemeDetailPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [scheme, setScheme] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            console.log('Fetching government scheme details for ID:', id);
            const token = localStorage.getItem('serviceToken');
            const res = await axiosServices.get(`/governments/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Government scheme API response:', res);
            if (res.data.success) {
                setScheme(res.data.data);
                setError('');
            } else {
                console.error('API returned success: false', res.data);
                setError('Failed to fetch government scheme details');
            }
        } catch (err) {
            console.error('Error fetching government scheme details:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
            setError('Error loading government scheme details. Please try again.');
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return 'N/A';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'new': return 'success';
            case 'old': return 'info';
            default: return 'default';
        }
    };

    const handleBack = () => navigate('/Government-Schema');
    const handleEdit = () => navigate(`/Government-Schema/edit/${id}`);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading government scheme details...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Government Schemes</Button>
            </Container>
        );
    }

    if (!scheme) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>Government scheme not found</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Government Schemes</Button>
            </Container>
        );
    }

    // Safety check to prevent white screen
    console.log('Rendering government scheme details:', scheme);

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                        Government Scheme Details
                    </Typography>
                </Stack>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/Government-Schema'); }}>Government Schemes</Link>
                    <Typography color="text.primary">{scheme.name || scheme._id}</Typography>
                </Breadcrumbs>
            </Box>

            <MainCard>
                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Scheme Name</Typography>
                            <Typography variant="body1">{scheme.name || 'N/A'}</Typography>

                            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Scheme Type</Typography>
                            <Chip label={scheme.type || 'N/A'} color={getTypeColor(scheme.type)} size="small" sx={{ mt: 0.5 }} />

                            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Amount</Typography>
                            <Typography variant="body1" color="primary" sx={{ fontWeight: '500' }}>{formatCurrency(scheme.amount)}</Typography>

                            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Project Complete Date</Typography>
                            <Typography variant="body1">{formatDate(scheme.project_complete_date)}</Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">State</Typography>
                            <Typography variant="body1">{scheme.state_id?.name || 'N/A'}</Typography>

                            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Division</Typography>
                            <Typography variant="body1">{scheme.division_id?.name || 'N/A'}</Typography>

                            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Parliament</Typography>
                            <Typography variant="body1">{scheme.parliament_id?.name || 'N/A'}</Typography>

                            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Assembly</Typography>
                            <Typography variant="body1">{scheme.assembly_id?.name || 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                            <Typography variant="body1">{scheme.created_by?.username || scheme.created_by?.name || 'N/A'}</Typography>

                            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Updated By</Typography>
                            <Typography variant="body1">{scheme.updated_by?.username || scheme.updated_by?.name || 'N/A'}</Typography>

                            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Created At</Typography>
                            <Typography variant="body1">{formatDateTime(scheme.created_at || scheme.createdAt)}</Typography>

                            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Updated At</Typography>
                            <Typography variant="body1">{formatDateTime(scheme.updated_at || scheme.updatedAt)}</Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>{scheme.description || 'No description provided'}</Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </MainCard>
        </Container>
    );
}
