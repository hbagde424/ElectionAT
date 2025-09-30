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
    Public
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';

const DivisionDetailPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [division, setDivision] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('DivisionDetailPage mounted with ID:', id);
        fetchDivisionDetails();
    }, [id]);

    const fetchDivisionDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('serviceToken');
            const response = await axiosServices.get(`/divisions/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setDivision(response.data.data);
                setError(null);
            } else {
                setError('Failed to fetch division details');
            }
        } catch (error) {
            console.error('Error fetching division details:', error);
            setError('Error loading division details. Please try again.');
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
        navigate(`/division/edit/${id}`);
    };

    const handleBack = () => {
        navigate('/division');
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading division details...</Typography>
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
                    Back to Divisions
                </Button>
            </Container>
        );
    }

    if (!division) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Division not found
                </Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
                    Back to Divisions
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
                            Division Details
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {formatDateTime(division.created_at)}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={handleEdit}
                        sx={{ ml: 'auto' }}
                    >
                        Edit Division
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
                            navigate('/division');
                        }}
                    >
                        Divisions
                    </Link>
                    <Typography color="text.primary">
                        {division.name}
                    </Typography>
                </Breadcrumbs>
            </Box>

            <Grid container spacing={3}>
                {/* Main Info Card */}
                <Grid item xs={12} md={8}>
                    <MainCard>
                        <CardContent>
                            {/* Division Header */}
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
                                    <Public />
                                </Avatar>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
                                        {division.name}
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                        <Chip
                                            label="Division"
                                            color="primary"
                                            size="small"
                                        />
                                        {division.status && (
                                            <Chip
                                                label={division.status}
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
                                        Division Name
                                    </Typography>
                                    <Typography variant="body1">
                                        {division.name}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Division Code
                                    </Typography>
                                    <Typography variant="body1">
                                        {division.code || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        State
                                    </Typography>
                                    <Typography variant="body1">
                                        {division.state_id?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Type
                                    </Typography>
                                    <Typography variant="body1">
                                        {division.type || 'Administrative Division'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Area (sq km)
                                    </Typography>
                                    <Typography variant="body1">
                                        {division.area ? `${division.area.toLocaleString()} sq km` : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Population
                                    </Typography>
                                    <Typography variant="body1">
                                        {division.population ? division.population.toLocaleString() : 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />

                            {/* Administrative Information */}
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <Public sx={{ mr: 1 }} />
                                Administrative Information
                            </Typography>

                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Headquarters
                                    </Typography>
                                    <Typography variant="body1">
                                        {division.headquarters || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Established Date
                                    </Typography>
                                    <Typography variant="body1">
                                        {division.established_date ? formatDate(division.established_date) : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Number of Parliaments
                                    </Typography>
                                    <Typography variant="body1">
                                        {division.parliament_count || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Number of Assemblies
                                    </Typography>
                                    <Typography variant="body1">
                                        {division.assembly_count || 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>

                            {/* Description */}
                            {division.description && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                        <Description sx={{ mr: 1 }} />
                                        Description
                                    </Typography>
                                    <Paper sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                                        <div dangerouslySetInnerHTML={{ __html: division.description }} />
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
                        <MainCard title="Statistics">
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Total Parliaments
                                    </Typography>
                                    <Typography variant="h6" color="primary">
                                        {division.parliament_count || 0}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Total Assemblies
                                    </Typography>
                                    <Typography variant="h6" color="secondary">
                                        {division.assembly_count || 0}
                                    </Typography>
                                </Box>
                                {division.population && (
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Population
                                        </Typography>
                                        <Typography variant="h6" color="success.main">
                                            {division.population.toLocaleString()}
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
                                        {formatDateTime(division.created_at)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Last Updated
                                    </Typography>
                                    <Typography variant="body2">
                                        {formatDateTime(division.updated_at)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Created By
                                    </Typography>
                                    <Typography variant="body2">
                                        {division.created_by?.name || (typeof division.created_by === 'string' ? division.created_by : 'System')}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Updated By
                                    </Typography>
                                    <Typography variant="body2">
                                        {division.updated_by?.name || (typeof division.updated_by === 'string' ? division.updated_by : 'System')}
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

export default DivisionDetailPage;
