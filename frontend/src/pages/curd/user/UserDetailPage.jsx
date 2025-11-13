import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Grid,
    CardContent,
    Chip,
    Stack,
    Avatar,
    Divider,
    Button,
    IconButton,
    Paper,
    LinearProgress,
    Alert,
    Breadcrumbs,
    Link
} from '@mui/material';
import {
    ArrowBack,
    Person,
    LocationOn,
    Work,
    Description,
    Timeline,
    Article,
    Edit,
    Share,
    Download,
    Phone,
    Email,
    CalendarToday,
    Security,
    AdminPanelSettings
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';

const UserDetailPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('UserDetailPage mounted with ID:', id);
        fetchUserDetails();
    }, [id]);

    const fetchUserDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('serviceToken');
            const response = await axiosServices.get(`/users/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setUser(response.data.data);
                setError(null);
            } else {
                setError('Failed to fetch user details');
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
            setError('Error loading user details. Please try again.');
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
            minute: '2-digit'
        });
    };

    const handleBack = () => {
        navigate('/Users');
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'success';
            case 'inactive': return 'error';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading user details...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
                    Back to Users
                </Button>
            </Container>
        );
    }

    if (!user) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    User not found
                </Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
                    Back to Users
                </Button>
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
                        <Typography variant="h4" component="h1">User Details</Typography>
                        <Typography variant="body2" color="text.secondary">{formatDateTime(user.created_at)}</Typography>
                    </Box>
                </Stack>

                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/Users'); }}>Users</Link>
                    <Typography color="text.primary">{user.username || user._id}</Typography>
                </Breadcrumbs>
            </Box>

            <MainCard>
                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Username</Typography>
                            <Typography variant="body1">{user.username || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Mobile</Typography>
                            <Typography variant="body1">{user.mobile || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                            <Typography variant="body1">{user.email || 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                            <Typography variant="body1">{user.role || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                            <Typography variant="body1">{user.isActive ? 'Active' : 'Inactive'}</Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">States</Typography>
                            <Typography variant="body1">{(user.state_ids && user.state_ids.length) ? user.state_ids.map(s => s.name).join(', ') : 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Divisions</Typography>
                            <Typography variant="body1">{(user.division_ids && user.division_ids.length) ? user.division_ids.map(s => s.name).join(', ') : 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Parliaments</Typography>
                            <Typography variant="body1">{(user.parliament_ids && user.parliament_ids.length) ? user.parliament_ids.map(s => s.name).join(', ') : 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Assemblies</Typography>
                            <Typography variant="body1">{(user.assembly_ids && user.assembly_ids.length) ? user.assembly_ids.map(s => s.name).join(', ') : 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Blocks</Typography>
                            <Typography variant="body1">{(user.block_ids && user.block_ids.length) ? user.block_ids.map(s => s.name).join(', ') : 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" color="text.secondary">Booths</Typography>
                            <Typography variant="body1">{(user.booth_ids && user.booth_ids.length) ? user.booth_ids.map(s => s.name).join(', ') : 'N/A'}</Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                            <Typography variant="body1">{user.created_by?.username || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Updated By</Typography>
                            <Typography variant="body1">{user.updated_by?.username || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                            <Typography variant="body1">{formatDateTime(user.created_at)}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                            <Typography variant="body1">{formatDateTime(user.updated_at)}</Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </MainCard>
        </Container>
    );
};

export default UserDetailPage;
