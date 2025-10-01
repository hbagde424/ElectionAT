import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, CardContent, Stack, Button, IconButton, LinearProgress, Alert, Breadcrumbs, Link, Chip } from '@mui/material';
import { ArrowBack, Edit, Person, Male, Female, Transgender } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';

export default function GenderDetailPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [gender, setGender] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            console.log('Fetching gender details for ID:', id);
            const token = localStorage.getItem('serviceToken');
            const res = await axiosServices.get(`/genders/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Gender API response:', res);
            if (res.data.success) {
                setGender(res.data.data);
                setError('');
            } else {
                console.error('API returned success: false', res.data);
                setError('Failed to fetch gender details');
            }
        } catch (err) {
            console.error('Error fetching gender details:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
            setError('Error loading gender details. Please try again.');
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

    const formatNumber = (number) => {
        if (number === null || number === undefined) return 'N/A';
        return number.toLocaleString();
    };

    const calculateTotal = () => {
        if (!gender) return 0;
        return (gender.male || 0) + (gender.female || 0) + (gender.others || 0);
    };

    const calculatePercentage = (value) => {
        const total = calculateTotal();
        if (total === 0) return '0%';
        return `${((value / total) * 100).toFixed(1)}%`;
    };

    const handleBack = () => navigate('/Gender');
    const handleEdit = () => navigate(`/Gender/edit/${id}`);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading gender details...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Gender</Button>
            </Container>
        );
    }

    if (!gender) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>Gender data not found</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Gender</Button>
            </Container>
        );
    }

    // Safety check to prevent white screen
    console.log('Rendering gender details:', gender);

    const total = calculateTotal();

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                        Gender Demographics
                    </Typography>
                </Stack>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/Gender'); }}>Gender</Link>
                    <Typography color="text.primary">{gender._id}</Typography>
                </Breadcrumbs>
            </Box>

            <MainCard>
                <CardContent>
                    <Grid container spacing={3}>
                        {/* Column 1: Gender Statistics */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Male Count</Typography>
                                    <Typography variant="h6" color="primary">
                                        {formatNumber(gender.male)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {calculatePercentage(gender.male || 0)} of total
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Female Count</Typography>
                                    <Typography variant="h6" color="secondary">
                                        {formatNumber(gender.female)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {calculatePercentage(gender.female || 0)} of total
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Others Count</Typography>
                                    <Typography variant="h6" color="info.main">
                                        {formatNumber(gender.others)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {calculatePercentage(gender.others || 0)} of total
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Total Count</Typography>
                                    <Typography variant="h5" color="text.primary" sx={{ fontWeight: 'bold' }}>
                                        {formatNumber(total)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Column 2: Geographic Information */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">State</Typography>
                                    <Typography variant="body1">{gender.state_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Division</Typography>
                                    <Typography variant="body1">{gender.division_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Parliament</Typography>
                                    <Typography variant="body1">{gender.parliament_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Assembly</Typography>
                                    <Typography variant="body1">{gender.assembly_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Block</Typography>
                                    <Typography variant="body1">{gender.block_id?.name || 'N/A'}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Column 3: Additional Information & Metadata */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Booth</Typography>
                                    <Typography variant="body1">{gender.booth_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Election Year</Typography>
                                    <Typography variant="body1">{gender.election_year_id?.year || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                                    <Typography variant="body1">{formatDateTime(gender.createdAt)}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                                    <Typography variant="body1">{formatDateTime(gender.updatedAt)}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                    <Chip
                                        label={gender.status || 'Active'}
                                        color="success"
                                        size="small"
                                        sx={{ mt: 0.5 }}
                                    />
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </CardContent>
            </MainCard>
        </Container>
    );
}
