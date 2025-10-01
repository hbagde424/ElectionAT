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
        console.log('VisitDetailPage mounted with ID:', id);
        console.log('Current URL:', window.location.href);
        fetchVisitDetails();
    }, [id]);

    const fetchVisitDetails = async () => {
        try {
            setLoading(true);
            console.log('Fetching visit with ID:', id);
            const response = await axiosServices.get(`/visits/${id}`);
            console.log('Visit response:', response.data);
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

            {/* All Visit Information in 3-column layout */}
            <MainCard>
                <CardContent>
                    <Grid container spacing={3}>
                        {/* Column 1 */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        State
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.state_id?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Division
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.division_id?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Parliament
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.parliament_id?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Assembly
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.assembly_id?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Block
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.block_id?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Booth
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.booth_id?.name || 'N/A'}
                                        {visit.booth_id?.booth_number && ` (#${visit.booth_id.booth_number})`}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Politician
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.candidate_id?.name || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Year
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.election_year_id?.year ? `${visit.election_year_id.year} (${visit.election_year_id.election_type})` : 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Column 2 */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Post
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.post || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Date
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDate(visit.date)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Work Name
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.workName || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Work Status
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.work_status || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Announcement Date
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.announcementDate ? formatDate(visit.announcementDate) : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Completion Date
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.completionDate ? formatDate(visit.completionDate) : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Budget Announced Date
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.budgetAnnouncedDate ? formatDate(visit.budgetAnnouncedDate) : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Location Name
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.locationName || 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Column 3 */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Longitude
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.longitude || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Latitude
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.latitude || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Created By
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.created_by?.username || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Last Updated
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDateTime(visit.updated_at)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Updated By
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.updated_by?.username || 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Full-width sections for longer content */}
                    {visit.description && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Description
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                <div dangerouslySetInnerHTML={{ __html: visit.description }} />
                            </Typography>
                        </Box>
                    )}

                    {visit.visitAgenda && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Visit Agenda
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                                {visit.visitAgenda}
                            </Typography>
                        </Box>
                    )}

                    {visit.speechFiveLines && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Speech Punch Line
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                <div dangerouslySetInnerHTML={{ __html: visit.speechFiveLines }} />
                            </Typography>
                        </Box>
                    )}

                    {visit.speechIssue && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Speech Issue
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                <div dangerouslySetInnerHTML={{ __html: visit.speechIssue }} />
                            </Typography>
                        </Box>
                    )}

                    {visit.remark && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Remark
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                                {visit.remark}
                            </Typography>
                        </Box>
                    )}

                    {/* Documents */}
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                            Documents
                        </Typography>
                        <Grid container spacing={2}>
                            {[0, 1, 2].map((idx) => {
                                const doc = visit.documents && visit.documents[idx];
                                return (
                                    <Grid item xs={12} sm={4} key={idx}>
                                        <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, opacity: doc ? 1 : 0.5 }}>
                                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                                Document {idx + 1} Name:
                                            </Typography>
                                            <Typography variant="body2" sx={{ mb: 2, minHeight: '1.5em' }}>
                                                {doc?.name || 'No document uploaded'}
                                            </Typography>
                                            {doc ? (
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<Download />}
                                                    href={doc.filePath}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    fullWidth
                                                    size="small"
                                                >
                                                    Download
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outlined"
                                                    disabled
                                                    fullWidth
                                                    size="small"
                                                >
                                                    No file
                                                </Button>
                                            )}
                                        </Box>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Box>
                </CardContent>
            </MainCard>

            {/* Status and Key Info below the table */}

        </Container>
    );
};

export default VisitDetailPage;
