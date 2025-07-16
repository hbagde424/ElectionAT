const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  abbreviation: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  symbol: {
    type: String,
    trim: true
  },
  founded_year: {
    type: Number
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
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

// Update timestamp and updated_by before saving
partySchema.pre('save', function(next) {
  this.updated_at = Date.now();
  if (this.isModified()) {
    this.updated_by = this._locals?.user?.id;
  }
  next();
});

module.exports = mongoose.model('Party', partySchema);