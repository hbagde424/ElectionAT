const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const RolePermission = require('../models/RolePermission');
const UserRole = require('../models/UserRole');

// @desc    Get RBAC analytics and metrics
// @route   GET /api/users/rbac-metrics
// @access  Private (SuperAdmin/StateAdmin)
exports.getRBACMetrics = async (req, res, next) => {
  try {
    // Total counts
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalRoles = await Role.countDocuments({ status: 'Active' });
    const totalPermissions = await Permission.countDocuments();
    const totalRoleAssignments = await UserRole.countDocuments();

    // User distribution by role
    const usersByRole = await UserRole.aggregate([
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'roleDetails'
        }
      },
      {
        $unwind: '$roleDetails'
      },
      {
        $group: {
          _id: '$roleDetails.name',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Permission distribution
    const permissionsByLevel = await Permission.aggregate([
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Scope distribution
    const usersByScope = await UserRole.aggregate([
      {
        $group: {
          _id: '$scope_type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Inactive users
    const inactiveUsersCount = await User.countDocuments({ isActive: false });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalRoles,
          totalPermissions,
          totalRoleAssignments,
          inactiveUsersCount
        },
        distributions: {
          usersByRole,
          permissionsByLevel,
          usersByScope
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get role-permission matrix
// @route   GET /api/users/role-permission-matrix
// @access  Private (SuperAdmin/StateAdmin)
exports.getRolePermissionMatrix = async (req, res, next) => {
  try {
    const roles = await Role.find({ status: 'Active' }).sort({ name: 1 });
    const permissions = await Permission.find().sort({ level: 1, name: 1 });
    
    const matrix = [];
    
    for (const role of roles) {
      const rolePermissions = await RolePermission.find({ role: role._id })
        .populate('permission');
      
      const permissionIds = rolePermissions.map(rp => rp.permission._id.toString());
      
      const roleMatrix = {
        roleId: role._id,
        roleName: role.name,
        roleDescription: role.description,
        permissions: permissions.map(permission => ({
          permissionId: permission._id,
          permissionName: permission.name,
          permissionLevel: permission.level,
          hasPermission: permissionIds.includes(permission._id.toString())
        }))
      };
      
      matrix.push(roleMatrix);
    }

    res.status(200).json({
      success: true,
      data: {
        roles: roles.length,
        permissions: permissions.length,
        matrix
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user access report
// @route   GET /api/users/:userId/access-report
// @access  Private (SuperAdmin/StateAdmin)
exports.getUserAccessReport = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    
    const user = await User.findById(userId)
      .select('-password')
      .populate('created_by', 'username email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user roles with details
    const userRoles = await UserRole.find({ user: userId })
      .populate('role');

    // Get all permissions for this user
    const roleIds = userRoles.map(ur => ur.role._id);
    const rolePermissions = await RolePermission.find({
      role: { $in: roleIds }
    }).populate('permission').populate('role');

    // Get unique permissions
    const uniquePermissions = [...new Set(rolePermissions.map(rp => rp.permission.name))];

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          isActive: user.isActive,
          created_at: user.created_at
        },
        roles: userRoles.map(ur => ({
          id: ur._id,
          role: {
            id: ur.role._id,
            name: ur.role.name,
            description: ur.role.description
          },
          scope: {
            type: ur.scope_type,
            id: ur.scope_id
          }
        })),
        permissions: {
          total: uniquePermissions.length,
          list: uniquePermissions
        },
        summary: {
          totalRoles: userRoles.length,
          totalPermissions: uniquePermissions.length,
          scopeTypes: [...new Set(userRoles.map(ur => ur.scope_type))]
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get permission usage statistics  
// @route   GET /api/rbac/permission-usage
// @access  Private (requires analytics.read permission)
exports.getPermissionUsageStats = async (req, res, next) => {
  try {
    // Permission usage by role count
    const permissionUsage = await RolePermission.aggregate([
      {
        $lookup: {
          from: 'permissions',
          localField: 'permission_id',
          foreignField: '_id',
          as: 'permission'
        }
      },
      { $unwind: '$permission' },
      {
        $group: {
          _id: '$permission.name',
          description: { $first: '$permission.description' },
          usageCount: { $sum: 1 },
          roles: { $addToSet: '$role_id' }
        }
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'roles',
          foreignField: '_id',
          as: 'assignedRoles'
        }
      },
      {
        $project: {
          permission: '$_id',
          description: 1,
          usageCount: 1,
          roleCount: { $size: '$assignedRoles' },
          roles: {
            $map: {
              input: '$assignedRoles',
              as: 'role',
              in: '$$role.name'
            }
          }
        }
      },
      { $sort: { usageCount: -1 } }
    ]);

    // Most and least used permissions
    const mostUsed = permissionUsage.slice(0, 5);
    const leastUsed = permissionUsage.slice(-5);

    // Unused permissions
    const usedPermissionIds = await RolePermission.distinct('permission_id');
    const unusedPermissions = await Permission.find({
      _id: { $nin: usedPermissionIds }
    }).select('name description');

    res.status(200).json({
      success: true,
      data: {
        permissionUsage,
        statistics: {
          totalPermissions: await Permission.countDocuments(),
          usedPermissions: permissionUsage.length,
          unusedPermissions: unusedPermissions.length
        },
        mostUsed,
        leastUsed,
        unusedPermissions
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get role hierarchy information
// @route   GET /api/rbac/role-hierarchy  
// @access  Private (requires role.read permission)
exports.getRoleHierarchy = async (req, res, next) => {
  try {
    // Role hierarchy based on permission count and scope
    const roleHierarchy = await Role.aggregate([
      {
        $lookup: {
          from: 'rolepermissions',
          localField: '_id',
          foreignField: 'role_id',
          as: 'permissions'
        }
      },
      {
        $lookup: {
          from: 'userroles',
          localField: '_id',
          foreignField: 'role_id',
          as: 'users'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          status: 1,
          permissionCount: { $size: '$permissions' },
          userCount: { $size: '$users' },
          created_at: 1
        }
      },
      { $sort: { permissionCount: -1 } }
    ]);

    // Define role hierarchy levels
    const hierarchyLevels = {
      'superAdmin': { level: 1, scope: 'Global' },
      'State': { level: 2, scope: 'State' },
      'Division': { level: 3, scope: 'Division' },
      'Parliament': { level: 4, scope: 'Parliament' },
      'Assembly': { level: 4, scope: 'Assembly' },
      'Block': { level: 5, scope: 'Block' },
      'Booth': { level: 6, scope: 'Booth' }
    };

    // Add hierarchy information
    const enrichedHierarchy = roleHierarchy.map(role => ({
      ...role,
      hierarchy: hierarchyLevels[role.name] || { level: 999, scope: 'Custom' }
    }));

    // Group by hierarchy level
    const groupedByLevel = enrichedHierarchy.reduce((acc, role) => {
      const level = role.hierarchy.level;
      if (!acc[level]) {
        acc[level] = [];
      }
      acc[level].push(role);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        roleHierarchy: enrichedHierarchy,
        groupedByLevel,
        hierarchyLevels,
        statistics: {
          totalRoles: roleHierarchy.length,
          systemRoles: Object.keys(hierarchyLevels).length,
          customRoles: roleHierarchy.filter(r => !hierarchyLevels[r.name]).length
        }
      }
    });
  } catch (err) {
    next(err);
  }
};
