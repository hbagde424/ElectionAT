import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, CardContent, Stack, Button, IconButton, LinearProgress, Alert, Breadcrumbs, Link, Paper } from '@mui/material';
import { ArrowBack, Edit } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';
import DetailRenderer from 'components/DetailRenderer';

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
            const token = localStorage.getItem('serviceToken');
            const res = await axiosServices.get(`/faqs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data?.success) setFaq(res.data.data);
            else setError('Failed to fetch FAQ details');
        } catch (err) { console.error(err); setError('Error loading FAQ details.'); } finally { setLoading(false); }
    };

    const filteredFaq = useMemo(() => {
        if (!faq) return null;
        const exclude = new Set(['created_by', 'updated_by', 'created_at', 'updated_at']);
        const out = {};
        Object.keys(faq).forEach((k) => {
            if (!exclude.has(k)) {
                // Strip HTML tags for answer/description so raw tags like <p> don't show in the UI
                if (k === 'answer' || k === 'description') {
                    const val = faq[k] || '';
                    out[k] = typeof val === 'string' ? val.replace(/<[^>]+>/g, '') : val;
                } else {
                    out[k] = faq[k];
                }
            }
        });
        return out;
    }, [faq]);
    const formatDateTime = (dateString) => { if (!dateString) return 'N/A'; try { return new Date(dateString).toLocaleString(); } catch (e) { return 'N/A'; } };

    const handleBack = () => navigate('/faq-crud');
    // Navigate to the edit page for this FAQ. Adjust the route if your app uses a different edit path.
    const handleEdit = () => navigate(`/faq-crud/edit/${id}`);


    if (loading) return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            <LinearProgress />
            <Box sx={{ mt: 2 }}><Typography>Loading FAQ details...</Typography></Box>
        </Container>
    );

    if (error) return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to FAQs</Button>
        </Container>
    );

    if (!faq) return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>FAQ not found</Alert>
            <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to FAQs</Button>
        </Container>
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}><ArrowBack /></IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" component="h1">FAQ Details</Typography>
                        <Typography variant="body2" color="text.secondary">{faq.question?.slice(0, 120)}</Typography>
                    </Box>
                    <Button variant="contained" startIcon={<Edit />} onClick={handleEdit}>Edit</Button>
                </Stack>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/faq-crud'); }}>FAQs</Link>
                    <Typography color="text.primary">{faq.question?.slice(0, 40) || faq._id}</Typography>
                </Breadcrumbs>
            </Box>

            <MainCard>
                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Paper elevation={0} sx={{ p: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Fields</Typography>
                                <Box sx={{ mt: 1 }}>
                                    <DetailRenderer data={filteredFaq} />
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Paper elevation={0} sx={{ p: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Metadata</Typography>
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2">Created: {formatDateTime(faq.created_at)}</Typography>
                                    <Typography variant="body2">Updated: {formatDateTime(faq.updated_at)}</Typography>
                                    <Typography variant="body2">Created By: {faq.created_by?.username || faq.created_by?.name || 'N/A'}</Typography>
                                    <Typography variant="body2">Updated By: {faq.updated_by?.username || faq.updated_by?.name || 'N/A'}</Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </CardContent>
            </MainCard>
        </Container>
    );
}