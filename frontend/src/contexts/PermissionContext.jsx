// contexts/PermissionContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axiosServices from 'utils/axios';

const PermissionContext = createContext();

export const usePermissions = () => {
    const context = useContext(PermissionContext);
    if (!context) {
        console.warn('usePermissions must be used within a PermissionProvider. Falling back to default values.');
        return {
            userPermissions: [],
            userRoles: [],
            userHierarchy: null,
            loading: false,
            error: null,
            hasPermission: () => false,
            hasAnyPermission: () => false,
            hasAllPermissions: () => false,
            hasRole: () => false,
            canAccessLevel: () => false,
            canAccessEntity: () => false,
            getUserHighestLevel: () => null,
            refreshPermissions: () => { },
            fetchUserPermissions: () => { }
        };
    }
    return context;
};

export const PermissionProvider = ({ children }) => {
    const [userPermissions, setUserPermissions] = useState([]);
    const [userRoles, setUserRoles] = useState([]);
    const [userHierarchy, setUserHierarchy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // guard to prevent state updates after unmount
    const mountedRef = useRef(true);
    useEffect(() => () => { mountedRef.current = false; }, []);

    // Get current user from localStorage or your auth context
    const getCurrentUser = () => {
        try {
            const userData = localStorage.getItem('user');
            // console.log('🔍 Raw user data from localStorage:', userData);
            const user = userData ? JSON.parse(userData) : null;
            // console.log('🔍 Parsed user data:', user);
            return user;
        } catch (err) {
            console.error('❌ Error parsing user data:', err);
            return null;
        }
    };

    // Normalize user id: accept _id or id or userId
    const getCurrentUserId = (userObj) => {
        if (!userObj) return null;
        return userObj._id || userObj.id || userObj.userId || null;
    };

    useEffect(() => {
        // Slight delay to ensure auth context/localStorage is ready
        const timer = setTimeout(() => {
            fetchUserPermissions();
            fetchUserHierarchy();
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const fetchUserPermissions = async () => {

        try {
            if (mountedRef.current) setLoading(true);
            const currentUser = getCurrentUser();
            const userId = getCurrentUserId(currentUser);

            // console.log('🔍 fetchUserPermissions called with user:', currentUser, 'resolved userId:', userId);

            if (!currentUser || !userId) {
                console.log('❌ No userId found, skipping permission fetch');
                if (mountedRef.current) setLoading(false);
                return;
            }

            // Fetch user roles
            // console.log('📡 Making API call to fetch user roles for:', userId);
            const userRolesRes = await axiosServices.get(`/user-roles/user/${userId}`);
            const rolesPayload = userRolesRes?.data?.data ?? userRolesRes?.data ?? [];
            // console.log('📡 User roles API response (normalized):', rolesPayload);

            // normalize roles array
            const roles = Array.isArray(rolesPayload) ? rolesPayload : [];
            if (mountedRef.current) setUserRoles(roles);
            // console.log('📋 Set user roles:', roles);

            // Extract permissions from roles
            const permissionsSet = new Set();

            for (const userRole of roles) {
                // role may be directly the role object or nested { role: {...} }
                const roleObj = userRole?.role ?? userRole;
                const roleId = roleObj?._id || roleObj?.id || roleObj?.roleId || null;

                if (!roleId) {
                    console.warn('⚠️ roleId not found for userRole, skipping:', userRole);
                    continue;
                }

                try {
                    console.log(`📡 Fetching permissions for role ${roleId}`);
                    const rolePermissionsRes = await axiosServices.get(`/role-permissions/${roleId}`);
                    // accept either res.data.data or res.data
                    const rolePermsPayload = rolePermissionsRes?.data?.data ?? rolePermissionsRes?.data ?? [];
                    const rolePermissions = Array.isArray(rolePermsPayload) ? rolePermsPayload : [];

                    rolePermissions.forEach(permission => {
                        // permission might be { name: 'perm' } or a string
                        if (!permission) return;
                        if (typeof permission === 'string') {
                            permissionsSet.add(permission);
                        } else if (permission.name) {
                            permissionsSet.add(permission.name);
                        } else if (permission.permissionName) {
                            permissionsSet.add(permission.permissionName);
                        }
                    });
                } catch (err) {
                    console.error(`Error fetching permissions for role ${roleId}:`, err);
                    // continue to next role
                }
            }

            const finalPermissions = Array.from(permissionsSet);
            if (mountedRef.current) setUserPermissions(finalPermissions);
            // console.log('✅ User permissions loaded:', finalPermissions.length, 'permissions');
            // console.log('📋 Permissions:', finalPermissions);
            if (mountedRef.current) setError(null);
        } catch (err) {
            console.error('❌ Error fetching user permissions:', err);
            console.error('❌ Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });

            // Fallback to test permissions based on user email
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.email) {
                console.log('🔄 Using test permissions for:', currentUser.email);
                const testPermissions = getTestPermissions(currentUser.email);
                console.log('🔄 Test permissions:', testPermissions);
                if (mountedRef.current) {
                    setUserPermissions(testPermissions);
                    setUserRoles([{ role: { name: getTestRole(currentUser.email) } }]);
                    setError('Using test permissions - database not available');
                }
            } else {
                console.log('❌ No current user for fallback');
                // Fallback to superadmin permissions if no user found
                console.log('🔄 Using superadmin fallback permissions');
                const fallbackPermissions = getTestPermissions('superadmin@example.com');
                if (mountedRef.current) {
                    setUserPermissions(fallbackPermissions);
                    setUserRoles([{ role: { name: 'SuperAdmin' } }]);
                    setError('Using fallback permissions - no user found');
                }
            }
        } finally {
            // console.log('🏁 fetchUserPermissions completed');
            if (mountedRef.current) setLoading(false);
        }
    };

    // Test permission fallback
    const getTestPermissions = (email) => {
        const testPermissionSets = {
            'superadmin@example.com': [
                // All permissions from the database (exact names)
                'state', 'division', 'parliament', 'parliament-candidate', 'assembly', 'district', 'block', 'booth',
                'Booth-Survey', 'booth-volunteer', 'Booth-votes', 'candidates', 'Caste-List', 'Coding', 'Events',
                'Gender', 'Government-Scheme', 'Influancer', 'Local-Issue', 'parties', 'Party-Activities',
                'Pontentcal-Candidate', 'Users', 'Our visits', 'WinningPartiesList', 'WInningCandidateList',
                'Work-Status', 'Year', 'role', 'matrix', 'assign-role-to-user', 'faq-crud', 'help center',
                'faq', 'data', 'default1', 'group-admin', 'roles', 'permissions'
            ],
            'manager@example.com': [
                'Users', 'role', 'permissions', 'matrix', 'assign-role-to-user',
                'state', 'division', 'parliament', 'assembly', 'block', 'booth',
                'candidates', 'parties', 'Booth-Survey', 'Booth-votes', 'Caste-List', 'Events',
                'Gender', 'Local-Issue', 'Our visits', 'Work-Status'
            ],
            'authfixed@example.com': [
                'Users', 'role', 'permissions', 'matrix', 'assign-role-to-user',
                'state', 'division', 'parliament', 'assembly', 'block', 'booth',
                'candidates', 'parties', 'Booth-Survey', 'Booth-votes', 'Caste-List', 'Events',
                'Gender', 'Local-Issue', 'Our visits', 'Work-Status'
            ],
            'user@example.com': [
                'Users', 'state', 'division', 'parliament', 'assembly', 'block', 'booth',
                'candidates', 'parties', 'Booth-Survey', 'Booth-votes', 'Caste-List', 'Events',
                'Gender', 'Local-Issue', 'Our visits', 'Work-Status'
            ]
        };

        return testPermissionSets[email] || ['Users'];
    };

    const getTestRole = (email) => {
        const testRoles = {
            'superadmin@example.com': 'SuperAdmin',
            'manager@example.com': 'Manager',
            'authfixed@example.com': 'Manager',
            'user@example.com': 'User'
        };

        return testRoles[email] || 'User';
    };

    const fetchUserHierarchy = async () => {
        try {
            const currentUser = getCurrentUser();
            const userId = getCurrentUserId(currentUser);
            if (!currentUser || !userId) {
                console.log('⚠️ fetchUserHierarchy: no user or userId found');
                return;
            }

            // First try to get UserHierarchy
            try {
                const response = await axiosServices.get(`/user-hierarchy/${userId}`);
                const hierarchyData = response?.data?.data ?? response?.data ?? null;
                if (hierarchyData && Object.keys(hierarchyData).length > 0) {
                    if (mountedRef.current) setUserHierarchy(hierarchyData);
                    console.log('📚 userHierarchy from UserHierarchy model:', hierarchyData);
                    return;
                }
            } catch (err) {
                console.log('No UserHierarchy found, checking User model...');
            }

            // If no UserHierarchy found, check if user has hierarchical IDs in User model
            if (currentUser.state_ids?.length > 0 || currentUser.division_ids?.length > 0 ||
                currentUser.parliament_ids?.length > 0 || currentUser.assembly_ids?.length > 0 ||
                currentUser.block_ids?.length > 0 || currentUser.booth_ids?.length > 0) {

                // Create a mock hierarchy object from User model data
                const mockHierarchy = {
                    user: userId,
                    state: currentUser.state_ids?.[0] || null,
                    division: currentUser.division_ids?.[0] || null,
                    parliament: currentUser.parliament_ids?.[0] || null,
                    assembly: currentUser.assembly_ids?.[0] || null,
                    block: currentUser.block_ids?.[0] || null,
                    booth: currentUser.booth_ids?.[0] || null
                };

                if (mountedRef.current) setUserHierarchy(mockHierarchy);
                console.log('📚 userHierarchy from User model:', mockHierarchy);
            } else {
                if (mountedRef.current) setUserHierarchy(null);
                console.log('📚 No hierarchy restrictions found');
            }
        } catch (err) {
            console.error('Error fetching user hierarchy:', err);
            if (mountedRef.current) setUserHierarchy(null);
        }
    };

    // Check if user has a specific permission
    const hasPermission = (permissionName) => {
        if (!permissionName) return false;

        // Grant all permissions to Super Admin (by email or role)
        const currentUser = getCurrentUser();
        if (currentUser && (
            currentUser.email === 'superadmin@example.com' ||
            currentUser.role === 'superAdmin' ||
            hasRole('SuperAdmin') ||
            hasRole('Super Admin') ||
            hasRole('Super Administrator')
        )) {
            return true;
        }

        return userPermissions.includes(permissionName);
    };

    // Check if user has any of the specified permissions
    const hasAnyPermission = (permissionNames) => {
        if (!Array.isArray(permissionNames)) return false;

        // Grant all permissions to Super Admin (by email or role)
        const currentUser = getCurrentUser();
        if (currentUser && (
            currentUser.email === 'superadmin@example.com' ||
            currentUser.role === 'superAdmin' ||
            hasRole('SuperAdmin') ||
            hasRole('Super Admin') ||
            hasRole('Super Administrator')
        )) {
            return true;
        }

        return permissionNames.some(permission => hasPermission(permission));
    };

    // Check if user has all of the specified permissions
    const hasAllPermissions = (permissionNames) => {
        if (!Array.isArray(permissionNames)) return false;

        // Grant all permissions to Super Admin (by email or role)
        const currentUser = getCurrentUser();
        if (currentUser && (
            currentUser.email === 'superadmin@example.com' ||
            currentUser.role === 'superAdmin' ||
            hasRole('SuperAdmin') ||
            hasRole('Super Admin') ||
            hasRole('Super Administrator')
        )) {
            return true;
        }

        return permissionNames.every(permission => hasPermission(permission));
    };

    // Check if user has a specific role
    const hasRole = (roleName) => {
        if (!roleName) return false;
        return userRoles.some(userRole =>
            // userRole may be { role: { name: '...' } } or { name: '...' }
            (userRole.role && userRole.role.name === roleName) || (userRole.name === roleName)
        );
    };

    // Check if user can access a specific geographic level
    const canAccessLevel = (level) => {
        if (!userHierarchy) return true; // No restrictions

        const hierarchy = ['state', 'division', 'parliament', 'assembly', 'block', 'booth'];
        const userLevel = getUserHighestLevel();

        if (!userLevel) return true; // No restrictions

        const userLevelIndex = hierarchy.indexOf(userLevel);
        const requestedLevelIndex = hierarchy.indexOf(level);

        // access their level and all levels below (smaller index => higher in hierarchy)
        return userLevelIndex <= requestedLevelIndex;
    };

    // Get user's highest access level
    const getUserHighestLevel = () => {
        if (!userHierarchy) return null;

        if (userHierarchy.state) return 'state';
        if (userHierarchy.division) return 'division';
        if (userHierarchy.parliament) return 'parliament';
        if (userHierarchy.assembly) return 'assembly';
        if (userHierarchy.block) return 'block';
        if (userHierarchy.booth) return 'booth';
        return null;
    };

    // Check if user can access a specific entity
    const canAccessEntity = (level, entityId) => {
        if (!userHierarchy) return true; // No restrictions
        if (!entityId) return true; // No specific entity

        const userEntityId = userHierarchy[level];
        if (!userEntityId) return true; // No restriction at this level

        return userEntityId.toString() === entityId.toString();
    };

    // Refresh permissions (useful after role changes)
    const refreshPermissions = () => {
        fetchUserPermissions();
        fetchUserHierarchy();
    };

    const value = {
        userPermissions,
        userRoles,
        userHierarchy,
        loading,
        error,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        canAccessLevel,
        canAccessEntity,
        getUserHighestLevel,
        refreshPermissions,
        fetchUserPermissions
    };

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    );
};

export default PermissionContext;
