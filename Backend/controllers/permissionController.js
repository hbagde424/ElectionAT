const Permission = require('../models/Permission');

// CRUD for Permission
exports.createPermission = async (req, res) => {
  try {
    const { name, description, level } = req.body;

    // Validate required fields
    if (!name || !level) {
      return res.status(400).json({
        error: 'Name and level are required fields'
      });
    }

    const permission = new Permission({ name, description, level });
    await permission.save();

    res.status(201).json({
      success: true,
      data: permission
    });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error
      return res.status(400).json({
        error: 'Permission name already exists'
      });
    }
    res.status(400).json({
      error: err.message
    });
  }
};

exports.getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find();
    res.json({
      success: true,
      data: permissions
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

exports.updatePermission = async (req, res) => {
  try {
    const { name, description, level } = req.body;

    // Validate required fields
    if (!name || !level) {
      return res.status(400).json({
        error: 'Name and level are required fields'
      });
    }

    const permission = await Permission.findByIdAndUpdate(
      req.params.id,
      { name, description, level },
      { new: true, runValidators: true }
    );

    if (!permission) {
      return res.status(404).json({
        error: 'Permission not found'
      });
    }

    res.json({
      success: true,
      data: permission
    });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error
      return res.status(400).json({
        error: 'Permission name already exists'
      });
    }
    res.status(400).json({
      error: err.message
    });
  }
};

exports.deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findByIdAndDelete(req.params.id);

    if (!permission) {
      return res.status(404).json({
        error: 'Permission not found'
      });
    }

    res.json({
      success: true,
      message: 'Permission deleted successfully'
    });
  } catch (err) {
    res.status(400).json({
      error: err.message
    });
  }
};
