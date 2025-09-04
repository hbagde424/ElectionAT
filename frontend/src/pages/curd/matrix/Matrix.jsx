import React, { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { Shield, People, Lock, Grid3x3 } from '@mui/icons-material';

// Import permission components
import { PermissionProvider } from 'contexts/PermissionContext';

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
                        <Tab icon={<Grid3x3 />} iconPosition="start" label="Role-Permission Matrix" />
                        <Tab icon={<Lock />} iconPosition="start" label="Manage Permissions" />
                        <Tab icon={<People />} iconPosition="start" label="Assign Roles to Users" />
                    </Tabs>
                </Box>
                <TabPanel value={currentTab} index={0}>
                    <RolePermissionMatrix />
                </TabPanel>
                <TabPanel value={currentTab} index={1}>
                    <PermissionManager />
                </TabPanel>
                <TabPanel value={currentTab} index={2}>
                    <UserRoleAssigner />
                </TabPanel>
            </Box>
        </PermissionProvider>
    );
};

export default Matrix;
