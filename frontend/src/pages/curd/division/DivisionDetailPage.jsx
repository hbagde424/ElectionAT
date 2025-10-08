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

    // Edit button removed per request

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
                    {/* Edit button removed */}
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
                <Grid item xs={12}>
                    <MainCard>
                        <CardContent>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" color="text.secondary">Division Name</Typography>
                                    <Typography variant="body1">{division.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" color="text.secondary">Division Code</Typography>
                                    <Typography variant="body1">{division.code || division.division_code || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" color="text.secondary">State</Typography>
                                    <Typography variant="body1">{division.state_id?.name || 'N/A'}</Typography>
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                                    <Typography variant="body1">{division.description || 'N/A'}</Typography>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                                    <Typography variant="body1">{division.created_by?.name || (typeof division.created_by === 'string' ? division.created_by : 'System')}</Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" color="text.secondary">Updated By</Typography>
                                    <Typography variant="body1">{division.updated_by?.name || (typeof division.updated_by === 'string' ? division.updated_by : 'System')}</Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                                    <Typography variant="body1">{formatDateTime(division.created_at)}</Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                                    <Typography variant="body1">{formatDateTime(division.updated_at)}</Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </MainCard>
                </Grid>
            </Grid>
        </Container>
    );
};

export default DivisionDetailPage;
