import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Typography,
  Alert,
  Tooltip,
  Menu,
  MenuList,
  MenuItem as MenuItemComponent,
  ListItemIcon,
  ListItemText,
  Pagination,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Block as BlockIcon,
  Check as CheckIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { userAPI, roleAPI } from '../../api/auth';
import { useRBAC } from '../../contexts/RBACContext';
import { PermissionGuard } from './Guards';
import UserRoleDialog from './UserRoleDialog';
import UserPermissionsDialog from './UserPermissionsDialog';

const UserManagement = () => {
  const { hasPermission } = useRBAC();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  
  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [openPermissionsDialog, setOpenPermissionsDialog] = useState(false);
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
    state_ids: [],
    division_ids: [],
    parliament_ids: [],
    assembly_ids: [],
    block_ids: [],
    booth_ids: []
  });

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, [page, searchTerm, selectedRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedRole && { role: selectedRole })
      };
      const response = await userAPI.getUsers(params);
      setUsers(response.data);
      setTotalPages(response.pages);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await roleAPI.getRoles();
      setRoles(response.data);
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  const handleCreateUser = async () => {
    try {
      await userAPI.createUser(formData);
      setOpenCreateDialog(false);
      setFormData({
        username: '',
        email: '',
        mobile: '',
        password: '',
        role: '',
        state_ids: [],
        division_ids: [],
        parliament_ids: [],
        assembly_ids: [],
        block_ids: [],
        booth_ids: []
      });
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditUser = async () => {
    try {
      await userAPI.updateUser(selectedUser.id, formData);
      setOpenEditDialog(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.deleteUser(userId);
        loadUsers();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await userAPI.toggleUserActive(userId);
      loadUsers();
    } catch (err) {
      setError(err.message);
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

  const openEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      mobile: user.mobile,
      password: '',
      role: user.role,
      state_ids: user.state_ids?.map(s => s._id) || [],
      division_ids: user.division_ids?.map(d => d._id) || [],
      parliament_ids: user.parliament_ids?.map(p => p._id) || [],
      assembly_ids: user.assembly_ids?.map(a => a._id) || [],
      block_ids: user.block_ids?.map(b => b._id) || [],
      booth_ids: user.booth_ids?.map(b => b._id) || []
    });
    setOpenEditDialog(true);
    handleMenuClose();
  };

  const openUserRoles = (user) => {
    setSelectedUser(user);
    setOpenRoleDialog(true);
    handleMenuClose();
  };

  const openUserPermissions = (user) => {
    setSelectedUser(user);
    setOpenPermissionsDialog(true);
    handleMenuClose();
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        <PermissionGuard permission="user.create">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
          >
            Add User
          </Button>
        </PermissionGuard>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Role</InputLabel>
                <Select
                  value={selectedRole}
                  label="Filter by Role"
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <MenuItem value="">All Roles</MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role._id} value={role.name}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRole('');
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader title="Users" />
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon />
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

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </Box>
        </CardContent>
      </Card>

      {/* User Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <PermissionGuard permission="user.update" showMessage={false}>
          <MenuItemComponent onClick={() => openEdit(menuUser)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit User</ListItemText>
          </MenuItemComponent>
        </PermissionGuard>

        <PermissionGuard permission="user.read" showMessage={false}>
          <MenuItemComponent onClick={() => openUserRoles(menuUser)}>
            <ListItemIcon>
              <AdminIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Manage Roles</ListItemText>
          </MenuItemComponent>
        </PermissionGuard>

        <PermissionGuard permission="user.read" showMessage={false}>
          <MenuItemComponent onClick={() => openUserPermissions(menuUser)}>
            <ListItemIcon>
              <SecurityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Permissions</ListItemText>
          </MenuItemComponent>
        </PermissionGuard>

        <PermissionGuard permission="user.update" showMessage={false}>
          <MenuItemComponent onClick={() => handleToggleActive(menuUser?._id)}>
            <ListItemIcon>
              {menuUser?.isActive ? <BlockIcon fontSize="small" /> : <CheckIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>
              {menuUser?.isActive ? 'Deactivate' : 'Activate'}
            </ListItemText>
          </MenuItemComponent>
        </PermissionGuard>

        <PermissionGuard permission="user.delete" showMessage={false}>
          <MenuItemComponent onClick={() => handleDeleteUser(menuUser?._id)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete User</ListItemText>
          </MenuItemComponent>
        </PermissionGuard>
      </Menu>

      {/* Create User Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
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
                label="Password"
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
                    <MenuItem key={role._id} value={role.name}>
                      {role.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained">
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditUser} variant="contained">
            Update User
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Role Management Dialog */}
      {selectedUser && (
        <UserRoleDialog
          open={openRoleDialog}
          onClose={() => setOpenRoleDialog(false)}
          user={selectedUser}
          onRoleUpdate={loadUsers}
        />
      )}

      {/* User Permissions Dialog */}
      {selectedUser && (
        <UserPermissionsDialog
          open={openPermissionsDialog}
          onClose={() => setOpenPermissionsDialog(false)}
          user={selectedUser}
        />
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default UserManagement;
