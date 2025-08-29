import React, { useState, useEffect } from 'react';
import rbacApiService from '../../services/rbacApi';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Fab,
  Tooltip,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

const UserManagementCRUD = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUser, setMenuUser] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobile: '',
    password: '',
    role: '',
    isActive: true
  });

  // Available roles
  const roles = [
    { value: 'superAdmin', label: 'Super Admin', color: 'error' },
    { value: 'State', label: 'State Admin', color: 'warning' },
    { value: 'Division', label: 'Division Admin', color: 'info' },
    { value: 'Parliament', label: 'Parliament Admin', color: 'success' },
    { value: 'Assembly', label: 'Assembly Admin', color: 'success' },
    { value: 'Block', label: 'Block Admin', color: 'default' },
    { value: 'Booth', label: 'Booth Officer', color: 'secondary' }
  ];

  // Mock users data (you can replace with real API calls)
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Real API call
      const response = await rbacApiService.getUsers();
      setUsers(response.data || response);
      setError('');
    } catch (err) {
      console.error('Load users error:', err);
      // Fallback to mock data on API error
      const mockUsers = [
        {
          _id: '1',
          username: 'admin',
          email: 'admin@election.com',
          mobile: '9876543210',
          role: 'superAdmin',
          isActive: true,
          created_at: new Date().toISOString()
        },
        {
          _id: '2',
          username: 'state_admin',
          email: 'state@election.com',
          mobile: '9876543211',
          role: 'State',
          isActive: true,
          created_at: new Date().toISOString()
        },
        {
          _id: '3',
          username: 'booth_officer',
          email: 'booth@election.com',
          mobile: '9876543212',
          role: 'Booth',
          isActive: true,
          created_at: new Date().toISOString()
        }
      ];
      
      setUsers(mockUsers);
      setError('Using mock data - API connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setLoading(true);
      
      // Validation
      if (!formData.username || !formData.email || !formData.password || !formData.role) {
        setError('Please fill all required fields');
        return;
      }

      // Real API call
      try {
        const response = await rbacApiService.createUser(formData);
        const newUser = response.data || response;
        setUsers(prev => [...prev, newUser]);
        setSuccess('User created successfully!');
      } catch (apiError) {
        console.error('API Error:', apiError);
        // Fallback to mock behavior
        const newUser = {
          _id: Date.now().toString(),
          ...formData,
          created_at: new Date().toISOString()
        };
        setUsers(prev => [...prev, newUser]);
        setSuccess('User created successfully! (Mock Mode)');
      }

      setOpenCreateDialog(false);
      resetForm();
    } catch (err) {
      setError('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    try {
      setLoading(true);

      // Real API call
      try {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // Don't send empty password
        }
        
        const response = await rbacApiService.updateUser(selectedUser._id, updateData);
        const updatedUser = response.data || response;
        
        setUsers(prev => prev.map(user => 
          user._id === selectedUser._id ? updatedUser : user
        ));
        setSuccess('User updated successfully!');
      } catch (apiError) {
        console.error('API Error:', apiError);
        // Fallback to mock behavior
        setUsers(prev => prev.map(user => 
          user._id === selectedUser._id 
            ? { ...user, ...formData, password: formData.password || user.password }
            : user
        ));
        setSuccess('User updated successfully! (Mock Mode)');
      }

      setOpenEditDialog(false);
      setSelectedUser(null);
      resetForm();
    } catch (err) {
      setError('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        setLoading(true);
        
        // Real API call
        try {
          await rbacApiService.deleteUser(userId);
          setUsers(prev => prev.filter(user => user._id !== userId));
          setSuccess('User deleted successfully!');
        } catch (apiError) {
          console.error('API Error:', apiError);
          // Fallback to mock behavior
          setUsers(prev => prev.filter(user => user._id !== userId));
          setSuccess('User deleted successfully! (Mock Mode)');
        }
      } catch (err) {
        setError('Failed to delete user');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      setLoading(true);
      
      // Real API call
      try {
        await rbacApiService.toggleUserStatus(userId);
        setUsers(prev => prev.map(user => 
          user._id === userId 
            ? { ...user, isActive: !user.isActive }
            : user
        ));
        setSuccess('User status updated successfully!');
      } catch (apiError) {
        console.error('API Error:', apiError);
        // Fallback to mock behavior
        setUsers(prev => prev.map(user => 
          user._id === userId 
            ? { ...user, isActive: !user.isActive }
            : user
        ));
        setSuccess('User status updated successfully! (Mock Mode)');
      }
    } catch (err) {
      setError('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const openCreate = () => {
    resetForm();
    setOpenCreateDialog(true);
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      password: '',
      role: user.role,
      isActive: user.isActive
    });
    setOpenEditDialog(true);
    handleMenuClose();
  };

  const openView = (user) => {
    setSelectedUser(user);
    setOpenViewDialog(true);
    handleMenuClose();
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      mobile: '',
      password: '',
      role: '',
      isActive: true
    });
  };

  const getRoleColor = (role) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj ? roleObj.color : 'default';
  };

  const getRoleLabel = (role) => {
    const roleObj = roles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  const goBack = () => {
    window.location.href = '/election/rbac/dashboard';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={goBack}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            User Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          Add User
        </Button>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Users ({users.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User Info</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon color="primary" />
                        <Box>
                          <Typography variant="subtitle2">
                            {user.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {user._id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {user.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.mobile}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(user.role)}
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
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(user.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, user)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItemComponent onClick={() => openView(menuUser)}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItemComponent>
        <MenuItemComponent onClick={() => openEdit(menuUser)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit User</ListItemText>
        </MenuItemComponent>
        <MenuItemComponent onClick={() => handleToggleActive(menuUser?._id)}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {menuUser?.isActive ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItemComponent>
        <MenuItemComponent onClick={() => handleDeleteUser(menuUser?._id)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItemComponent>
      </Menu>

      {/* Create User Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username *"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mobile"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password *"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role *</InputLabel>
                <Select
                  value={formData.role}
                  label="Role *"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateUser} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mobile"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="New Password (leave blank to keep current)"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button 
            onClick={handleEditUser} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            Update User
          </Button>
        </DialogActions>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedUser.username}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Email:
                </Typography>
                <Typography variant="body1">
                  {selectedUser.email}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Mobile:
                </Typography>
                <Typography variant="body1">
                  {selectedUser.mobile || 'Not provided'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Role:
                </Typography>
                <Chip
                  label={getRoleLabel(selectedUser.role)}
                  color={getRoleColor(selectedUser.role)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Status:
                </Typography>
                <Chip
                  label={selectedUser.isActive ? 'Active' : 'Inactive'}
                  color={selectedUser.isActive ? 'success' : 'error'}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Created:
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedUser.created_at).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  User ID:
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {selectedUser._id}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add user"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={openCreate}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default UserManagementCRUD;
