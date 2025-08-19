// Role definitions with associated permissions
export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    STATE_ADMIN: 'STATE_ADMIN',
    DIVISION_ADMIN: 'DIVISION_ADMIN',
    PARLIAMENT_ADMIN: 'PARLIAMENT_ADMIN',
    ASSEMBLY_ADMIN: 'ASSEMBLY_ADMIN',
    BLOCK_ADMIN: 'BLOCK_ADMIN',
    BOOTH_ADMIN: 'BOOTH_ADMIN',
    USER: 'USER'
};

// Permission types
export const PERMISSIONS = {
    CREATE: 'CREATE',
    READ: 'READ',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE'
};

// Role-based permission configuration
export const ROLE_PERMISSIONS = {
    [ROLES.SUPER_ADMIN]: {
        state: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE],
        division: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE],
        parliament: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE],
        assembly: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE],
        block: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE],
        booth: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE, PERMISSIONS.DELETE]
    },
    [ROLES.STATE_ADMIN]: {
        state: [PERMISSIONS.READ],
        division: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE],
        parliament: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE],
        assembly: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE],
        block: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE],
        booth: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE]
    },
    [ROLES.DIVISION_ADMIN]: {
        state: [PERMISSIONS.READ],
        division: [PERMISSIONS.READ],
        parliament: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE],
        assembly: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE],
        block: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE],
        booth: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE]
    },
    [ROLES.PARLIAMENT_ADMIN]: {
        state: [PERMISSIONS.READ],
        division: [PERMISSIONS.READ],
        parliament: [PERMISSIONS.READ],
        assembly: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE],
        block: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE],
        booth: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE]
    },
    [ROLES.ASSEMBLY_ADMIN]: {
        state: [PERMISSIONS.READ],
        division: [PERMISSIONS.READ],
        parliament: [PERMISSIONS.READ],
        assembly: [PERMISSIONS.READ],
        block: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE],
        booth: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE]
    },
    [ROLES.BLOCK_ADMIN]: {
        state: [PERMISSIONS.READ],
        division: [PERMISSIONS.READ],
        parliament: [PERMISSIONS.READ],
        assembly: [PERMISSIONS.READ],
        block: [PERMISSIONS.READ],
        booth: [PERMISSIONS.CREATE, PERMISSIONS.READ, PERMISSIONS.UPDATE]
    },
    [ROLES.BOOTH_ADMIN]: {
        state: [PERMISSIONS.READ],
        division: [PERMISSIONS.READ],
        parliament: [PERMISSIONS.READ],
        assembly: [PERMISSIONS.READ],
        block: [PERMISSIONS.READ],
        booth: [PERMISSIONS.READ]
    },
    [ROLES.USER]: {
        state: [PERMISSIONS.READ],
        division: [PERMISSIONS.READ],
        parliament: [PERMISSIONS.READ],
        assembly: [PERMISSIONS.READ],
        block: [PERMISSIONS.READ],
        booth: [PERMISSIONS.READ]
    }
};

// Helper function to check if a user has permission for an action
export const hasPermission = (role, entity, action) => {
    if (!ROLE_PERMISSIONS[role]) return false;
    if (!ROLE_PERMISSIONS[role][entity]) return false;
    return ROLE_PERMISSIONS[role][entity].includes(action);
};

// Get available entities for a role
export const getAvailableEntities = (role) => {
    if (!ROLE_PERMISSIONS[role]) return [];
    return Object.keys(ROLE_PERMISSIONS[role]).filter(entity =>
        ROLE_PERMISSIONS[role][entity].length > 0
    );
};

