// Normalize permission names between different formats
export const normalizePermissionName = (permission) => {
    if (!permission) return '';

    // Convert to lowercase for consistent comparison
    permission = permission.toLowerCase();

    // Map old permission formats to new ones and vice versa
    const permissionMap = {
        // Old to New format
        'dashboard_total': ['dashboard.view', 'analytics_read'],
        'users_create': ['user.create'],
        'users_delete': ['user.delete'],

        // New to Old format
        'reports.view': ['report_read'],
        'dashboard.view': ['analytics_read'],
        'analytics_read': ['dashboard.view', 'Dashboard_Total'],
        'report_read': ['reports.view'],

        // Additional mappings
        'Dashboard_Total': ['dashboard.view', 'analytics_read'],
        'Users_Create': ['user.create'],
        'Users_Delete': ['user.delete']
    };

    // If the permission is in the map, return all its variations
    if (permissionMap[permission]) {
        return permissionMap[permission];
    }

    // If not in map, return the original permission
    return [permission];

    return permissionMap[permission] || permission;
};

// Check if user has permission considering all formats
export const checkPermission = (userPermissions, requiredPermission) => {
    // Get all possible variations of the required permission
    const requiredVariations = normalizePermissionName(requiredPermission);

    // Get all possible variations of user permissions
    const userVariations = userPermissions.flatMap(p => normalizePermissionName(p));

    // Check if any of the required variations match any of the user variations
    return requiredVariations.some(required =>
        userVariations.includes(required) || userPermissions.includes(required)
    );
};

// Check multiple permissions
export const checkPermissions = (userPermissions, requiredPermissions) => {
    if (!Array.isArray(requiredPermissions)) {
        requiredPermissions = [requiredPermissions];
    }

    // Check if user has any of the required permissions
    return requiredPermissions.some(permission =>
        checkPermission(userPermissions, permission)
    );
};