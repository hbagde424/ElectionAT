const mongoose = require('mongoose');

const blockVotesSchema = new mongoose.Schema({
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: [true, 'Candidate reference is required'],
    index: true
  },
  block_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
    required: [true, 'Block reference is required'],
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
    min: [0, 'Votes cannot be negative'],
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value for votes'
    }
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
blockVotesSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Compound indexes for optimized queries
blockVotesSchema.index({ block_id: 1, election_year_id: 1 });
blockVotesSchema.index({ candidate_id: 1, election_year_id: 1 });
blockVotesSchema.index({ booth_id: 1, block_id: 1, election_year_id: 1 });

// Prevent duplicate votes for same candidate-booth-block-year combination
blockVotesSchema.index(
  { candidate_id: 1, booth_id: 1, block_id: 1, election_year_id: 1 }, 
  { unique: true }
);

module.exports = mongoose.model('BlockVotes', blockVotesSchema);