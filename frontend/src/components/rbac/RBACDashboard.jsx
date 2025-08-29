import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Tab,
  Tabs,
  Badge,
  Tooltip,
  Button,
  IconButton,
  Alert
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  VpnKey as VpnKeyIcon,
  Assignment as AssignmentIcon,
  AdminPanelSettings as AdminIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  Groups as GroupsIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useRBAC } from '../../contexts/RBACContext';
import { rbacAPI } from '../../api/auth';

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rbac-tabpanel-${index}`}
      aria-labelledby={`rbac-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const RBACDashboard = () => {
  const { user, permissions, roles, accessibleScopes, dashboardData, refreshPermissions } = useRBAC();
  const [tabValue, setTabValue] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load RBAC metrics
  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await rbacAPI.getMetrics();
      setMetrics(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getRoleColor = (roleName) => {
    const colors = {
      'SuperAdmin': 'error',
      'StateAdmin': 'warning',
      'DivisionAdmin': 'info',
      'AssemblyAdmin': 'primary',
      'BoothAdmin': 'secondary',
      'BoothUser': 'default'
    };
    return colors[roleName] || 'default';
  };

  const getPermissionCategory = (permission) => {
    return permission.split('.')[0];
  };

  const groupPermissionsByCategory = () => {
    const grouped = {};
    permissions.forEach(permission => {
      const category = getPermissionCategory(permission);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(permission);
    });
    return grouped;
  };

  if (!user) {
    return (
      <Alert severity="warning">
        <Typography>Please login to view your RBAC dashboard.</Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DashboardIcon />
          RBAC Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={refreshPermissions}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* User Overview Card */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <PersonIcon />
            </Avatar>
          }
          title={`Welcome, ${user.username}`}
          subheader={user.email}
          action={
            <Chip 
              label={user.isActive ? 'Active' : 'Inactive'} 
              color={user.isActive ? 'success' : 'error'}
              size="small"
            />
          }
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Badge badgeContent={roles.length} color="primary">
                  <AdminIcon fontSize="large" />
                </Badge>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {roles.length} Role{roles.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Badge badgeContent={permissions.length} color="secondary">
                  <VpnKeyIcon fontSize="large" />
                </Badge>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {permissions.length} Permission{permissions.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Badge 
                  badgeContent={Object.values(accessibleScopes).reduce((acc, scopes) => acc + scopes.length, 0)} 
                  color="info"
                >
                  <LocationIcon fontSize="large" />
                </Badge>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  Accessible Scopes
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab label="My Roles" icon={<GroupsIcon />} />
          <Tab label="My Permissions" icon={<VpnKeyIcon />} />
          <Tab label="Accessible Scopes" icon={<LocationIcon />} />
          {metrics && <Tab label="System Metrics" icon={<SecurityIcon />} />}
        </Tabs>

        {/* Roles Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            {roles.map((userRole, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <AdminIcon />
                      <Typography variant="h6">
                        {userRole.role}
                      </Typography>
                      <Chip 
                        label={userRole.role} 
                        color={getRoleColor(userRole.role)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Scope: {userRole.scope}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Permissions Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={2}>
            {Object.entries(groupPermissionsByCategory()).map(([category, perms]) => (
              <Grid item xs={12} sm={6} md={4} key={category}>
                <Card variant="outlined">
                  <CardHeader
                    title={category.charAt(0).toUpperCase() + category.slice(1)}
                    titleTypographyProps={{ variant: 'h6' }}
                    avatar={<VpnKeyIcon />}
                  />
                  <CardContent>
                    <List dense>
                      {perms.map((permission, index) => (
                        <ListItem key={index} disablePadding>
                          <ListItemIcon>
                            <Chip label={permission.split('.')[1]} size="small" />
                          </ListItemIcon>
                          <ListItemText primary={permission} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Accessible Scopes Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
            {Object.entries(accessibleScopes).map(([scopeType, scopes]) => (
              scopes.length > 0 && (
                <Grid item xs={12} sm={6} md={4} key={scopeType}>
                  <Card variant="outlined">
                    <CardHeader
                      title={scopeType.charAt(0).toUpperCase() + scopeType.slice(1)}
                      titleTypographyProps={{ variant: 'h6' }}
                      avatar={<LocationIcon />}
                    />
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {scopes.length} accessible {scopeType}
                      </Typography>
                      <List dense>
                        {scopes.slice(0, 5).map((scope, index) => (
                          <ListItem key={index} disablePadding>
                            <ListItemText 
                              primary={scope.id} 
                              secondary={scope.role ? `Role: ${scope.role}` : ''} 
                            />
                          </ListItem>
                        ))}
                        {scopes.length > 5 && (
                          <ListItem>
                            <ListItemText 
                              primary={`... and ${scopes.length - 5} more`}
                              primaryTypographyProps={{ style: { fontStyle: 'italic' } }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )
            ))}
          </Grid>
        </TabPanel>

        {/* System Metrics Tab */}
        {metrics && (
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              {/* Overview Metrics */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>System Overview</Typography>
                <Grid container spacing={2}>
                  {Object.entries(metrics.overview).map(([key, value]) => (
                    <Grid item xs={12} sm={6} md={3} key={key}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {value}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {/* Distribution Charts */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Users by Role" />
                  <CardContent>
                    <List>
                      {metrics.distributions.usersByRole.map((item, index) => (
                        <ListItem key={index}>
                          <ListItemText 
                            primary={item._id || 'Unknown'}
                            secondary={`${item.count} users`}
                          />
                          <Chip label={item.count} size="small" />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Permissions by Level" />
                  <CardContent>
                    <List>
                      {metrics.distributions.permissionsByLevel.map((item, index) => (
                        <ListItem key={index}>
                          <ListItemText 
                            primary={item._id}
                            secondary={`${item.count} permissions`}
                          />
                          <Chip label={item.count} size="small" />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default RBACDashboard;
