const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    maxlength: [100, 'Username cannot exceed 100 characters'],
    unique: true
  },
  mobile: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number'],
    required: [true, 'Mobile number is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['superAdmin', 'State', 'Admin', 'Booth', 'Division', 'Parliament', 'Block', 'Assembly'],
    required: [true, 'Role is required']
  },
  state_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State'
  }],
  division_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division'
  }],
  parliament_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament'
  }],
  assembly_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly'
  }],
  block_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block'
  }],
  booth_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Update timestamp on update
userSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updated_at: Date.now() });
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user permissions
userSchema.methods.getPermissions = async function() {
  const UserRole = require('./UserRole');
  const RolePermission = require('./RolePermission');
  
  // Get all user roles
  const userRoles = await UserRole.find({ user: this._id }).populate('role');
  
  // Get all permissions for these roles
  const roleIds = userRoles.map(ur => ur.role._id);
  const rolePermissions = await RolePermission.find({ 
    role: { $in: roleIds } 
  }).populate('permission');
  
  // Extract unique permissions
  const permissions = [...new Set(rolePermissions.map(rp => rp.permission.name))];
  
  return {
    permissions,
    rolePermissions: rolePermissions.map(rp => ({
      permission: rp.permission.name,
      role: userRoles.find(ur => ur.role._id.toString() === rp.role.toString())?.role?.name,
      level: rp.permission.level
    }))
  };
};

// Method to check if user has specific permission
userSchema.methods.hasPermission = async function(permissionName, level = null) {
  const userPermissions = await this.getPermissions();
  
  if (level) {
    return userPermissions.rolePermissions.some(rp => 
      rp.permission === permissionName && rp.level === level
    );
  }
  
  return userPermissions.permissions.includes(permissionName);
};

// Method to get user roles with scope
userSchema.methods.getUserRoles = async function() {
  const UserRole = require('./UserRole');
  
  return await UserRole.find({ user: this._id })
    .populate('role')
    .populate('scope_id');
};

module.exports = mongoose.model('User', userSchema);