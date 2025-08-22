const Role = require('../models/Role');
const Permission = require('../models/Permission');
const RolePermission = require('../models/RolePermission');

// CRUD for Role
exports.createRole = async (req, res) => {
  try {
    const role = new Role(req.body);
    await role.save();
    res.status(201).json(role);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(role);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    await Role.findByIdAndDelete(req.params.id);
    res.json({ message: 'Role deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Assign/Remove permissions to/from role
exports.assignPermission = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;
    const rp = new RolePermission({ role: roleId, permission: permissionId });
    await rp.save();
    res.status(201).json(rp);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.removePermission = async (req, res) => {
  try {
    const { roleId, permissionId } = req.body;
    await RolePermission.findOneAndDelete({ role: roleId, permission: permissionId });
    res.json({ message: 'Permission removed from role' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
