import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, CardContent, Stack, Button, IconButton, LinearProgress, Alert, Breadcrumbs, Link } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';
import DetailRenderer from 'components/DetailRenderer';

export default function GenderDetailPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const [gender, setGender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchDetails(); /* eslint-disable-line */ }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('serviceToken');
      const res = await axiosServices.get(`/genders/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data && (res.data.success || res.data.data)) setGender(res.data.data || res.data);
      else setError('Failed to fetch gender details');
    } catch (e) {
      setError('Error loading gender details. Please try again.');
    } finally { setLoading(false); }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleString(); } catch (e) { return 'N/A'; }
  };

  const handleBack = () => navigate('/Gender');

  if (loading) return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      <LinearProgress />
      <Box sx={{ mt: 2 }}><Typography>Loading gender details...</Typography></Box>
    </Container>
  );

  if (error) return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Gender</Button>
    </Container>
  );

  if (!gender) return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      <Alert severity="warning" sx={{ mb: 2 }}>Gender data not found</Alert>
      <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>Back to Gender</Button>
    </Container>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}><ArrowBack /></IconButton>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>Gender Details</Typography>
        </Stack>
        <Breadcrumbs aria-label="breadcrumb">
          <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
          <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/Gender'); }}>Gender</Link>
          <Typography color="text.primary">{gender._id}</Typography>
        </Breadcrumbs>
      </Box>

      <MainCard>
        <CardContent>
          <DetailRenderer data={gender} />
        </CardContent>
      </MainCard>
    </Container>
  );
}
