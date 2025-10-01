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
    Person,
    LocationOn,
    Work,
    Description,
    Timeline,
    Article,
    Edit,
    Share,
    Download,
    Phone,
    Email,
    CalendarToday,
    Group
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';

const PartyDetailPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [party, setParty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('PartyDetailPage mounted with ID:', id);
        fetchPartyDetails();
    }, [id]);

    const fetchPartyDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('serviceToken');
            const response = await axiosServices.get(`/parties/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setParty(response.data.data);
                setError(null);
            } else {
                setError('Failed to fetch party details');
            }
        } catch (error) {
            console.error('Error fetching party details:', error);
            setError('Error loading party details. Please try again.');
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
        navigate(`/parties/edit/${id}`);
    };

    const handleBack = () => {
        navigate('/parties');
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading party details...</Typography>
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
                    Back to Parties
                </Button>
            </Container>
        );
    }

    if (!party) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Party not found
                </Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
                    Back to Parties
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
                            Party Details
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {formatDateTime(party.created_at)}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={handleEdit}
                        sx={{ ml: 'auto' }}
                    >
                        Edit Party
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
                            navigate('/parties');
                        }}
                    >
                        Parties
                    </Link>
                    <Typography color="text.primary">
                        {party.name}
                    </Typography>
                </Breadcrumbs>
            </Box>

            {/* All Party Information in 3-column layout */}
            <MainCard>
                <CardContent>
                    <Grid container spacing={3}>
                        {/* Column 1 */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Party Name
                                    </Typography>
                                    <Typography variant="body1">
                                        {party.name}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Abbreviation
                                    </Typography>
                                    <Typography variant="body1">
                                        {party.abbreviation || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Founded Year
                                    </Typography>
                                    <Typography variant="body1">
                                        {party.founded_year || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Symbol
                                    </Typography>
                                    <Typography variant="body1">
                                        {party.symbol || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Party Leader
                                    </Typography>
                                    <Typography variant="body1">
                                        {party.leader_name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        President
                                    </Typography>
                                    <Typography variant="body1">
                                        {party.president_name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Secretary General
                                    </Typography>
                                    <Typography variant="body1">
                                        {party.secretary_general || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Spokesperson
                                    </Typography>
                                    <Typography variant="body1">
                                        {party.spokesperson || 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Column 2 */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Contact Phone
                                    </Typography>
                                    <Typography variant="body1">
                                        {party.phone || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Contact Email
                                    </Typography>
                                    <Typography variant="body1">
                                        {party.email || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Website
                                    </Typography>
                                    <Typography variant="body1">
                                        {party.website ? (
                                            <Link href={party.website} target="_blank" rel="noopener">
                                                {party.website}
                                            </Link>
                                        ) : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Social Media
                                    </Typography>
                                    <Typography variant="body1">
                                        {party.social_media || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Headquarters Address
                                    </Typography>
                                    <Typography variant="body1">
                                        {party.address || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Total Members
                                    </Typography>
                                    <Typography variant="body1">
                                        {party.member_count ? party.member_count.toLocaleString() : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Active Candidates
                                    </Typography>
                                    <Typography variant="body1">
                                        {party.candidate_count || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Status
                                    </Typography>
                                    <Typography variant="body1">
                                        {party.status || 'N/A'}
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
                                        {party.created_by?.username || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Last Updated
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDateTime(party.updated_at)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Updated By
                                    </Typography>
                                    <Typography variant="body1">
                                        {party.updated_by?.username || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Created At
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDateTime(party.created_at)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Full-width sections for longer content */}
                    {party.description && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Description & Ideology
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                <div dangerouslySetInnerHTML={{ __html: party.description }} />
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </MainCard>
        </Container>
    );
};

export default PartyDetailPage;
