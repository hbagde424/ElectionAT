import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Grid,
    Chip,
    IconButton,
    Breadcrumbs,
    Link,
    CardContent,
    Button,
    Stack,
    Alert,
    LinearProgress
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';

export default function WinningPartyDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [winningParty, setWinningParty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
            fetchWinningPartyDetails();
        }
    }, [id]);

    const fetchWinningPartyDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!id) {
                setError('No winning party ID provided');
                return;
            }

            // Validate MongoDB ObjectId format
            if (!/^[0-9a-fA-F]{24}$/.test(id)) {
                setError('Invalid winning party ID format');
                return;
            }

            console.log('Fetching winning party details for ID:', id);
            const response = await axiosServices.get(`/winning-parties/${id}`);

            if (response.data.success) {
                setWinningParty(response.data.data);
            } else {
                setError('Failed to load winning party details');
            }
        } catch (err) {
            console.error('Error fetching winning party details:', err);
            console.error('Error response:', err.response);

            if (err.response?.status === 404) {
                setError('Winning party not found');
            } else if (err.response?.status === 500) {
                setError('Server error. Please try again later.');
            } else {
                setError(err.response?.data?.message || 'Failed to load winning party details');
            }
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
            minute: '2-digit',
            hour12: true
        });
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'success';
            case 'inactive':
                return 'error';
            default:
                return 'default';
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg">
                <LinearProgress />
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography>Loading winning party details...</Typography>
                </Box>
            </Container>
        );
    }

    if (error || !winningParty) {
        return (
            <Container maxWidth="lg">
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error || 'Failed to load winning party details'}
                </Alert>
                <Button
                    variant="contained"
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/winning-parties')}
                >
                    Back To Winning Parties
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            {/* Breadcrumbs */}
            <Breadcrumbs sx={{ mb: 3 }}>
                <Link
                    component="button"
                    variant="body1"
                    onClick={() => navigate('/winning-parties')}
                    sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                >
                    Winning Parties
                </Link>
                <Typography color="text.primary">Winning Party Details</Typography>
            </Breadcrumbs>

            {/* Header Section */}
            <MainCard sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <IconButton onClick={() => navigate('/winning-parties')}>
                        <ArrowBack />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" component="h1" color="primary">
                            Winning Party Details
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {formatDateTime(winningParty.created_at)}
                        </Typography>
                    </Box>
                </Box>
            </MainCard>

            {/* All Winning Party Information in 3-column layout */}
            <MainCard>
                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Candidate</Typography>
                                    <Typography variant="body1">{winningParty.candidate_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Party</Typography>
                                    <Typography variant="body1">{winningParty.party_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">State</Typography>
                                    <Typography variant="body1">{winningParty.state_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Division</Typography>
                                    <Typography variant="body1">{winningParty.division_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Parliament</Typography>
                                    <Typography variant="body1">{winningParty.parliament_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Assembly</Typography>
                                    <Typography variant="body1">{winningParty.assembly_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Block</Typography>
                                    <Typography variant="body1">{winningParty.block_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Booth</Typography>
                                    <Typography variant="body1">{winningParty.booth_id?.name || 'N/A'}{winningParty.booth_id?.booth_number ? ` (#${winningParty.booth_id.booth_number})` : ''}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Election Year</Typography>
                                    <Typography variant="body1">{winningParty.election_year ? `${winningParty.election_year.year} (${winningParty.election_year.election_type})` : 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Votes</Typography>
                                    <Typography variant="body1">{winningParty.votes || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Margin</Typography>
                                    <Typography variant="body1">{winningParty.margin || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Electors</Typography>
                                    <Typography variant="body1">{winningParty.electors ?? 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Male Electors</Typography>
                                    <Typography variant="body1">{winningParty.male_electors ?? 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Female Electors</Typography>
                                    <Typography variant="body1">{winningParty.female_electors ?? 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">NOTA Votes</Typography>
                                    <Typography variant="body1">{winningParty.nota_votes ?? 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                                    <Typography variant="body1">{winningParty.created_by?.username || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Updated By</Typography>
                                    <Typography variant="body1">{winningParty.updated_by?.username || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                                    <Typography variant="body1">{formatDateTime(winningParty.created_at)}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                                    <Typography variant="body1">{formatDateTime(winningParty.updated_at)}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    {winningParty.description && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                <div dangerouslySetInnerHTML={{ __html: winningParty.description }} />
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </MainCard>

            {/* Status and Key Info below the table */}
            <MainCard sx={{ mt: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Chip
                            label={winningParty.election_year?.year ? `${winningParty.election_year.year} (${winningParty.election_year.election_type})` : 'N/A'}
                            color="primary"
                        />
                        <Chip
                            label={winningParty.party_id?.name || 'N/A'}
                            variant="outlined"
                        />
                        <Chip
                            label={winningParty.candidate_id?.name || 'N/A'}
                            variant="outlined"
                        />
                    </Box>
                </CardContent>
            </MainCard>
        </Container>
    );
}
