// components/PermissionMenu.jsx
import React from 'react';
import { usePermissions } from 'contexts/PermissionContext';
import { MENU_PERMISSIONS } from 'utils/menuPermissions';

const PermissionMenu = ({ menuItem, children }) => {
    const { hasAnyPermission, loading } = usePermissions();

    // If still loading permissions, show the menu item (will be hidden once loaded if no permission)
    if (loading) {
        return children;
    }

    // Check if this menu item requires permissions
    const requiredPermissions = MENU_PERMISSIONS[menuItem.id];

    // If no specific permissions required, show the item
    if (!requiredPermissions || !Array.isArray(requiredPermissions)) {
        return children;
    }

    // Check if user has at least one of the required permissions
    if (!hasAnyPermission(requiredPermissions)) {
        return null; // Hide menu item
    }

    return children;
};

export default PermissionMenu;
