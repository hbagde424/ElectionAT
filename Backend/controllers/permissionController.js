const Permission = require('../models/Permission');

// CRUD for Permission
exports.createPermission = async (req, res) => {
  try {
    const permission = new Permission(req.body);
    await permission.save();
    res.status(201).json(permission);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find();
    res.json(permissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePermission = async (req, res) => {
  try {
    const permission = await Permission.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(permission);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deletePermission = async (req, res) => {
  try {
    await Permission.findByIdAndDelete(req.params.id);
    res.json({ message: 'Permission deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
