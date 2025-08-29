import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { userAPI, roleAPI } from '../../api/auth';

const UserRoleDialog = ({ open, onClose, user, onRoleUpdate }) => {
  const [userRoles, setUserRoles] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && user) {
      loadUserRoles();
      loadAvailableRoles();
    }
  }, [open, user]);

  const loadUserRoles = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUserRoles(user._id);
      setUserRoles(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableRoles = async () => {
    try {
      const response = await roleAPI.getRoles();
      setAvailableRoles(response.data);
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRole) return;

    try {
      setLoading(true);
      await userAPI.assignRole(user._id, selectedRole);
      setSelectedRole('');
      loadUserRoles();
      onRoleUpdate();
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (roleId) => {
    if (window.confirm('Are you sure you want to remove this role from the user?')) {
      try {
        setLoading(true);
        await userAPI.removeRole(user._id, roleId);
        loadUserRoles();
        onRoleUpdate();
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      'superAdmin': 'error',
      'State': 'warning',
      'Admin': 'primary',
      'Booth': 'secondary',
      'Division': 'info',
      'Parliament': 'success',
      'Block': 'default',
      'Assembly': 'default'
    };
    return colors[role] || 'default';
  };

  const getAvailableRolesForAssignment = () => {
    const assignedRoleIds = userRoles.map(ur => ur.role._id);
    return availableRoles.filter(role => !assignedRoleIds.includes(role._id));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdminIcon />
          <Typography variant="h6">
            Manage Roles for {user?.username}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          {/* User Info */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PersonIcon color="primary" />
                  <Box>
                    <Typography variant="h6">{user?.username}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user?.email} • {user?.mobile}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Assign New Role */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Assign New Role
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <FormControl sx={{ minWidth: 200 }} size="small">
                    <InputLabel>Select Role</InputLabel>
                    <Select
                      value={selectedRole}
                      label="Select Role"
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      {getAvailableRolesForAssignment().map((role) => (
                        <MenuItem key={role._id} value={role._id}>
                          {role.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAssignRole}
                    disabled={!selectedRole || loading}
                    size="small"
                  >
                    Assign Role
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Current Roles */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Roles ({userRoles.length})
                </Typography>
                
                {userRoles.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No roles assigned to this user.
                  </Typography>
                ) : (
                  <List>
                    {userRoles.map((userRole, index) => (
                      <React.Fragment key={userRole._id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={userRole.role.name}
                                  color={getRoleColor(userRole.role.name)}
                                  size="small"
                                />
                                <Typography variant="body2">
                                  {userRole.role.description}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Assigned: {new Date(userRole.assigned_at).toLocaleDateString()}
                                </Typography>
                                {userRole.role.permissions && (
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    {userRole.role.permissions.length} permissions included
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveRole(userRole.role._id)}
                              disabled={loading}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < userRoles.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Role Summary */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Role Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Roles:
                    </Typography>
                    <Typography variant="h6">
                      {userRoles.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Permissions:
                    </Typography>
                    <Typography variant="h6">
                      {userRoles.reduce((total, ur) => total + (ur.role.permissions?.length || 0), 0)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserRoleDialog;
