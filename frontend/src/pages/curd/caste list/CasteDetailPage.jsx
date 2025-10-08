import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, CardContent, Stack, Button, IconButton, LinearProgress, Alert, Breadcrumbs, Link, Chip } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';

export default function CasteDetailPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [entry, setEntry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            console.log('Fetching caste list details for ID:', id);
            const token = localStorage.getItem('serviceToken');
            const res = await axiosServices.get(`/caste-lists/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Caste list API response:', res);
            if (res.data.success) {
                setEntry(res.data.data);
                setError('');
            } else {
                console.error('API returned success: false', res.data);
                setError('Failed to fetch caste details');
            }
        } catch (err) {
            console.error('Error fetching caste list details:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
            setError('Error loading caste details. Please try again.');
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

    const handleBack = () => navigate('/Caste-List');


    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading caste details...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Caste List</Button>
            </Container>
        );
    }

    if (!entry) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>Caste entry not found</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Caste List</Button>
            </Container>
        );
    }

    // Safety check to prevent white screen
    console.log('Rendering caste list details:', entry);

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}>
                        <ArrowBack />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" component="h1">Caste Details</Typography>
                        <Typography variant="body2" color="text.secondary">{formatDateTime(entry.created_at)}</Typography>
                    </Box>
                </Stack>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/Caste-List'); }}>Caste List</Link>
                    <Typography color="text.primary">{entry.caste || entry._id}</Typography>
                </Breadcrumbs>
            </Box>
            <MainCard>
                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Caste</Typography>
                            <Typography variant="body1">{entry.caste || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Percentage</Typography>
                            <Typography variant="body1">{entry.percentage ?? 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                            <Typography variant="body1">{entry.category || 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">State</Typography>
                            <Typography variant="body1">{entry.state?.name || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Division</Typography>
                            <Typography variant="body1">{entry.division?.name || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Parliament</Typography>
                            <Typography variant="body1">{entry.parliament?.name || 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Assembly</Typography>
                            <Typography variant="body1">{entry.assembly?.name || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Block</Typography>
                            <Typography variant="body1">{entry.block?.name || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Booth</Typography>
                            <Typography variant="body1">{entry.booth?.name || 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Booth Number</Typography>
                            <Typography variant="body1">{entry.booth_number ?? 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                            <Typography variant="body1">{entry.description || 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                            <Typography variant="body1">{entry.created_by?.username || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Updated By</Typography>
                            <Typography variant="body1">{entry.updated_by?.username || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                            <Typography variant="body1">{formatDateTime(entry.created_at)}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                            <Typography variant="body1">{formatDateTime(entry.updated_at)}</Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </MainCard>
        </Container>
    );
}
