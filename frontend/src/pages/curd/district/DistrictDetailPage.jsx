import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Grid,
    CardContent,
    Chip,
    Stack,
    Avatar,
    Divider,
    Button,
    IconButton,
    Paper,
    LinearProgress,
    Alert,
    Breadcrumbs,
    Link
} from '@mui/material';
import {
    ArrowBack,
    LocationOn,
    Description,
    Edit,
    CalendarToday,
    Domain
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';

const DistrictDetailPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [district, setDistrict] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('DistrictDetailPage mounted with ID:', id);
        fetchDistrictDetails();
    }, [id]);

    const fetchDistrictDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('serviceToken');
            const response = await axiosServices.get(`/districts/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setDistrict(response.data.data);
                setError(null);
            } else {
                setError('Failed to fetch district details');
            }
        } catch (error) {
            console.error('Error fetching district details:', error);
            setError('Error loading district details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleEdit = () => {
        navigate(`/district/edit/${id}`);
    };

    const handleBack = () => {
        navigate('/district');
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading district details...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
                    Back to Districts
                </Button>
            </Container>
        );
    }

    if (!district) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    District not found
                </Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
                    Back to Districts
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}>
                        <ArrowBack />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" component="h1">
                            District Details
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {formatDateTime(district.created_at)}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={handleEdit}
                        sx={{ ml: 'auto' }}
                    >
                        Edit District
                    </Button>
                </Stack>

                {/* Breadcrumbs */}
                <Breadcrumbs aria-label="breadcrumb">
                    <Link
                        underline="hover"
                        color="inherit"
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate('/');
                        }}
                    >
                        Dashboard
                    </Link>
                    <Link
                        underline="hover"
                        color="inherit"
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate('/district');
                        }}
                    >
                        Districts
                    </Link>
                    <Typography color="text.primary">
                        {district.name}
                    </Typography>
                </Breadcrumbs>
            </Box>

            <Grid container spacing={3}>
                {/* Main Info Card */}
                <Grid item xs={12} md={8}>
                    <MainCard>
                        <CardContent>
                            {/* District Header */}
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Avatar
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        mr: 2,
                                        border: `3px solid ${theme.palette.primary.main}`,
                                        bgcolor: theme.palette.primary.main
                                    }}
                                >
                                    <Domain />
                                </Avatar>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
                                        {district.name}
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                        <Chip
                                            label="District"
                                            color="primary"
                                            size="small"
                                        />
                                        {district.status && (
                                            <Chip
                                                label={district.status}
                                                color="secondary"
                                                size="small"
                                            />
                                        )}
                                    </Stack>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Basic Information */}
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <LocationOn sx={{ mr: 1 }} />
                                Basic Information
                            </Typography>

                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        District Name
                                    </Typography>
                                    <Typography variant="body1">
                                        {district.name}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        District Code
                                    </Typography>
                                    <Typography variant="body1">
                                        {district.code || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        State
                                    </Typography>
                                    <Typography variant="body1">
                                        {district.state_id?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Division
                                    </Typography>
                                    <Typography variant="body1">
                                        {district.division_id?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        District Type
                                    </Typography>
                                    <Typography variant="body1">
                                        {district.type || 'Administrative District'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Area (sq km)
                                    </Typography>
                                    <Typography variant="body1">
                                        {district.area ? `${district.area.toLocaleString()} sq km` : 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />

                            {/* Administrative Information */}
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <Domain sx={{ mr: 1 }} />
                                Administrative Information
                            </Typography>

                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Headquarters
                                    </Typography>
                                    <Typography variant="body1">
                                        {district.headquarters || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        District Collector
                                    </Typography>
                                    <Typography variant="body1">
                                        {district.collector_name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Established Date
                                    </Typography>
                                    <Typography variant="body1">
                                        {district.established_date ? formatDate(district.established_date) : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Population
                                    </Typography>
                                    <Typography variant="body1">
                                        {district.population ? district.population.toLocaleString() : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Number of Tehsils
                                    </Typography>
                                    <Typography variant="body1">
                                        {district.tehsil_count || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Number of Blocks
                                    </Typography>
                                    <Typography variant="body1">
                                        {district.block_count || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Number of Villages
                                    </Typography>
                                    <Typography variant="body1">
                                        {district.village_count || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Literacy Rate
                                    </Typography>
                                    <Typography variant="body1">
                                        {district.literacy_rate ? `${district.literacy_rate}%` : 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>

                            {/* Description */}
                            {district.description && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                        <Description sx={{ mr: 1 }} />
                                        Description
                                    </Typography>
                                    <Paper sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                                        <div dangerouslySetInnerHTML={{ __html: district.description }} />
                                    </Paper>
                                </>
                            )}
                        </CardContent>
                    </MainCard>
                </Grid>

                {/* Sidebar */}
                <Grid item xs={12} md={4}>
                    <Stack spacing={3}>
                        {/* Statistics */}
                        <MainCard title="District Statistics">
                            <Stack spacing={2}>
                                {district.population && (
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Population
                                        </Typography>
                                        <Typography variant="h6" color="primary">
                                            {district.population.toLocaleString()}
                                        </Typography>
                                    </Box>
                                )}
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Tehsils
                                    </Typography>
                                    <Typography variant="h6" color="secondary">
                                        {district.tehsil_count || 0}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Blocks
                                    </Typography>
                                    <Typography variant="h6" color="success.main">
                                        {district.block_count || 0}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Villages
                                    </Typography>
                                    <Typography variant="h6" color="warning.main">
                                        {district.village_count || 0}
                                    </Typography>
                                </Box>
                                {district.area && (
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Area Coverage
                                        </Typography>
                                        <Typography variant="h6" color="info.main">
                                            {district.area.toLocaleString()} sq km
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>
                        </MainCard>

                        {/* Metadata */}
                        <MainCard title="Metadata">
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Created At
                                    </Typography>
                                    <Typography variant="body2">
                                        {formatDateTime(district.created_at)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Last Updated
                                    </Typography>
                                    <Typography variant="body2">
                                        {formatDateTime(district.updated_at)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Created By
                                    </Typography>
                                    <Typography variant="body2">
                                        {district.created_by?.name || (typeof district.created_by === 'string' ? district.created_by : 'System')}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Updated By
                                    </Typography>
                                    <Typography variant="body2">
                                        {district.updated_by?.name || (typeof district.updated_by === 'string' ? district.updated_by : 'System')}
                                    </Typography>
                                </Box>
                            </Stack>
                        </MainCard>
                    </Stack>
                </Grid>
            </Grid>
        </Container>
    );
};

export default DistrictDetailPage;
