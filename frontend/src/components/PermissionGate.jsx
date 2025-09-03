// components/PermissionGate.jsx
import React from 'react';
import { usePermissions } from 'contexts/PermissionContext';

const PermissionGate = ({
    permission,
    permissions,
    role,
    roles,
    requireAll = false,
    fallback = null,
    children
}) => {
    const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = usePermissions();

    // Check single permission
    if (permission && !hasPermission(permission)) {
        return fallback;
    }

    // Check multiple permissions
    if (permissions && Array.isArray(permissions)) {
        const hasAccess = requireAll
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions);

        if (!hasAccess) {
            return fallback;
        }
    }

    // Check single role
    if (role && !hasRole(role)) {
        return fallback;
    }

    // Check multiple roles
    if (roles && Array.isArray(roles)) {
        const hasRoleAccess = roles.some(r => hasRole(r));
        if (!hasRoleAccess) {
            return fallback;
        }
    }

    return children;
};

export default PermissionGate;
