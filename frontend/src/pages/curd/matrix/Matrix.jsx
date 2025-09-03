import React, { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { Shield, People, Lock, Grid3x3 } from '@mui/icons-material';

// Import permission components
import { PermissionProvider } from 'contexts/PermissionContext';
import PermissionGate from 'components/PermissionGate';

// Import sub-components
import PermissionManager from './PermissionManager';
import RolePermissionMatrix from './RolePermissionMatrix';
import UserRoleAssigner from './UserRoleAssigner';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`role-matrix-tabpanel-${index}`}
            aria-labelledby={`role-matrix-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const Matrix = () => {
    const [currentTab, setCurrentTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <PermissionProvider>
            <Box sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={currentTab} onChange={handleTabChange} aria-label="Role and Permission Matrix">
                        <PermissionGate requiredPermission="matrix_read">
                            <Tab icon={<Grid3x3 />} iconPosition="start" label="Role-Permission Matrix" />
                        </PermissionGate>
                        <PermissionGate requiredPermission="permission_manage">
                            <Tab icon={<Lock />} iconPosition="start" label="Manage Permissions" />
                        </PermissionGate>
                        <PermissionGate requiredPermission="user_role_assign">
                            <Tab icon={<People />} iconPosition="start" label="Assign Roles to Users" />
                        </PermissionGate>
                    </Tabs>
                </Box>
                <PermissionGate requiredPermission="matrix_read">
                    <TabPanel value={currentTab} index={0}>
                        <RolePermissionMatrix />
                    </TabPanel>
                </PermissionGate>
                <PermissionGate requiredPermission="permission_manage">
                    <TabPanel value={currentTab} index={1}>
                        <PermissionManager />
                    </TabPanel>
                </PermissionGate>
                <PermissionGate requiredPermission="user_role_assign">
                    <TabPanel value={currentTab} index={2}>
                        <UserRoleAssigner />
                    </TabPanel>
                </PermissionGate>
            </Box>
        </PermissionProvider>
    );
};

export default Matrix;
