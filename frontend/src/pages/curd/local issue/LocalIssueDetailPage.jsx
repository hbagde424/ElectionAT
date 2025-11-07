import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, CardContent, Stack, Button, IconButton, LinearProgress, Alert, Breadcrumbs, Link, Chip, Divider, Paper } from '@mui/material';
import { ArrowBack, Edit, Delete } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import { usePermissions } from 'contexts/PermissionContext';
import axiosServices from 'utils/axios';

export default function LocalIssueDetailPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const { userHierarchy, getUserHighestLevel } = usePermissions();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { fetchDetails(); /* eslint-disable-line */ }, [id]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('serviceToken');
            const res = await axiosServices.get(`/local-issues/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data?.success) setItem(res.data.data);
            else setError('Failed to fetch local issue details');
        } catch (err) { console.error(err); setError('Error loading local issue details.'); } finally { setLoading(false); }
    };

    const formatDateTime = (dateString) => { 
        if (!dateString) return 'N/A'; 
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Critical': return 'error';
            case 'High': return 'warning';
            case 'Medium': return 'info';
            case 'Low': return 'success';
            default: return 'default';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Resolved': return 'success';
            case 'In Progress': return 'warning';
            case 'Reported': return 'info';
            case 'Rejected': return 'error';
            default: return 'default';
        }
    };

    const handleBack = () => navigate('/Local-Issue');
    const handleEdit = () => navigate(`/Local-Issue/edit/${id}`);


    if (loading) return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            <LinearProgress />
            <Box sx={{ mt: 2 }}><Typography>Loading local issue details...</Typography></Box>
        </Container>
    );

    if (error) return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Local Issues</Button>
        </Container>
    );

    if (!item) return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>Local issue not found</Alert>
            <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Local Issues</Button>
        </Container>
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}><ArrowBack /></IconButton>
                    <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>Local Issue Details</Typography>
                    <Button variant="contained" startIcon={<Edit />} onClick={handleEdit}>Edit</Button>
                </Stack>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/Local-Issue'); }}>Local Issues</Link>
                    <Typography color="text.primary">{item.issue_name || item._id}</Typography>
                </Breadcrumbs>
            </Box>

            {/* Access Scope Information */}
            <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                    <strong>Data Access:</strong> {(() => {
                        if (!userHierarchy) return 'You have access to all Local Issues data';
                        const highest = getUserHighestLevel();
                        const labelMap = { state: 'State', division: 'Division', parliament: 'Parliament', assembly: 'Assembly', block: 'Block', booth: 'Booth' };
                        const idMap = { state: userHierarchy.state, division: userHierarchy.division, parliament: userHierarchy.parliament, assembly: userHierarchy.assembly, block: userHierarchy.block, booth: userHierarchy.booth };
                        return `You have access to Local Issues data for ${labelMap[highest] || 'Unknown'}: ${idMap[highest] || 'Unknown'}`;
                    })()}
                </Typography>
            </Alert>

            <MainCard>
                <CardContent>
                    {/* Issue Overview */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Issue Overview</Typography>
                        <Divider sx={{ mb: 3 }} />
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Issue Name</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>{item.issue_name || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Status</Typography>
                                <Chip
                                    label={item.status || 'N/A'}
                                    color={getStatusColor(item.status)}
                                    size="small"
                                    sx={{ mt: 0.5 }}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Priority</Typography>
                                <Chip
                                    label={item.priority || 'N/A'}
                                    color={getPriorityColor(item.priority)}
                                    size="small"
                                    variant="outlined"
                                    sx={{ mt: 0.5 }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Department</Typography>
                                <Typography variant="body1">{item.department || 'N/A'}</Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Category</Typography>
                                <Typography variant="body1">{item.category || 'N/A'}</Typography>
                            </Grid>
                            {item.year && (
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Year</Typography>
                                    <Typography variant="body1">{item.year}</Typography>
                                </Grid>
                            )}
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Description</Typography>
                                {item.description ? (
                                    <Paper 
                                        variant="outlined" 
                                        sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}
                                        dangerouslySetInnerHTML={{ __html: item.description }}
                                    />
                                ) : (
                                    <Typography variant="body1" color="text.secondary">No description provided</Typography>
                                )}
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Location Details */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Location Details</Typography>
                        <Divider sx={{ mb: 3 }} />
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>State</Typography>
                                <Chip
                                    label={item.state_id?.name || 'N/A'}
                                    color="primary"
                                    size="small"
                                    variant="outlined"
                                    sx={{ mt: 0.5 }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Division</Typography>
                                <Chip
                                    label={item.division_id?.name || 'N/A'}
                                    color="warning"
                                    size="small"
                                    variant="outlined"
                                    sx={{ mt: 0.5 }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Parliament</Typography>
                                <Chip
                                    label={item.parliament_id?.name || 'N/A'}
                                    color="secondary"
                                    size="small"
                                    variant="outlined"
                                    sx={{ mt: 0.5 }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Assembly</Typography>
                                <Chip
                                    label={item.assembly_id?.name || 'N/A'}
                                    color="info"
                                    size="small"
                                    variant="outlined"
                                    sx={{ mt: 0.5 }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Block</Typography>
                                <Chip
                                    label={item.block_id?.name || 'N/A'}
                                    color="success"
                                    size="small"
                                    variant="outlined"
                                    sx={{ mt: 0.5 }}
                                />
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Booth</Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                    <Chip
                                        label={item.booth_id?.name || 'N/A'}
                                        color="error"
                                        size="small"
                                        variant="outlined"
                                    />
                                    {item.booth_id?.booth_number && (
                                        <Chip
                                            label={`#${item.booth_id.booth_number}`}
                                            color="error"
                                            size="small"
                                        />
                                    )}
                                </Stack>
                            </Grid>
                            {item.panchayat_id && (
                                <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Panchayat</Typography>
                                    <Chip
                                        label={item.panchayat_id?.panchayat_name || 'N/A'}
                                        color="info"
                                        size="small"
                                        variant="outlined"
                                        sx={{ mt: 0.5 }}
                                    />
                                </Grid>
                            )}
                            {item.village_id && (
                                <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Village</Typography>
                                    <Chip
                                        label={item.village_id?.village_name || 'N/A'}
                                        color="success"
                                        size="small"
                                        variant="outlined"
                                        sx={{ mt: 0.5 }}
                                    />
                                </Grid>
                            )}
                            {item.falliya_id && (
                                <Grid item xs={12} md={4}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Falliya</Typography>
                                    <Chip
                                        label={item.falliya_id?.falliya_name || 'N/A'}
                                        color="warning"
                                        size="small"
                                        variant="outlined"
                                        sx={{ mt: 0.5 }}
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </Box>

                    {/* Metadata */}
                    <Box>
                        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Record Information</Typography>
                        <Divider sx={{ mb: 3 }} />
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Created By</Typography>
                                <Typography variant="body1">{item.created_by?.username || 'N/A'}</Typography>
                                {item.created_by?.email && (
                                    <Typography variant="body2" color="text.secondary">{item.created_by.email}</Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Created At</Typography>
                                <Typography variant="body1">{formatDateTime(item.created_at)}</Typography>
                            </Grid>
                            {item.updated_by && (
                                <>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Updated By</Typography>
                                        <Typography variant="body1">{item.updated_by?.username || 'N/A'}</Typography>
                                        {item.updated_by?.email && (
                                            <Typography variant="body2" color="text.secondary">{item.updated_by.email}</Typography>
                                        )}
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Updated At</Typography>
                                        <Typography variant="body1">{formatDateTime(item.updated_at)}</Typography>
                                    </Grid>
                                </>
                            )}
                        </Grid>
                    </Box>
                </CardContent>
            </MainCard>
        </Container>
    );
}
