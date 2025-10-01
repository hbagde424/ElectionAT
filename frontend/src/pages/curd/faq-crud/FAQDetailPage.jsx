import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, CardContent, Stack, Button, IconButton, LinearProgress, Alert, Breadcrumbs, Link, Chip } from '@mui/material';
import { ArrowBack, Edit, Help, QuestionAnswer, Category, Person, CalendarToday } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';

export default function FAQDetailPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [faq, setFaq] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            console.log('Fetching FAQ details for ID:', id);
            const token = localStorage.getItem('serviceToken');
            const res = await axiosServices.get(`/faqs/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('FAQ API response:', res);
            if (res.data.success) {
                setFaq(res.data.data);
                setError('');
            } else {
                console.error('API returned success: false', res.data);
                setError('Failed to fetch FAQ details');
            }
        } catch (err) {
            console.error('Error fetching FAQ details:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
            setError('Error loading FAQ details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'General Questions': return 'primary';
            case 'Account & Login': return 'secondary';
            case 'Data & Analytics': return 'info';
            case 'Technical Support': return 'warning';
            case 'Other': return 'default';
            default: return 'default';
        }
    };

    const getStatusColor = (isActive) => {
        return isActive ? 'success' : 'error';
    };

    const handleBack = () => navigate('/faq-crud');
    const handleEdit = () => navigate(`/faq-crud/edit/${id}`);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading FAQ details...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to FAQs</Button>
            </Container>
        );
    }

    if (!faq) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>FAQ not found</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to FAQs</Button>
            </Container>
        );
    }

    // Safety check to prevent white screen
    console.log('Rendering FAQ details:', faq);

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                        FAQ Details
                    </Typography>
                </Stack>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/faq-crud'); }}>FAQs</Link>
                    <Typography color="text.primary">{faq.question || faq._id}</Typography>
                </Breadcrumbs>
            </Box>

            <MainCard>
                <CardContent>
                    <Grid container spacing={3}>
                        {/* Column 1: Question & Category Information */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Question</Typography>
                                    <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 'medium' }}>
                                        {faq.question || 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                                    <Chip
                                        label={faq.category || 'N/A'}
                                        color={getCategoryColor(faq.category)}
                                        size="small"
                                        sx={{ mt: 0.5 }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                    <Chip
                                        label={faq.is_active ? 'Active' : 'Inactive'}
                                        color={getStatusColor(faq.is_active)}
                                        size="small"
                                        sx={{ mt: 0.5 }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Order Index</Typography>
                                    <Typography variant="body1">{faq.order_index || 0}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Column 2: Answer Information */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Answer</Typography>
                                    <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                        {faq.answer || 'No answer provided'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Column 3: Metadata Information */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                                    <Typography variant="body1">{faq.created_by?.name || faq.created_by?.email || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Updated By</Typography>
                                    <Typography variant="body1">{faq.updated_by?.name || faq.updated_by?.email || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                                    <Typography variant="body1">{formatDateTime(faq.created_at)}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                                    <Typography variant="body1">{formatDateTime(faq.updated_at)}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </CardContent>
            </MainCard>
        </Container>
    );
}
