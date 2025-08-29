import React, { useState, useEffect } from 'react';
import rbacApiService from '../../services/rbacApi';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  People as PeopleIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';

const RBACDashboardSimple = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    users: [],
    roles: [],
    permissions: []
  });
  const [error, setError] = useState('');

  // Mock user data (since we're testing)
  const mockUser = {
    username: 'admin',
    role: 'superAdmin',
    permissions: ['user.read', 'user.create', 'role.read', 'permission.read']
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // First check if API is connected
      const isApiConnected = await rbacApiService.testConnection();
      
      if (isApiConnected) {
        console.log('🔗 Connecting to real API...');
        
        // Try real API calls
        const [dashboardResponse, usersResponse, rolesResponse] = await Promise.all([
          rbacApiService.getDashboardStats(),
          rbacApiService.getUsers(),
          rbacApiService.getRoles()
        ]);

        setData({
          users: usersResponse?.data || [],
          roles: rolesResponse?.data || [],
          permissions: dashboardResponse?.permissions || [],
          stats: dashboardResponse?.stats || {}
        });
        
        console.log('✅ Real API data loaded successfully');
      } else {
        throw new Error('API connection not available');
      }
    } catch (error) {
      console.log('⚠️  Falling back to demo data:', error.message);
      setError('Using demo data - API connection not available');
      
      // Fallback to mock data
      const mockData = {
        users: [
          { _id: '1', username: 'admin', role: 'superAdmin', isActive: true },
          { _id: '2', username: 'state_admin', role: 'State', isActive: true },
          { _id: '3', username: 'booth_officer', role: 'Booth', isActive: true }
        ],
        roles: [
          { _id: '1', name: 'superAdmin', description: 'Full system access', userCount: 1 },
          { _id: '2', name: 'State', description: 'State level access', userCount: 1 },
          { _id: '3', name: 'Booth', description: 'Booth level access', userCount: 1 }
        ],
        permissions: [
          { _id: '1', name: 'user.read', description: 'View users' },
          { _id: '2', name: 'user.create', description: 'Create users' },
          { _id: '3', name: 'role.read', description: 'View roles' }
        ]
      };
      setData(mockData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const logout = () => {
    alert('Logged out successfully!');
    window.location.href = '/election/rbac/login';
  };

  const getRoleColor = (role) => {
    const colors = {
      'superAdmin': 'error',
      'State': 'warning',
      'Booth': 'secondary'
    };
    return colors[role] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          RBAC Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="subtitle1">{mockUser.username}</Typography>
            <Chip label={mockUser.role} color={getRoleColor(mockUser.role)} size="small" />
          </Box>
          <Button variant="outlined" onClick={logout}>
            Logout
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{data.users.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AdminIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{data.roles.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    System Roles
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SecurityIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{data.permissions.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Permissions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Users Table */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Users
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Username</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.role}
                            color={getRoleColor(user.role)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isActive ? 'Active' : 'Inactive'}
                            color={user.isActive ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Roles
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Role Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Users</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.roles.map((role) => (
                      <TableRow key={role._id}>
                        <TableCell>
                          <Chip
                            label={role.name}
                            color={getRoleColor(role.name)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>{role.userCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Permissions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Permissions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {mockUser.permissions.map((permission, index) => (
              <Chip
                key={index}
                label={permission}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              startIcon={<PeopleIcon />}
              onClick={() => window.location.href = '/election/rbac/users'}
            >
              Manage Users
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AdminIcon />}
              onClick={() => window.location.href = '/election/rbac/roles'}
            >
              Manage Roles
            </Button>
            <Button variant="contained" startIcon={<SecurityIcon />}>
              View Analytics
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RBACDashboardSimple;
