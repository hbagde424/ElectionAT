const mongoose = require('mongoose');
const LocalDynamics = require('../models/localDynamics');

const boothElectionStatsSchema = new mongoose.Schema({
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: true
  },
  year_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElectionYear',
    required: true
  },
  total_votes_polled: Number,
  turnout_percentage: Number,
  male_turnout: Number,
  female_turnout: Number,
  nota_votes: Number,
  rejected_votes: Number,
  winning_candidate: String,
  winning_party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party'
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

boothElectionStatsSchema.index({ booth_id: 1, year_id: 1 }, { unique: true });

boothElectionStatsSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('BoothElectionStats', boothElectionStatsSchema);