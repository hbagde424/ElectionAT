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
    Download
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';

const VisitDetailPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [visit, setVisit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchVisitDetails();
    }, [id]);

    const fetchVisitDetails = async () => {
        try {
            setLoading(true);
            const response = await axiosServices.get(`/visits/${id}`);
            if (response.data.success) {
                setVisit(response.data.data);
            } else {
                setError('Visit not found');
            }
        } catch (err) {
            console.error('Error fetching visit details:', err);
            setError(`Failed to load visit details: ${err.response?.data?.message || err.message}`);
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
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            'announced': 'default',
            'approved': 'info',
            'in progress': 'warning',
            'complete': 'success'
        };
        return colors[status] || 'default';
    };

    const getStatusIcon = (status) => {
        const icons = {
            'announced': '📢',
            'approved': '✅',
            'in progress': '🔄',
            'complete': '🎉'
        };
        return icons[status] || '📋';
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <LinearProgress />
                <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
                    Loading visit details...
                </Typography>
            </Container>
        );
    }

    if (error || !visit) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error || 'Visit not found'}
                </Alert>
                <Button
                    variant="contained"
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/visits')}
                >
                    Back to Visits
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Breadcrumbs */}
            <Breadcrumbs sx={{ mb: 3 }}>
                <Link
                    color="inherit"
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        navigate('/visits');
                    }}
                    sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                >
                    Visits
                </Link>
                <Typography color="text.primary">Visit Details</Typography>
            </Breadcrumbs>

            {/* Header Section */}
            <MainCard sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <IconButton onClick={() => navigate('/visits')}>
                        <ArrowBack />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" component="h1" color="primary">
                            Visit Details
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {formatDateTime(visit.date)}
                        </Typography>
                    </Box>
                </Box>

            </MainCard>

            <MainCard>
                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Candidate</Typography>
                                    <Typography variant="body1">{visit.candidate_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Post</Typography>
                                    <Typography variant="body1">{visit.post || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Election Year</Typography>
                                    <Typography variant="body1">{visit.election_year_id?.year ? `${visit.election_year_id.year} (${visit.election_year_id.election_type})` : 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                                    <Typography variant="body1">{formatDate(visit.date)}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Work Status</Typography>
                                    <Typography variant="body1">{visit.work_status || 'N/A'}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">State</Typography>
                                    <Typography variant="body1">{visit.state_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Division</Typography>
                                    <Typography variant="body1">{visit.division_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Parliament</Typography>
                                    <Typography variant="body1">{visit.parliament_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Assembly</Typography>
                                    <Typography variant="body1">{visit.assembly_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Block</Typography>
                                    <Typography variant="body1">{visit.block_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Booth</Typography>
                                    <Typography variant="body1">{visit.booth_id?.name || 'N/A'}{visit.booth_id?.booth_number ? ` (#${visit.booth_id.booth_number})` : ''}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Panchayat</Typography>
                                    <Chip label={visit.panchayat_id?.panchayat_name || 'N/A'} color="info" size="small" />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Village</Typography>
                                    <Chip label={visit.village_id?.village_name || 'N/A'} color="success" size="small" />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Falliya</Typography>
                                    <Chip label={visit.falliya_id?.falliya_name || 'N/A'} color="warning" size="small" />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Year</Typography>
                                    <Chip label={visit.year || 'N/A'} color="primary" size="small" />
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                                    <Typography variant="body1">{visit.locationName || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Longitude</Typography>
                                    <Typography variant="body1">{visit.longitude ?? 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Latitude</Typography>
                                    <Typography variant="body1">{visit.latitude ?? 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                                    <Typography variant="body1">{visit.created_by?.username || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Updated By</Typography>
                                    <Typography variant="body1">{visit.updated_by?.username || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                                    <Typography variant="body1">{formatDate(visit.created_at)}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                                    <Typography variant="body1">{formatDate(visit.updated_at)}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    {visit.description && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                <div dangerouslySetInnerHTML={{ __html: visit.description }} />
                            </Typography>
                        </Box>
                    )}

                    {visit.visitAgenda && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary">Visit Agenda</Typography>
                            <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-line' }}>{visit.visitAgenda}</Typography>
                        </Box>
                    )}

                    {visit.remark && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary">Remark</Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>{visit.remark}</Typography>
                        </Box>
                    )}
                </CardContent>
            </MainCard>

            {/* Status and Key Info below the table */}

        </Container>
    );
};

export default VisitDetailPage;
