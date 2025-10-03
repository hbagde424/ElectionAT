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
    Description,
    Edit,
    CalendarToday,
    HowToVote,
    AccountBalance
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';
import DetailRenderer from 'components/DetailRenderer';

const ParliamentCandidateDetailPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('ParliamentCandidateDetailPage mounted with ID:', id);
        fetchCandidateDetails();
    }, [id]);

    const fetchCandidateDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('serviceToken');
            const response = await axiosServices.get(`/parliament-candidates/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.success) {
                setCandidate(response.data.data);
                setError(null);
            } else {
                setError('Failed to fetch parliament candidate details');
            }
        } catch (error) {
            console.error('Error fetching parliament candidate details:', error);
            setError('Error loading parliament candidate details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => { if (!dateString) return 'N/A'; return new Date(dateString).toLocaleDateString(); };
    const formatDateTime = (dateString) => { if (!dateString) return 'N/A'; return new Date(dateString).toLocaleString(); };

    const handleEdit = () => {
        navigate(`/parliament-candidate/edit/${id}`);
    };

    const handleBack = () => {
        navigate('/parliament-candidate');
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'success';
            case 'inactive': return 'error';
            case 'won': return 'success';
            case 'lost': return 'error';
            case 'pending': return 'warning';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>Loading parliament candidate details...</Typography>
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
                    Back to Parliament Candidates
                </Button>
            </Container>
        );
    }

    if (!candidate) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Parliament candidate not found
                </Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
                    Back to Parliament Candidates
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}><ArrowBack /></IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" component="h1">Parliament Candidate Details</Typography>
                        <Typography variant="body2" color="text.secondary">{formatDateTime(candidate?.created_at)}</Typography>
                    </Box>
                    <Button variant="contained" startIcon={<Edit />} onClick={handleEdit}>Edit Candidate</Button>
                </Stack>

                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Dashboard</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/parliament-candidate'); }}>Parliament Candidates</Link>
                    <Typography color="text.primary">{candidate?.name}</Typography>
                </Breadcrumbs>
            </Box>

            <MainCard>
                <CardContent>
                    <DetailRenderer data={candidate} />
                </CardContent>
            </MainCard>
        </Container>
    );
};

export default ParliamentCandidateDetailPage;
