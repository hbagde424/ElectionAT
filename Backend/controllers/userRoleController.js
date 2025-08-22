const UserRole = require('../models/UserRole');

// Assign role to user with scope
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

// Remove role from user with scope
exports.removeRole = async (req, res) => {
  try {
    const { userId, roleId, scope_type, scope_id } = req.body;
    await UserRole.findOneAndDelete({ user: userId, role: roleId, scope_type, scope_id });
    res.json({ message: 'Role removed from user' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
