import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, CardContent, Stack, Button, IconButton, LinearProgress, Alert, Breadcrumbs, Link, Chip } from '@mui/material';
import { ArrowBack, Edit, Person, Phone, Email, Facebook, Instagram, Twitter, WhatsApp } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';

export default function CodingDetailPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [coding, setCoding] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            console.log('Fetching coding details for ID:', id);
            const token = localStorage.getItem('serviceToken');
            const res = await axiosServices.get(`/codings/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Coding API response:', res);
            if (res.data.success) {
                setCoding(res.data.data);
                setError('');
            } else {
                console.error('API returned success: false', res.data);
                setError('Failed to fetch coding details');
            }
        } catch (err) {
            console.error('Error fetching coding details:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
            setError('Error loading coding details. Please try again.');
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

    const getTypeColor = (type) => {
        switch (type) {
            case 'influencer': return 'primary';
            case 'volunteer': return 'secondary';
            case 'supporter': return 'info';
            case 'opponent': return 'error';
            default: return 'default';
        }
    };

    const handleBack = () => navigate('/Coding');
    const handleEdit = () => navigate(`/Coding/edit/${id}`);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading coding details...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Coding</Button>
            </Container>
        );
    }

    if (!coding) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>Coding entry not found</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Coding</Button>
            </Container>
        );
    }

    // Safety check to prevent white screen
    console.log('Rendering coding details:', coding);

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                        Coding Details
                    </Typography>
                </Stack>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/Coding'); }}>Coding</Link>
                    <Typography color="text.primary">{coding.name || coding._id}</Typography>
                </Breadcrumbs>
            </Box>

            <MainCard>
                <CardContent>
                    <Grid container spacing={3}>
                        {/* Column 1: Personal Information */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                                    <Typography variant="body1">{coding.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Mobile</Typography>
                                    <Typography variant="body1">{coding.mobile || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                                    <Typography variant="body1">{coding.email || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">WhatsApp Number</Typography>
                                    <Typography variant="body1">{coding.whatsapp_number || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                                    <Chip
                                        label={coding.type || 'N/A'}
                                        color={getTypeColor(coding.type)}
                                        size="small"
                                        sx={{ mt: 0.5 }}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Column 2: Social Media & Contact Information */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Facebook</Typography>
                                    <Typography variant="body1">{coding.facebook || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Instagram</Typography>
                                    <Typography variant="body1">{coding.instagram || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Twitter</Typography>
                                    <Typography variant="body1">{coding.twitter || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                                    <Typography variant="body1">{coding.address || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Remarks</Typography>
                                    <Typography variant="body1">{coding.remarks || 'N/A'}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Column 3: Geographic & Metadata Information */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">State</Typography>
                                    <Typography variant="body1">{coding.state_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Division</Typography>
                                    <Typography variant="body1">{coding.division_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Parliament</Typography>
                                    <Typography variant="body1">{coding.parliament_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Assembly</Typography>
                                    <Typography variant="body1">{coding.assembly_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Block</Typography>
                                    <Typography variant="body1">{coding.block_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Booth</Typography>
                                    <Typography variant="body1">{coding.booth_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                                    <Typography variant="body1">{formatDateTime(coding.createdAt)}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                                    <Typography variant="body1">{formatDateTime(coding.updatedAt)}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </CardContent>
            </MainCard>
        </Container>
    );
}
