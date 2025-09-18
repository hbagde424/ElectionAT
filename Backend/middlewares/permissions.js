const UserRole = require('../models/UserRole');
const UserHierarchy = require('../models/UserHierarchy');
const RolePermission = require('../models/RolePermission');
const Permission = require('../models/Permission');

// Check if user has specific permission(s)
const hasPermission = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Convert single permission to array
            const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

            // Get user roles
            const userRoles = await UserRole.find({ user: req.user._id }).populate('role');
            const roleIds = userRoles.map(ur => ur.role._id);

            // Get permissions for these roles
            const rolePermissions = await RolePermission.find({
                role: { $in: roleIds }
            }).populate('permission');

            const userPermissions = rolePermissions.map(rp => rp.permission.name);

            console.log('User permissions:', userPermissions);
            console.log('Required permissions:', permissions);

            // Check if user has any of the required permissions
            const hasRequiredPermission = permissions.some(perm => userPermissions.includes(perm));

            if (hasRequiredPermission) {
                next();
            } else {
                res.status(403).json({
                    error: 'Insufficient permissions',
                    required: permissions,
                    userHas: userPermissions
                });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
};

// Check if user has access to specific geographic entity
const hasHierarchyAccess = (level) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const userHierarchy = await UserHierarchy.findOne({ user: req.user._id })
                .populate(['state', 'division', 'parliament', 'assembly', 'block', 'booth']);

            if (!userHierarchy) {
                // No restrictions - user has access to all levels
                return next();
            }

            const requestedEntityId = req.params.id || req.body.id;
            const levelMap = {
                'state': 'state',
                'division': 'division',
                'parliament': 'parliament',
                'assembly': 'assembly',
                'block': 'block',
                'booth': 'booth'
            };

            // Check if user's hierarchy level allows access to requested entity
            const userLevel = getUserHighestLevel(userHierarchy);
            const requestedLevel = levelMap[level];

            if (isLevelAccessible(userLevel, requestedLevel, userHierarchy, requestedEntityId)) {
                next();
            } else {
                res.status(403).json({ error: 'Access denied: Insufficient geographic permissions' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
};

// Get user's highest access level
function getUserHighestLevel(userHierarchy) {
    if (userHierarchy.booth) return 'booth';
    if (userHierarchy.block) return 'block';
    if (userHierarchy.assembly) return 'assembly';
    if (userHierarchy.parliament) return 'parliament';
    if (userHierarchy.division) return 'division';
    if (userHierarchy.state) return 'state';
    return null;
}

// Check if user can access the requested level
function isLevelAccessible(userLevel, requestedLevel, userHierarchy, entityId) {
    const hierarchy = ['state', 'division', 'parliament', 'assembly', 'block', 'booth'];
    const userLevelIndex = hierarchy.indexOf(userLevel);
    const requestedLevelIndex = hierarchy.indexOf(requestedLevel);

    // User can access their level and all levels below it
    if (userLevelIndex <= requestedLevelIndex) {
        // Additional check: ensure the entity is within user's geographic boundary
        return isEntityWithinBoundary(userHierarchy, requestedLevel, entityId);
    }

    return false;
}

// Check if entity is within user's geographic boundary
function isEntityWithinBoundary(userHierarchy, level, entityId) {
    // This would require additional logic to check if the requested entity
    // falls within the user's assigned geographic area
    // For now, returning true - implement based on your specific data structure
    return true;
}

// Combined permission and hierarchy check
const hasPermissionAndHierarchy = (permission, level) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Check role-based permissions
            const userRoles = await UserRole.find({ user: req.user._id }).populate('role');
            const roleIds = userRoles.map(ur => ur.role._id);

            const rolePermissions = await RolePermission.find({
                role: { $in: roleIds }
            }).populate('permission');

            const userPermissions = rolePermissions.map(rp => rp.permission.name);

            if (!userPermissions.includes(permission)) {
                return res.status(403).json({ error: 'Insufficient role permissions' });
            }

            // Check hierarchy access
            const userHierarchy = await UserHierarchy.findOne({ user: req.user._id });

            if (userHierarchy) {
                const userLevel = getUserHighestLevel(userHierarchy);
                const requestedEntityId = req.params.id || req.body.id;

                if (!isLevelAccessible(userLevel, level, userHierarchy, requestedEntityId)) {
                    return res.status(403).json({ error: 'Access denied: Geographic restrictions apply' });
                }
            }

            next();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
};

// Middleware to get user permissions and hierarchy (for frontend use)
const getUserPermissionsAndHierarchy = async (req, res, next) => {
    try {
        if (!req.user) {
            return next();
        }

        // Get user roles and permissions
        const userRoles = await UserRole.find({ user: req.user._id }).populate('role');
        const roleIds = userRoles.map(ur => ur.role._id);

        const rolePermissions = await RolePermission.find({
            role: { $in: roleIds }
        }).populate('permission');

        const userPermissions = rolePermissions.map(rp => rp.permission.name);

        // Get user hierarchy
        const userHierarchy = await UserHierarchy.findOne({ user: req.user._id })
            .populate(['state', 'division', 'parliament', 'assembly', 'block', 'booth']);

        // Attach to request object
        req.userPermissions = userPermissions;
        req.userHierarchy = userHierarchy;
        req.userRoles = userRoles.map(ur => ur.role);

        next();
    } catch (error) {
        console.error('Error getting user permissions and hierarchy:', error);
        next();
    }
};

module.exports = {
    hasPermission,
    hasHierarchyAccess,
    hasPermissionAndHierarchy,
    getUserPermissionsAndHierarchy
};
