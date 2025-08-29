# RBAC System Installation and Setup Guide

## 📋 Overview

This comprehensive Role-Based Access Control (RBAC) system for the Election Management System provides:

- **Complete User Management** with hierarchical scope control
- **Dynamic Role and Permission Management**
- **Real-time Permission Checking** and Authorization
- **Material-UI Based Modern Interface**
- **Secure JWT Authentication**
- **MongoDB Integration** with optimized queries

## 🚀 Installation Steps

### 1. Install Required Dependencies

**Frontend Dependencies:**
```bash
cd frontend
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install @mui/lab @mui/x-date-pickers
npm install axios react-router-dom
npm install @mui/system
```

**Backend Dependencies (if not already installed):**
```bash
cd Backend
npm install jsonwebtoken bcryptjs mongoose cors express
npm install dotenv helmet morgan compression
```

### 2. Backend Setup

The RBAC backend system is already implemented with the following components:

**Models:**
- `models/User.js` - Enhanced with RBAC methods
- `models/Role.js` - Role management
- `models/Permission.js` - Permission definitions
- `models/UserRole.js` - User-role assignments
- `models/RolePermission.js` - Role-permission mappings

**Controllers:**
- `controllers/rbacMetricsController.js` - Analytics and metrics
- Enhanced `controllers/authController.js` - Authentication with RBAC
- Enhanced `controllers/userController.js` - User management with RBAC

**Utilities:**
- `utils/rbac.js` - Core RBAC service functions
- Enhanced `middlewares/auth.js` - Permission-based middleware

### 3. Frontend Integration

**Step 1: Add RBAC Context to Your App**

Update your main App component or create a new RBAC section:

```jsx
// src/App.jsx - Add RBAC routes
import RBACApp from './rbac/RBACApp';

// Add this route to your existing router
<Route path="/rbac/*" element={<RBACApp />} />
```

**Step 2: Access the RBAC System**

Navigate to: `http://localhost:3000/rbac`

**Step 3: Demo Login Credentials**

Use these demo credentials to test the system:

- **Super Admin**: `admin` / `admin123`
- **State Admin**: `state_admin` / `state123`  
- **Booth Officer**: `booth_officer` / `booth123`

## 🎯 Features and Usage

### 1. User Management

**Access:** `/rbac/dashboard/users`
**Required Permission:** `user.read`

Features:
- Create, edit, delete users
- Assign/remove roles
- View user permissions
- Filter by role and search
- Bulk operations

### 2. Role Management

**Access:** `/rbac/dashboard/roles`
**Required Permission:** `role.read`

Features:
- Create custom roles
- Assign permissions to roles
- Role hierarchy management
- Permission matrix view

### 3. Permission System

**Hierarchical Scopes:**
- State → Division → Parliament/Assembly → Block → Booth

**Permission Types:**
- `read` - View access
- `create` - Creation rights
- `update` - Modification rights
- `delete` - Deletion rights
- `manage` - Full administrative access

### 4. Real-time Authorization

**Permission Guards:**
```jsx
<PermissionGuard permission="user.create">
  <CreateUserButton />
</PermissionGuard>

<RoleGuard role="superAdmin">
  <AdminPanel />
</RoleGuard>
```

**Hook Usage:**
```jsx
const { hasPermission, hasRole, user } = useRBAC();

if (hasPermission('user.delete')) {
  // Show delete button
}
```

## 🔧 Configuration

### 1. Environment Variables

Add to your `.env` file:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=24h

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/election_management

# API Configuration
API_BASE_URL=http://localhost:5000/api
```

### 2. API Integration

The system uses these main API endpoints:

```
Authentication:
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
GET  /api/auth/me

User Management:
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
GET    /api/users/:id/permissions
POST   /api/users/:id/assign-role
DELETE /api/users/:id/remove-role

Role Management:
GET    /api/roles
POST   /api/roles
PUT    /api/roles/:id
DELETE /api/roles/:id
GET    /api/roles/:id/permissions
PUT    /api/roles/:id/permissions

RBAC Metrics:
GET /api/rbac/metrics
GET /api/rbac/role-permission-matrix
GET /api/rbac/user-access-report
```

## 🛡️ Security Features

### 1. JWT Token Security
- Secure token generation with expiration
- Automatic token refresh
- Token blacklisting support

### 2. Permission Validation
- Real-time permission checking
- Scope-based authorization
- Hierarchical access control

### 3. Data Protection
- Password hashing with bcrypt
- SQL injection prevention
- XSS protection headers

## 📊 System Architecture

### 1. Database Schema

```
Users Collection:
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  role: String,
  state_ids: [ObjectId],
  division_ids: [ObjectId],
  // ... other scope fields
  isActive: Boolean,
  created_at: Date
}

Roles Collection:
{
  _id: ObjectId,
  name: String,
  description: String,
  isActive: Boolean,
  created_at: Date
}

Permissions Collection:
{
  _id: ObjectId,
  name: String, // e.g., "user.create"
  description: String,
  resource: String, // e.g., "user"
  action: String, // e.g., "create"
  created_at: Date
}

UserRole Collection:
{
  _id: ObjectId,
  user_id: ObjectId,
  role_id: ObjectId,
  assigned_at: Date,
  assigned_by: ObjectId
}

RolePermission Collection:
{
  _id: ObjectId,
  role_id: ObjectId,
  permission_id: ObjectId,
  assigned_at: Date
}
```

### 2. Component Structure

```
src/
├── contexts/
│   └── RBACContext.jsx          # Global RBAC state management
├── components/
│   ├── auth/
│   │   └── Login.jsx            # Authentication component
│   └── rbac/
│       ├── RBACLayout.jsx       # Main layout with navigation
│       ├── RBACDashboard.jsx    # Dashboard overview
│       ├── UserManagement.jsx   # User CRUD operations
│       ├── RoleManagement.jsx   # Role CRUD operations
│       ├── Guards.jsx           # Permission guard components
│       ├── UserRoleDialog.jsx   # User role assignment
│       └── UserPermissionsDialog.jsx # User permissions view
├── api/
│   └── auth.js                  # API service layer
└── rbac/
    └── RBACApp.jsx             # RBAC application wrapper
```

## 🔍 Testing the System

### 1. Start the Backend Server

```bash
cd Backend
npm start
# Server should start on http://localhost:5000
```

### 2. Start the Frontend

```bash
cd frontend
npm start
# Frontend should start on http://localhost:3000
```

### 3. Initialize Default Data

The system automatically creates default roles and permissions on first startup:

**Default Roles:**
- `superAdmin` - Full system access
- `State` - State-level access
- `Division` - Division-level access
- `Parliament` - Parliament constituency access
- `Assembly` - Assembly constituency access
- `Block` - Block-level access
- `Booth` - Booth-level access

**Default Permissions:**
- User management: `user.read`, `user.create`, `user.update`, `user.delete`
- Role management: `role.read`, `role.create`, `role.update`, `role.delete`
- Permission management: `permission.read`, `permission.create`, `permission.update`, `permission.delete`
- And many more for each resource type...

### 4. Test User Flows

1. **Login as Super Admin**
   - Access all features
   - Create new roles and permissions
   - Manage all users

2. **Login as State Admin**
   - Manage users within state scope
   - Limited role assignment capabilities

3. **Login as Booth Officer**
   - View booth-specific data only
   - Read-only access to most features

## 🚨 Troubleshooting

### Common Issues:

1. **"Permission Denied" Errors**
   - Check if user has required permissions
   - Verify role assignments
   - Check permission middleware

2. **API Connection Issues**
   - Verify backend server is running
   - Check API base URL in frontend
   - Verify CORS configuration

3. **Login Issues**
   - Check JWT secret configuration
   - Verify user exists in database
   - Check password hashing

4. **MongoDB Connection**
   - Ensure MongoDB is running
   - Check connection string
   - Verify database permissions

### Debug Mode:

Enable debug logging by adding:

```javascript
// In RBACContext.jsx
const DEBUG_MODE = true;

if (DEBUG_MODE) {
  console.log('RBAC Debug:', { user, permissions, roles });
}
```

## 📈 Performance Optimization

### 1. Database Indexes

```javascript
// Add these indexes for better performance
db.users.createIndex({ "username": 1 })
db.users.createIndex({ "email": 1 })
db.userRole.createIndex({ "user_id": 1, "role_id": 1 })
db.rolePermission.createIndex({ "role_id": 1, "permission_id": 1 })
```

### 2. Frontend Optimization

- Permission checks are memoized
- API responses are cached
- Lazy loading for heavy components

## 🔮 Future Enhancements

Planned features for the next version:

1. **Advanced Analytics Dashboard**
2. **Permission Audit Logging**
3. **Role Templates and Presets**
4. **Bulk User Import/Export**
5. **API Rate Limiting**
6. **Multi-tenant Support**
7. **Advanced Scope Management UI**
8. **Real-time Notifications**

## 📞 Support

For questions or issues:

1. Check the troubleshooting section
2. Review API documentation
3. Check browser console for errors
4. Verify backend logs

---

**🎉 Your RBAC System is now ready for production use!**

The system provides enterprise-grade security with an intuitive interface for managing users, roles, and permissions in your Election Management System.
