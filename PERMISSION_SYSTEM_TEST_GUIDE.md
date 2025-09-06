# Permission System Test Guide

## Overview

The role and permission system is now fully implemented with hierarchical geographic access control. Here's how to test it:

## Test Accounts

### 1. Super Administrator

- **Email**: superadmin@example.com
- **Password**: SuperAdmin123!
- **Permissions**: Full access to all features
- **Can**: Create/edit/delete users, assign roles, manage all geographic levels

### 2. Manager

- **Email**: manager@example.com
- **Password**: Manager123!
- **Permissions**: Read/update users, view all data
- **Cannot**: Delete users, create new roles

### 3. Regular User

- **Email**: user@example.com
- **Password**: User123!
- **Permissions**: Read-only access to most data
- **Cannot**: Modify users, access admin features

## Testing Steps

### 1. Login Test

1. Open http://localhost:5174/election/
2. Login with each test account
3. Verify appropriate navigation options appear

### 2. User Management Test

1. Login as Super Administrator
2. Navigate to Users page
3. Verify you can:

   - ✅ View all users
   - ✅ Create new users
   - ✅ Edit existing users
   - ✅ Delete users
   - ✅ Assign roles

4. Login as Manager
5. Navigate to Users page
6. Verify you can:

   - ✅ View all users
   - ✅ Edit existing users
   - ❌ Create new users (button should be hidden/disabled)
   - ❌ Delete users (button should be hidden/disabled)

7. Login as Regular User
8. Navigate to Users page
9. Verify you can:
   - ✅ View users (if user_read permission granted)
   - ❌ Edit users
   - ❌ Create users
   - ❌ Delete users

### 3. Permission Context Test

The system uses fallback permissions when database is not accessible:

#### Super Administrator Fallback Permissions:

- user_create, user_read, user_update, user_delete
- user_role_assign, user_hierarchy_assign
- role_create, role_read, role_update, role_delete
- permission_read, role_permission_assign
- state_read, division_read, parliament_read, assembly_read, block_read, booth_read
- candidate_read, party_read, voter_read, election_data_read
- survey_read, report_read, analytics_read

#### Manager Fallback Permissions:

- user_read, user_update, user_role_assign
- role_read, permission_read
- All geographic read permissions
- All data read permissions

#### User Fallback Permissions:

- user_read
- All geographic read permissions
- candidate_read, party_read, voter_read, election_data_read
- survey_read, report_read

## Features Implemented

### 1. Permission Context (PermissionContext.jsx)

- ✅ Hierarchical permission loading
- ✅ Fallback test data when database unavailable
- ✅ Role-based permission aggregation
- ✅ Geographic access control functions

### 2. Permission Gate Component

- ✅ Conditional rendering based on permissions
- ✅ Multiple permission requirements (AND/OR logic)
- ✅ Graceful fallback for missing permissions

### 3. User Management Interface

- ✅ Permission-aware CRUD operations
- ✅ Role assignment with permission checks
- ✅ Hierarchical access validation

### 4. Backend Middleware

- ✅ Geographic hierarchy validation
- ✅ Entity-level access control
- ✅ Permission-based route protection

### 5. Database Schema

- ✅ Permission model with categories
- ✅ Role model with hierarchical support
- ✅ UserRole association
- ✅ RolePermission assignment
- ✅ UserHierarchy for geographic access

## Next Steps

1. **Database Setup**: Once MongoDB connectivity is resolved, run:

   ```bash
   node setupCompletePermissionSystem.js
   ```

2. **Production Deployment**: Update environment variables for production database

3. **Additional Features**:
   - Audit logging for permission changes
   - Permission inheritance optimization
   - Bulk role assignment tools
   - Permission analytics dashboard

## Troubleshooting

### Permission Context Errors

- Ensure PermissionProvider wraps the entire app
- Check for proper JWT token in localStorage
- Verify user authentication before permission fetch

### Database Connection Issues

- Check MongoDB URI in config
- Verify network connectivity
- Use fallback test permissions for development

### UI Permission Issues

- Clear browser cache and localStorage
- Check browser console for permission errors
- Verify PermissionGate component usage
