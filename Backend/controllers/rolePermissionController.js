const RolePermission = require('../models/RolePermission');
const Permission = require('../models/Permission');

// Get all permissions for a given role
exports.getRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const rolePermissions = await RolePermission.find({ role: roleId }).populate('permission');
    res.json(rolePermissions.map(rp => rp.permission));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all role-permission assignments
exports.getAllRolePermissions = async (req, res) => {
  try {
    const rolePermissions = await RolePermission.find().populate('role').populate('permission');
    res.json({
      success: true,
      data: rolePermissions
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Create a new role-permission assignment
exports.createRolePermission = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;

    // Check if assignment already exists
    const existingAssignment = await RolePermission.findOne({
      role: roleId,
      permission: permissionId
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        error: 'Role-permission assignment already exists'
      });
    }

    const rolePermission = new RolePermission({
      role: roleId,
      permission: permissionId
    });

    await rolePermission.save();

    res.status(201).json({
      success: true,
      data: rolePermission
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// Delete a role-permission assignment
exports.deleteRolePermission = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;

    const deletedAssignment = await RolePermission.findOneAndDelete({
      role: roleId,
      permission: permissionId
    });

    if (!deletedAssignment) {
      return res.status(404).json({
        success: false,
        error: 'Role-permission assignment not found'
      });
    }

    res.json({
      success: true,
      message: 'Role-permission assignment deleted successfully',
      data: deletedAssignment
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};
