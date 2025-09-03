import {
  Stack,
  Typography,
  Divider,
  Grid,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  CircularProgress
} from '@mui/material';
import { CalendarTick, People, User, CloseCircle } from 'iconsax-react';
import { useState, useEffect } from 'react';
import axiosServices from '../../../utils/axios';

export default function UserView({ open, setOpen, selectedUser }) {
  const [userHierarchy, setUserHierarchy] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const data = selectedUser;

  // Fetch user hierarchy and roles data when dialog opens
  useEffect(() => {
    if (open && data?._id) {
      fetchUserHierarchy();
      fetchUserRoles();
    }
  }, [open, data?._id]);

  const fetchUserHierarchy = async () => {
    try {
      setLoading(true);
      const response = await axiosServices.get(`/user-hierarchy/${data._id}`);

      // Handle different response structures
      const hierarchyData = response.data?.data || response.data;
      setUserHierarchy(hierarchyData);
    } catch (error) {
      console.error('Error fetching user hierarchy:', error);
      setUserHierarchy(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const response = await axiosServices.get(`/user-roles/user/${data._id}`);
      const rolesData = response.data?.data || response.data || [];
      setUserRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      setUserRoles([]);
    }
  }; if (!data) return null;

  const handleClose = () => {
    setOpen(false);
    setUserRoles([]);
    setUserHierarchy(null);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatArray = (items) => {
    if (!items || items.length === 0) return 'None';
    return items.map(item => item.name).join(', ');
  };

  const getRoleColor = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'superadmin':
        return 'error';
      case 'admin':
        return 'warning';
      case 'manager':
        return 'info';
      case 'user':
        return 'success';
      default:
        return 'primary';
    }
  };

  const formatRoles = () => {
    if (!userRoles || userRoles.length === 0) return 'No roles assigned';
    return userRoles.map(role => role.name).join(', ');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <User />
            <Typography variant="h6">User Details</Typography>
          </Stack>
          <IconButton onClick={handleClose} size="small">
            <CloseCircle />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ p: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2} mb={2}>
            <Typography variant="h6">{data.username || 'Untitled User'}</Typography>
            {userRoles && userRoles.length > 0 ? (
              userRoles.map((role, index) => (
                <Chip
                  key={role._id || index}
                  label={role.name?.toUpperCase() || 'UNKNOWN'}
                  color={getRoleColor(role.name)}
                  size="small"
                />
              ))
            ) : (
              <Chip
                label="NO ROLES"
                color="default"
                size="small"
              />
            )}
            <Chip
              label={data.isActive ? 'ACTIVE' : 'INACTIVE'}
              color={data.isActive ? 'success' : 'error'}
              size="small"
            />
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={3}>
            {/* Left Column */}
            <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
              <Stack spacing={2}>
                <Typography variant="h6" color="primary">Personal Information</Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4} lg={4} xl={4}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Username</Typography>
                    <Typography variant="body1" fontWeight="medium">{data.username || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} lg={4} xl={4}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Mobile</Typography>
                    <Typography variant="body1">{data.mobile || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} lg={4} xl={4}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Status</Typography>
                    <Chip
                      label={data.isActive ? 'Active' : 'Inactive'}
                      color={data.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={12} md={8} lg={8} xl={8}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Email</Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        wordBreak: 'break-all',
                        whiteSpace: 'normal'
                      }}
                    >
                      {data.email || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Role(s)</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {userRoles && userRoles.length > 0 ? (
                        userRoles.map((role, index) => (
                          <Chip
                            key={role._id || index}
                            label={role.name}
                            color={getRoleColor(role.name)}
                            size="small"
                          />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No roles assigned
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Stack>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
              <Stack spacing={2}>
                <Typography variant="h6" color="primary">Assigned Areas</Typography>

                {loading ? (
                  <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>States</Typography>
                      {userHierarchy?.state ? (
                        <Chip
                          label={userHierarchy.state.name}
                          color="primary"
                          size="small"
                          sx={{ mb: 0.5, mr: 0.5 }}
                        />
                      ) : (
                        <Typography variant="caption">No states assigned</Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>Divisions</Typography>
                      {userHierarchy?.division ? (
                        <Chip
                          label={userHierarchy.division.name}
                          color="warning"
                          size="small"
                          sx={{ mb: 0.5, mr: 0.5 }}
                        />
                      ) : (
                        <Typography variant="caption">No divisions assigned</Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>Parliaments</Typography>
                      {userHierarchy?.parliament ? (
                        <Chip
                          label={userHierarchy.parliament.name}
                          color="secondary"
                          size="small"
                          sx={{ mb: 0.5, mr: 0.5 }}
                        />
                      ) : (
                        <Typography variant="caption">No parliaments assigned</Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>Assemblies</Typography>
                      {userHierarchy?.assembly ? (
                        <Chip
                          label={userHierarchy.assembly.name}
                          color="info"
                          size="small"
                          sx={{ mb: 0.5, mr: 0.5 }}
                        />
                      ) : (
                        <Typography variant="caption">No assemblies assigned</Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>Blocks</Typography>
                      {userHierarchy?.block ? (
                        <Chip
                          label={userHierarchy.block.name}
                          color="primary"
                          size="small"
                          sx={{ mb: 0.5, mr: 0.5 }}
                        />
                      ) : (
                        <Typography variant="caption">No blocks assigned</Typography>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6} md={2.4} lg={2.4} xl={2.4}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>Booths</Typography>
                      {userHierarchy?.booth ? (
                        <Chip
                          label={`${userHierarchy.booth.name} (${userHierarchy.booth.booth_number || 'N/A'})`}
                          color="success"
                          size="small"
                          sx={{ mb: 0.5, mr: 0.5 }}
                        />
                      ) : (
                        <Typography variant="caption">No booths assigned</Typography>
                      )}
                    </Grid>
                  </Grid>
                )}
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Metadata Section */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <User size={16} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
                  <Typography variant="body2">{data.created_by?.username || 'Unknown'}</Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <User size={16} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Updated By</Typography>
                  <Typography variant="body2">{data.updated_by?.username || 'N/A'}</Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CalendarTick size={16} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                  <Typography variant="body2">{formatDateTime(data.created_at)}</Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CalendarTick size={16} />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Updated At</Typography>
                  <Typography variant="body2">{formatDateTime(data.updated_at)}</Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
