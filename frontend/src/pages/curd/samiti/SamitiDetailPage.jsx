import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Button,
    Grid,
    Stack,
    Typography,
    Card,
    CardContent,
    Divider,
    Chip,
    IconButton,
    Tooltip,
    Alert,
    Skeleton
} from '@mui/material';
import { ArrowLeft, Edit, Trash } from 'iconsax-react';

// Project imports
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';

// Local imports
import SamitiModal from './SamitiModal';
import AlertSamitiDelete from './AlertSamitiDelete';

const SamitiDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    
    const [samiti, setSamiti] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openModal, setOpenModal] = useState(false);
    const [deleteAlert, setDeleteAlert] = useState({ open: false, id: null });
    
    // Reference data for modal
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);

    const fetchSamiti = async () => {
        setLoading(true);
        setError('');
        try {
            const { data: json } = await axiosServices.get(`/samitis/${id}`);
            if (json.success) {
                setSamiti(json.data);
            } else {
                setError(json.message || 'Failed to fetch samiti details');
            }
        } catch (err) {
            console.error('Error fetching samiti:', err);
            setError(
                err.response?.data?.message ||
                err.message ||
                'An unexpected error occurred'
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchReferenceData = async () => {
        try {
            const [
                statesRes, divisionsRes, parliamentsRes,
                assembliesRes, blocksRes, boothsRes
            ] = await Promise.all([
                axiosServices.get('/states'),
                axiosServices.get('/divisions'),
                axiosServices.get('/parliaments'),
                axiosServices.get('/assemblies'),
                axiosServices.get('/blocks'),
                axiosServices.get('/booths')
            ]);

            if (statesRes.data.success) setStates(statesRes.data.data);
            if (divisionsRes.data.success) setDivisions(divisionsRes.data.data);
            if (parliamentsRes.data.success) setParliaments(parliamentsRes.data.data);
            if (assembliesRes.data.success) setAssemblies(assembliesRes.data.data);
            if (blocksRes.data.success) setBlocks(blocksRes.data.data);
            if (boothsRes.data.success) setBooths(boothsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    useEffect(() => {
        if (id) {
            fetchSamiti();
            fetchReferenceData();
        }
    }, [id]);

    const handleDelete = () => {
        setDeleteAlert({ open: true, id: samiti._id });
    };

    const handleDeleteSuccess = () => {
        navigate('/samitis');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-IN');
    };

    if (loading) {
        return (
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <MainCard>
                        <Stack spacing={2}>
                            <Skeleton variant="text" height={40} width="40%" />
                            <Divider />
                            <Grid container spacing={2}>
                                {[...Array(8)].map((_, index) => (
                                    <Grid item xs={12} sm={6} md={4} key={index}>
                                        <Skeleton variant="rectangular" height={80} />
                                    </Grid>
                                ))}
                            </Grid>
                        </Stack>
                    </MainCard>
                </Grid>
            </Grid>
        );
    }

    if (error) {
        return (
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <MainCard>
                        <Stack spacing={2} alignItems="center">
                            <Alert severity="error" sx={{ width: '100%' }}>
                                {error}
                            </Alert>
                            <Button
                                variant="outlined"
                                startIcon={<ArrowLeft />}
                                onClick={() => navigate('/samitis')}
                            >
                                Back to Samitis
                            </Button>
                        </Stack>
                    </MainCard>
                </Grid>
            </Grid>
        );
    }

    if (!samiti) {
        return (
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <MainCard>
                        <Stack spacing={2} alignItems="center">
                            <Alert severity="warning" sx={{ width: '100%' }}>
                                Samiti not found
                            </Alert>
                            <Button
                                variant="outlined"
                                startIcon={<ArrowLeft />}
                                onClick={() => navigate('/samitis')}
                            >
                                Back to Samitis
                            </Button>
                        </Stack>
                    </MainCard>
                </Grid>
            </Grid>
        );
    }

    return (
        <>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <MainCard>
                        <Stack spacing={3}>
                            {/* Header */}
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <IconButton onClick={() => navigate('/samitis')}>
                                        <ArrowLeft />
                                    </IconButton>
                                    <Box>
                                        <Typography variant="h4">
                                            {samiti.samiti_name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {samiti.village}, {samiti.falia || 'No Falia'}
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <Tooltip title="Delete Samiti">
                                        <IconButton color="error" onClick={handleDelete}>
                                            <Trash />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            </Stack>

                            <Divider />

                            {/* Basic Information */}
                            <Box>
                                <Typography variant="h6" gutterBottom color="primary">
                                    Basic Information
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    Samiti Name
                                                </Typography>
                                                <Typography variant="h6">
                                                    {samiti.samiti_name}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    Village
                                                </Typography>
                                                <Typography variant="h6">
                                                    {samiti.village}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    Falia
                                                </Typography>
                                                <Typography variant="h6">
                                                    {samiti.falia || 'Not specified'}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    Count
                                                </Typography>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Typography variant="h6">
                                                        {samiti.count}
                                                    </Typography>
                                                    <Chip 
                                                        label={`${samiti.count} members`} 
                                                        color="primary" 
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    Year
                                                </Typography>
                                                <Chip 
                                                    label={samiti.year || 'N/A'} 
                                                    color="info" 
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Administrative Hierarchy */}
                            <Box>
                                <Typography variant="h6" gutterBottom color="primary">
                                    Administrative Hierarchy
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    State
                                                </Typography>
                                                <Typography variant="h6">
                                                    {samiti.state_id?.name || 'N/A'}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    Division
                                                </Typography>
                                                <Typography variant="h6">
                                                    {samiti.division_id?.name || 'N/A'}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    Parliament
                                                </Typography>
                                                <Typography variant="h6">
                                                    {samiti.parliament_id?.name || 'N/A'}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    Assembly
                                                </Typography>
                                                <Typography variant="h6">
                                                    {samiti.assembly_id?.name || 'N/A'}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    Block
                                                </Typography>
                                                <Typography variant="h6">
                                                    {samiti.block_id?.name || 'N/A'}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    Booth
                                                </Typography>
                                                <Typography variant="h6">
                                                    {samiti.booth_id?.name || 'N/A'}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    Panchayat
                                                </Typography>
                                                <Chip 
                                                    label={samiti.panchayat_id?.panchayat_name || 'N/A'}
                                                    color="info"
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    Village
                                                </Typography>
                                                <Chip 
                                                    label={samiti.village_id?.village_name || 'N/A'}
                                                    color="success"
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    Falliya
                                                </Typography>
                                                <Chip 
                                                    label={samiti.falliya_id?.falliya_name || 'N/A'}
                                                    color="warning"
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    Year
                                                </Typography>
                                                <Chip 
                                                    label={samiti.year || 'N/A'}
                                                    color="primary"
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Box>

                            {/* Record Information */}
                            <Box>
                                <Typography variant="h6" gutterBottom color="primary">
                                    Record Information
                                </Typography>
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    Created By
                                                </Typography>
                                                <Typography variant="h6">
                                                    {samiti.created_by?.username || 'System'}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    Created At
                                                </Typography>
                                                <Typography variant="h6">
                                                    {formatDate(samiti.created_at)}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="body2" color="text.secondary">
                                                    Last Updated
                                                </Typography>
                                                <Typography variant="h6">
                                                    {formatDate(samiti.updated_at)}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Stack>
                    </MainCard>
                </Grid>
            </Grid>

            <SamitiModal
                open={openModal}
                modalToggler={setOpenModal}
                samiti={samiti}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                refresh={fetchSamiti}
            />

            <AlertSamitiDelete
                open={deleteAlert.open}
                handleClose={() => setDeleteAlert({ open: false, id: null })}
                id={deleteAlert.id}
                refresh={handleDeleteSuccess}
            />
        </>
    );
};

export default SamitiDetailPage;