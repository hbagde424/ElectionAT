const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['SuperAdmin', 'Admin', 'Booth', 'Division', 'Parliament', 'Block', 'Assembly'],
    required: true,
  },
  accessLevel: {
    type: String,
    enum: ['editor', 'viewOnly'],
    default: 'viewOnly',
  },
  regionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'regionModel',
    required: function () {
      return this.role !== 'superAdmin'; // superAdmin may not need specific regions
    }
  }],
  regionModel: {
    type: String,
    enum: ['Division', 'Parliament', 'Block', 'Assembly', 'Booth'],
    required: function () {
      return this.role !== 'superAdmin';
    }
  }, 
  isActive: {
    type: Boolean, 
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  }
});

// Middleware: hash password before save
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Middleware: update updatedAt before update
UserSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);