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
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import axiosServices from 'utils/axios';

const UserRoleAssigner = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [userRoles, setUserRoles] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');

            console.log('Fetching users...');
            const usersRes = await axiosServices.get('/users/for-roles');
            console.log('Users response:', usersRes.data);

            console.log('Fetching roles...');
            const rolesRes = await axiosServices.get('/roles');
            console.log('Roles response:', rolesRes.data);

            console.log('Fetching user-roles...');
            const userRolesRes = await axiosServices.get('/user-roles');
            console.log('User-roles response:', userRolesRes.data);

            const usersData = usersRes.data.data || usersRes.data;
            const rolesData = rolesRes.data.data || rolesRes.data;
            const userRolesData = userRolesRes.data.data || userRolesRes.data;

            console.log('Processed data:', {
                users: Array.isArray(usersData) ? usersData.length : 'Not an array',
                roles: Array.isArray(rolesData) ? rolesData.length : 'Not an array',
                userRoles: Array.isArray(userRolesData) ? userRolesData.length : 'Not an array'
            });

            // Validate data arrays
            if (!Array.isArray(usersData)) {
                throw new Error('Users data is not an array');
            }
            if (!Array.isArray(rolesData)) {
                throw new Error('Roles data is not an array');
            }
            if (!Array.isArray(userRolesData)) {
                throw new Error('User-roles data is not an array');
            }

            setUsers(usersData);
            setRoles(rolesData);

            const urMap = {};

            // Ensure userRolesData is an array and handle empty/null data
            if (Array.isArray(userRolesData) && userRolesData.length > 0) {
                userRolesData.forEach(ur => {
                    // Skip if user or role is null (orphaned records)
                    if (!ur.user || !ur.role || !ur.user._id || !ur.role._id) {
                        console.warn('Skipping invalid user-role record:', ur);
                        return;
                    }

                    if (!urMap[ur.user._id]) {
                        urMap[ur.user._id] = [];
                    }
                    urMap[ur.user._id].push(ur.role._id);
                });
            } else {
                console.log('No user-roles data found or data is empty');
            }

            setUserRoles(urMap);

        } catch (err) {
            console.error('Error in fetchData:', err);
            setError(`Failed to fetch data: ${err.response?.data?.error || err.message || 'Please try again.'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRoleIds) => {
        const currentRoleIds = userRoles[userId] || [];

        const rolesToAdd = newRoleIds.filter(id => !currentRoleIds.includes(id));
        const rolesToRemove = currentRoleIds.filter(id => !newRoleIds.includes(id));

        try {
            for (const roleId of rolesToAdd) {
                await axiosServices.post('/user-roles', { userId, roleId });
            }
            for (const roleId of rolesToRemove) {
                await axiosServices.delete('/user-roles', { data: { userId, roleId } });
            }

            // Update local state
            setUserRoles(prev => ({
                ...prev,
                [userId]: newRoleIds
            }));
        } catch (error) {
            console.error('Error updating user roles:', error);
            setError('Failed to update roles.');
        }
    };

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Box>
            <Typography variant="h5" mb={2}>Assign Roles to Users</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Roles</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user._id}>
                                <TableCell>{user.name || user.username}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <FormControl fullWidth>
                                        <InputLabel>Roles</InputLabel>
                                        <Select
                                            multiple
                                            value={userRoles[user._id] || []}
                                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((value) => {
                                                        const role = roles.find(r => r._id === value);
                                                        return <Chip key={value} label={role ? role.name : ''} />;
                                                    })}
                                                </Box>
                                            )}
                                        >
                                            {roles.map((role) => (
                                                <MenuItem key={role._id} value={role._id}>
                                                    {role.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default UserRoleAssigner;
