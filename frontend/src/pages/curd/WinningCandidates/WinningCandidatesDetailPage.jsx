import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, CardContent, Stack, Button, IconButton, LinearProgress, Alert, Breadcrumbs, Link, Chip } from '@mui/material';
import { ArrowBack, Edit, EmojiEvents, Person, Business, TrendingUp } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';

export default function WinningCandidatesDetailPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [winningCandidate, setWinningCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            console.log('Fetching winning candidate details for ID:', id);
            const token = localStorage.getItem('serviceToken');
            const res = await axiosServices.get(`/winning-candidates/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Winning candidate API response:', res);
            if (res.data.success) {
                setWinningCandidate(res.data.data);
                setError('');
            } else {
                console.error('API returned success: false', res.data);
                setError('Failed to fetch winning candidate details');
            }
        } catch (err) {
            console.error('Error fetching winning candidate details:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
            setError('Error loading winning candidate details. Please try again.');
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

    const getTypeColor = (type) => {
        switch (type) {
            case 'General': return 'primary';
            case 'SC': return 'secondary';
            case 'ST': return 'info';
            case 'OBC': return 'success';
            default: return 'default';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'success';
            case 'inactive': return 'error';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    const handleBack = () => navigate('/WInningCandidateList');
    const handleEdit = () => navigate(`/WInningCandidateList/edit/${id}`);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading winning candidate details...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Winning Candidates</Button>
            </Container>
        );
    }

    if (!winningCandidate) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>Winning candidate not found</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Winning Candidates</Button>
            </Container>
        );
    }

    // Safety check to prevent white screen
    console.log('Rendering winning candidate details:', winningCandidate);

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                        Winning Candidate Details
                    </Typography>
                </Stack>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/WInningCandidateList'); }}>Winning Candidates</Link>
                    <Typography color="text.primary">{winningCandidate.candidate_id?.name || winningCandidate._id}</Typography>
                </Breadcrumbs>
            </Box>

            <MainCard>
                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Candidate</Typography>
                                    <Typography variant="body1">{winningCandidate.candidate_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Party</Typography>
                                    <Typography variant="body1">{winningCandidate.party_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Election Year</Typography>
                                    <Typography variant="body1">{winningCandidate.election_year?.year || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Assembly No</Typography>
                                    <Typography variant="body1">{winningCandidate.assembly_id?.AC_NO || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                                    <Typography variant="body1">{Array.isArray(winningCandidate.type) ? winningCandidate.type.join(', ') : (winningCandidate.type || 'N/A')}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Poll Percentage</Typography>
                                    <Typography variant="body1">{winningCandidate.poll_percentage ?? 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Total Votes</Typography>
                                    <Typography variant="body1">{formatNumber(winningCandidate.total_votes)}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Voting Percentage</Typography>
                                    <Typography variant="body1">{winningCandidate.voting_percentage ?? 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Margin</Typography>
                                    <Typography variant="body1">{winningCandidate.margin ?? 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Electors</Typography>
                                    <Typography variant="body1">{winningCandidate.electors ?? 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Male Electors</Typography>
                                    <Typography variant="body1">{winningCandidate.male_electors ?? 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Female Electors</Typography>
                                    <Typography variant="body1">{winningCandidate.female_electors ?? 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">NOTA Votes</Typography>
                                    <Typography variant="body1">{winningCandidate.nota_votes ?? 'N/A'}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    {winningCandidate.description && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                <div dangerouslySetInnerHTML={{ __html: winningCandidate.description }} />
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </MainCard>
        </Container>
    );
}
