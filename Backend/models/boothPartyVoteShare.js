const mongoose = require('mongoose');

const boothPartyVoteShareSchema = new mongoose.Schema({
  stat_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BoothElectionStats',
    required: true
  },
  party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  votes: {
    type: Number,
    required: true,
    min: 0
  },
  vote_percent: {
    type: Number,
    required: true,
    min: 0,
    max: 100
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

boothPartyVoteShareSchema.index({ stat_id: 1, party_id: 1 }, { unique: true });

boothPartyVoteShareSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('BoothPartyVoteShare', boothPartyVoteShareSchema);