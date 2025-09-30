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
    AccountBalance
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';

const ParliamentDetailPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [parliament, setParliament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('ParliamentDetailPage mounted with ID:', id);
        fetchParliamentDetails();
    }, [id]);

    const fetchParliamentDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('serviceToken');
            const response = await axiosServices.get(`/parliaments/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setParliament(response.data.data);
                setError(null);
            } else {
                setError('Failed to fetch parliament details');
            }
        } catch (error) {
            console.error('Error fetching parliament details:', error);
            setError('Error loading parliament details. Please try again.');
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
        navigate(`/parliament/edit/${id}`);
    };

    const handleBack = () => {
        navigate('/parliament');
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading parliament details...</Typography>
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
                    Back to Parliaments
                </Button>
            </Container>
        );
    }

    if (!parliament) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Parliament not found
                </Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
                    Back to Parliaments
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
                            Parliament Details
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {formatDateTime(parliament.created_at)}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={handleEdit}
                        sx={{ ml: 'auto' }}
                    >
                        Edit Parliament
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
                            navigate('/parliament');
                        }}
                    >
                        Parliaments
                    </Link>
                    <Typography color="text.primary">
                        {parliament.name}
                    </Typography>
                </Breadcrumbs>
            </Box>

            <Grid container spacing={3}>
                {/* Main Info Card */}
                <Grid item xs={12} md={8}>
                    <MainCard>
                        <CardContent>
                            {/* Parliament Header */}
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
                                    <AccountBalance />
                                </Avatar>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
                                        {parliament.name}
                                    </Typography>
                                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                        <Chip
                                            label="Parliament Constituency"
                                            color="primary"
                                            size="small"
                                        />
                                        {parliament.status && (
                                            <Chip
                                                label={parliament.status}
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
                                        Parliament Name
                                    </Typography>
                                    <Typography variant="body1">
                                        {parliament.name}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Parliament Code
                                    </Typography>
                                    <Typography variant="body1">
                                        {parliament.code || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        State
                                    </Typography>
                                    <Typography variant="body1">
                                        {parliament.state_id?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Division
                                    </Typography>
                                    <Typography variant="body1">
                                        {parliament.division_id?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Constituency Type
                                    </Typography>
                                    <Typography variant="body1">
                                        {parliament.constituency_type || 'General'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Reserved For
                                    </Typography>
                                    <Typography variant="body1">
                                        {parliament.reserved_for || 'General'}
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />

                            {/* Electoral Information */}
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <AccountBalance sx={{ mr: 1 }} />
                                Electoral Information
                            </Typography>

                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Total Voters
                                    </Typography>
                                    <Typography variant="body1">
                                        {parliament.total_voters ? parliament.total_voters.toLocaleString() : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Male Voters
                                    </Typography>
                                    <Typography variant="body1">
                                        {parliament.male_voters ? parliament.male_voters.toLocaleString() : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Female Voters
                                    </Typography>
                                    <Typography variant="body1">
                                        {parliament.female_voters ? parliament.female_voters.toLocaleString() : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Number of Assemblies
                                    </Typography>
                                    <Typography variant="body1">
                                        {parliament.assembly_count || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Established Date
                                    </Typography>
                                    <Typography variant="body1">
                                        {parliament.established_date ? formatDate(parliament.established_date) : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Area (sq km)
                                    </Typography>
                                    <Typography variant="body1">
                                        {parliament.area ? `${parliament.area.toLocaleString()} sq km` : 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>

                            {/* Description */}
                            {parliament.description && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                        <Description sx={{ mr: 1 }} />
                                        Description
                                    </Typography>
                                    <Paper sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                                        <div dangerouslySetInnerHTML={{ __html: parliament.description }} />
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
                        <MainCard title="Electoral Statistics">
                            <Stack spacing={2}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Total Voters
                                    </Typography>
                                    <Typography variant="h6" color="primary">
                                        {parliament.total_voters ? parliament.total_voters.toLocaleString() : '0'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Assembly Constituencies
                                    </Typography>
                                    <Typography variant="h6" color="secondary">
                                        {parliament.assembly_count || 0}
                                    </Typography>
                                </Box>
                                {parliament.area && (
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Area Coverage
                                        </Typography>
                                        <Typography variant="h6" color="success.main">
                                            {parliament.area.toLocaleString()} sq km
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
                                        {formatDateTime(parliament.created_at)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Last Updated
                                    </Typography>
                                    <Typography variant="body2">
                                        {formatDateTime(parliament.updated_at)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Created By
                                    </Typography>
                                    <Typography variant="body2">
                                        {parliament.created_by?.name || (typeof parliament.created_by === 'string' ? parliament.created_by : 'System')}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Updated By
                                    </Typography>
                                    <Typography variant="body2">
                                        {parliament.updated_by?.name || (typeof parliament.updated_by === 'string' ? parliament.updated_by : 'System')}
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

export default ParliamentDetailPage;
