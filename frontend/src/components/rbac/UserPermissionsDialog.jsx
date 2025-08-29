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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Check as CheckIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { userAPI } from '../../api/auth';

const UserPermissionsDialog = ({ open, onClose, user }) => {
  const [userPermissions, setUserPermissions] = useState([]);
  const [permissionsByCategory, setPermissionsByCategory] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && user) {
      loadUserPermissions();
    }
  }, [open, user]);

  const loadUserPermissions = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUserPermissions(user._id);
      setUserPermissions(response.data);
      categorizePermissions(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const categorizePermissions = (permissions) => {
    const categories = {};
    
    permissions.forEach(permission => {
      const [resource, action] = permission.name.split('.');
      if (!categories[resource]) {
        categories[resource] = [];
      }
      categories[resource].push(permission);
    });

    setPermissionsByCategory(categories);
  };

  const getPermissionIcon = (action) => {
    const icons = {
      'read': <VisibilityIcon fontSize="small" />,
      'create': <AddIcon fontSize="small" />,
      'update': <EditIcon fontSize="small" />,
      'delete': <DeleteIcon fontSize="small" />,
      'manage': <AdminIcon fontSize="small" />
    };
    return icons[action] || <SecurityIcon fontSize="small" />;
  };

  const getPermissionColor = (action) => {
    const colors = {
      'read': 'info',
      'create': 'success',
      'update': 'warning',
      'delete': 'error',
      'manage': 'primary'
    };
    return colors[action] || 'default';
  };

  const getResourceDisplayName = (resource) => {
    const displayNames = {
      'user': 'User Management',
      'role': 'Role Management',
      'permission': 'Permission Management',
      'booth': 'Booth Management',
      'block': 'Block Management',
      'assembly': 'Assembly Management',
      'parliament': 'Parliament Management',
      'division': 'Division Management',
      'state': 'State Management',
      'candidate': 'Candidate Management',
      'election': 'Election Management',
      'vote': 'Vote Management',
      'report': 'Report Access',
      'analytics': 'Analytics Access'
    };
    return displayNames[resource] || resource.charAt(0).toUpperCase() + resource.slice(1);
  };

  const getTotalPermissionsByAction = () => {
    const actionCounts = {};
    userPermissions.forEach(permission => {
      const action = permission.name.split('.')[1];
      actionCounts[action] = (actionCounts[action] || 0) + 1;
    });
    return actionCounts;
  };

  const actionCounts = getTotalPermissionsByAction();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon />
          <Typography variant="h6">
            Permissions for {user?.username}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
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
                        {user?.email} • Role: {user?.role}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Permission Summary */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Permission Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Total Permissions:
                      </Typography>
                      <Typography variant="h6">
                        {userPermissions.length}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Resource Categories:
                      </Typography>
                      <Typography variant="h6">
                        {Object.keys(permissionsByCategory).length}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Read Permissions:
                      </Typography>
                      <Typography variant="h6">
                        {actionCounts.read || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Write Permissions:
                      </Typography>
                      <Typography variant="h6">
                        {(actionCounts.create || 0) + (actionCounts.update || 0) + (actionCounts.delete || 0)}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Action Breakdown */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Permission Breakdown by Action:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {Object.entries(actionCounts).map(([action, count]) => (
                        <Chip
                          key={action}
                          label={`${action}: ${count}`}
                          color={getPermissionColor(action)}
                          size="small"
                        />
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Permissions by Category */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Permissions by Resource Category
              </Typography>
              
              {Object.keys(permissionsByCategory).length === 0 ? (
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      No permissions assigned to this user.
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                Object.entries(permissionsByCategory).map(([resource, permissions]) => (
                  <Accordion key={resource}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Typography variant="h6">
                          {getResourceDisplayName(resource)}
                        </Typography>
                        <Chip
                          label={`${permissions.length} permissions`}
                          color="primary"
                          size="small"
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {permissions.map((permission, index) => {
                          const action = permission.name.split('.')[1];
                          return (
                            <React.Fragment key={permission._id}>
                              <ListItem>
                                <ListItemIcon>
                                  {getPermissionIcon(action)}
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body1">
                                        {permission.name}
                                      </Typography>
                                      <Chip
                                        label={action}
                                        color={getPermissionColor(action)}
                                        size="small"
                                      />
                                    </Box>
                                  }
                                  secondary={permission.description}
                                />
                                <CheckIcon color="success" />
                              </ListItem>
                              {index < permissions.length - 1 && <Divider />}
                            </React.Fragment>
                          );
                        })}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                ))
              )}
            </Grid>
          </Grid>
        )}

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

export default UserPermissionsDialog;
