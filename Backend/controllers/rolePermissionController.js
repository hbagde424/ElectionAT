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
