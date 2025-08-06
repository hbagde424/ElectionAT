const mongoose = require('mongoose');

const voterTurnoutSchema = new mongoose.Schema({
  state_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: true
  },
  year_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElectionYear',
    required: true
  },
  total_voter: {
    type: Number,
    required: true,
    min: 0
  },
  total_votes: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        return v <= this.total_voter;
      },
      message: 'Total votes cannot exceed total voters'
    }
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

// Compound index to ensure unique state-year combination
voterTurnoutSchema.index({ state_id: 1, year_id: 1 }, { unique: true });

voterTurnoutSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('VoterTurnout', voterTurnoutSchema);