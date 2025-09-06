// components/PermissionDebug.jsx
import React from 'react';
import { usePermissions } from 'contexts/PermissionContext';
import { Box, Typography, Paper } from '@mui/material';

const PermissionDebug = () => {
    const {
        userPermissions,
        userRoles,
        loading,
        error,
        hasPermission
    } = usePermissions();

    return (
        <Paper sx={{ p: 2, m: 2 }}>
            <Typography variant="h6" gutterBottom>
                Permission System Debug
            </Typography>

            <Box sx={{ mb: 1 }}>
                <Typography variant="body2">
                    <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
                </Typography>
            </Box>

            {error && (
                <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="error">
                        <strong>Error:</strong> {error}
                    </Typography>
                </Box>
            )}

            <Box sx={{ mb: 1 }}>
                <Typography variant="body2">
                    <strong>User Permissions:</strong> {userPermissions.length} permissions loaded
                </Typography>
            </Box>

            <Box sx={{ mb: 1 }}>
                <Typography variant="body2">
                    <strong>User Roles:</strong> {userRoles.length} roles loaded
                </Typography>
            </Box>

            <Box sx={{ mb: 1 }}>
                <Typography variant="body2">
                    <strong>Can create users:</strong> {hasPermission('user_create') ? 'Yes' : 'No'}
                </Typography>
            </Box>

            <Box sx={{ mb: 1 }}>
                <Typography variant="body2">
                    <strong>Can read users:</strong> {hasPermission('user_read') ? 'Yes' : 'No'}
                </Typography>
            </Box>
        </Paper>
    );
};

export default PermissionDebug;
