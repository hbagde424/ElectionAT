import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, CardContent, Stack, Button, IconButton, LinearProgress, Alert, Breadcrumbs, Link, Chip } from '@mui/material';
import { ArrowBack, Edit, Work, Business, AttachMoney, CalendarToday } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';

export default function WorkStatusDetailPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [workStatus, setWorkStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            console.log('Fetching work status details for ID:', id);
            const token = localStorage.getItem('serviceToken');
            const res = await axiosServices.get(`/work-status/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Work status API response:', res);
            if (res.data.success) {
                setWorkStatus(res.data.data);
                setError('');
            } else {
                console.error('API returned success: false', res.data);
                setError('Failed to fetch work status details');
            }
        } catch (err) {
            console.error('Error fetching work status details:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
            setError('Error loading work status details. Please try again.');
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return 'N/A';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'success';
            case 'In Progress': return 'warning';
            case 'Pending': return 'info';
            case 'Halted': return 'error';
            case 'Cancelled': return 'error';
            default: return 'default';
        }
    };

    const getWorkTypeColor = (type) => {
        switch (type) {
            case 'infrastructure': return 'primary';
            case 'social': return 'secondary';
            case 'education': return 'info';
            case 'health': return 'success';
            case 'other': return 'default';
            default: return 'default';
        }
    };

    const getFundSourceColor = (source) => {
        switch (source) {
            case 'vidhayak nidhi': return 'primary';
            case 'swechcha nidhi': return 'secondary';
            default: return 'default';
        }
    };

    const calculateProgress = () => {
        if (!workStatus || !workStatus.total_budget || !workStatus.spent_amount) return 0;
        return Math.round((workStatus.spent_amount / workStatus.total_budget) * 100);
    };

    const handleBack = () => navigate('/Work-Status');


    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading work status details...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Work Status</Button>
            </Container>
        );
    }

    if (!workStatus) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>Work status not found</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Work Status</Button>
            </Container>
        );
    }

    // Safety check to prevent white screen
    console.log('Rendering work status details:', workStatus);

    const progress = calculateProgress();

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                        Work Status Details
                    </Typography>
                </Stack>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/Work-Status'); }}>Work Status</Link>
                    <Typography color="text.primary">{workStatus.work_name || workStatus._id}</Typography>
                </Breadcrumbs>
            </Box>

            <MainCard>
                <CardContent>
                    <Grid container spacing={3}>
                        {/* Column 1: Basic Info */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Work Name</Typography>
                                    <Typography variant="body1">{workStatus.work_name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                                    <Typography variant="body1">{workStatus.department || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Work Type</Typography>
                                    <Chip
                                        label={workStatus.work_type || 'N/A'}
                                        color={getWorkTypeColor(workStatus.work_type)}
                                        size="small"
                                        sx={{ mt: 0.5 }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                                    <Chip
                                        label={workStatus.status || 'N/A'}
                                        color={getStatusColor(workStatus.status)}
                                        size="small"
                                        sx={{ mt: 0.5 }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Fund Source</Typography>
                                    <Typography variant="body1">{workStatus.approved_fund_from || 'N/A'}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Column 2: Financial & Dates (only list fields) */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Total Budget</Typography>
                                    <Typography variant="body1">{formatCurrency(workStatus.total_budget)}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Spent Amount</Typography>
                                    <Typography variant="body1">{formatCurrency(workStatus.spent_amount)}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Start Date</Typography>
                                    <Typography variant="body1">{formatDate(workStatus.start_date)}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Expected End</Typography>
                                    <Typography variant="body1">{formatDate(workStatus.expected_end_date)}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Actual End</Typography>
                                    <Typography variant="body1">{formatDate(workStatus.actual_end_date)}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Column 3: Geography & Metadata */}
                        <Grid item xs={12} md={4}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">State</Typography>
                                    <Typography variant="body1">{workStatus.state_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Division</Typography>
                                    <Typography variant="body1">{workStatus.division_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Parliament</Typography>
                                    <Typography variant="body1">{workStatus.parliament_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Assembly</Typography>
                                    <Typography variant="body1">{workStatus.assembly_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Block</Typography>
                                    <Typography variant="body1">{workStatus.block_id?.name || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Booth</Typography>
                                    <Typography variant="body1">{workStatus.booth_id?.name || 'N/A'}{workStatus.booth_id?.booth_number ? ` (#${workStatus.booth_id.booth_number})` : ''}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Panchayat</Typography>
                                    <Typography variant="body1">{workStatus.panchayat || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Village</Typography>
                                    <Typography variant="body1">{workStatus.village || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Announced Date</Typography>
                                    <Typography variant="body1">{formatDate(workStatus.announced_date)}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Announced By</Typography>
                                    <Typography variant="body1">{workStatus.announced_by || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                                    <Typography variant="body1">{workStatus.created_by?.username || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Updated By</Typography>
                                    <Typography variant="body1">{workStatus.updated_by?.username || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                                    <Typography variant="body1">{formatDate(workStatus.created_at)}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                                    <Typography variant="body1">{formatDate(workStatus.updated_at)}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                        {/* Description row (kept because list includes it) */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                            <Typography variant="body1">{workStatus.description || 'No description provided'}</Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </MainCard>
        </Container>
    );
}
