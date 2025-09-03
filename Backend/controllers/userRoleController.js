const UserRole = require('../models/UserRole');
const User = require('../models/User');
const Role = require('../models/Role');

// Assign role to user
exports.assignUserRole = async (req, res) => {
  try {
    const { userId, roleId, scopeType, scopeId } = req.body;

    if (!userId || !roleId) {
      return res.status(400).json({
        success: false,
        error: 'Both userId and roleId are required.'
      });
    }

    // Build query for checking existing assignment
    let existingQuery = { user: userId, role: roleId };
    if (scopeType && scopeId) {
      existingQuery.scope_type = scopeType;
      existingQuery.scope_id = scopeId;
    } else if (!scopeType && !scopeId) {
      // For general roles, check if role is already assigned without scope
      existingQuery.$or = [
        { scope_type: { $exists: false } },
        { scope_type: null },
        { scope_id: { $exists: false } },
        { scope_id: null }
      ];
    }

    // Check if assignment already exists
    const existingAssignment = await UserRole.findOne(existingQuery);
    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        error: 'This role assignment already exists for this user.'
      });
    }

    // Build user role object
    const userRoleData = {
      user: userId,
      role: roleId,
      assignedBy: req.user?._id
    };

    // Add scope fields if provided
    if (scopeType && scopeId) {
      userRoleData.scope_type = scopeType;
      userRoleData.scope_id = scopeId;
    }

    const userRole = new UserRole(userRoleData);
    await userRole.save();

    res.status(201).json({
      success: true,
      data: userRole
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// Remove role from user
exports.removeUserRole = async (req, res) => {
  try {
    const { userId, roleId, scopeType, scopeId } = req.body;

    if (!userId || !roleId) {
      return res.status(400).json({
        success: false,
        error: 'Both userId and roleId are required.'
      });
    }

    // Build query for deletion
    let deleteQuery = { user: userId, role: roleId };
    if (scopeType && scopeId) {
      deleteQuery.scope_type = scopeType;
      deleteQuery.scope_id = scopeId;
    }

    await UserRole.findOneAndDelete(deleteQuery);
    res.json({
      success: true,
      message: 'Role removed from user successfully'
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

// Get all roles for a user
exports.getUserRoles = async (req, res) => {
  try {
    const { userId } = req.params;
    const userRoles = await UserRole.find({ user: userId }).populate('role');

    res.json({
      success: true,
      data: userRoles.map(ur => ur.role)
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get all users with a specific role
exports.getRoleUsers = async (req, res) => {
  try {
    const { roleId } = req.params;
    const roleUsers = await UserRole.find({ role: roleId }).populate('user');

    res.json({
      success: true,
      data: roleUsers.map(ru => ru.user)
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Legacy method - keeping for backward compatibility
exports.assignRole = async (req, res) => {
  try {
    const { userId, roleId, scope_type, scope_id } = req.body;
    if (!userId || !roleId || !scope_type || !scope_id) {
      return res.status(400).json({ error: 'All fields (userId, roleId, scope_type, scope_id) are required.' });
    }
    // Check for valid ObjectId
    const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);
    if (!isValidObjectId(userId) || !isValidObjectId(roleId) || !isValidObjectId(scope_id)) {
      return res.status(400).json({ error: 'Invalid userId, roleId, or scope_id.' });
    }
    const ur = new UserRole({ user: userId, role: roleId, scope_type, scope_id });
    await ur.save();
    res.status(201).json(ur);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Legacy method - keeping for backward compatibility  
exports.removeRole = async (req, res) => {
  try {
    const { userId, roleId, scope_type, scope_id } = req.body;
    await UserRole.findOneAndDelete({ user: userId, role: roleId, scope_type, scope_id });
    res.json({ message: 'Role removed from user' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
