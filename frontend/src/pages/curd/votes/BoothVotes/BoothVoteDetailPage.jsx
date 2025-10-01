import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, CardContent, Stack, Button, IconButton, LinearProgress, Alert, Breadcrumbs, Link } from '@mui/material';
import { ArrowBack, Edit } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';

export default function BoothVoteDetailPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [vote, setVote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            console.log('Fetching booth vote details for ID:', id);
            const token = localStorage.getItem('serviceToken');
            const res = await axiosServices.get(`/booth-votes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Booth vote API response:', res);
            if (res.data.success) {
                setVote(res.data.data);
                setError('');
            } else {
                console.error('API returned success: false', res.data);
                setError('Failed to fetch booth vote details');
            }
        } catch (err) {
            console.error('Error fetching booth vote details:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
            setError('Error loading booth vote details. Please try again.');
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

    const handleBack = () => navigate('/Booth-Votes');
    const handleEdit = () => navigate(`/Booth-Votes/edit/${id}`);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading booth vote details...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Booth Votes</Button>
            </Container>
        );
    }

    if (!vote) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>Booth vote not found</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Booth Votes</Button>
            </Container>
        );
    }

    // Safety check to prevent white screen
    console.log('Rendering booth vote details:', vote);

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}>
                        <ArrowBack />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" component="h1">Booth Vote Details</Typography>
                        <Typography variant="body2" color="text.secondary">{formatDateTime(vote.created_at)}</Typography>
                    </Box>
                    <Button variant="contained" startIcon={<Edit />} onClick={handleEdit} sx={{ ml: 'auto' }}>Edit Vote</Button>
                </Stack>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/Booth-Votes'); }}>Booth Votes</Link>
                    <Typography color="text.primary">{vote._id}</Typography>
                </Breadcrumbs>
            </Box>

            <MainCard>
                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Candidate</Typography>
                                    <Typography variant="body1">{vote.candidate_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Booth</Typography>
                                    <Typography variant="body1">{vote.booth_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Assembly</Typography>
                                    <Typography variant="body1">{vote.assembly_id?.name || 'N/A'}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Parliament</Typography>
                                    <Typography variant="body1">{vote.parliament_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Division</Typography>
                                    <Typography variant="body1">{vote.division_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">State</Typography>
                                    <Typography variant="body1">{vote.state_id?.name || 'N/A'}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Total Votes</Typography>
                                    <Typography variant="body1">{vote.total_votes?.toLocaleString?.() || vote.total_votes || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Election Year</Typography>
                                    <Typography variant="body1">{vote.election_year_id?.year || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                                    <Typography variant="body1">{vote.created_by?.username || 'N/A'}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </CardContent>
            </MainCard>
        </Container>
    );
}
