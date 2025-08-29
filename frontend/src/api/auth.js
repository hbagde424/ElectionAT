import axios from 'axios';

// Create axios instance
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.message || error.message || 'An error occurred';
    throw new Error(message);
  }
);

// Auth API
export const authAPI = {
  // Login
  login: async (credentials) => {
    const response = await api.post('/users/login', credentials);
    return response;
  },

  // Get dashboard data
  getDashboard: async () => {
    const response = await api.get('/users/dashboard');
    return response;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/users/me');
    return response;
  },

  // Update profile
  updateProfile: async (data) => {
    const response = await api.put('/users/me', data);
    return response;
  }
};

// User Management API
export const userAPI = {
  // Get all users
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response;
  },

  // Get single user
  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response;
  },

  // Create user
  createUser: async (userData) => {
    const response = await api.post('/users/register', userData);
    return response;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response;
  },

  // Toggle user active status
  toggleUserActive: async (id) => {
    const response = await api.put(`/users/${id}/toggle-active`);
    return response;
  },

  // Get user permissions
  getUserPermissions: async (id) => {
    const response = await api.get(`/users/${id}/permissions`);
    return response;
  },

  // Get user roles
  getUserRoles: async (id) => {
    const response = await api.get(`/users/${id}/roles`);
    return response;
  },

  // Assign role to user
  assignRole: async (id, roleData) => {
    const response = await api.post(`/users/${id}/assign-role`, roleData);
    return response;
  },

  // Remove role from user
  removeRole: async (id, roleData) => {
    const response = await api.delete(`/users/${id}/remove-role`, { data: roleData });
    return response;
  },

  // Get user access report
  getUserAccessReport: async (id) => {
    const response = await api.get(`/users/${id}/access-report`);
    return response;
  }
};

// Role Management API
export const roleAPI = {
  // Get all roles
  getRoles: async () => {
    const response = await api.get('/roles');
    return response;
  },

  // Get single role
  getRole: async (id) => {
    const response = await api.get(`/roles/${id}`);
    return response;
  },

  // Create role
  createRole: async (roleData) => {
    const response = await api.post('/roles', roleData);
    return response;
  },

  // Update role
  updateRole: async (id, roleData) => {
    const response = await api.put(`/roles/${id}`, roleData);
    return response;
  },

  // Delete role
  deleteRole: async (id) => {
    const response = await api.delete(`/roles/${id}`);
    return response;
  },

  // Get role permissions
  getRolePermissions: async (id) => {
    const response = await api.get(`/role-permissions/${id}`);
    return response;
  },

  // Assign permission to role
  assignPermission: async (roleId, permissionId) => {
    const response = await api.post('/roles/assign-permission', { roleId, permissionId });
    return response;
  },

  // Remove permission from role
  removePermission: async (roleId, permissionId) => {
    const response = await api.post('/roles/remove-permission', { roleId, permissionId });
    return response;
  }
};

// Permission Management API
export const permissionAPI = {
  // Get all permissions
  getPermissions: async () => {
    const response = await api.get('/permissions');
    return response;
  },

  // Get single permission
  getPermission: async (id) => {
    const response = await api.get(`/permissions/${id}`);
    return response;
  },

  // Create permission
  createPermission: async (permissionData) => {
    const response = await api.post('/permissions', permissionData);
    return response;
  },

  // Update permission
  updatePermission: async (id, permissionData) => {
    const response = await api.put(`/permissions/${id}`, permissionData);
    return response;
  },

  // Delete permission
  deletePermission: async (id) => {
    const response = await api.delete(`/permissions/${id}`);
    return response;
  }
};

// RBAC Analytics API
export const rbacAPI = {
  // Get RBAC metrics
  getMetrics: async () => {
    const response = await api.get('/users/rbac-metrics');
    return response;
  },

  // Get role-permission matrix
  getRolePermissionMatrix: async () => {
    const response = await api.get('/users/role-permission-matrix');
    return response;
  },

  // Initialize RBAC system
  initializeRBAC: async () => {
    const response = await api.post('/users/init-rbac');
    return response;
  }
};

export default api;
