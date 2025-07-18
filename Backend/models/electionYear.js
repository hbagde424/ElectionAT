const mongoose = require('mongoose');

const electionYearSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true
  },
  election_type: {
    type: String,
    enum: ['Assembly', 'Parliament'],
    required: true
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

electionYearSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('ElectionYear', electionYearSchema);