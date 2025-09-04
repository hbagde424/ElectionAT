import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    CircularProgress,
    Alert,
    TextField,
    InputAdornment,
    Grid
} from '@mui/material';
import { Search } from '@mui/icons-material';
import axiosServices from 'utils/axios';
import { usePermissions } from 'contexts/PermissionContext';

const RolePermissionMatrix = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [rolePermissions, setRolePermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [permissionFilter, setPermissionFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const { hasPermission } = usePermissions();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [rolesRes, permissionsRes, rolePermissionsRes] = await Promise.all([
                axiosServices.get('/roles'),
                axiosServices.get('/permissions'),
                axiosServices.get('/role-permissions')
            ]);

            // Handle both response formats: {data: []} or direct array []
            const rolesData = Array.isArray(rolesRes.data) ? rolesRes.data : (rolesRes.data.data || []);
            const permissionsData = Array.isArray(permissionsRes.data) ? permissionsRes.data : (permissionsRes.data.data || []);
            const rolePermissionsData = Array.isArray(rolePermissionsRes.data) ? rolePermissionsRes.data : (rolePermissionsRes.data.data || []);

            setRoles(rolesData);
            setPermissions(permissionsData);

            const rpMap = {};
            rolePermissionsData.forEach(rp => {
                if (!rpMap[rp.role._id]) {
                    rpMap[rp.role._id] = {};
                }
                rpMap[rp.role._id][rp.permission._id] = true;
            });
            console.log('Role-Permission mapping:', rpMap);
            setRolePermissions(rpMap);

        } catch (err) {
            setError(`Failed to fetch data. Please try again. Error: ${err.message || err}`);
            console.error('Full error details:', err);
            console.error('Error response:', err.response);
        } finally {
            setLoading(false);
        }
    };

    const handlePermissionChange = async (roleId, permissionId, checked) => {
        // Check if user has permission to modify role-permission assignments
        if (!hasPermission('role_permission_manage')) {
            setError('You do not have permission to modify role-permission assignments.');
            return;
        }

        try {
            if (checked) {
                await axiosServices.post('/role-permissions', { roleId, permissionId });
            } else {
                await axiosServices.delete('/role-permissions', { data: { roleId, permissionId } });
            }
            // Update local state for immediate feedback
            setRolePermissions(prev => ({
                ...prev,
                [roleId]: {
                    ...prev[roleId],
                    [permissionId]: checked
                }
            }));
        } catch (error) {
            console.error('Error updating permission:', error);
            setError('Failed to update permission.');
        }
    };

    // Filter functions using useMemo for better performance
    const filteredPermissions = useMemo(() => {
        if (!permissions || permissions.length === 0) return [];
        if (!permissionFilter) return permissions;
        return permissions.filter(permission =>
            permission && permission.name && permission.name.toLowerCase().includes(permissionFilter.toLowerCase())
        );
    }, [permissions, permissionFilter]);

    const filteredRoles = useMemo(() => {
        if (!roles || roles.length === 0) return [];
        if (!roleFilter) return roles;
        return roles.filter(role =>
            role && role.name && role.name.toLowerCase().includes(roleFilter.toLowerCase())
        );
    }, [roles, roleFilter]);

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box>
            <Typography variant="h5" mb={2}>Role-Permission Matrix</Typography>

            {/* Filter Controls */}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Filter Permissions"
                        value={permissionFilter}
                        onChange={(e) => setPermissionFilter(e.target.value)}
                        placeholder="Search permissions..."
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                        size="small"
                    />
                </Grid>
                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        label="Filter Roles"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        placeholder="Search roles..."
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                        size="small"
                    />
                </Grid>
                {(permissionFilter || roleFilter) && (
                    <Grid item xs={12}>
                        <Typography variant="body2" color="primary">
                            {permissionFilter && `Filtering permissions: "${permissionFilter}"`}
                            {permissionFilter && roleFilter && ' | '}
                            {roleFilter && `Filtering roles: "${roleFilter}"`}
                        </Typography>
                    </Grid>
                )}
            </Grid>

            <TableContainer component={Paper}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>
                                Permissions ({filteredPermissions.length}{permissions.length !== filteredPermissions.length ? ` of ${permissions.length}` : ''})
                            </TableCell>
                            {filteredRoles.map((role) => (
                                <TableCell key={role._id} align="center" sx={{ fontWeight: 'bold' }}>
                                    {role.name}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredPermissions.map((permission) => (
                            <TableRow key={permission._id}>
                                <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {permission.name}
                                    </Typography>
                                    {permission.description && (
                                        <Typography variant="caption" color="text.secondary">
                                            {permission.description}
                                        </Typography>
                                    )}
                                </TableCell>
                                {filteredRoles.map((role) => (
                                    <TableCell key={role._id} align="center">
                                        <Checkbox
                                            checked={!!(rolePermissions[role._id] && rolePermissions[role._id][permission._id])}
                                            onChange={(e) => handlePermissionChange(role._id, permission._id, e.target.checked)}
                                            disabled={!hasPermission('role_permission_manage')}
                                            title={!hasPermission('role_permission_manage') ? 'You do not have permission to modify role-permission assignments' : ''}
                                        />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {filteredPermissions.length === 0 && permissionFilter && (
                <Box mt={2}>
                    <Alert severity="info">
                        No permissions found matching "{permissionFilter}". Try adjusting your search.
                    </Alert>
                </Box>
            )}

            {filteredRoles.length === 0 && roleFilter && (
                <Box mt={2}>
                    <Alert severity="info">
                        No roles found matching "{roleFilter}". Try adjusting your search.
                    </Alert>
                </Box>
            )}
        </Box>
    );
};

export default RolePermissionMatrix;
