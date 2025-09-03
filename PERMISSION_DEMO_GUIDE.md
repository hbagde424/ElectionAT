# Permission System Demo Script

## Overview

This script demonstrates how to test the comprehensive permission system implemented for the ElectionAT application.

## Prerequisites

1. Backend server running on port 3001
2. Frontend server running on port 3000
3. Test user created with proper role assignments (using createTestUser.js)

## Testing Steps

### 1. Backend Setup

```bash
cd Backend
npm start
```

### 2. Create Test Data (if not already done)

```bash
node createTestUser.js
```

### 3. Frontend Setup

```bash
cd ../frontend
npm start
```

### 4. Permission System Testing

#### A. Login with Test User

- Navigate to login page
- Use credentials from createTestUser.js
- Verify user data is stored in localStorage

#### B. Navigation Menu Testing

- **Expected**: Only menu items with proper permissions are visible
- **Test**: Different users should see different menu options
- **Components**: PermissionNavGroup filters menu items based on user permissions

#### C. CRUD Operations Testing

##### State Management Page

1. Navigate to `/state` page
2. **Add Button**: Should be visible only if user has `state_create` permission
3. **Edit Icons**: Should be enabled only if user has `state_update` permission
4. **Delete Icons**: Should be enabled only if user has `state_delete` permission
5. **View/Expand**: Should work if user has `state_read` permission

##### Permission Matrix Page

1. Navigate to `/Matrics` page
2. **Tab Visibility**: Different tabs should be visible based on permissions:
   - Role-Permission Matrix: `matrix_read`
   - Manage Permissions: `permission_manage`
   - Assign Roles: `user_role_assign`
3. **Checkbox Controls**: Should be disabled if user lacks `role_permission_manage`

#### D. Permission-based UI Feedback

- **Disabled Buttons**: Should show tooltips explaining why action is restricted
- **Hidden Elements**: Elements without permission should not render at all
- **Graceful Degradation**: Pages should still function with limited permissions

### 5. Permission Scenarios to Test

#### Scenario 1: Admin User

- Should see all menu items
- Should have access to all CRUD operations
- Should be able to modify permission matrix

#### Scenario 2: Limited User

- Should see only permitted menu items
- CRUD buttons should be disabled/hidden appropriately
- Should receive clear feedback about restrictions

#### Scenario 3: Read-only User

- Should see data but no edit/delete buttons
- Add buttons should be hidden
- Permission matrix should be view-only

### 6. Component Integration Examples

#### Using PermissionButton

```jsx
<PermissionButton
  variant="contained"
  startIcon={<Add />}
  requiredPermission="state_create"
  onClick={handleAdd}
  tooltipTitle="Add new state"
>
  Add State
</PermissionButton>
```

#### Using PermissionGate

```jsx
<PermissionGate requiredPermission="state_read">
  <DataTable data={states} />
</PermissionGate>
```

#### Using CrudActions

```jsx
<CrudActions
  entityName="State"
  row={row}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onView={handleView}
/>
```

### 7. Expected Behaviors

#### Navigation

- Menu items without permissions: Hidden
- Menu groups with no accessible children: Hidden
- Permission-based routing: Accessible pages only

#### CRUD Operations

- Create: Add buttons hidden if no `{entity}_create` permission
- Read: Data hidden if no `{entity}_read` permission
- Update: Edit buttons disabled if no `{entity}_update` permission
- Delete: Delete buttons disabled if no `{entity}_delete` permission

#### User Feedback

- Disabled buttons show reason in tooltip
- Missing permissions show appropriate messages
- Loading states while checking permissions

### 8. Troubleshooting

#### Common Issues

1. **Permissions not loading**: Check PermissionContext is wrapping components
2. **All buttons disabled**: Verify user has valid permissions in database
3. **Menu items not filtering**: Ensure menuPermissions.js mappings are correct

#### Debug Tools

1. Check browser localStorage for user data
2. Monitor network requests to permission endpoints
3. Use React DevTools to inspect PermissionContext state

### 9. Extending the System

#### Adding New Permissions

1. Add permission to `menuPermissions.js`
2. Update database with new permission record
3. Assign permission to appropriate roles

#### Creating New Permission-Aware Components

1. Use `usePermissions()` hook
2. Implement permission checks with `hasPermission()`
3. Provide user feedback for restricted actions

## Demo Success Criteria

- ✅ Navigation menus filter based on permissions
- ✅ CRUD buttons respect permission restrictions
- ✅ User receives clear feedback about limitations
- ✅ System maintains consistent UX across all pages
- ✅ Performance remains good with permission checks
