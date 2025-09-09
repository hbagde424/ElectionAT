// utils/menuPermissions.js
// Define permission mappings for menu items - Updated to match our actual permission system
export const MENU_PERMISSIONS = {
    // Geographic Data
    state: ['state_read'],
    division: ['division_read'],
    parliament: ['parliament_read'],
    assembly: ['assembly_read'],
    district: ['division_read'], // District is part of division
    block: ['block_read'],
    booth: ['booth_read'],

    // Voting Data
    'Assembly-Votes': ['election_data_read'],
    'Block-Votes': ['election_data_read'],
    'Booth-Votes': ['election_data_read'],
    'Parliament-Votes': ['election_data_read'],

    // Demographics & Survey
    'Booth-Survey': ['survey_read'],
    'Booth-Demographics': ['election_data_read'],
    'Booth-Infrastructure': ['election_data_read'],
    'Local-Dynamics': ['election_data_read'],
    'Local-Issues': ['election_data_read'],
    'Local-News': ['election_data_read'],

    // Party & Candidate Data
    'Active-Party': ['party_read'],
    'Booth-Party-Presence': ['election_data_read'],
    'Booth-Party-Vote-Share': ['election_data_read'],
    'Accomplished-MLA': ['election_data_read'],
    'Party-Activity': ['election_data_read'],
    'Candidates': ['candidate_read'],

    // People & Volunteers
    'Booth-Volunteers': ['booth_read'],
    'Influencers': ['election_data_read'],

    // System Management
    'Users': ['user_read'],
    'matrix': ['permission_read', 'role_permission_matrix_view']
};

// CRUD operation permissions - Updated to match our actual permission system
export const CRUD_PERMISSIONS = {
    READ: '_read',
    CREATE: '_create',
    UPDATE: '_update',
    DELETE: '_delete'
};

// Get permission name for a specific operation
export const getPermissionName = (module, operation) => {
    const moduleLower = module.toLowerCase().replace(/-/g, '_');
    return `${moduleLower}${operation}`;
};

// Check if user has permission for specific CRUD operation
export const hasOperationPermission = (userPermissions, module, operation) => {
    const permissionName = getPermissionName(module, operation);
    return userPermissions.includes(permissionName);
};
