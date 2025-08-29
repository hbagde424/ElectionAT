# RBAC System Implementation Guide

## Overview
यह एक complete Role-Based Access Control (RBAC) system है जो आपके Election Management System के लिए बनाया गया है।

## Key Components

### 1. Models
- **User.js**: Enhanced with RBAC methods
- **Role.js**: Role definitions
- **Permission.js**: Permission definitions
- **RolePermission.js**: Many-to-many relationship between roles and permissions
- **UserRole.js**: User role assignments with scope

### 2. Services
- **utils/rbac.js**: Core RBAC service with helper methods
- **middlewares/auth.js**: Enhanced authentication and authorization middlewares

### 3. Controllers
- **userController.js**: Enhanced with RBAC functionality

## Setup Instructions

### Step 1: Initialize RBAC System
```bash
# Run the initialization script
node init-rbac.js
```

यह script निम्नलिखित काम करेगा:
- Default roles और permissions create करेगा
- Role-permission mappings setup करेगा
- SuperAdmin user बनाएगा

### Step 2: Default Credentials
```
Email: admin@electionat.com
Password: admin123
```
⚠️ **Important**: पहली login के बाद password change करें!

## Usage Examples

### 1. API Endpoints

#### Authentication
```bash
# Login
POST /api/users/login
{
  "email": "admin@electionat.com",
  "password": "admin123"
}
```

#### Get Dashboard Data
```bash
# Get user dashboard with roles and permissions
GET /api/users/dashboard
Headers: Authorization: Bearer <token>
```

#### Assign Role to User
```bash
# Assign role with scope
POST /api/users/:userId/assign-role
{
  "roleId": "role_id_here",
  "scopeType": "State",
  "scopeId": "state_id_here"
}
```

### 2. Middleware Usage in Routes

#### Permission-based Protection
```javascript
const { requirePermission } = require('../middlewares/auth');

// Only users with 'booth.read' permission can access
router.get('/booths', protect, requirePermission('booth.read'), getBooths);

// Permission with scope validation
router.get('/booths/:boothId', protect, requirePermission('booth.read', 'Booth'), getBooth);
```

#### Role-based Protection
```javascript
const { requireRole } = require('../middlewares/auth');

// Only StateAdmin can access
router.get('/state-reports', protect, requireRole('StateAdmin'), getStateReports);
```

#### Combined Protection
```javascript
// Multiple protection layers
router.post('/booths', 
  protect, 
  requirePermission('booth.create'), 
  requireScope('Booth'),
  createBooth
);
```

### 3. User Model Methods

#### Check User Permissions
```javascript
// In controller
const user = await User.findById(userId);

// Check if user has specific permission
const canRead = await user.hasPermission('booth.read');
const canReadInState = await user.hasPermission('booth.read', 'State');

// Get all user permissions
const permissions = await user.getPermissions();
console.log(permissions.permissions); // Array of permission names
console.log(permissions.rolePermissions); // Detailed role-permission mapping
```

#### Get User Roles
```javascript
const userRoles = await user.getUserRoles();
// Returns roles with scope information
```

### 4. RBAC Service Methods

#### Check Permission Programmatically
```javascript
const RBACService = require('../utils/rbac');

// Check if user has permission for specific scope
const hasPermission = await RBACService.checkUserPermission(
  userId, 
  'booth.update', 
  'Booth', 
  boothId
);
```

#### Assign Role to User
```javascript
await RBACService.assignRoleToUser(
  userId, 
  'BoothAdmin', 
  'Booth', 
  boothId
);
```

## Default Roles और Permissions

### Roles Hierarchy
1. **SuperAdmin** - All permissions
2. **StateAdmin** - State level management
3. **DivisionAdmin** - Division level management
4. **ParliamentAdmin** - Parliament level management
5. **AssemblyAdmin** - Assembly level management
6. **BlockAdmin** - Block level management
7. **BoothAdmin** - Booth level management
8. **BoothUser** - Read-only booth access

### Permission Categories
- **user.*** - User management
- **role.*** - Role management
- **booth.*** - Booth operations
- **assembly.*** - Assembly operations
- **parliament.*** - Parliament operations
- **division.*** - Division operations
- **block.*** - Block operations
- **reports.view** - Report access
- **analytics.view** - Analytics access
- **system.admin** - System administration

## How to Use in Your Application

### 1. Protect Routes
```javascript
// In your route files
const { protect, requirePermission, requireRole } = require('../middlewares/auth');

// Basic authentication
router.get('/protected', protect, controller);

// Permission-based
router.get('/booths', protect, requirePermission('booth.read'), getBooths);

// Role-based
router.get('/admin-panel', protect, requireRole('StateAdmin'), getAdminPanel);
```

### 2. Frontend Integration
```javascript
// Get user dashboard data
const response = await fetch('/api/users/dashboard', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const dashboardData = await response.json();
// Use dashboardData.permissions to show/hide UI elements
// Use dashboardData.accessibleScopes to filter data
```

### 3. Dynamic UI Based on Permissions
```javascript
// Example: Show/hide buttons based on permissions
if (userPermissions.includes('booth.create')) {
  // Show create booth button
}

if (userPermissions.includes('booth.update')) {
  // Show edit booth button
}
```

## Best Practices

### 1. Always Use Middlewares
```javascript
// ❌ Don't check permissions manually in controllers
exports.createBooth = async (req, res) => {
  // Manual permission check - not recommended
  if (!await req.user.hasPermission('booth.create')) {
    return res.status(403).json({ message: 'Access denied' });
  }
  // ... rest of the logic
};

// ✅ Use middleware instead
router.post('/booths', protect, requirePermission('booth.create'), createBooth);
```

### 2. Scope-based Access Control
```javascript
// For scope-specific operations
router.get('/booths/:boothId', 
  protect, 
  requirePermission('booth.read'), 
  requireScope('Booth'), 
  getBooth
);
```

### 3. Error Handling
सभी RBAC operations में proper error handling करें:
```javascript
try {
  const hasPermission = await user.hasPermission('booth.read');
  // ... logic
} catch (error) {
  console.error('Permission check failed:', error);
  return res.status(500).json({ message: 'Authorization check failed' });
}
```

## Frontend Dashboard Implementation

### User Dashboard Component
```javascript
useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/users/dashboard');
      const data = await response.json();
      setUserData(data.data);
      setPermissions(data.data.permissions);
      setAccessibleScopes(data.data.accessibleScopes);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };
  
  fetchDashboardData();
}, []);
```

### Permission-based Component Rendering
```javascript
const BoothManagement = () => {
  const { permissions } = useAuth();
  
  return (
    <div>
      {permissions.includes('booth.read') && (
        <BoothList />
      )}
      
      {permissions.includes('booth.create') && (
        <CreateBoothButton />
      )}
      
      {permissions.includes('booth.update') && (
        <EditBoothButton />
      )}
    </div>
  );
};
```

यह comprehensive RBAC system आपको complete control देता है अपने users और उनके permissions पर। आप इसे अपनी जरूरतों के अनुसार customize कर सकते हैं।
