import React, { useState, useEffect } from 'react';
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
    Alert
} from '@mui/material';
import axiosServices from 'utils/axios';

const RolePermissionMatrix = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [rolePermissions, setRolePermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

            console.log('Roles response:', rolesRes.data);
            console.log('Permissions response:', permissionsRes.data);
            console.log('Role-Permissions response:', rolePermissionsRes.data);

            // Handle both response formats: {data: []} or direct array []
            const rolesData = Array.isArray(rolesRes.data) ? rolesRes.data : (rolesRes.data.data || []);
            const permissionsData = Array.isArray(permissionsRes.data) ? permissionsRes.data : (permissionsRes.data.data || []);
            const rolePermissionsData = Array.isArray(rolePermissionsRes.data) ? rolePermissionsRes.data : (rolePermissionsRes.data.data || []);

            console.log('Processed roles:', rolesData);
            console.log('Processed permissions:', permissionsData);
            console.log('Processed role-permissions:', rolePermissionsData);

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

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    console.log('Current state - Roles:', roles);
    console.log('Current state - Permissions:', permissions);
    console.log('Current state - RolePermissions:', rolePermissions);

    return (
        <Box>
            <Typography variant="h5" mb={2}>Role-Permission Matrix</Typography>
            <TableContainer component={Paper}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>Permissions</TableCell>
                            {roles.map((role) => (
                                <TableCell key={role._id} align="center" sx={{ fontWeight: 'bold' }}>
                                    {role.name}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {permissions.map((permission) => (
                            <TableRow key={permission._id}>
                                <TableCell>{permission.name}</TableCell>
                                {roles.map((role) => (
                                    <TableCell key={role._id} align="center">
                                        <Checkbox
                                            checked={!!(rolePermissions[role._id] && rolePermissions[role._id][permission._id])}
                                            onChange={(e) => handlePermissionChange(role._id, permission._id, e.target.checked)}
                                        />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default RolePermissionMatrix;
