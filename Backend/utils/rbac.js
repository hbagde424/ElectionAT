const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const RolePermission = require('../models/RolePermission');
const UserRole = require('../models/UserRole');

class RBACService {
  // Initialize default roles and permissions
  static async initializeDefaultData() {
    try {
      // Default Permissions
      const defaultPermissions = [
        // User Management
        { name: 'user.create', description: 'Create users', level: 'State' },
        { name: 'user.read', description: 'View users', level: 'State' },
        { name: 'user.update', description: 'Update users', level: 'State' },
        { name: 'user.delete', description: 'Delete users', level: 'State' },
        
        // Role Management
        { name: 'role.create', description: 'Create roles', level: 'State' },
        { name: 'role.read', description: 'View roles', level: 'State' },
        { name: 'role.update', description: 'Update roles', level: 'State' },
        { name: 'role.delete', description: 'Delete roles', level: 'State' },
        
        // Booth Management
        { name: 'booth.create', description: 'Create booths', level: 'Booth' },
        { name: 'booth.read', description: 'View booths', level: 'Booth' },
        { name: 'booth.update', description: 'Update booths', level: 'Booth' },
        { name: 'booth.delete', description: 'Delete booths', level: 'Booth' },
        
        // Assembly Management
        { name: 'assembly.create', description: 'Create assemblies', level: 'Assembly' },
        { name: 'assembly.read', description: 'View assemblies', level: 'Assembly' },
        { name: 'assembly.update', description: 'Update assemblies', level: 'Assembly' },
        { name: 'assembly.delete', description: 'Delete assemblies', level: 'Assembly' },
        
        // Parliament Management
        { name: 'parliament.create', description: 'Create parliaments', level: 'Parliament' },
        { name: 'parliament.read', description: 'View parliaments', level: 'Parliament' },
        { name: 'parliament.update', description: 'Update parliaments', level: 'Parliament' },
        { name: 'parliament.delete', description: 'Delete parliaments', level: 'Parliament' },
        
        // Division Management
        { name: 'division.create', description: 'Create divisions', level: 'Division' },
        { name: 'division.read', description: 'View divisions', level: 'Division' },
        { name: 'division.update', description: 'Update divisions', level: 'Division' },
        { name: 'division.delete', description: 'Delete divisions', level: 'Division' },
        
        // Block Management
        { name: 'block.create', description: 'Create blocks', level: 'Block' },
        { name: 'block.read', description: 'View blocks', level: 'Block' },
        { name: 'block.update', description: 'Update blocks', level: 'Block' },
        { name: 'block.delete', description: 'Delete blocks', level: 'Block' },
        
        // Reports and Analytics
        { name: 'reports.view', description: 'View reports', level: 'State' },
        { name: 'analytics.view', description: 'View analytics', level: 'State' },
        
        // System Administration
        { name: 'system.admin', description: 'System administration', level: 'State' },
      ];

      // Create permissions if they don't exist
      for (const permData of defaultPermissions) {
        const exists = await Permission.findOne({ name: permData.name });
        if (!exists) {
          await Permission.create(permData);
          console.log(`Created permission: ${permData.name}`);
        }
      }

      // Default Roles
      const defaultRoles = [
        { name: 'SuperAdmin', description: 'Super Administrator with all permissions' },
        { name: 'StateAdmin', description: 'State level administrator' },
        { name: 'DivisionAdmin', description: 'Division level administrator' },
        { name: 'ParliamentAdmin', description: 'Parliament level administrator' },
        { name: 'AssemblyAdmin', description: 'Assembly level administrator' },
        { name: 'BlockAdmin', description: 'Block level administrator' },
        { name: 'BoothAdmin', description: 'Booth level administrator' },
        { name: 'BoothUser', description: 'Booth level user with limited permissions' },
      ];

      // Create roles if they don't exist
      for (const roleData of defaultRoles) {
        const exists = await Role.findOne({ name: roleData.name });
        if (!exists) {
          await Role.create(roleData);
          console.log(`Created role: ${roleData.name}`);
        }
      }

      console.log('RBAC system initialized successfully');
    } catch (error) {
      console.error('Error initializing RBAC system:', error);
    }
  }

  // Assign permissions to role
  static async assignPermissionsToRole(roleName, permissionNames) {
    try {
      const role = await Role.findOne({ name: roleName });
      if (!role) {
        throw new Error(`Role ${roleName} not found`);
      }

      const permissions = await Permission.find({ name: { $in: permissionNames } });
      
      for (const permission of permissions) {
        const exists = await RolePermission.findOne({ 
          role: role._id, 
          permission: permission._id 
        });
        
        if (!exists) {
          await RolePermission.create({
            role: role._id,
            permission: permission._id
          });
          console.log(`Assigned permission ${permission.name} to role ${roleName}`);
        }
      }
    } catch (error) {
      console.error('Error assigning permissions to role:', error);
      throw error;
    }
  }

  // Setup default role permissions
  static async setupDefaultRolePermissions() {
    try {
      // SuperAdmin gets all permissions
      const allPermissions = await Permission.find();
      await this.assignPermissionsToRole('SuperAdmin', allPermissions.map(p => p.name));

      // StateAdmin permissions
      await this.assignPermissionsToRole('StateAdmin', [
        'user.create', 'user.read', 'user.update', 'user.delete',
        'role.create', 'role.read', 'role.update',
        'assembly.read', 'parliament.read', 'division.read', 'block.read', 'booth.read',
        'reports.view', 'analytics.view'
      ]);

      // DivisionAdmin permissions
      await this.assignPermissionsToRole('DivisionAdmin', [
        'user.read', 'user.update',
        'division.read', 'division.update',
        'assembly.read', 'parliament.read', 'block.read', 'booth.read',
        'reports.view'
      ]);

      // AssemblyAdmin permissions
      await this.assignPermissionsToRole('AssemblyAdmin', [
        'user.read',
        'assembly.read', 'assembly.update',
        'block.read', 'booth.read',
        'reports.view'
      ]);

      // BlockAdmin permissions
      await this.assignPermissionsToRole('BlockAdmin', [
        'user.read',
        'block.read', 'block.update',
        'booth.read', 'booth.update',
        'reports.view'
      ]);

      // BoothAdmin permissions
      await this.assignPermissionsToRole('BoothAdmin', [
        'booth.read', 'booth.update',
        'reports.view'
      ]);

      // BoothUser permissions
      await this.assignPermissionsToRole('BoothUser', [
        'booth.read'
      ]);

      console.log('Default role permissions setup completed');
    } catch (error) {
      console.error('Error setting up default role permissions:', error);
    }
  }

  // Assign role to user with scope
  static async assignRoleToUser(userId, roleName, scopeType, scopeId) {
    try {
      const user = await User.findById(userId);
      const role = await Role.findOne({ name: roleName });

      if (!user) throw new Error('User not found');
      if (!role) throw new Error('Role not found');

      const exists = await UserRole.findOne({
        user: userId,
        role: role._id,
        scope_type: scopeType,
        scope_id: scopeId
      });

      if (exists) {
        throw new Error('User already has this role for this scope');
      }

      await UserRole.create({
        user: userId,
        role: role._id,
        scope_type: scopeType,
        scope_id: scopeId
      });

      console.log(`Assigned role ${roleName} to user ${user.username} for ${scopeType}:${scopeId}`);
    } catch (error) {
      console.error('Error assigning role to user:', error);
      throw error;
    }
  }

  // Check if user has permission for specific scope
  static async checkUserPermission(userId, permissionName, scopeType = null, scopeId = null) {
    try {
      const user = await User.findById(userId);
      if (!user) return false;

      // Get user roles
      const userRoles = await UserRole.find({ user: userId }).populate('role');
      
      // If scope is specified, filter by scope
      let relevantRoles = userRoles;
      if (scopeType && scopeId) {
        relevantRoles = userRoles.filter(ur => 
          ur.scope_type === scopeType && ur.scope_id.toString() === scopeId.toString()
        );
      }

      if (relevantRoles.length === 0) return false;

      // Get role permissions
      const roleIds = relevantRoles.map(ur => ur.role._id);
      const rolePermissions = await RolePermission.find({
        role: { $in: roleIds }
      }).populate('permission');

      // Check if permission exists
      return rolePermissions.some(rp => rp.permission.name === permissionName);
    } catch (error) {
      console.error('Error checking user permission:', error);
      return false;
    }
  }

  // Get user dashboard data based on roles
  static async getUserDashboardData(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const userRoles = await user.getUserRoles();
      const permissions = await user.getPermissions();

      // Get accessible scopes based on user roles
      const accessibleScopes = {
        states: [],
        divisions: [],
        parliaments: [],
        assemblies: [],
        blocks: [],
        booths: []
      };

      for (const userRole of userRoles) {
        const scopeType = userRole.scope_type.toLowerCase();
        if (accessibleScopes[scopeType + 's']) {
          accessibleScopes[scopeType + 's'].push({
            id: userRole.scope_id,
            role: userRole.role.name
          });
        }
      }

      return {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          mobile: user.mobile
        },
        roles: userRoles.map(ur => ({
          role: ur.role.name,
          scope: `${ur.scope_type}:${ur.scope_id}`
        })),
        permissions: permissions.permissions,
        accessibleScopes
      };
    } catch (error) {
      console.error('Error getting user dashboard data:', error);
      throw error;
    }
  }
}

module.exports = RBACService;
