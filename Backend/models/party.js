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
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

partySchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Party', partySchema);