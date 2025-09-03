// utils/menuPermissions.js
// Define permission mappings for menu items
export const MENU_PERMISSIONS = {
    // Geographic Data
    state: ['STATE_VIEW', 'STATE_CREATE', 'STATE_UPDATE', 'STATE_DELETE'],
    division: ['DIVISION_VIEW', 'DIVISION_CREATE', 'DIVISION_UPDATE', 'DIVISION_DELETE'],
    parliament: ['PARLIAMENT_VIEW', 'PARLIAMENT_CREATE', 'PARLIAMENT_UPDATE', 'PARLIAMENT_DELETE'],
    assembly: ['ASSEMBLY_VIEW', 'ASSEMBLY_CREATE', 'ASSEMBLY_UPDATE', 'ASSEMBLY_DELETE'],
    district: ['DISTRICT_VIEW', 'DISTRICT_CREATE', 'DISTRICT_UPDATE', 'DISTRICT_DELETE'],
    block: ['BLOCK_VIEW', 'BLOCK_CREATE', 'BLOCK_UPDATE', 'BLOCK_DELETE'],
    booth: ['BOOTH_VIEW', 'BOOTH_CREATE', 'BOOTH_UPDATE', 'BOOTH_DELETE'],

    // Voting Data
    'Assembly-Votes': ['ASSEMBLY_VOTES_VIEW', 'ASSEMBLY_VOTES_CREATE', 'ASSEMBLY_VOTES_UPDATE', 'ASSEMBLY_VOTES_DELETE'],
    'Block-Votes': ['BLOCK_VOTES_VIEW', 'BLOCK_VOTES_CREATE', 'BLOCK_VOTES_UPDATE', 'BLOCK_VOTES_DELETE'],
    'Booth-Votes': ['BOOTH_VOTES_VIEW', 'BOOTH_VOTES_CREATE', 'BOOTH_VOTES_UPDATE', 'BOOTH_VOTES_DELETE'],
    'Parliament-Votes': ['PARLIAMENT_VOTES_VIEW', 'PARLIAMENT_VOTES_CREATE', 'PARLIAMENT_VOTES_UPDATE', 'PARLIAMENT_VOTES_DELETE'],

    // Demographics & Survey
    'Booth-Survey': ['BOOTH_SURVEY_VIEW', 'BOOTH_SURVEY_CREATE', 'BOOTH_SURVEY_UPDATE', 'BOOTH_SURVEY_DELETE'],
    'Booth-Demographics': ['BOOTH_DEMOGRAPHICS_VIEW', 'BOOTH_DEMOGRAPHICS_CREATE', 'BOOTH_DEMOGRAPHICS_UPDATE', 'BOOTH_DEMOGRAPHICS_DELETE'],
    'Booth-Infrastructure': ['BOOTH_INFRASTRUCTURE_VIEW', 'BOOTH_INFRASTRUCTURE_CREATE', 'BOOTH_INFRASTRUCTURE_UPDATE', 'BOOTH_INFRASTRUCTURE_DELETE'],
    'Local-Dynamics': ['LOCAL_DYNAMICS_VIEW', 'LOCAL_DYNAMICS_CREATE', 'LOCAL_DYNAMICS_UPDATE', 'LOCAL_DYNAMICS_DELETE'],
    'Local-Issues': ['LOCAL_ISSUES_VIEW', 'LOCAL_ISSUES_CREATE', 'LOCAL_ISSUES_UPDATE', 'LOCAL_ISSUES_DELETE'],
    'Local-News': ['LOCAL_NEWS_VIEW', 'LOCAL_NEWS_CREATE', 'LOCAL_NEWS_UPDATE', 'LOCAL_NEWS_DELETE'],

    // Party & Candidate Data
    'Active-Party': ['PARTY_VIEW', 'PARTY_CREATE', 'PARTY_UPDATE', 'PARTY_DELETE'],
    'Booth-Party-Presence': ['BOOTH_PARTY_PRESENCE_VIEW', 'BOOTH_PARTY_PRESENCE_CREATE', 'BOOTH_PARTY_PRESENCE_UPDATE', 'BOOTH_PARTY_PRESENCE_DELETE'],
    'Booth-Party-Vote-Share': ['BOOTH_PARTY_VOTE_SHARE_VIEW', 'BOOTH_PARTY_VOTE_SHARE_CREATE', 'BOOTH_PARTY_VOTE_SHARE_UPDATE', 'BOOTH_PARTY_VOTE_SHARE_DELETE'],
    'Accomplished-MLA': ['ACCOMPLISHED_MLA_VIEW', 'ACCOMPLISHED_MLA_CREATE', 'ACCOMPLISHED_MLA_UPDATE', 'ACCOMPLISHED_MLA_DELETE'],
    'Party-Activity': ['PARTY_ACTIVITY_VIEW', 'PARTY_ACTIVITY_CREATE', 'PARTY_ACTIVITY_UPDATE', 'PARTY_ACTIVITY_DELETE'],
    'Candidates': ['CANDIDATES_VIEW', 'CANDIDATES_CREATE', 'CANDIDATES_UPDATE', 'CANDIDATES_DELETE'],

    // People & Volunteers
    'Booth-Volunteers': ['BOOTH_VOLUNTEERS_VIEW', 'BOOTH_VOLUNTEERS_CREATE', 'BOOTH_VOLUNTEERS_UPDATE', 'BOOTH_VOLUNTEERS_DELETE'],
    'Influencers': ['INFLUENCERS_VIEW', 'INFLUENCERS_CREATE', 'INFLUENCERS_UPDATE', 'INFLUENCERS_DELETE'],

    // System Management
    'Users': ['USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE'],
    'matrix': ['ROLE_VIEW', 'PERMISSION_VIEW', 'ROLE_MANAGE', 'PERMISSION_CREATE', 'PERMISSION_UPDATE']
};

// CRUD operation permissions
export const CRUD_PERMISSIONS = {
    VIEW: '_VIEW',
    CREATE: '_CREATE',
    UPDATE: '_UPDATE',
    DELETE: '_DELETE'
};

// Get permission name for a specific operation
export const getPermissionName = (module, operation) => {
    const moduleUpper = module.toUpperCase().replace(/-/g, '_');
    return `${moduleUpper}${operation}`;
};

// Check if user has permission for specific CRUD operation
export const hasOperationPermission = (userPermissions, module, operation) => {
    const permissionName = getPermissionName(module, operation);
    return userPermissions.includes(permissionName);
};
