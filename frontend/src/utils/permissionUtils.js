// Normalize permission names between different formats
export const normalizePermissionName = (permission) => {
    if (!permission) return '';

    // Convert to lowercase for consistent comparison
    permission = permission.toLowerCase();

    // Map old permission formats to new ones and vice versa
    const permissionMap = {
        // CRUD permissions (database format) to Frontend format
        'state_read': ['state_read'],
        'state_insert': ['state_create'],
        'state_update': ['state_update'],
        'state_delete': ['state_delete'],

        'division_read': ['division_read'],
        'division_insert': ['division_create'],
        'division_update': ['division_update'],
        'division_delete': ['division_delete'],

        'parliament_read': ['parliament_read'],
        'parliament_insert': ['parliament_create'],
        'parliament_update': ['parliament_update'],
        'parliament_delete': ['parliament_delete'],

        'assembly_read': ['assembly_read'],
        'assembly_insert': ['assembly_create'],
        'assembly_update': ['assembly_update'],
        'assembly_delete': ['assembly_delete'],

        'block_read': ['block_read'],
        'block_insert': ['block_create'],
        'block_update': ['block_update'],
        'block_delete': ['block_delete'],

        'booth_read': ['booth_read'],
        'booth_insert': ['booth_create'],
        'booth_update': ['booth_update'],
        'booth_delete': ['booth_delete'],

        'users_read': ['user_read'],
        'users_insert': ['user_create'],
        'users_update': ['user_update'],
        'users_delete': ['user_delete'],

        'role_read': ['role_read'],
        'role_insert': ['role_create'],
        'role_update': ['role_update'],
        'role_delete': ['role_delete'],

        'candidates_read': ['candidate_read'],
        'candidates_insert': ['candidate_create'],
        'candidates_update': ['candidate_update'],
        'candidates_delete': ['candidate_delete'],

        'parties_read': ['party_read'],
        'parties_insert': ['party_create'],
        'parties_update': ['party_update'],
        'parties_delete': ['party_delete'],

        // Special permissions
        'matrix_read': ['permission_read', 'role_permission_matrix_view'],
        'matrix_insert': ['permission_create'],
        'matrix_update': ['permission_update'],
        'matrix_delete': ['permission_delete'],

        'assign-role-to-user_read': ['user_role_assign'],
        'assign-role-to-user_insert': ['user_role_assign'],
        'assign-role-to-user_update': ['user_role_assign'],
        'assign-role-to-user_delete': ['user_role_assign'],

        // Frontend format to Database format (reverse mapping)
        'state_read': ['state_read'],
        'state_create': ['state_insert'],
        'state_update': ['state_update'],
        'state_delete': ['state_delete'],

        'division_read': ['division_read'],
        'division_create': ['division_insert'],
        'division_update': ['division_update'],
        'division_delete': ['division_delete'],

        'parliament_read': ['parliament_read'],
        'parliament_create': ['parliament_insert'],
        'parliament_update': ['parliament_update'],
        'parliament_delete': ['parliament_delete'],

        'assembly_read': ['assembly_read'],
        'assembly_create': ['assembly_insert'],
        'assembly_update': ['assembly_update'],
        'assembly_delete': ['assembly_delete'],

        'block_read': ['block_read'],
        'block_create': ['block_insert'],
        'block_update': ['block_update'],
        'block_delete': ['block_delete'],

        'booth_read': ['booth_read'],
        'booth_create': ['booth_insert'],
        'booth_update': ['booth_update'],
        'booth_delete': ['booth_delete'],

        'user_read': ['users_read'],
        'user_create': ['users_insert'],
        'user_update': ['users_update'],
        'user_delete': ['users_delete'],

        'role_read': ['role_read'],
        'role_create': ['role_insert'],
        'role_update': ['role_update'],
        'role_delete': ['role_delete'],

        'candidate_read': ['candidates_read'],
        'candidate_create': ['candidates_insert'],
        'candidate_update': ['candidates_update'],
        'candidate_delete': ['candidates_delete'],

        'party_read': ['parties_read'],
        'party_create': ['parties_insert'],
        'party_update': ['parties_update'],
        'party_delete': ['parties_delete'],

        'permission_read': ['matrix_read', 'permissions_read'],
        'role_permission_matrix_view': ['matrix_read'],
        'user_role_assign': ['assign-role-to-user_read', 'assign-role-to-user_insert', 'assign-role-to-user_update', 'assign-role-to-user_delete'],

        // Additional mappings for new permissions
        'FAQ_read': ['analytics_read'],
        'FAQ_insert': ['analytics_read'],
        'FAQ_update': ['analytics_read'],
        'FAQ_delete': ['analytics_read'],

        'Data_read': ['analytics_read'],
        'Data_insert': ['analytics_read'],
        'Data_update': ['analytics_read'],
        'Data_delete': ['analytics_read'],

        'default1_read': ['analytics_read'],
        'default1_insert': ['analytics_read'],
        'default1_update': ['analytics_read'],
        'default1_delete': ['analytics_read'],

        'group-admin_read': ['user_read', 'role_read', 'permission_read'],
        'group-admin_insert': ['user_create', 'role_create', 'permission_create'],
        'group-admin_update': ['user_update', 'role_update', 'permission_update'],
        'group-admin_delete': ['user_delete', 'role_delete', 'permission_delete'],

        'roles_read': ['role_read'],
        'roles_insert': ['role_create'],
        'roles_update': ['role_update'],
        'roles_delete': ['role_delete'],

        'permissions_read': ['permission_read'],
        'permissions_insert': ['permission_create'],
        'permissions_update': ['permission_update'],
        'permissions_delete': ['permission_delete'],

        // Legacy mappings for backward compatibility
        'user.read': ['user_read'],
        'role.read': ['role_read'],
        'state.read': ['state_read'],
        'division.read': ['division_read'],
        'parliament.read': ['parliament_read'],
        'assembly.read': ['assembly_read'],
        'block.read': ['block_read'],
        'booth.read': ['booth_read'],
        'dashboard.view': ['analytics_read'],
        'reports.view': ['report_read'],
        'system.admin': ['permission_read', 'role_permission_matrix_view']
    };

    // If the permission is in the map, return all its variations
    if (permissionMap[permission]) {
        return permissionMap[permission];
    }

    // If not in map, return the original permission
    return [permission];
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