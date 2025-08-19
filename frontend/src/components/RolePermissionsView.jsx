import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { ROLE_PERMISSIONS, PERMISSIONS } from '../utils/rolePermissions';

const PermissionChip = ({ permission }) => (
    <Box
        sx={{
            display: 'inline-block',
            backgroundColor: 'primary.light',
            color: 'primary.contrastText',
            borderRadius: 1,
            px: 1,
            py: 0.5,
            m: 0.5,
            fontSize: '0.875rem'
        }}
    >
        {permission}
    </Box>
);

const RolePermissionsView = ({ role }) => {
    if (!role || !ROLE_PERMISSIONS[role]) {
        return null;
    }

    const permissions = ROLE_PERMISSIONS[role];

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                Role Permissions
            </Typography>
            <Grid container spacing={2}>
                {Object.entries(permissions).map(([entity, entityPermissions]) => (
                    <Grid item xs={12} sm={6} md={4} key={entity}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" gutterBottom sx={{ textTransform: 'capitalize' }}>
                                {entity}
                            </Typography>
                            <Box>
                                {entityPermissions.map((permission) => (
                                    <PermissionChip key={permission} permission={permission} />
                                ))}
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default RolePermissionsView;

