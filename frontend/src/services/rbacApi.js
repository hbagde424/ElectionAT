// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// API Service for RBAC
class RBACApiService {
  constructor() {
    this.testConnection();
  }

  // Test API connection
  async testConnection() {
    try {
      // Use stats endpoint for testing as it's public
      const response = await fetch(`${API_BASE_URL}/users/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend API is available', data.data);
        localStorage.setItem('api_status', 'connected');
        return true;
      }
      throw new Error('API not responding');
    } catch (error) {
      console.log('❌ Backend API connection failed:', error.message);
      localStorage.setItem('api_status', 'disconnected');
      return false;
    }
  }

  // Check if API is connected
  isConnected() {
    return localStorage.getItem('api_status') === 'connected';
  }

  // Helper method for API calls
  async apiCall(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if token exists
        ...(localStorage.getItem('rbac_token') && {
          'Authorization': `Bearer ${localStorage.getItem('rbac_token')}`
        })
      },
      ...options
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Call Error:', error);
      throw error;
    }
  }

  // Authentication APIs
  async login(credentials) {
    return this.apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.username, // Map username to email
        password: credentials.password
      })
    });
  }

  async register(userData) {
    return this.apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async logout() {
    return this.apiCall('/auth/logout', {
      method: 'POST'
    });
  }

  async getCurrentUser() {
    return this.apiCall('/auth/me');
  }

  // User Management APIs
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/users${queryString ? `?${queryString}` : ''}`);
  }

  async getUserById(userId) {
    return this.apiCall(`/users/${userId}`);
  }

  async createUser(userData) {
    return this.apiCall('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateUser(userId, userData) {
    return this.apiCall(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(userId) {
    return this.apiCall(`/users/${userId}`, {
      method: 'DELETE'
    });
  }

  async getDashboardStats() {
    return this.apiCall('/users/stats');
  }

  async toggleUserStatus(userId) {
    return this.apiCall(`/users/${userId}/toggle-active`, {
      method: 'PUT'
    });
  }

  async assignRole(userId, roleId) {
    return this.apiCall(`/users/${userId}/assign-role`, {
      method: 'PATCH',
      body: JSON.stringify({ roleId })
    });
  }

  // Role Management APIs
  async getRoles(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/roles${queryString ? `?${queryString}` : ''}`);
  }

  async getRoleById(roleId) {
    return this.apiCall(`/roles/${roleId}`);
  }

  async createRole(roleData) {
    return this.apiCall('/roles', {
      method: 'POST',
      body: JSON.stringify(roleData)
    });
  }

  async updateRole(roleId, roleData) {
    return this.apiCall(`/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(roleData)
    });
  }

  async deleteRole(roleId) {
    return this.apiCall(`/roles/${roleId}`, {
      method: 'DELETE'
    });
  }

  async toggleRoleStatus(roleId) {
    return this.apiCall(`/roles/${roleId}/toggle-status`, {
      method: 'PATCH'
    });
  }

  // Permission Management APIs
  async getPermissions() {
    return this.apiCall('/permissions');
  }

  async getPermissionsByRole(roleId) {
    return this.apiCall(`/roles/${roleId}/permissions`);
  }

  async assignPermissionsToRole(roleId, permissionIds) {
    return this.apiCall(`/roles/${roleId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissionIds })
    });
  }

  async removePermissionFromRole(roleId, permissionId) {
    return this.apiCall(`/roles/${roleId}/permissions/${permissionId}`, {
      method: 'DELETE'
    });
  }

  // Dashboard & Analytics APIs
  async getDashboardStats() {
    return this.apiCall('/users/dashboard');
  }

  async getUserStats() {
    return this.apiCall('/users/rbac-metrics');
  }

  async getRoleStats() {
    return this.apiCall('/users/role-permission-matrix');
  }

  async getSystemLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/logs${queryString ? `?${queryString}` : ''}`);
  }

  // Hierarchy Management APIs
  async getHierarchy() {
    return this.apiCall('/hierarchy');
  }

  async getUsersByHierarchy(hierarchyLevel, hierarchyId) {
    return this.apiCall(`/hierarchy/${hierarchyLevel}/${hierarchyId}/users`);
  }

  // Utility Methods
  setAuthToken(token) {
    if (token) {
      localStorage.setItem('rbac_token', token);
    } else {
      localStorage.removeItem('rbac_token');
    }
  }

  getAuthToken() {
    return localStorage.getItem('rbac_token');
  }

  clearAuthToken() {
    localStorage.removeItem('rbac_token');
  }

  isAuthenticated() {
    return !!this.getAuthToken();
  }
}

// Create and export singleton instance
const rbacApiService = new RBACApiService();
export default rbacApiService;

// Named exports for convenience
export const {
  login,
  register,
  logout,
  getCurrentUser,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  assignRole,
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  toggleRoleStatus,
  getPermissions,
  getPermissionsByRole,
  assignPermissionsToRole,
  removePermissionFromRole,
  getDashboardStats,
  getUserStats,
  getRoleStats,
  getSystemLogs,
  getHierarchy,
  getUsersByHierarchy,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  isAuthenticated
} = rbacApiService;
