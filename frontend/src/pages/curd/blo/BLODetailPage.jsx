import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// material-ui
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';

// project import
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';
import StarRating from 'components/StarRating';
import MaskedPhoneNumber from 'components/MaskedPhoneNumber';

// assets
import { ArrowLeft, Edit } from 'iconsax-react';

// ==============================|| BLO DETAIL ||============================== //

const BLODetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blo, setBLO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBLODetails();
  }, [id]);

  const fetchBLODetails = async () => {
    try {
      setLoading(true);
      const response = await axiosServices.get(`/blos/${id}`);
      setBLO(response.data.data);
    } catch (error) {
      console.error('Error fetching BLO details:', error);
      setError('Failed to load BLO details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/blo/edit/${id}`);
  };

  const handleBack = () => {
    navigate('/blo');
  };

  if (loading) {
    return (
      <MainCard>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  if (error) {
    return (
      <MainCard>
        <Alert severity="error">{error}</Alert>
      </MainCard>
    );
  }

  if (!blo) {
    return (
      <MainCard>
        <Alert severity="warning">BLO not found</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="outlined"
              startIcon={<ArrowLeft />}
              onClick={handleBack}
            >
              Back to List
            </Button>
            <Typography variant="h4">BLO Officer Details</Typography>
          </Stack>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={handleEdit}
          >
            Edit BLO
          </Button>
        </Stack>

        <Divider />

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      BLO Name
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {blo.blo_name}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={blo.is_active ? 'Active' : 'Inactive'}
                      color={blo.is_active ? 'success' : 'error'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  {blo.designation && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Designation
                      </Typography>
                      <Typography variant="body1">
                        {blo.designation}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contact Information
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Contact Number
                    </Typography>
                    <MaskedPhoneNumber
                      maskedNumber={blo.contact_number || 'N/A'}
                      bloId={blo._id}
                    />
                  </Box>

                  {blo.email && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">
                        {blo.email}
                      </Typography>
                    </Box>
                  )}

                  {blo.election_year_id && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Election Year
                      </Typography>
                      <Typography variant="body1">
                        {blo.election_year_id.year}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Hierarchy Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Administrative Hierarchy
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        State
                      </Typography>
                      <Typography variant="body1">
                        {blo.state_id?.name || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Division
                      </Typography>
                      <Typography variant="body1">
                        {blo.division_id?.name || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Parliament
                      </Typography>
                      <Typography variant="body1">
                        {blo.parliament_id?.name || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Assembly
                      </Typography>
                      <Typography variant="body1">
                        {blo.assembly_id?.name || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Block
                      </Typography>
                      <Typography variant="body1">
                        {blo.block_id?.name || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Booth
                      </Typography>
                      <Typography variant="body1">
                        {blo.booth_id?.name || 'N/A'}
                        {blo.booth_id?.booth_number && (
                          <Typography variant="body2" color="text.secondary">
                            (Booth #{blo.booth_id.booth_number})
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* System Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Information
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Created At
                    </Typography>
                    <Typography variant="body1">
                      {new Date(blo.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body1">
                      {new Date(blo.updated_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>

                  {blo.created_by && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Created By
                      </Typography>
                      <Typography variant="body1">
                        {blo.created_by.username || 'N/A'}
                      </Typography>
                    </Box>
                  )}

                  {blo.updated_by && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Updated By
                      </Typography>
                      <Typography variant="body1">
                        {blo.updated_by.username || 'N/A'}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </MainCard>
  );
};

export default BLODetailPage;