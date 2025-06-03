const mongoose = require('mongoose');

const votingTrendsSchema = new mongoose.Schema({
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: true
  },
  election_year: {
    type: Number,
    required: true
  },
  turnout_percent: {
    type: Number,
    min: 0,
    max: 100
  },
  leading_party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party'
  },
  victory_margin: {
    type: Number,
    min: 0
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

votingTrendsSchema.index({ booth_id: 1, election_year: 1 }, { unique: true });

votingTrendsSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('VotingTrends', votingTrendsSchema);