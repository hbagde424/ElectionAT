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
    Person,
    Phone,
    Email,
    Business,
    Public,
    AccountBalance,
    Download
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';
import { usePermissions } from 'contexts/PermissionContext';

const BoothVolunteerDetailPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const { userHierarchy, getUserHighestLevel } = usePermissions();
    const [volunteer, setVolunteer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('BoothVolunteerDetailPage mounted with ID:', id);
        fetchVolunteerDetails();
    }, [id]);

    const fetchVolunteerDetails = async () => {
        try {
            setLoading(true);
            console.log('Fetching volunteer details for ID:', id);
            const token = localStorage.getItem('serviceToken');
            console.log('Token available:', !!token);

            const response = await axiosServices.get(`/booth-volunteers/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log('Volunteer API response:', response);
            if (response.data.success) {
                setVolunteer(response.data.data);
                setError(null);
            } else {
                console.error('API returned success: false', response.data);
                setError('Failed to fetch volunteer details');
            }
        } catch (error) {
            console.error('Error fetching volunteer details:', error);
            console.error('Error response:', error.response);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);
            setError('Error loading volunteer details. Please try again.');
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

    const handleBack = () => {
        navigate('/booth-volunteer');
    };

    // Get user's access scope information
    const getUserAccessScope = () => {
        if (!userHierarchy) {
            return { level: 'All', description: 'You have access to all booth volunteer data' };
        }

        const highestLevel = getUserHighestLevel();
        if (!highestLevel) {
            return { level: 'All', description: 'You have access to all booth volunteer data' };
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
            description: `You have access to booth volunteer data for ${levelName}: ${levelValue}`
        };
    };

    const accessScope = getUserAccessScope();

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading volunteer details...</Typography>
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
                    Back to Volunteers
                </Button>
            </Container>
        );
    }

    if (!volunteer) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Volunteer not found
                </Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
                    Back to Volunteers
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
                            Volunteer Details
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {formatDateTime(volunteer.created_at)}
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
                            navigate('/booth-volunteer');
                        }}
                    >
                        Booth Volunteers
                    </Link>
                    <Typography color="text.primary">
                        {volunteer.name}
                    </Typography>
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

            {/* All Volunteer Information in 3-column layout */}
            <MainCard>
                <CardContent>
                    <Grid container spacing={3}>
                        {/* Column 1 */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Volunteer Name
                                    </Typography>
                                    <Typography variant="body1">
                                        {volunteer.name}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Role
                                    </Typography>
                                    <Typography variant="body1">
                                        {volunteer.role || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Post
                                    </Typography>
                                    <Typography variant="body1">
                                        {volunteer.post || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Phone
                                    </Typography>
                                    <Typography variant="body1">
                                        {volunteer.phone || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Email
                                    </Typography>
                                    <Typography variant="body1">
                                        {volunteer.email || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Area Responsibility
                                    </Typography>
                                    <Typography variant="body1">
                                        {volunteer.area_responsibility || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Activity Level
                                    </Typography>
                                    <Chip
                                        label={volunteer.activity_level || 'N/A'}
                                        color={
                                            volunteer.activity_level === 'High' ? 'error' :
                                                volunteer.activity_level === 'Medium' ? 'warning' : 'success'
                                        }
                                        size="small"
                                    />
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Column 2 */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Booth
                                    </Typography>
                                    <Typography variant="body1">
                                        {volunteer.booth?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Party
                                    </Typography>
                                    <Typography variant="body1">
                                        {volunteer.party?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        State
                                    </Typography>
                                    <Typography variant="body1">
                                        {volunteer.state?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Division
                                    </Typography>
                                    <Typography variant="body1">
                                        {volunteer.division?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Parliament
                                    </Typography>
                                    <Typography variant="body1">
                                        {volunteer.parliament?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Assembly
                                    </Typography>
                                    <Typography variant="body1">
                                        {volunteer.assembly?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Block
                                    </Typography>
                                    <Typography variant="body1">
                                        {volunteer.block?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Column 3 */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Created By
                                    </Typography>
                                    <Typography variant="body1">
                                        {volunteer.created_by?.username || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Last Updated
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDateTime(volunteer.updated_at)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Updated By
                                    </Typography>
                                    <Typography variant="body1">
                                        {volunteer.updated_by?.username || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Created At
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDateTime(volunteer.created_at)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Full-width sections for longer content */}
                    {volunteer.remarks && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Remarks
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                {volunteer.remarks}
                            </Typography>
                        </Box>
                    )}

                    {/* Documents Section */}
                    {volunteer.documents && volunteer.documents.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                                Documents
                            </Typography>
                            <Grid container spacing={2}>
                                {volunteer.documents.map((doc, index) => (
                                    <Grid item xs={12} sm={6} md={4} key={index}>
                                        <Paper sx={{ p: 2, border: 1, borderColor: 'divider' }}>
                                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                                Document {index + 1}
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                {doc.originalname}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                                                {(doc.size / 1024 / 1024).toFixed(2)} MB
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                startIcon={<Download />}
                                                href={`${import.meta.env.VITE_APP_API_URL?.replace('/api', '') || 'https://myhostmanager.co.in/backend'}/uploads/volunteer-docs/${doc.filename}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                fullWidth
                                                size="small"
                                            >
                                                Download
                                            </Button>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                </CardContent>
            </MainCard>
        </Container>
    );
};

export default BoothVolunteerDetailPage;
