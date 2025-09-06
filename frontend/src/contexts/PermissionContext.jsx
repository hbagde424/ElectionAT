// contexts/PermissionContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosServices from 'utils/axios';

const PermissionContext = createContext();

export const usePermissions = () => {
    const context = useContext(PermissionContext);
    if (!context) {
        // For development, log the error but provide default values
        console.warn('usePermissions must be used within a PermissionProvider. Falling back to default values.');

        // Return default values to prevent crashes during development
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

    // Get current user from localStorage or your auth context
    const getCurrentUser = () => {
        try {
            const userData = localStorage.getItem('user');
            const user = userData ? JSON.parse(userData) : null;
            return user;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    };

    useEffect(() => {
        // Add a small delay to ensure authentication context is ready
        const timer = setTimeout(() => {
            fetchUserPermissions();
            fetchUserHierarchy();
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const fetchUserPermissions = async () => {
        try {
            setLoading(true);
            const currentUser = getCurrentUser();

            if (!currentUser || !currentUser._id) {
                console.log('No user found, skipping permission fetch');
                setLoading(false);
                return;
            }

            // Fetch user roles
            const userRolesRes = await axiosServices.get(`/user-roles/user/${currentUser._id}`);
            const roles = userRolesRes.data.data || [];
            setUserRoles(roles);

            // Extract permissions from roles
            const permissions = new Set();

            for (const userRole of roles) {
                if (userRole.role && userRole.role._id) {
                    try {
                        const rolePermissionsRes = await axiosServices.get(`/role-permissions/${userRole.role._id}`);
                        const rolePermissions = rolePermissionsRes.data || [];

                        rolePermissions.forEach(permission => {
                            if (permission && permission.name) {
                                permissions.add(permission.name);
                            }
                        });
                    } catch (error) {
                        console.error(`Error fetching permissions for role ${userRole.role._id}:`, error);
                    }
                }
            }

            setUserPermissions(Array.from(permissions));
            setError(null);
        } catch (error) {
            console.error('Error fetching user permissions:', error);

            // Fallback to test permissions based on user email
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.email) {
                console.log('Using test permissions for:', currentUser.email);
                const testPermissions = getTestPermissions(currentUser.email);
                setUserPermissions(testPermissions);
                setUserRoles([{ role: { name: getTestRole(currentUser.email) } }]);
                setError('Using test permissions - database not available');
            } else {
                setError('Failed to load user permissions');
                setUserPermissions([]);
            }
        } finally {
            setLoading(false);
        }
    };

    // Test permission fallback
    const getTestPermissions = (email) => {
        const testPermissionSets = {
            'superadmin@example.com': [
                'user_create', 'user_read', 'user_update', 'user_delete',
                'user_role_assign', 'user_hierarchy_assign',
                'role_create', 'role_read', 'role_update', 'role_delete',
                'permission_read', 'role_permission_assign',
                'state_read', 'division_read', 'parliament_read', 'assembly_read', 'block_read', 'booth_read',
                'candidate_read', 'party_read', 'voter_read', 'election_data_read',
                'survey_read', 'report_read', 'analytics_read'
            ],
            'manager@example.com': [
                'user_read', 'user_update', 'user_role_assign',
                'role_read', 'permission_read',
                'state_read', 'division_read', 'parliament_read', 'assembly_read', 'block_read', 'booth_read',
                'candidate_read', 'party_read', 'voter_read', 'election_data_read',
                'survey_read', 'report_read', 'analytics_read'
            ],
            'user@example.com': [
                'user_read',
                'state_read', 'division_read', 'parliament_read', 'assembly_read', 'block_read', 'booth_read',
                'candidate_read', 'party_read', 'voter_read', 'election_data_read',
                'survey_read', 'report_read'
            ]
        };

        return testPermissionSets[email] || ['user_read'];
    };

    const getTestRole = (email) => {
        const testRoles = {
            'superadmin@example.com': 'Super Administrator',
            'manager@example.com': 'Manager',
            'user@example.com': 'User'
        };

        return testRoles[email] || 'User';
    };

    const fetchUserHierarchy = async () => {
        try {
            const currentUser = getCurrentUser();
            if (!currentUser || !currentUser._id) {
                return;
            }

            const response = await axiosServices.get(`/user-hierarchy/${currentUser._id}`);
            const hierarchyData = response.data?.data || response.data;
            setUserHierarchy(hierarchyData);
        } catch (error) {
            console.error('Error fetching user hierarchy:', error);
            setUserHierarchy(null);
        }
    };

    // Check if user has a specific permission
    const hasPermission = (permissionName) => {
        if (!permissionName) return false;

        // Grant all permissions to Super Admin
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.email === 'superadmin@example.com') {
            return true;
        }

        return userPermissions.includes(permissionName);
    };

    // Check if user has any of the specified permissions
    const hasAnyPermission = (permissionNames) => {
        if (!Array.isArray(permissionNames)) return false;

        // Grant all permissions to Super Admin
        const currentUser = getCurrentUser();

        if (currentUser && currentUser.email === 'superadmin@example.com') {
            return true;
        }

        const result = permissionNames.some(permission => hasPermission(permission));
        return result;
    };

    // Check if user has all of the specified permissions
    const hasAllPermissions = (permissionNames) => {
        if (!Array.isArray(permissionNames)) return false;

        // Grant all permissions to Super Admin
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.email === 'superadmin@example.com') {
            return true;
        }

        return permissionNames.every(permission => hasPermission(permission));
    };

    // Check if user has a specific role
    const hasRole = (roleName) => {
        if (!roleName) return false;
        return userRoles.some(userRole =>
            userRole.role && userRole.role.name === roleName
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

        // User can access their level and all levels below
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

