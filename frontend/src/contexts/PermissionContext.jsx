// contexts/PermissionContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosServices from 'utils/axios';

const PermissionContext = createContext();

export const usePermissions = () => {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error('usePermissions must be used within a PermissionProvider');
    }
    return context;
};

export const PermissionProvider = ({ children }) => {
    const [userPermissions, setUserPermissions] = useState([]);
    const [userRoles, setUserRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get current user from localStorage or your auth context
    const getCurrentUser = () => {
        try {
            const userData = localStorage.getItem('user');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    };

    useEffect(() => {
        fetchUserPermissions();
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
            setError('Failed to load user permissions');
            setUserPermissions([]);
        } finally {
            setLoading(false);
        }
    };

    // Check if user has a specific permission
    const hasPermission = (permissionName) => {
        if (!permissionName) return false;
        return userPermissions.includes(permissionName);
    };

    // Check if user has any of the specified permissions
    const hasAnyPermission = (permissionNames) => {
        if (!Array.isArray(permissionNames)) return false;
        return permissionNames.some(permission => hasPermission(permission));
    };

    // Check if user has all of the specified permissions
    const hasAllPermissions = (permissionNames) => {
        if (!Array.isArray(permissionNames)) return false;
        return permissionNames.every(permission => hasPermission(permission));
    };

    // Check if user has a specific role
    const hasRole = (roleName) => {
        if (!roleName) return false;
        return userRoles.some(userRole =>
            userRole.role && userRole.role.name === roleName
        );
    };

    const value = {
        userPermissions,
        userRoles,
        loading,
        error,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        refreshPermissions: fetchUserPermissions
    };

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    );
};

export default PermissionContext;
