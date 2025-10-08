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
    Share,
    Download,
    Phone,
    Email,
    CalendarToday
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';

const CandidateDetailPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('CandidateDetailPage mounted with ID:', id);
        fetchCandidateDetails();
    }, [id]);

    const fetchCandidateDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('serviceToken');
            const response = await axiosServices.get(`/candidates/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setCandidate(response.data.data);
                setError(null);
            } else {
                setError('Failed to fetch candidate details');
            }
        } catch (error) {
            console.error('Error fetching candidate details:', error);
            setError('Error loading candidate details. Please try again.');
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
        navigate('/candidates');
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading candidate details...</Typography>
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
                    Back to Candidates
                </Button>
            </Container>
        );
    }

    if (!candidate) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Candidate not found
                </Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
                    Back to Candidates
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
                            Candidate Details
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {formatDateTime(candidate.created_at)}
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
                            navigate('/candidates');
                        }}
                    >
                        Candidates
                    </Link>
                    <Typography color="text.primary">
                        {candidate.name}
                    </Typography>
                </Breadcrumbs>
            </Box>

            {/* Candidate Information - only fields shown in list/table */}
            <MainCard>
                <CardContent>
                    <Grid container spacing={3}>
                        {/* Column 1 */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                                    <Typography variant="body1">{candidate.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Party</Typography>
                                    <Typography variant="body1">{candidate.party_id?.name || 'Independent'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Education</Typography>
                                    <Typography variant="body1">{candidate.education || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Assets</Typography>
                                    <Typography variant="body1">{candidate.assets || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Liabilities</Typography>
                                    <Typography variant="body1">{candidate.liabilities || 'N/A'}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Column 2 */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Caste</Typography>
                                    <Typography variant="body1">{candidate.caste || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Criminal Cases</Typography>
                                    <Typography variant="body1">{candidate.criminal_cases || 0}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                    <Typography variant="body1">{candidate.is_active ? 'Active' : 'Inactive'}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Column 3 */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                                    <Typography variant="body1">{candidate.created_by?.username || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Updated By</Typography>
                                    <Typography variant="body1">{candidate.updated_by?.username || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                                    <Typography variant="body1">{formatDateTime(candidate.created_at)}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                                    <Typography variant="body1">{formatDateTime(candidate.updated_at)}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Description (kept because it's in list preview) */}
                    {candidate.description && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                <div dangerouslySetInnerHTML={{ __html: candidate.description }} />
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </MainCard>
        </Container>
    );
};

export default CandidateDetailPage;
