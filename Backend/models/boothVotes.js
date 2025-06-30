const mongoose = require('mongoose');

const boothVotesSchema = new mongoose.Schema({
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: [true, 'Candidate reference is required'],
    index: true
  },
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: [true, 'Booth reference is required'],
    index: true
  },
  total_votes: {
    type: Number,
    required: [true, 'Total votes is required'],
    min: [0, 'Votes cannot be negative']
  },
  election_year_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElectionYear',
    required: [true, 'Election year reference is required'],
    index: true
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

// Update timestamp before saving
boothVotesSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Compound indexes for better query performance
boothVotesSchema.index({ booth_id: 1, election_year_id: 1 });
boothVotesSchema.index({ candidate_id: 1, election_year_id: 1 });

module.exports = mongoose.model('BoothVotes', boothVotesSchema);