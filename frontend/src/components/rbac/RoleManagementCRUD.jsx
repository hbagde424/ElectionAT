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
  Grid,
  Alert,
  Fab,
  Menu,
  MenuItem as MenuItemComponent,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  Security as SecurityIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';

const RoleManagementCRUD = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRole, setMenuRole] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    roleName: '',
    description: '',
    isActive: true,
    permissions: []
  });

  // Available permissions grouped by module
  const permissionModules = [
    {
      module: 'User Management',
      permissions: [
        { id: 'user.create', name: 'Create Users', description: 'Can create new users' },
        { id: 'user.read', name: 'View Users', description: 'Can view user details' },
        { id: 'user.update', name: 'Update Users', description: 'Can edit user information' },
        { id: 'user.delete', name: 'Delete Users', description: 'Can delete users' },
        { id: 'user.activate', name: 'Activate/Deactivate Users', description: 'Can change user status' }
      ]
    },
    {
      module: 'Role Management',
      permissions: [
        { id: 'role.create', name: 'Create Roles', description: 'Can create new roles' },
        { id: 'role.read', name: 'View Roles', description: 'Can view role details' },
        { id: 'role.update', name: 'Update Roles', description: 'Can edit role information' },
        { id: 'role.delete', name: 'Delete Roles', description: 'Can delete roles' },
        { id: 'role.assign', name: 'Assign Roles', description: 'Can assign roles to users' }
      ]
    },
    {
      module: 'Election Management',
      permissions: [
        { id: 'election.create', name: 'Create Elections', description: 'Can create election events' },
        { id: 'election.read', name: 'View Elections', description: 'Can view election data' },
        { id: 'election.update', name: 'Update Elections', description: 'Can edit election information' },
        { id: 'election.delete', name: 'Delete Elections', description: 'Can delete elections' },
        { id: 'election.results', name: 'Manage Results', description: 'Can manage election results' }
      ]
    },
    {
      module: 'Booth Management',
      permissions: [
        { id: 'booth.create', name: 'Create Booths', description: 'Can create polling booths' },
        { id: 'booth.read', name: 'View Booths', description: 'Can view booth information' },
        { id: 'booth.update', name: 'Update Booths', description: 'Can edit booth details' },
        { id: 'booth.delete', name: 'Delete Booths', description: 'Can delete booths' },
        { id: 'booth.assign', name: 'Assign Officers', description: 'Can assign booth officers' }
      ]
    },
    {
      module: 'Reports & Analytics',
      permissions: [
        { id: 'report.view', name: 'View Reports', description: 'Can view system reports' },
        { id: 'report.export', name: 'Export Reports', description: 'Can export report data' },
        { id: 'analytics.view', name: 'View Analytics', description: 'Can view analytics dashboard' },
        { id: 'analytics.advanced', name: 'Advanced Analytics', description: 'Can access advanced analytics' }
      ]
    }
  ];

  // Mock roles data
  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    try {
      // Real API call
      const response = await rbacApiService.getRoles();
      setRoles(response.data || response);
      setError('');
    } catch (err) {
      console.error('Load roles error:', err);
      // Fallback to mock data on API error
      const mockRoles = [
        {
          _id: '1',
          roleName: 'Super Admin',
          description: 'Full system access with all permissions',
          isActive: true,
          permissions: permissionModules.flatMap(m => m.permissions.map(p => p.id)),
          userCount: 1,
          created_at: new Date().toISOString()
        },
        {
          _id: '2',
          roleName: 'State Admin',
          description: 'State-level administration access',
          isActive: true,
          permissions: ['user.read', 'user.create', 'election.read', 'booth.read', 'report.view'],
          userCount: 5,
          created_at: new Date().toISOString()
        },
        {
          _id: '3',
          roleName: 'Booth Officer',
          description: 'Booth-level operations access',
          isActive: true,
          permissions: ['booth.read', 'booth.update', 'election.read'],
          userCount: 25,
          created_at: new Date().toISOString()
        }
      ];
      
      setRoles(mockRoles);
      setError('Using mock data - API connection failed');
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = () => {
    const allPermissions = permissionModules.flatMap(module => 
      module.permissions.map(permission => ({
        ...permission,
        module: module.module
      }))
    );
    setPermissions(allPermissions);
  };

  const handleCreateRole = async () => {
    try {
      setLoading(true);
      
      // Validation
      if (!formData.roleName || !formData.description) {
        setError('Please fill all required fields');
        return;
      }

      // Mock API call - replace with real API
      const newRole = {
        _id: Date.now().toString(),
        ...formData,
        userCount: 0,
        created_at: new Date().toISOString()
      };

      setRoles(prev => [...prev, newRole]);
      setSuccess('Role created successfully!');
      setOpenCreateDialog(false);
      resetForm();
    } catch (err) {
      setError('Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = async () => {
    try {
      setLoading(true);

      // Mock API call - replace with real API
      setRoles(prev => prev.map(role => 
        role._id === selectedRole._id 
          ? { ...role, ...formData }
          : role
      ));

      setSuccess('Role updated successfully!');
      setOpenEditDialog(false);
      setSelectedRole(null);
      resetForm();
    } catch (err) {
      setError('Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    const role = roles.find(r => r._id === roleId);
    if (role && role.userCount > 0) {
      setError('Cannot delete role with assigned users');
      return;
    }

    // eslint-disable-next-line no-restricted-globals
    if (confirm('Are you sure you want to delete this role?')) {
      try {
        setLoading(true);
        
        // Mock API call - replace with real API
        setRoles(prev => prev.filter(role => role._id !== roleId));
        setSuccess('Role deleted successfully!');
      } catch (err) {
        setError('Failed to delete role');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleActive = async (roleId) => {
    try {
      setLoading(true);
      
      // Mock API call - replace with real API
      setRoles(prev => prev.map(role => 
        role._id === roleId 
          ? { ...role, isActive: !role.isActive }
          : role
      ));

      setSuccess('Role status updated successfully!');
    } catch (err) {
      setError('Failed to update role status');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, role) => {
    setAnchorEl(event.currentTarget);
    setMenuRole(role);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRole(null);
  };

  const openCreate = () => {
    resetForm();
    setOpenCreateDialog(true);
  };

  const openEdit = (role) => {
    setSelectedRole(role);
    setFormData({
      roleName: role.roleName,
      description: role.description,
      isActive: role.isActive,
      permissions: role.permissions || []
    });
    setOpenEditDialog(true);
    handleMenuClose();
  };

  const openView = (role) => {
    setSelectedRole(role);
    setOpenViewDialog(true);
    handleMenuClose();
  };

  const resetForm = () => {
    setFormData({
      roleName: '',
      description: '',
      isActive: true,
      permissions: []
    });
  };

  const handlePermissionChange = (permissionId, checked) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(id => id !== permissionId)
    }));
  };

  const getPermissionName = (permissionId) => {
    const permission = permissions.find(p => p.id === permissionId);
    return permission ? permission.name : permissionId;
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
            Role Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          Add Role
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

      {/* Roles Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Roles ({roles.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Role Info</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Users</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SecurityIcon color="primary" />
                        <Box>
                          <Typography variant="subtitle2">
                            {role.roleName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {role._id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {role.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {role.permissions ? role.permissions.length : 0} permissions
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${role.userCount} users`}
                        size="small"
                        color={role.userCount > 0 ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={role.isActive ? 'Active' : 'Inactive'}
                        color={role.isActive ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(role.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, role)}
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
        <MenuItemComponent onClick={() => openView(menuRole)}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItemComponent>
        <MenuItemComponent onClick={() => openEdit(menuRole)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Role</ListItemText>
        </MenuItemComponent>
        <MenuItemComponent onClick={() => handleToggleActive(menuRole?._id)}>
          <ListItemIcon>
            <SecurityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {menuRole?.isActive ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItemComponent>
        <MenuItemComponent 
          onClick={() => handleDeleteRole(menuRole?._id)}
          disabled={menuRole?.userCount > 0}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Role</ListItemText>
        </MenuItemComponent>
      </Menu>

      {/* Create Role Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Role Name *"
                value={formData.roleName}
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active Role"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description *"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Permissions
              </Typography>
              {permissionModules.map((module) => (
                <Accordion key={module.module}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">{module.module}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormGroup>
                      {module.permissions.map((permission) => (
                        <FormControlLabel
                          key={permission.id}
                          control={
                            <Checkbox
                              checked={formData.permissions.includes(permission.id)}
                              onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2">{permission.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {permission.description}
                              </Typography>
                            </Box>
                          }
                        />
                      ))}
                    </FormGroup>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateRole} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            Create Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Role</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Role Name"
                value={formData.roleName}
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active Role"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Permissions
              </Typography>
              {permissionModules.map((module) => (
                <Accordion key={module.module}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">{module.module}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <FormGroup>
                      {module.permissions.map((permission) => (
                        <FormControlLabel
                          key={permission.id}
                          control={
                            <Checkbox
                              checked={formData.permissions.includes(permission.id)}
                              onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2">{permission.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {permission.description}
                              </Typography>
                            </Box>
                          }
                        />
                      ))}
                    </FormGroup>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button 
            onClick={handleEditRole} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            Update Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Role Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Role Details</DialogTitle>
        <DialogContent>
          {selectedRole && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {selectedRole.roleName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Description:
                </Typography>
                <Typography variant="body1">
                  {selectedRole.description}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Status:
                </Typography>
                <Chip
                  label={selectedRole.isActive ? 'Active' : 'Inactive'}
                  color={selectedRole.isActive ? 'success' : 'error'}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Assigned Users:
                </Typography>
                <Typography variant="body1">
                  {selectedRole.userCount} users
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Created:
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedRole.created_at).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Permissions ({selectedRole.permissions ? selectedRole.permissions.length : 0}):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedRole.permissions && selectedRole.permissions.map((permissionId) => (
                    <Chip
                      key={permissionId}
                      label={getPermissionName(permissionId)}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
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
        aria-label="add role"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={openCreate}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default RoleManagementCRUD;
