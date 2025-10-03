import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, CardContent, Stack, Button, IconButton, LinearProgress, Alert, Breadcrumbs, Link, Chip } from '@mui/material';
import { ArrowBack, Edit, Person, Business, CalendarToday, LocationOn } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';
import DetailRenderer from 'components/DetailRenderer';

export default function PotentialCandidateDetailPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            console.log('Fetching potential candidate details for ID:', id);
            const token = localStorage.getItem('serviceToken');
            const res = await axiosServices.get(`/potential-candidates/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Potential candidate API response:', res);
            if (res.data.success) {
                setCandidate(res.data.data);
                setError('');
            } else {
                console.error('API returned success: false', res.data);
                setError('Failed to fetch potential candidate details');
            }
        } catch (err) {
            console.error('Error fetching potential candidate details:', err);
            console.error('Error response:', err.response);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
            setError('Error loading potential candidate details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateString) => { if (!dateString) return 'N/A'; return new Date(dateString).toLocaleString(); };
    const formatDate = (dateString) => { if (!dateString) return 'N/A'; return new Date(dateString).toLocaleDateString(); };

    const handleBack = () => navigate('/Potentical-Candidate');
    const handleEdit = () => navigate(`/Potentical-Candidate/edit/${id}`);

    if (loading) return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            <LinearProgress />
            <Box sx={{ mt: 2 }}><Typography>Loading potential candidate details...</Typography></Box>
        </Container>
    );

    if (error) return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Potential Candidates</Button>
        </Container>
    );

    if (!candidate) return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>Potential candidate not found</Alert>
            <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Potential Candidates</Button>
        </Container>
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}><ArrowBack /></IconButton>
                    <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>Potential Candidate Details</Typography>
                    <Button variant="contained" startIcon={<Edit />} onClick={handleEdit}>Edit</Button>
                </Stack>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/Potentical-Candidate'); }}>Potential Candidates</Link>
                    <Typography color="text.primary">{candidate.name || candidate._id}</Typography>
                </Breadcrumbs>
            </Box>

            <MainCard>
                <CardContent>
                    <DetailRenderer data={candidate} />
                </CardContent>
            </MainCard>
        </Container>
    );
}
