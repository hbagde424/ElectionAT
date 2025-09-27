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
          {/* Header Section */}
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <Typography variant="h4" component="h1" color="primary">
              {data.username || 'Untitled User'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDateTime(data.created_at)}
            </Typography>
          </Stack>

          {/* All User Information in 3-column layout */}
          <Grid container spacing={3}>
            {/* Column 1 */}
            <Grid item xs={12} md={4}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Username
                  </Typography>
                  <Typography variant="body1">
                    {data.username || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Mobile
                  </Typography>
                  <Typography variant="body1">
                    {data.mobile || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                    {data.email || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Role
                  </Typography>
                  <Typography variant="body1">
                    {data.role || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    States
                  </Typography>
                  <Typography variant="body1">
                    {userHierarchy?.state?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Divisions
                  </Typography>
                  <Typography variant="body1">
                    {userHierarchy?.division?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Parliaments
                  </Typography>
                  <Typography variant="body1">
                    {userHierarchy?.parliament?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Assemblies
                  </Typography>
                  <Typography variant="body1">
                    {userHierarchy?.assembly?.name || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>

            {/* Column 2 */}
            <Grid item xs={12} md={4}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Blocks
                  </Typography>
                  <Typography variant="body1">
                    {userHierarchy?.block?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Booths
                  </Typography>
                  <Typography variant="body1">
                    {userHierarchy?.booth ? `${userHierarchy.booth.name} (${userHierarchy.booth.booth_number || 'N/A'})` : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created By
                  </Typography>
                  <Typography variant="body1">
                    {data.created_by?.username || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Updated By
                  </Typography>
                  <Typography variant="body1">
                    {data.updated_by?.username || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(data.created_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Updated At
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(data.updated_at)}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>

            {/* Column 3 */}
            <Grid item xs={12} md={4}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    User Roles
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
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
                      <Typography variant="body2" color="text.secondary">
                        No roles assigned
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Assigned Areas Summary
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {loading ? 'Loading...' : (
                      <>
                        {userHierarchy?.state && `State: ${userHierarchy.state.name}`}
                        {userHierarchy?.division && ` | Division: ${userHierarchy.division.name}`}
                        {userHierarchy?.parliament && ` | Parliament: ${userHierarchy.parliament.name}`}
                        {userHierarchy?.assembly && ` | Assembly: ${userHierarchy.assembly.name}`}
                        {userHierarchy?.block && ` | Block: ${userHierarchy.block.name}`}
                        {userHierarchy?.booth && ` | Booth: ${userHierarchy.booth.name}`}
                        {!userHierarchy?.state && !userHierarchy?.division && !userHierarchy?.parliament &&
                          !userHierarchy?.assembly && !userHierarchy?.block && !userHierarchy?.booth &&
                          'No areas assigned'}
                      </>
                    )}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* Status and Key Info below the table */}
          <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                label={data.isActive ? 'ACTIVE' : 'INACTIVE'}
                color={data.isActive ? 'success' : 'error'}
              />
              {userRoles && userRoles.length > 0 ? (
                userRoles.map((role, index) => (
                  <Chip
                    key={role._id || index}
                    label={role.name?.toUpperCase() || 'UNKNOWN'}
                    color={getRoleColor(role.name)}
                    variant="outlined"
                  />
                ))
              ) : (
                <Chip
                  label="NO ROLES"
                  color="default"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
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
