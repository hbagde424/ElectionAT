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
    enum: ['master', 'division', 'parliament', 'block', 'assembly'],
    required: true,
  },
  regionIds: [{  // Changed from regionId to regionIds (array)
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'regionModel',
    required: true
  }],
  regionModel: {
    type: String,
    enum: ['Division', 'Parliament', 'block', 'Assembly', 'master'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ... (rest of the model remains the same)

// Encrypt password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
