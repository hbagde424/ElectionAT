import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, CardContent, Stack, Button, IconButton, LinearProgress, Alert, Breadcrumbs, Link, Chip } from '@mui/material';
import { ArrowBack, Person, Phone, Email, Facebook, Instagram, Twitter, WhatsApp } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';
import { usePermissions } from 'contexts/PermissionContext';

export default function CodingDetailPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const { userHierarchy, getUserHighestLevel } = usePermissions();
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

    const handleBack = () => navigate('/Coding');

    // Get user's access scope information
    const getUserAccessScope = () => {
        if (!userHierarchy) {
            return { level: 'All', description: 'You have access to all coding data' };
        }

        const highestLevel = getUserHighestLevel();
        if (!highestLevel) {
            return { level: 'All', description: 'You have access to all coding data' };
        }

        const levelNames = {
            state: 'State',
            division: 'Division',
            parliament: 'Parliament',
            assembly: 'Assembly',
            block: 'Block',
            booth: 'Booth'
        };

        const levelName = levelNames[highestLevel.level] || 'Unknown';
        const levelValue = highestLevel.value || 'Unknown';

        return {
            level: levelName,
            description: `You have access to coding data for ${levelName}: ${levelValue}`
        };
    };

    const accessScope = getUserAccessScope();

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
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Coding List</Button>
            </Container>
        );
    }

    if (!coding) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>Coding entry not found</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Coding List</Button>
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
                        <Typography variant="h4" component="h1">Coding Details</Typography>
                        <Typography variant="body2" color="text.secondary">{formatDateTime(coding.created_at || coding.createdAt)}</Typography>
                    </Box>

                </Stack>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/Coding'); }}>Coding</Link>
                    <Typography color="text.primary">{coding.name || coding._id}</Typography>
                </Breadcrumbs>
            </Box>

            {/* Access Scope Information */}
            <Alert
                severity="info"
                sx={{ mb: 3 }}
            >
                <Typography variant="body2">
                    <strong>Data Access:</strong> {accessScope.description}
                </Typography>
            </Alert>

            <MainCard>
                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                            <Typography variant="body1">{coding.name || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Mobile</Typography>
                            <Typography variant="body1">{coding.mobile || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                            <Typography variant="body1">{coding.email || 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">WhatsApp</Typography>
                            <Typography variant="body1">{coding.whatsapp_number || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Facebook</Typography>
                            <Typography variant="body1">{coding.facebook || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Instagram</Typography>
                            <Typography variant="body1">{coding.instagram || 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Twitter</Typography>
                            <Typography variant="body1">{coding.twitter || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Coding Types</Typography>
                            <Typography variant="body1">{coding.coding_types?.join(', ') || 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">State</Typography>
                            <Typography variant="body1">{coding.state?.name || coding.state_id?.name || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Division</Typography>
                            <Typography variant="body1">{coding.division?.name || coding.division_id?.name || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Parliament</Typography>
                            <Typography variant="body1">{coding.parliament?.name || coding.parliament_id?.name || 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Assembly</Typography>
                            <Typography variant="body1">{coding.assembly?.name || coding.assembly_id?.name || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Block</Typography>
                            <Typography variant="body1">{coding.block?.name || coding.block_id?.name || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Booth</Typography>
                            <Typography variant="body1">{coding.booth?.name || coding.booth_id?.name || 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Booth Number</Typography>
                            <Typography variant="body1">{coding.booth_number ?? 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                            <Typography variant="body1">{coding.description || 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                            <Typography variant="body1">{coding.created_by?.username || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Updated By</Typography>
                            <Typography variant="body1">{coding.updated_by?.username || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                            <Typography variant="body1">{formatDateTime(coding.created_at || coding.createdAt)}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                            <Typography variant="body1">{formatDateTime(coding.updated_at || coding.updatedAt)}</Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </MainCard>
        </Container>
    );
}
