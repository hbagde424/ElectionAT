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
            <MainCard sx={{ mb: 3, background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton
                            onClick={() => navigate('/visits')}
                            sx={{
                                bgcolor: 'background.paper',
                                boxShadow: 2,
                                '&:hover': { bgcolor: 'background.paper', transform: 'scale(1.05)' }
                            }}
                        >
                            <ArrowBack />
                        </IconButton>
                        <Box>
                            <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
                                Visit Details
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {formatDateTime(visit.date)}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Status and Key Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                        icon={<span>{getStatusIcon(visit.work_status)}</span>}
                        label={visit.work_status?.toUpperCase() || 'N/A'}
                        color={getStatusColor(visit.work_status)}
                        size="large"
                        sx={{ fontWeight: 'bold' }}
                    />
                    <Chip
                        label={visit.post || 'N/A'}
                        variant="outlined"
                        color="primary"
                    />
                    <Chip
                        label={visit.election_year_id?.year ? `${visit.election_year_id.year} (${visit.election_year_id.election_type})` : 'N/A'}
                        variant="outlined"
                        color="secondary"
                    />
                </Box>
            </MainCard>

            <Grid container spacing={3}>
                {/* Left Column - Main Info */}
                <Grid item xs={12} lg={8}>
                    {/* Candidate Information */}
                    <MainCard sx={{ mb: 3 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                                <Avatar
                                    src={visit.candidate_id?.photo}
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        border: `4px solid ${theme.palette.primary.main}`,
                                        boxShadow: 3
                                    }}
                                >
                                    <Person sx={{ fontSize: 40 }} />
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                                        {visit.candidate_id?.name || 'N/A'}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" gutterBottom>
                                        {visit.candidate_id?.caste || 'N/A'} • {visit.candidate_id?.education || 'N/A'}
                                    </Typography>
                                    {visit.candidate_id?.mobile && (
                                        <Typography variant="body2" color="text.secondary">
                                            📱 {visit.candidate_id.mobile}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </CardContent>
                    </MainCard>

                    {/* Location Information */}
                    <MainCard sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationOn color="primary" />
                                Location Details
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            State
                                        </Typography>
                                        <Chip label={visit.state_id?.name || 'N/A'} color="primary" />
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Division
                                        </Typography>
                                        <Chip label={visit.division_id?.name || 'N/A'} color="secondary" />
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Assembly
                                        </Typography>
                                        <Chip label={visit.assembly_id?.name || 'N/A'} color="info" />
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Parliament
                                        </Typography>
                                        <Chip label={visit.parliament_id?.name || 'N/A'} color="warning" />
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Block
                                        </Typography>
                                        <Chip label={visit.block_id?.name || 'N/A'} color="success" />
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Booth
                                        </Typography>
                                        <Chip label={visit.booth_id?.name || 'N/A'} />
                                    </Paper>
                                </Grid>
                            </Grid>

                            {visit.locationName && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Full Location
                                    </Typography>
                                    <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                                        <Typography variant="body1">
                                            📍 {visit.locationName}
                                        </Typography>
                                        {visit.latitude && visit.longitude && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                Coordinates: {visit.latitude}, {visit.longitude}
                                            </Typography>
                                        )}
                                    </Paper>
                                </Box>
                            )}
                        </CardContent>
                    </MainCard>

                    {/* Visit Details */}
                    {(visit.description || visit.remark || visit.visitAgenda) && (
                        <MainCard sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Description color="primary" />
                                    Visit Details
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                {visit.description && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Description
                                        </Typography>
                                        <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                                            <div dangerouslySetInnerHTML={{ __html: visit.description }} />
                                        </Paper>
                                    </Box>
                                )}

                                {visit.visitAgenda && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Visit Agenda
                                        </Typography>
                                        <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                                            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                                                {visit.visitAgenda}
                                            </Typography>
                                        </Paper>
                                    </Box>
                                )}

                                {visit.remark && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Remarks
                                        </Typography>
                                        <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                                            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                                                {visit.remark}
                                            </Typography>
                                        </Paper>
                                    </Box>
                                )}
                            </CardContent>
                        </MainCard>
                    )}

                    {/* Speech Content */}
                    {(visit.speechFiveLines || visit.speechIssue) && (
                        <MainCard sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Article color="primary" />
                                    Speech Content
                                </Typography>
                                <Divider sx={{ mb: 2 }} />

                                {visit.speechFiveLines && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Speech Punch Line
                                        </Typography>
                                        <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                                            <div dangerouslySetInnerHTML={{ __html: visit.speechFiveLines }} />
                                        </Paper>
                                    </Box>
                                )}

                                {visit.speechIssue && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Speech Issue
                                        </Typography>
                                        <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
                                            <div dangerouslySetInnerHTML={{ __html: visit.speechIssue }} />
                                        </Paper>
                                    </Box>
                                )}
                            </CardContent>
                        </MainCard>
                    )}
                </Grid>

                {/* Right Column - Timeline & Additional Info */}
                <Grid item xs={12} lg={4}>
                    {/* Timeline */}
                    <MainCard sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Timeline color="primary" />
                                Timeline
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Stack spacing={2}>
                                {visit.announcementDate && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            bgcolor: 'primary.main'
                                        }} />
                                        <Box>
                                            <Typography variant="subtitle2">Announced</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(visit.announcementDate)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        bgcolor: 'secondary.main'
                                    }} />
                                    <Box>
                                        <Typography variant="subtitle2">Visit Date</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {formatDate(visit.date)}
                                        </Typography>
                                    </Box>
                                </Box>

                                {visit.completionDate && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            bgcolor: 'success.main'
                                        }} />
                                        <Box>
                                            <Typography variant="subtitle2">Completed</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(visit.completionDate)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}

                                {visit.budgetAnnouncedDate && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            bgcolor: 'warning.main'
                                        }} />
                                        <Box>
                                            <Typography variant="subtitle2">Budget Announced</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(visit.budgetAnnouncedDate)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}
                            </Stack>
                        </CardContent>
                    </MainCard>

                    {/* Additional Information */}
                    <MainCard sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Work color="primary" />
                                Additional Info
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Stack spacing={2}>
                                {visit.workName && (
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Work Name
                                        </Typography>
                                        <Typography variant="body1">
                                            {visit.workName}
                                        </Typography>
                                    </Box>
                                )}

                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Created By
                                    </Typography>
                                    <Typography variant="body1">
                                        {visit.created_by?.username || 'N/A'}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Last Updated
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDateTime(visit.updated_at)}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </MainCard>

                    {/* Documents */}
                    {Array.isArray(visit.documents) && visit.documents.length > 0 && (
                        <MainCard sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Article color="primary" />
                                    Documents
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Stack spacing={1}>
                                    {visit.documents.map((doc, idx) => (
                                        doc ? (
                                            <Button
                                                key={idx}
                                                variant="outlined"
                                                startIcon={<Download />}
                                                href={doc.filePath}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                fullWidth
                                                sx={{ justifyContent: 'flex-start' }}
                                            >
                                                {doc.name || `Document ${idx + 1}`}
                                            </Button>
                                        ) : null
                                    ))}
                                </Stack>
                            </CardContent>
                        </MainCard>
                    )}
                </Grid>
            </Grid>
        </Container>
    );
};

export default VisitDetailPage;
