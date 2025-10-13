import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    IconButton,
    Grid,
    TextField,
    Autocomplete,
    Card,
    CardContent,
    Divider,
    Tooltip,
    Avatar,
    Stack,
    Alert
} from '@mui/material';
import {
    Edit,
    Delete,
    PersonAdd,
    LocationOn,
    Security,
    Visibility,
    Assignment,
    Map
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import axiosServices from 'utils/axios';
import JWTContext from 'contexts/JWTContext';
import { usePermissions } from 'contexts/PermissionContext';

// Import existing components
import UserModal from './UserModal';
import CrudPageLayout from 'components/permission/CrudPageLayout';
import PermissionGate from 'components/PermissionGate';
import AlertUserDelete from './AlertUserDelete';
import UserView from './UserView';

const Users = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useContext(JWTContext);
    const { hasPermission, hasAnyPermission, loading: permissionLoading } = usePermissions();

    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [currentUserHierarchy, setCurrentUserHierarchy] = useState(null);
    const [roles, setRoles] = useState([]);
    const [hierarchyData, setHierarchyData] = useState({
        states: [],
        divisions: [],
        parliaments: [],
        assemblies: [],
        blocks: [],
        booths: []
    });

    // Dialog states
    const [roleDialog, setRoleDialog] = useState(false);
    const [hierarchyDialog, setHierarchyDialog] = useState(false);
    const [userModal, setUserModal] = useState(false);
    const [userView, setUserView] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [userRoles, setUserRoles] = useState({});
    const [userHierarchy, setUserHierarchy] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Hierarchy selection states
    const [selectedHierarchy, setSelectedHierarchy] = useState({
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: '',
        booth: ''
    });

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        fetchHierarchyData();
        fetchCurrentUserHierarchy();
    }, []);

    useEffect(() => {
        // Filter users whenever users or currentUserHierarchy changes
        if (users.length > 0) {
            filterUsersBasedOnHierarchy();
        }
    }, [users, currentUserHierarchy]);

    const fetchCurrentUserHierarchy = async () => {
        try {
            // Get current user ID from localStorage or context
            let currentUserId = user?.id || user?._id;
            if (!currentUserId) {
                try {
                    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                    currentUserId = localUser._id || localUser.id;
                } catch (e) {
                    console.error('Failed to parse localStorage user:', e);
                }
            }

            if (currentUserId) {
                const response = await axiosServices.get(`/user-hierarchy/${currentUserId}`);
                const hierarchyData = response.data?.data || response.data;
                setCurrentUserHierarchy(hierarchyData);
            }
        } catch (error) {
            console.error('Error fetching current user hierarchy:', error);
            setCurrentUserHierarchy(null);
        }
    };

    const filterUsersBasedOnHierarchy = () => {
        if (!currentUserHierarchy) {
            // If no hierarchy restrictions, show all users
            setFilteredUsers(users);
            return;
        }

        const filteredUserList = users.filter(user => {
            // Get this user's hierarchy
            const userHierarchyData = userHierarchy[user._id];
            if (!userHierarchyData) {
                // If user has no hierarchy, allow access (could be super admin)
                return true;
            }

            // Check if the user falls within the current user's geographic scope
            return isUserWithinScope(currentUserHierarchy, userHierarchyData);
        });

        setFilteredUsers(filteredUserList);
    };

    const isUserWithinScope = (currentUserHierarchy, targetUserHierarchy) => {
        // If current user has no restrictions, they can see all users
        if (!currentUserHierarchy) return true;

        // Check hierarchy level by level (from state down to booth)
        const levels = ['state', 'division', 'parliament', 'assembly', 'block', 'booth'];

        for (const level of levels) {
            const currentUserLevelId = currentUserHierarchy[level]?._id || currentUserHierarchy[level];
            const targetUserLevelId = targetUserHierarchy[level]?._id || targetUserHierarchy[level];

            if (currentUserLevelId) {
                // Current user has restriction at this level
                if (!targetUserLevelId) {
                    // Target user has no assignment at this level, so they're not within scope
                    return false;
                }

                if (currentUserLevelId !== targetUserLevelId) {
                    // Different geographic areas at this level
                    return false;
                }

                // If they match at this level, continue to check lower levels
                // But if current user only has access to this level, then target user is within scope
                return true;
            }
        }

        return true; // If no restrictions found, allow access
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axiosServices.get('/users');
            const userData = Array.isArray(response.data) ? response.data : response.data.data || [];
            setUsers(userData);

            // Fetch roles and hierarchy for each user
            const rolePromises = userData.map(user =>
                axiosServices.get(`/user-roles/user/${user._id}`)
                    .then(res => ({ userId: user._id, roles: res.data.data || res.data || [] }))
                    .catch(() => ({ userId: user._id, roles: [] }))
            );

            const hierarchyPromises = userData.map(user =>
                axiosServices.get(`/user-hierarchy/${user._id}`)
                    .then(res => ({ userId: user._id, hierarchy: res.data.data || res.data || {} }))
                    .catch(() => ({ userId: user._id, hierarchy: {} }))
            );

            const [userRoleData, userHierarchyData] = await Promise.all([
                Promise.all(rolePromises),
                Promise.all(hierarchyPromises)
            ]);

            const roleMap = {};
            const hierarchyMap = {};

            userRoleData.forEach(({ userId, roles }) => {
                console.log('Role data for user', userId, ':', roles);
                roleMap[userId] = Array.isArray(roles) ? roles : [];
            });

            userHierarchyData.forEach(({ userId, hierarchy }) => {
                hierarchyMap[userId] = hierarchy || {};
            });

            setUserRoles(roleMap);
            setUserHierarchy(hierarchyMap);

            console.log('Final userRoles state:', roleMap);
            console.log('Final userHierarchy state:', hierarchyMap);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to fetch users: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await axiosServices.get('/roles');
            setRoles(Array.isArray(response.data) ? response.data : response.data.data || []);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const fetchHierarchyData = async () => {
        try {
            const [states, divisions, parliaments, assemblies, blocks, booths] = await Promise.all([
                axiosServices.get('/states'),
                axiosServices.get('/divisions'),
                axiosServices.get('/parliaments'),
                axiosServices.get('/assemblies'),
                axiosServices.get('/blocks'),
                axiosServices.get('/booths')
            ]);

            setHierarchyData({
                states: states.data.data || states.data || [],
                divisions: divisions.data.data || divisions.data || [],
                parliaments: parliaments.data.data || parliaments.data || [],
                assemblies: assemblies.data.data || assemblies.data || [],
                blocks: blocks.data.data || blocks.data || [],
                booths: booths.data.data || booths.data || []
            });
        } catch (error) {
            console.error('Error fetching hierarchy data:', error);
        }
    };

    const handleAssignRole = async () => {
        if (!selectedUser || !selectedRole) return;

        try {
            await axiosServices.post('/user-roles', {
                userId: selectedUser._id,
                roleId: selectedRole
            });
            setRoleDialog(false);
            setSelectedUser(null);
            setSelectedRole('');
            fetchUsers();
            setError('');
        } catch (error) {
            console.error('Error assigning role:', error);
            setError('Error assigning role: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleAssignHierarchy = async () => {
        if (!selectedUser) return;

        try {
            await axiosServices.post('/user-hierarchy', {
                userId: selectedUser._id,
                hierarchy: selectedHierarchy
            });
            setHierarchyDialog(false);
            setSelectedUser(null);
            setSelectedHierarchy({
                state: '',
                division: '',
                parliament: '',
                assembly: '',
                block: '',
                booth: ''
            });
            fetchUsers();
            setError('');
        } catch (error) {
            console.error('Error assigning hierarchy:', error);
            setError('Error assigning hierarchy: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleRemoveRole = async (userId, roleId) => {
        try {
            await axiosServices.delete('/user-roles', {
                data: { userId, roleId }
            });
            fetchUsers();
        } catch (error) {
            console.error('Error removing role:', error);
            setError('Error removing role');
        }
    };

    const getHierarchyDisplay = (hierarchy) => {
        const levels = [];
        if (hierarchy.state) levels.push(`State: ${hierarchy.state.name}`);
        if (hierarchy.division) levels.push(`Division: ${hierarchy.division.name}`);
        if (hierarchy.parliament) levels.push(`Parliament: ${hierarchy.parliament.name}`);
        if (hierarchy.assembly) levels.push(`Assembly: ${hierarchy.assembly.name}`);
        if (hierarchy.block) levels.push(`Block: ${hierarchy.block.name}`);
        if (hierarchy.booth) levels.push(`Booth: ${hierarchy.booth.name}`);
        return levels;
    };

    const getFilteredOptions = (level) => {
        switch (level) {
            case 'divisions':
                return selectedHierarchy.state
                    ? hierarchyData.divisions.filter(d => {
                        // Handle populated state_id field
                        const divisionStateId = d.state_id && typeof d.state_id === 'object'
                            ? d.state_id._id
                            : d.state_id;
                        return d.state === selectedHierarchy.state || divisionStateId === selectedHierarchy.state;
                    })
                    : hierarchyData.divisions;
            case 'parliaments':
                return selectedHierarchy.division
                    ? hierarchyData.parliaments.filter(p => {
                        const parliamentDivisionId = p.division_id && typeof p.division_id === 'object'
                            ? p.division_id._id
                            : p.division_id;
                        return p.division === selectedHierarchy.division || parliamentDivisionId === selectedHierarchy.division;
                    })
                    : hierarchyData.parliaments;
            case 'assemblies':
                return selectedHierarchy.parliament
                    ? hierarchyData.assemblies.filter(a => {
                        const assemblyParliamentId = a.parliament_id && typeof a.parliament_id === 'object'
                            ? a.parliament_id._id
                            : a.parliament_id;
                        return a.parliament === selectedHierarchy.parliament || assemblyParliamentId === selectedHierarchy.parliament;
                    })
                    : hierarchyData.assemblies;
            case 'blocks':
                return selectedHierarchy.assembly
                    ? hierarchyData.blocks.filter(b => {
                        const blockAssemblyId = b.assembly_id && typeof b.assembly_id === 'object'
                            ? b.assembly_id._id
                            : b.assembly_id;
                        return b.assembly === selectedHierarchy.assembly || blockAssemblyId === selectedHierarchy.assembly;
                    })
                    : hierarchyData.blocks;
            case 'booths':
                return selectedHierarchy.block
                    ? hierarchyData.booths.filter(b => {
                        const boothBlockId = b.block_id && typeof b.block_id === 'object'
                            ? b.block_id._id
                            : b.block_id;
                        return b.block === selectedHierarchy.block || boothBlockId === selectedHierarchy.block;
                    })
                    : hierarchyData.booths;
            default:
                return hierarchyData[level] || [];
        }
    };

    const handleUserAction = (action, user) => {
        setSelectedUser(user);
        switch (action) {
            case 'edit':
                if (!hasPermission('user_update')) {
                    setError('You do not have permission to edit users');
                    return;
                }
                setUserModal(true);
                break;
            case 'view':
                if (!hasPermission('user_read')) {
                    setError('You do not have permission to view user details');
                    return;
                }
                navigate(`/Users/${user._id}`);
                break;
            case 'delete':
                if (!hasPermission('user_delete')) {
                    setError('You do not have permission to delete users');
                    return;
                }
                setDeleteDialog(true);
                break;
            case 'role':
                if (!hasPermission('user_role_assign')) {
                    setError('You do not have permission to assign roles');
                    return;
                }
                setRoleDialog(true);
                break;
            case 'hierarchy':
                if (!hasPermission('user_hierarchy_assign')) {
                    setError('You do not have permission to assign geographic access');
                    return;
                }
                setHierarchyDialog(true);
                break;
            default:
                break;
        }
    };

    // Permission-aware handlers
    const handleAdd = () => {
        if (!hasPermission('user_create')) {
            setError('You do not have permission to create users');
            return;
        }
        setSelectedUser(null);
        setUserModal(true);
    };

    const handleEdit = (user) => {
        if (!hasPermission('user_update')) {
            setError('You do not have permission to edit users');
            return;
        }
        setSelectedUser(user);
        setUserModal(true);
    };

    const handleDelete = async (user) => {
        if (!hasPermission('user_delete')) {
            setError('You do not have permission to delete users');
            return;
        }

        try {
            await axiosServices.delete(`/users/${user._id}`);
            setSuccess('User deleted successfully');
            fetchUsers();
        } catch (error) {
            setError('Failed to delete user: ' + (error.response?.data?.error || error.message));
        }
    };

    // Show loading spinner while permissions are being fetched
    if (permissionLoading) {
        return (
            <Box p={3} display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography>Loading permissions...</Typography>
            </Box>
        );
    }

    return (
        <Box p={3}>


            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">
                    User Management & Permissions
                </Typography>
                <PermissionGate permission="user_create">
                    <Button
                        variant="contained"
                        startIcon={<PersonAdd />}
                        onClick={handleAdd}
                    >
                        Add User
                    </Button>
                </PermissionGate>
            </Stack>

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

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>User Details</TableCell>
                            <TableCell>Contact Info</TableCell>
                            <TableCell>Roles & Permissions</TableCell>
                            <TableCell>Geographic Access</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <Typography>Loading users...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No users found within your geographic access area. Click "Add User" to create one.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user._id} hover>
                                    <TableCell>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                                {(user.name || user.username)?.charAt(0)?.toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {user.name || user.username}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    ID: {user._id}
                                                </Typography>
                                                <br />
                                                <Chip
                                                    label={user.isActive ? 'Active' : 'Inactive'}
                                                    color={user.isActive ? 'success' : 'error'}
                                                    size="small"
                                                />
                                            </Box>
                                        </Stack>
                                    </TableCell>

                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2">
                                                {user.email || 'No email'}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {user.mobile || 'No phone'}
                                            </Typography>
                                        </Box>
                                    </TableCell>

                                    <TableCell>
                                        <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
                                            {(Array.isArray(userRoles[user._id]) ? userRoles[user._id] : []).map((role) => (
                                                <Chip
                                                    key={role._id}
                                                    label={role.name}
                                                    onDelete={() => handleRemoveRole(user._id, role._id)}
                                                    color="primary"
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            ))}
                                        </Box>
                                        {(!userRoles[user._id] || userRoles[user._id].length === 0) && (
                                            <Typography variant="body2" color="text.secondary">
                                                No roles assigned
                                            </Typography>
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        <Box>
                                            {userHierarchy[user._id] && getHierarchyDisplay(userHierarchy[user._id]).length > 0 ? (
                                                getHierarchyDisplay(userHierarchy[user._id]).map((level, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={level}
                                                        variant="outlined"
                                                        size="small"
                                                        icon={<LocationOn />}
                                                        sx={{ mb: 0.5, mr: 0.5 }}
                                                    />
                                                ))
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    No geographic restrictions
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>

                                    <TableCell align="center">
                                        <Stack direction="row" spacing={1} justifyContent="center">
                                            <PermissionGate permission="user_read">
                                                <Tooltip title="View Details">
                                                    <IconButton
                                                        onClick={() => handleUserAction('view', user)}
                                                        color="info"
                                                        size="small"
                                                    >
                                                        <Visibility />
                                                    </IconButton>
                                                </Tooltip>
                                            </PermissionGate>

                                            <PermissionGate permission="user_update">
                                                <Tooltip title="Edit User">
                                                    <IconButton
                                                        onClick={() => handleUserAction('edit', user)}
                                                        color="primary"
                                                        size="small"
                                                    >
                                                        <Edit />
                                                    </IconButton>
                                                </Tooltip>
                                            </PermissionGate>

                                            <PermissionGate permission="user_role_assign">
                                                <Tooltip title="Assign Role">
                                                    <IconButton
                                                        onClick={() => handleUserAction('role', user)}
                                                        color="secondary"
                                                        size="small"
                                                    >
                                                        <Security />
                                                    </IconButton>
                                                </Tooltip>
                                            </PermissionGate>

                                            <PermissionGate permission="user_hierarchy_assign">
                                                <Tooltip title="Set Geographic Access">
                                                    <IconButton
                                                        onClick={() => handleUserAction('hierarchy', user)}
                                                        color="success"
                                                        size="small"
                                                    >
                                                        <Map />
                                                    </IconButton>
                                                </Tooltip>
                                            </PermissionGate>

                                            <PermissionGate permission="user_delete">
                                                <Tooltip title="Delete User">
                                                    <IconButton
                                                        onClick={() => handleUserAction('delete', user)}
                                                        color="error"
                                                        size="small"
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Tooltip>
                                            </PermissionGate>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Role Assignment Dialog */}
            <Dialog open={roleDialog} onClose={() => setRoleDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Security />
                        <Typography>Assign Role to {selectedUser?.name || selectedUser?.username}</Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Select Role</InputLabel>
                        <Select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            label="Select Role"
                        >
                            {roles.map((role) => (
                                <MenuItem key={role._id} value={role._id}>
                                    <Box>
                                        <Typography>{role.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {role.description}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRoleDialog(false)}>Cancel</Button>
                    <Button onClick={handleAssignRole} variant="contained">
                        Assign Role
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Hierarchy Assignment Dialog */}
            <Dialog open={hierarchyDialog} onClose={() => setHierarchyDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Map />
                        <Typography>Set Geographic Access for {selectedUser?.name || selectedUser?.username}</Typography>
                    </Stack>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <Alert severity="info">
                                Set the geographic boundaries for this user's access. They will only be able to view and manage data within the selected areas.
                            </Alert>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                options={hierarchyData.states}
                                getOptionLabel={(option) => option.name || ''}
                                value={hierarchyData.states.find(s => s._id === selectedHierarchy.state) || null}
                                onChange={(event, newValue) => {
                                    setSelectedHierarchy(prev => ({
                                        ...prev,
                                        state: newValue?._id || '',
                                        division: '',
                                        parliament: '',
                                        assembly: '',
                                        block: '',
                                        booth: ''
                                    }));
                                }}
                                renderInput={(params) => <TextField {...params} label="State" />}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                options={getFilteredOptions('divisions')}
                                getOptionLabel={(option) => option.name || ''}
                                value={getFilteredOptions('divisions').find(d => d._id === selectedHierarchy.division) || null}
                                onChange={(event, newValue) => {
                                    setSelectedHierarchy(prev => ({
                                        ...prev,
                                        division: newValue?._id || '',
                                        parliament: '',
                                        assembly: '',
                                        block: '',
                                        booth: ''
                                    }));
                                }}
                                disabled={!selectedHierarchy.state}
                                renderInput={(params) => <TextField {...params} label="Division" />}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                options={getFilteredOptions('parliaments')}
                                getOptionLabel={(option) => option.name || ''}
                                value={getFilteredOptions('parliaments').find(p => p._id === selectedHierarchy.parliament) || null}
                                onChange={(event, newValue) => {
                                    setSelectedHierarchy(prev => ({
                                        ...prev,
                                        parliament: newValue?._id || '',
                                        assembly: '',
                                        block: '',
                                        booth: ''
                                    }));
                                }}
                                disabled={!selectedHierarchy.division}
                                renderInput={(params) => <TextField {...params} label="Parliament" />}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                options={getFilteredOptions('assemblies')}
                                getOptionLabel={(option) => option.name || ''}
                                value={getFilteredOptions('assemblies').find(a => a._id === selectedHierarchy.assembly) || null}
                                onChange={(event, newValue) => {
                                    setSelectedHierarchy(prev => ({
                                        ...prev,
                                        assembly: newValue?._id || '',
                                        block: '',
                                        booth: ''
                                    }));
                                }}
                                disabled={!selectedHierarchy.parliament}
                                renderInput={(params) => <TextField {...params} label="Assembly" />}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                options={getFilteredOptions('blocks')}
                                getOptionLabel={(option) => option.name || ''}
                                value={getFilteredOptions('blocks').find(b => b._id === selectedHierarchy.block) || null}
                                onChange={(event, newValue) => {
                                    setSelectedHierarchy(prev => ({
                                        ...prev,
                                        block: newValue?._id || '',
                                        booth: ''
                                    }));
                                }}
                                disabled={!selectedHierarchy.assembly}
                                renderInput={(params) => <TextField {...params} label="Block" />}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                options={getFilteredOptions('booths')}
                                getOptionLabel={(option) => option.name || ''}
                                value={getFilteredOptions('booths').find(b => b._id === selectedHierarchy.booth) || null}
                                onChange={(event, newValue) => {
                                    setSelectedHierarchy(prev => ({
                                        ...prev,
                                        booth: newValue?._id || ''
                                    }));
                                }}
                                disabled={!selectedHierarchy.block}
                                renderInput={(params) => <TextField {...params} label="Booth" />}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHierarchyDialog(false)}>Cancel</Button>
                    <Button onClick={handleAssignHierarchy} variant="contained">
                        Set Access Level
                    </Button>
                </DialogActions>
            </Dialog>

            {/* User Modal */}
            {userModal && (
                <UserModal
                    open={userModal}
                    modalToggler={setUserModal}
                    user={selectedUser}
                    refresh={fetchUsers}
                    states={hierarchyData.states}
                    divisions={hierarchyData.divisions}
                    parliaments={hierarchyData.parliaments}
                    assemblies={hierarchyData.assemblies}
                    blocks={hierarchyData.blocks}
                    booths={hierarchyData.booths}
                />
            )}

            {/* User View */}
            {/* {userView && (
                <UserView
                    open={userView}
                    setOpen={setUserView}
                    selectedUser={selectedUser}
                />
            )} */}

            {/* Delete Dialog */}
            {deleteDialog && (
                <AlertUserDelete
                    id={selectedUser?._id}
                    open={deleteDialog}
                    handleClose={() => setDeleteDialog(false)}
                    refresh={fetchUsers}
                />
            )}
        </Box>
    );
};

export default Users;
