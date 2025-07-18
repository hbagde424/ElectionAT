const mongoose = require('mongoose');

const localDynamicsSchema = new mongoose.Schema({
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: true
  },
  dominant_caste: {
    type: String,
    trim: true
  },
  known_issues: {
    type: String,
    trim: true
  },
  local_leader: {
    type: String,
    trim: true
  },
  grassroots_orgs: {
    type: String,
    trim: true
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

localDynamicsSchema.index({ booth_id: 1 }, { unique: true });

localDynamicsSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('LocalDynamics', localDynamicsSchema);