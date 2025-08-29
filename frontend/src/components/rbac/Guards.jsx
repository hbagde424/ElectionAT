import React from 'react';
import { useRBAC } from '../contexts/RBACContext';
import { Alert, Box, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

// Component that renders children only if user has required permission
export const PermissionGuard = ({ 
  permission, 
  permissions = [], 
  requireAll = false, 
  children, 
  fallback = null,
  showMessage = true 
}) => {
  const { hasPermission, hasAnyPermission } = useRBAC();

  // Check permissions
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? permissions.every(p => hasPermission(p))
      : hasAnyPermission(permissions);
  }

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }
    
    if (showMessage) {
      return (
        <Alert 
          severity="warning" 
          icon={<LockIcon />}
          sx={{ m: 2 }}
        >
          <Typography variant="h6">Access Denied</Typography>
          <Typography variant="body2">
            You don't have permission to access this content.
          </Typography>
          {permission && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Required permission: {permission}
            </Typography>
          )}
          {permissions.length > 0 && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Required permissions: {permissions.join(', ')}
            </Typography>
          )}
        </Alert>
      );
    }
    
    return null;
  }

  return children;
};

// Component that renders children only if user has required role
export const RoleGuard = ({ 
  role, 
  roles = [], 
  requireAll = false, 
  children, 
  fallback = null,
  showMessage = true 
}) => {
  const { hasRole, hasAnyRole } = useRBAC();

  // Check roles
  let hasAccess = false;
  
  if (role) {
    hasAccess = hasRole(role);
  } else if (roles.length > 0) {
    hasAccess = requireAll 
      ? roles.every(r => hasRole(r))
      : hasAnyRole(roles);
  }

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }
    
    if (showMessage) {
      return (
        <Alert 
          severity="warning" 
          icon={<LockIcon />}
          sx={{ m: 2 }}
        >
          <Typography variant="h6">Access Denied</Typography>
          <Typography variant="body2">
            You don't have the required role to access this content.
          </Typography>
          {role && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Required role: {role}
            </Typography>
          )}
          {roles.length > 0 && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Required roles: {roles.join(', ')}
            </Typography>
          )}
        </Alert>
      );
    }
    
    return null;
  }

  return children;
};

// Component that renders children only if user can access specific scope
export const ScopeGuard = ({ 
  scopeType, 
  scopeId = null, 
  children, 
  fallback = null,
  showMessage = true 
}) => {
  const { canAccessScope } = useRBAC();

  const hasAccess = canAccessScope(scopeType, scopeId);

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }
    
    if (showMessage) {
      return (
        <Alert 
          severity="warning" 
          icon={<LockIcon />}
          sx={{ m: 2 }}
        >
          <Typography variant="h6">Access Denied</Typography>
          <Typography variant="body2">
            You don't have access to this {scopeType.toLowerCase()}.
          </Typography>
          {scopeId && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              {scopeType} ID: {scopeId}
            </Typography>
          )}
        </Alert>
      );
    }
    
    return null;
  }

  return children;
};

// Combined guard component
export const AccessGuard = ({ 
  permission,
  permissions = [],
  role,
  roles = [],
  scopeType,
  scopeId,
  requireAll = false,
  children,
  fallback = null,
  showMessage = true 
}) => {
  const { hasPermission, hasAnyPermission, hasRole, hasAnyRole, canAccessScope } = useRBAC();

  let hasAccess = true;

  // Check permissions
  if (permission) {
    hasAccess = hasAccess && hasPermission(permission);
  }
  if (permissions.length > 0) {
    const permissionCheck = requireAll 
      ? permissions.every(p => hasPermission(p))
      : hasAnyPermission(permissions);
    hasAccess = hasAccess && permissionCheck;
  }

  // Check roles
  if (role) {
    hasAccess = hasAccess && hasRole(role);
  }
  if (roles.length > 0) {
    const roleCheck = requireAll 
      ? roles.every(r => hasRole(r))
      : hasAnyRole(roles);
    hasAccess = hasAccess && roleCheck;
  }

  // Check scope
  if (scopeType) {
    hasAccess = hasAccess && canAccessScope(scopeType, scopeId);
  }

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }
    
    if (showMessage) {
      return (
        <Alert 
          severity="warning" 
          icon={<LockIcon />}
          sx={{ m: 2 }}
        >
          <Typography variant="h6">Access Denied</Typography>
          <Typography variant="body2">
            You don't have sufficient privileges to access this content.
          </Typography>
          <Box sx={{ mt: 1 }}>
            {permission && (
              <Typography variant="caption" display="block">
                Required permission: {permission}
              </Typography>
            )}
            {permissions.length > 0 && (
              <Typography variant="caption" display="block">
                Required permissions: {permissions.join(', ')}
              </Typography>
            )}
            {role && (
              <Typography variant="caption" display="block">
                Required role: {role}
              </Typography>
            )}
            {roles.length > 0 && (
              <Typography variant="caption" display="block">
                Required roles: {roles.join(', ')}
              </Typography>
            )}
            {scopeType && (
              <Typography variant="caption" display="block">
                Required scope: {scopeType} {scopeId && `(${scopeId})`}
              </Typography>
            )}
          </Box>
        </Alert>
      );
    }
    
    return null;
  }

  return children;
};

// Hook for conditional rendering based on permissions
export const usePermissionCheck = () => {
  const { hasPermission, hasAnyPermission, hasRole, hasAnyRole, canAccessScope } = useRBAC();

  return {
    hasPermission,
    hasAnyPermission,
    hasRole,
    hasAnyRole,
    canAccessScope,
    
    // Helper function for multiple checks
    checkAccess: ({
      permission,
      permissions = [],
      role,
      roles = [],
      scopeType,
      scopeId,
      requireAll = false
    }) => {
      let hasAccess = true;

      if (permission) {
        hasAccess = hasAccess && hasPermission(permission);
      }
      if (permissions.length > 0) {
        const permissionCheck = requireAll 
          ? permissions.every(p => hasPermission(p))
          : hasAnyPermission(permissions);
        hasAccess = hasAccess && permissionCheck;
      }
      if (role) {
        hasAccess = hasAccess && hasRole(role);
      }
      if (roles.length > 0) {
        const roleCheck = requireAll 
          ? roles.every(r => hasRole(r))
          : hasAnyRole(roles);
        hasAccess = hasAccess && roleCheck;
      }
      if (scopeType) {
        hasAccess = hasAccess && canAccessScope(scopeType, scopeId);
      }

      return hasAccess;
    }
  };
};
