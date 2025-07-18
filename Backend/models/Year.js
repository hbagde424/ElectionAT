const mongoose = require('mongoose');

const yearSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true,
    min: 1900,
    max: 2100
  },
  is_current: {
    type: Boolean,
    default: false
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

// Ensure only one year can be current
yearSchema.pre('save', async function(next) {
  if (this.is_current) {
    await mongoose.model('Year').updateMany(
      { _id: { $ne: this._id } },
      { $set: { is_current: false } }
    );
  }
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Year', yearSchema);