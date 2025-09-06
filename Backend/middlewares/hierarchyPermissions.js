const UserHierarchy = require('../models/UserHierarchy');

/**
 * Middleware to check hierarchical access control
 * Ensures users can only access entities within their geographic scope
 */
const checkHierarchicalAccess = (level) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Super admin has access to everything
            if (req.user.email === 'superadmin@example.com') {
                return next();
            }

            const userHierarchy = await UserHierarchy.findOne({ user: req.user._id })
                .populate(['state', 'division', 'parliament', 'assembly', 'block', 'booth']);

            if (!userHierarchy) {
                // No restrictions - user has access to all levels
                return next();
            }

            const requestedEntityId = req.params.id || req.body.id;

            // Check if user can access this level and entity
            if (!canAccessEntity(userHierarchy, level, requestedEntityId)) {
                return res.status(403).json({
                    error: 'Access denied: Insufficient geographic permissions',
                    details: `You don't have access to ${level} level data`
                });
            }

            // Add user hierarchy to request for further processing
            req.userHierarchy = userHierarchy;
            next();
        } catch (error) {
            console.error('Hierarchy access check error:', error);
            res.status(500).json({ error: error.message });
        }
    };
};

/**
 * Check if user can access a specific entity based on hierarchy
 */
const canAccessEntity = (userHierarchy, requestedLevel, entityId) => {
    const hierarchy = ['state', 'division', 'parliament', 'assembly', 'block', 'booth'];
    const userLevel = getUserHighestLevel(userHierarchy);

    if (!userLevel) {
        // No hierarchy restrictions
        return true;
    }

    const requestedLevelIndex = hierarchy.indexOf(requestedLevel);
    const userLevelIndex = hierarchy.indexOf(userLevel);

    // User can access their level and all levels below
    if (userLevelIndex <= requestedLevelIndex) {
        // Additional check: ensure the entity is within user's geographic boundary
        return isEntityWithinBoundary(userHierarchy, requestedLevel, entityId);
    }

    return false;
};

/**
 * Get user's highest access level
 */
const getUserHighestLevel = (userHierarchy) => {
    if (userHierarchy.state) return 'state';
    if (userHierarchy.division) return 'division';
    if (userHierarchy.parliament) return 'parliament';
    if (userHierarchy.assembly) return 'assembly';
    if (userHierarchy.block) return 'block';
    if (userHierarchy.booth) return 'booth';
    return null;
};

/**
 * Check if requested entity is within user's geographic boundary
 */
const isEntityWithinBoundary = (userHierarchy, requestedLevel, entityId) => {
    if (!entityId) {
        // If no specific entity ID, allow access (for listing operations)
        return true;
    }

    // Get user's boundary at each level
    const userState = userHierarchy.state?._id || userHierarchy.state;
    const userDivision = userHierarchy.division?._id || userHierarchy.division;
    const userParliament = userHierarchy.parliament?._id || userHierarchy.parliament;
    const userAssembly = userHierarchy.assembly?._id || userHierarchy.assembly;
    const userBlock = userHierarchy.block?._id || userHierarchy.block;
    const userBooth = userHierarchy.booth?._id || userHierarchy.booth;

    switch (requestedLevel) {
        case 'state':
            return !userState || userState.toString() === entityId.toString();

        case 'division':
            return !userDivision || userDivision.toString() === entityId.toString();

        case 'parliament':
            return !userParliament || userParliament.toString() === entityId.toString();

        case 'assembly':
            return !userAssembly || userAssembly.toString() === entityId.toString();

        case 'block':
            return !userBlock || userBlock.toString() === entityId.toString();

        case 'booth':
            return !userBooth || userBooth.toString() === entityId.toString();

        default:
            return true;
    }
};

/**
 * Filter query based on user's geographic scope
 * Used for GET requests to limit results to user's accessible area
 */
const addHierarchyFilter = (level) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Super admin sees everything
            if (req.user.email === 'superadmin@example.com') {
                return next();
            }

            const userHierarchy = await UserHierarchy.findOne({ user: req.user._id });

            if (!userHierarchy) {
                // No restrictions
                return next();
            }

            // Add hierarchy filter to query
            const hierarchyFilter = buildHierarchyFilter(userHierarchy, level);

            // Merge with existing query
            req.query = { ...req.query, ...hierarchyFilter };
            req.userHierarchy = userHierarchy;

            next();
        } catch (error) {
            console.error('Hierarchy filter error:', error);
            res.status(500).json({ error: error.message });
        }
    };
};

/**
 * Build MongoDB filter based on user hierarchy
 */
const buildHierarchyFilter = (userHierarchy, level) => {
    const filter = {};

    // Apply filters based on user's hierarchy
    if (userHierarchy.state) {
        filter.state = userHierarchy.state;
    }
    if (userHierarchy.division) {
        filter.division = userHierarchy.division;
    }
    if (userHierarchy.parliament) {
        filter.parliament = userHierarchy.parliament;
    }
    if (userHierarchy.assembly) {
        filter.assembly = userHierarchy.assembly;
    }
    if (userHierarchy.block) {
        filter.block = userHierarchy.block;
    }
    if (userHierarchy.booth) {
        filter.booth = userHierarchy.booth;
    }

    return filter;
};

/**
 * Check if user can access another user based on hierarchy
 */
const canAccessUser = async (currentUserId, targetUserId) => {
    try {
        const currentUserHierarchy = await UserHierarchy.findOne({ user: currentUserId });
        const targetUserHierarchy = await UserHierarchy.findOne({ user: targetUserId });

        // If current user has no restrictions, they can access anyone
        if (!currentUserHierarchy) {
            return true;
        }

        // If target user has no restrictions, only unrestricted users can access them
        if (!targetUserHierarchy) {
            return !currentUserHierarchy;
        }

        // Check if target user is within current user's scope
        return isUserWithinScope(currentUserHierarchy, targetUserHierarchy);
    } catch (error) {
        console.error('Error checking user access:', error);
        return false;
    }
};

/**
 * Check if target user is within current user's geographic scope
 */
const isUserWithinScope = (currentUserHierarchy, targetUserHierarchy) => {
    // Compare each level - target must be within or equal to current user's scope
    const levels = ['state', 'division', 'parliament', 'assembly', 'block', 'booth'];

    for (const level of levels) {
        const currentLevel = currentUserHierarchy[level];
        const targetLevel = targetUserHierarchy[level];

        if (currentLevel && targetLevel) {
            const currentId = currentLevel._id || currentLevel;
            const targetId = targetLevel._id || targetLevel;

            if (currentId.toString() !== targetId.toString()) {
                return false;
            }
        } else if (currentLevel && !targetLevel) {
            // Current user has restriction at this level, but target doesn't
            return false;
        }
        // If current user doesn't have restriction at this level, target can have any value
    }

    return true;
};

module.exports = {
    checkHierarchicalAccess,
    addHierarchyFilter,
    canAccessEntity,
    getUserHighestLevel,
    isEntityWithinBoundary,
    buildHierarchyFilter,
    canAccessUser,
    isUserWithinScope
};
