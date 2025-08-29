import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../api/auth';

// Initial state
const initialState = {
  user: null,
  permissions: [],
  roles: [],
  accessibleScopes: {},
  isAuthenticated: false,
  isLoading: false,
  error: null,
  dashboardData: null
};

// Action types
const RBAC_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_PERMISSIONS: 'SET_PERMISSIONS',
  SET_ROLES: 'SET_ROLES',
  SET_DASHBOARD_DATA: 'SET_DASHBOARD_DATA',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer function
const rbacReducer = (state, action) => {
  switch (action.type) {
    case RBAC_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case RBAC_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false
      };

    case RBAC_ACTIONS.SET_PERMISSIONS:
      return {
        ...state,
        permissions: action.payload
      };

    case RBAC_ACTIONS.SET_ROLES:
      return {
        ...state,
        roles: action.payload
      };

    case RBAC_ACTIONS.SET_DASHBOARD_DATA:
      return {
        ...state,
        dashboardData: action.payload,
        user: action.payload.user,
        permissions: action.payload.permissions,
        roles: action.payload.roles,
        accessibleScopes: action.payload.accessibleScopes,
        isAuthenticated: true,
        isLoading: false
      };

    case RBAC_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case RBAC_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case RBAC_ACTIONS.LOGOUT:
      return {
        ...initialState
      };

    default:
      return state;
  }
};

// Create context
const RBACContext = createContext();

// RBAC Provider component
export const RBACProvider = ({ children }) => {
  const [state, dispatch] = useReducer(rbacReducer, initialState);

  // Load user data on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadDashboardData();
    }
  }, []);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      dispatch({ type: RBAC_ACTIONS.SET_LOADING, payload: true });
      const response = await authAPI.getDashboard();
      dispatch({ type: RBAC_ACTIONS.SET_DASHBOARD_DATA, payload: response.data });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      dispatch({ type: RBAC_ACTIONS.SET_ERROR, payload: error.message });
      // If unauthorized, logout
      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: RBAC_ACTIONS.SET_LOADING, payload: true });
      const response = await authAPI.login(credentials);
      
      // Store token
      localStorage.setItem('token', response.token);
      
      // Load dashboard data
      await loadDashboardData();
      
      return { success: true };
    } catch (error) {
      dispatch({ type: RBAC_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: RBAC_ACTIONS.LOGOUT });
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    return state.permissions.includes(permission);
  };

  // Check if user has specific role
  const hasRole = (roleName) => {
    return state.roles.some(role => role.role === roleName);
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => state.permissions.includes(permission));
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.some(roleName => hasRole(roleName));
  };

  // Check if user can access specific scope
  const canAccessScope = (scopeType, scopeId = null) => {
    const scopeKey = scopeType.toLowerCase() + 's';
    const accessibleScopes = state.accessibleScopes[scopeKey] || [];
    
    if (!scopeId) {
      return accessibleScopes.length > 0;
    }
    
    return accessibleScopes.some(scope => scope.id === scopeId);
  };

  // Get accessible items for a scope type
  const getAccessibleScopes = (scopeType) => {
    const scopeKey = scopeType.toLowerCase() + 's';
    return state.accessibleScopes[scopeKey] || [];
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: RBAC_ACTIONS.CLEAR_ERROR });
  };

  // Update user permissions (after role changes)
  const refreshPermissions = async () => {
    try {
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to refresh permissions:', error);
    }
  };

  const value = {
    // State
    ...state,
    
    // Actions
    login,
    logout,
    loadDashboardData,
    refreshPermissions,
    clearError,
    
    // Permission checkers
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAnyRole,
    canAccessScope,
    getAccessibleScopes
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
};

// Custom hook to use RBAC context
export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

// HOC for permission-based rendering
export const withPermission = (permission) => (Component) => {
  return function PermissionComponent(props) {
    const { hasPermission } = useRBAC();
    
    if (!hasPermission(permission)) {
      return (
        <div className="permission-denied">
          <h3>Access Denied</h3>
          <p>You don't have permission to view this content.</p>
          <p>Required permission: {permission}</p>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};

// HOC for role-based rendering
export const withRole = (roleName) => (Component) => {
  return function RoleComponent(props) {
    const { hasRole } = useRBAC();
    
    if (!hasRole(roleName)) {
      return (
        <div className="access-denied">
          <h3>Access Denied</h3>
          <p>You don't have the required role to view this content.</p>
          <p>Required role: {roleName}</p>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};

export default RBACContext;
