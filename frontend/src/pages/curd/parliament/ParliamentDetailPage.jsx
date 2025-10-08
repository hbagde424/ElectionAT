import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Grid,
    CardContent,
    Stack,
    Divider,
    Button,
    IconButton,
    LinearProgress,
    Alert,
    Breadcrumbs,
    Link
} from '@mui/material';
import { ArrowBack, Description } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';
import DetailRenderer from 'components/DetailRenderer';

const ParliamentDetailPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [parliament, setParliament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchParliamentDetails();
    }, [id]);

    const fetchParliamentDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('serviceToken');
            const response = await axiosServices.get(`/parliaments/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setParliament(response.data.data);
                setError(null);
            } else {
                setError('Failed to fetch parliament details');
            }
        } catch (err) {
            console.error('Error fetching parliament details:', err);
            setError('Error loading parliament details. Please try again.');
        } finally {
            setLoading(false);
        }
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

    const handleBack = () => navigate('/parliament');

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading parliament details...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Parliaments</Button>
            </Container>
        );
    }

    if (!parliament) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>Parliament not found</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Parliaments</Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}><ArrowBack /></IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" component="h1">Parliament Details</Typography>
                        <Typography variant="body2" color="text.secondary">{formatDateTime(parliament.created_at)}</Typography>
                    </Box>
                </Stack>

                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/parliament'); }}>Parliaments</Link>
                    <Typography color="text.primary">{parliament.name}</Typography>
                </Breadcrumbs>
            </Box>

            <MainCard>
                <CardContent>
                    <DetailRenderer data={parliament} />
                </CardContent>
            </MainCard>
        </Container>
    );
};

export default ParliamentDetailPage;
