// components/PermissionButton.jsx
import React from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import { usePermissions } from 'contexts/PermissionContext';

const PermissionButton = ({
    permission,
    permissions,
    role,
    requireAll = false,
    tooltip = "You don't have permission to perform this action",
    variant = "contained",
    size = "medium",
    color = "primary",
    icon = false,
    disabled = false,
    children,
    ...props
}) => {
    const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = usePermissions();

    let hasAccess = true;

    // Check single permission
    if (permission && !hasPermission(permission)) {
        hasAccess = false;
    }

    // Check multiple permissions
    if (permissions && Array.isArray(permissions)) {
        hasAccess = requireAll
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions);
    }

    // Check role
    if (role && !hasRole(role)) {
        hasAccess = false;
    }

    const isDisabled = !hasAccess || disabled;

    const ButtonComponent = icon ? IconButton : Button;

    const buttonProps = {
        ...props,
        disabled: isDisabled,
        variant: icon ? undefined : variant,
        size,
        color: isDisabled ? 'default' : color
    };

    const button = (
        <ButtonComponent {...buttonProps}>
            {children}
        </ButtonComponent>
    );

    // Show tooltip when disabled due to permissions
    if (!hasAccess) {
        return (
            <Tooltip title={tooltip} arrow>
                <span>
                    {button}
                </span>
            </Tooltip>
        );
    }

    return button;
};

export default PermissionButton;
