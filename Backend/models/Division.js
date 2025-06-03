const mongoose = require('mongoose');

const divisionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  state_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
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

divisionSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Division', divisionSchema);