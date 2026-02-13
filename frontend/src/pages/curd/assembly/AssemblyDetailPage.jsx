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
    Business
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';
import PolygonMap from 'components/PolygonMap';

const AssemblyDetailPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [assembly, setAssembly] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [assemblyPolygon, setAssemblyPolygon] = useState(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    useEffect(() => {
        console.log('AssemblyDetailPage mounted with ID:', id);
        fetchAssemblyDetails();
    }, [id]);

    useEffect(() => {
        if (assembly?.AC_NO) {
            fetchAssemblyPolygon();
        }
    }, [assembly?.AC_NO]);

    const fetchAssemblyDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('serviceToken');
            const response = await axiosServices.get(`/assemblies/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setAssembly(response.data.data);
                setError(null);
            } else {
                setError('Failed to fetch assembly details');
            }
        } catch (error) {
            console.error('Error fetching assembly details:', error);
            setError('Error loading assembly details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAssemblyPolygon = async () => {
        try {
            // Assembly data already has polygon field
            if (assembly?.polygon) {
                // Check if polygon is a valid GeoJSON feature
                if (assembly.polygon.type === 'Feature' && assembly.polygon.geometry) {
                    setAssemblyPolygon({ 
                        type: 'FeatureCollection', 
                        features: [assembly.polygon] 
                    });
                    return;
                } else if (assembly.polygon.type === 'FeatureCollection' && assembly.polygon.features) {
                    setAssemblyPolygon(assembly.polygon);
                    return;
                }
            }
            
            setAssemblyPolygon(null);
        } catch (e) {
            console.error('Failed to load assembly polygon:', e);
            setAssemblyPolygon(null);
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

    const handleBack = () => {
        navigate('/assembly');
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading assembly details...</Typography>
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
                    Back to Assemblies
                </Button>
            </Container>
        );
    }

    if (!assembly) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Assembly not found
                </Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
                    Back to Assemblies
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
                            Assembly Details
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {formatDateTime(assembly.created_at)}
                        </Typography>
                    </Box>
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
                            navigate('/assembly');
                        }}
                    >
                        Assemblies
                    </Link>
                    <Typography color="text.primary">
                        {assembly.name}
                    </Typography>
                </Breadcrumbs>
            </Box>

            {/* Assembly Information - Only Available Fields */}
            <MainCard>
                <CardContent>
                    <Grid container spacing={3}>
                        {/* Column 1 */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Assembly Name
                                    </Typography>
                                    <Typography variant="body1">
                                        {assembly.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Assembly Number
                                    </Typography>
                                    <Typography variant="body1">
                                        {assembly.AC_NO || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Type
                                    </Typography>
                                    <Typography variant="body1">
                                        {assembly.type || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Category
                                    </Typography>
                                    <Typography variant="body1">
                                        {assembly.category || 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Column 2 */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        State
                                    </Typography>
                                    <Typography variant="body1">
                                        {assembly.state_id?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Division
                                    </Typography>
                                    <Typography variant="body1">
                                        {assembly.division_id?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Parliament
                                    </Typography>
                                    <Typography variant="body1">
                                        {assembly.parliament_id?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Column 3 - Map */}
                        <Grid item xs={12} md={4}>
                            <PolygonMap 
                                polygon={assemblyPolygon} 
                                mapboxToken={mapboxToken}
                                height={300}
                            />
                        </Grid>
                    </Grid>

                    {/* Additional Info Row */}
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Created By
                            </Typography>
                            <Typography variant="body1">
                                {assembly.created_by?.username || 'N/A'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Updated By
                            </Typography>
                            <Typography variant="body1">
                                {assembly.updated_by?.username || 'N/A'}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Created At
                            </Typography>
                            <Typography variant="body1">
                                {formatDateTime(assembly.created_at)}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Updated At
                            </Typography>
                            <Typography variant="body1">
                                {formatDateTime(assembly.updated_at)}
                            </Typography>
                        </Grid>
                    </Grid>

                    {/* Full-width section for description */}
                    {assembly.description && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Description
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                <div dangerouslySetInnerHTML={{ __html: assembly.description }} />
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </MainCard>
        </Container>
    );
};

export default AssemblyDetailPage;
