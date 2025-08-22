const mongoose = require('mongoose');

const userRoleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  scope_type: {
    type: String,
    enum: ['State', 'Division', 'Assembly', 'Parliament', 'Block', 'Booth'],
    required: true
  },
  scope_id: { type: mongoose.Schema.Types.ObjectId, required: true },
});

userRoleSchema.index({ user: 1, role: 1, scope_type: 1, scope_id: 1 }, { unique: true });

module.exports = mongoose.model('UserRole', userRoleSchema);
