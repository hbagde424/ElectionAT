import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, CardContent, Stack, Button, IconButton, LinearProgress, Alert, Breadcrumbs, Link } from '@mui/material';
import { ArrowBack, Edit } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';
import DetailRenderer from 'components/DetailRenderer';

export default function LocalIssueDetailPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
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

    const formatDateTime = (dateString) => { if (!dateString) return 'N/A'; return new Date(dateString).toLocaleString(); };

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

            <MainCard>
                <CardContent>
                    <DetailRenderer data={item} />
                </CardContent>
            </MainCard>
        </Container>
    );
}
