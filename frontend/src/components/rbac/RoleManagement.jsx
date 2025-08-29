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
  Grid,
  Typography,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemSecondaryAction,
  Switch,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { roleAPI, permissionAPI } from '../../api/auth';
import { useRBAC } from '../../contexts/RBACContext';
import { PermissionGuard } from './Guards';

const RoleManagement = () => {
  const { hasPermission } = useRBAC();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [permissionsByCategory, setPermissionsByCategory] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openPermissionsDialog, setOpenPermissionsDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRole, setMenuRole] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  // Permission assignment state
  const [rolePermissions, setRolePermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await roleAPI.getRoles();
      setRoles(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const response = await permissionAPI.getPermissions();
      setPermissions(response.data);
      categorizePermissions(response.data);
    } catch (err) {
      console.error('Failed to load permissions:', err);
    }
  };

  const categorizePermissions = (permissions) => {
    const categories = {};
    permissions.forEach(permission => {
      const [resource] = permission.name.split('.');
      if (!categories[resource]) {
        categories[resource] = [];
      }
      categories[resource].push(permission);
    });
    setPermissionsByCategory(categories);
  };

  const handleCreateRole = async () => {
    try {
      await roleAPI.createRole(formData);
      setOpenCreateDialog(false);
      resetForm();
      loadRoles();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditRole = async () => {
    try {
      await roleAPI.updateRole(selectedRole._id, formData);
      setOpenEditDialog(false);
      setSelectedRole(null);
      resetForm();
      loadRoles();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      try {
        await roleAPI.deleteRole(roleId);
        loadRoles();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleToggleRoleActive = async (roleId) => {
    try {
      await roleAPI.toggleRoleActive(roleId);
      loadRoles();
    } catch (err) {
      setError(err.message);
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

  const openEdit = (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      isActive: role.isActive
    });
    setOpenEditDialog(true);
    handleMenuClose();
  };

  const openPermissions = async (role) => {
    setSelectedRole(role);
    try {
      const response = await roleAPI.getRolePermissions(role._id);
      setRolePermissions(response.data);
      setSelectedPermissions(response.data.map(p => p._id));
      setOpenPermissionsDialog(true);
    } catch (err) {
      setError(err.message);
    }
    handleMenuClose();
  };

  const handlePermissionChange = (permissionId) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSavePermissions = async () => {
    try {
      await roleAPI.updateRolePermissions(selectedRole._id, selectedPermissions);
      setOpenPermissionsDialog(false);
      setSelectedRole(null);
      loadRoles();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true
    });
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Role Management
        </Typography>
        <PermissionGuard permission="role.create">
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
          >
            Create Role
          </Button>
        </PermissionGuard>
      </Box>

      {/* Roles Table */}
      <Card>
        <CardHeader title="System Roles" />
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Role</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Permissions</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role._id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AdminIcon />
                        <Box>
                          <Typography variant="subtitle2">
                            {role.name}
                          </Typography>
                          <Chip
                            label={role.name}
                            color={getRoleColor(role.name)}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {role.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {role.permissionCount || 0} permissions
                      </Typography>
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

      {/* Role Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <PermissionGuard permission="role.update" showMessage={false}>
          <MenuItem onClick={() => openEdit(menuRole)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Role</ListItemText>
          </MenuItem>
        </PermissionGuard>

        <PermissionGuard permission="permission.read" showMessage={false}>
          <MenuItem onClick={() => openPermissions(menuRole)}>
            <ListItemIcon>
              <SecurityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Manage Permissions</ListItemText>
          </MenuItem>
        </PermissionGuard>

        <PermissionGuard permission="role.update" showMessage={false}>
          <MenuItem onClick={() => handleToggleRoleActive(menuRole?._id)}>
            <ListItemIcon>
              <AssignmentIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {menuRole?.isActive ? 'Deactivate' : 'Activate'}
            </ListItemText>
          </MenuItem>
        </PermissionGuard>

        <PermissionGuard permission="role.delete" showMessage={false}>
          <MenuItem onClick={() => handleDeleteRole(menuRole?._id)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Role</ListItemText>
          </MenuItem>
        </PermissionGuard>
      </Menu>

      {/* Create Role Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Role Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active Role"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateRole} variant="contained">
            Create Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Role</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Role Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active Role"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditRole} variant="contained">
            Update Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Permissions Dialog */}
      <Dialog open={openPermissionsDialog} onClose={() => setOpenPermissionsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Manage Permissions for {selectedRole?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select permissions to assign to this role. Users with this role will inherit all selected permissions.
          </Typography>
          
          {Object.entries(permissionsByCategory).map(([resource, perms]) => (
            <Accordion key={resource}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  {getResourceDisplayName(resource)} ({perms.filter(p => selectedPermissions.includes(p._id)).length}/{perms.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {perms.map((permission) => (
                    <ListItem key={permission._id}>
                      <ListItemText
                        primary={permission.name}
                        secondary={permission.description}
                      />
                      <ListItemSecondaryAction>
                        <Checkbox
                          checked={selectedPermissions.includes(permission._id)}
                          onChange={() => handlePermissionChange(permission._id)}
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPermissionsDialog(false)}>Cancel</Button>
          <Button onClick={handleSavePermissions} variant="contained">
            Save Permissions
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default RoleManagement;
