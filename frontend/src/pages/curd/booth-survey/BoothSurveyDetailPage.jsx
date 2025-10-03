import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Grid,
    CardContent,
    Stack,
    Button,
    IconButton,
    LinearProgress,
    Alert,
    Breadcrumbs,
    Link,
    Paper
} from '@mui/material';
import { ArrowBack, Edit, Phone, Room } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';
import DetailRenderer from 'components/DetailRenderer';

const BoothSurveyDetailPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSurveyDetails();
    }, [id]);

    const fetchSurveyDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('serviceToken');
            const response = await axiosServices.get(`/booth-surveys/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setSurvey(response.data.data);
                setError(null);
            } else {
                setError('Failed to fetch survey details');
            }
        } catch (err) {
            console.error('Error fetching survey details:', err);
            setError('Error loading survey details. Please try again.');
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
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const handleBack = () => navigate('/booth-survey');
    const handleEdit = () => navigate(`/booth-survey/edit/${id}`);

    const filteredSurvey = useMemo(() => {
        if (!survey) return null;
        const exclude = new Set(['created_at', 'updated_at', 'created_by', 'updated_by', 'contact_number', 'latitude', 'longitude']);
        const out = {};
        Object.keys(survey).forEach((k) => { if (!exclude.has(k)) out[k] = survey[k]; });
        return out;
    }, [survey]);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading survey details...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Surveys</Button>
            </Container>
        );
    }

    if (!survey) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>Survey not found</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Surveys</Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}>
                        <ArrowBack />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" component="h1">Survey Details</Typography>
                        <Typography variant="body2" color="text.secondary">{formatDateTime(survey.created_at)}</Typography>
                    </Box>
                    <Button variant="contained" startIcon={<Edit />} onClick={handleEdit} sx={{ ml: 'auto' }}>Edit Survey</Button>
                </Stack>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e)=>{e.preventDefault();navigate('/');}}>Dashboard</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e)=>{e.preventDefault();navigate('/booth-survey');}}>Booth Surveys</Link>
                    <Typography color="text.primary">Survey {survey._id}</Typography>
                </Breadcrumbs>
            </Box>

            <MainCard>
                <Box sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', p: 2, borderRadius: '8px 8px 0 0' }}>
                    <Grid container alignItems="center">
                        <Grid item xs>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>Survey {survey._id || ''}</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>{survey.respondent_name ? survey.respondent_name : 'Booth Survey'}</Typography>
                        </Grid>
                        <Grid item>
                            <Stack direction="row" spacing={1}>
                                <Button variant="contained" color="secondary" startIcon={<Edit />} onClick={handleEdit}>Edit</Button>
                                {survey.contact_number && (
                                    <Button variant="outlined" color="inherit" startIcon={<Phone />} href={`tel:${survey.contact_number}`}>Call</Button>
                                )}
                                {survey.latitude && survey.longitude && (
                                    <Button variant="outlined" color="inherit" startIcon={<Room />} onClick={() => window.open(`https://www.google.com/maps?q=${survey.latitude},${survey.longitude}`, '_blank')}>Open Map</Button>
                                )}
                            </Stack>
                        </Grid>
                    </Grid>
                </Box>

                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Paper elevation={0} sx={{ p: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">All Fields</Typography>
                                <Box sx={{ mt: 1 }}>
                                    {/* filter out metadata/contact/coords so they only show in Metadata & Actions */}
                                    <DetailRenderer data={filteredSurvey} />
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Paper elevation={0} sx={{ p: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Metadata & Actions</Typography>
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2">Created: {formatDateTime(survey.created_at)}</Typography>
                                    <Typography variant="body2">Updated: {formatDateTime(survey.updated_at)}</Typography>
                                    <Typography variant="body2">Created By: {survey.created_by?.username || survey.created_by?.name || 'N/A'}</Typography>
                                    <Typography variant="body2">Updated By: {survey.updated_by?.username || survey.updated_by?.name || 'N/A'}</Typography>
                                    {survey.contact_number && (
                                        <Typography variant="body2" sx={{ mt: 1 }}>Contact: {survey.contact_number}</Typography>
                                    )}
                                    {survey.latitude && survey.longitude && (
                                        <Typography variant="body2" sx={{ mt: 1 }}>Coordinates: {survey.latitude}, {survey.longitude}</Typography>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper' }}>
                                <Typography variant="subtitle2" color="text.secondary">Remarks</Typography>
                                <Box sx={{ mt: 1 }}>
                                    {survey.remark || survey.note || survey.description ? (
                                        <Typography variant="body1">{survey.remark || survey.note || survey.description}</Typography>
                                    ) : (
                                        <Typography variant="body1" color="text.secondary">No remarks provided.</Typography>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </CardContent>
            </MainCard>
        </Container>
    );
};

export default BoothSurveyDetailPage;
