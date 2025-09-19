const mongoose = require('mongoose');

const parliamentCandidateSchema = new mongoose.Schema({
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: true
  },
  election_year_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElectionYear',
    required: true
  },
  party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  position_result: {
    type: String,
    enum: ['win', 'loss'],
    required: true,
    lowercase: true
  },
  total_votes_parliament: {
    type: Number,
    required: true,
    min: 0
  },
  candidate_votes: {
    type: Number,
    required: true,
    min: 0
  },
  margin: {
    type: Number,
    required: true,
    default: 0
  },
  // Margin as a decimal fraction (e.g. 0.03 for 3%)
  margin_percentage: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Indexes for better performance
parliamentCandidateSchema.index({ candidate_id: 1, parliament_id: 1, election_year_id: 1 });
parliamentCandidateSchema.index({ party_id: 1 });
parliamentCandidateSchema.index({ position_result: 1 });
parliamentCandidateSchema.index({ election_year_id: 1, parliament_id: 1 });

// Compound unique index to prevent duplicate entries
parliamentCandidateSchema.index({
  candidate_id: 1,
  parliament_id: 1,
  election_year_id: 1
}, { unique: true });

// Pre-save middleware to update the updated_at field
parliamentCandidateSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

// Pre-save middleware to calculate margin if not provided
parliamentCandidateSchema.pre('save', function (next) {
  if (this.position_result === 'win' && this.margin === 0) {
    // For winning candidates, we might want to calculate margin differently
    // This is a placeholder - you might need to adjust based on your business logic
    this.margin = Math.abs(this.candidate_votes - (this.total_votes_parliament - this.candidate_votes));
  } else if (this.position_result === 'loss') {
    // For losing candidates, margin is typically negative or the difference they lost by
    this.margin = this.candidate_votes - (this.total_votes_parliament - this.candidate_votes);
  }
  next();
});

// Calculate margin_percentage before save
parliamentCandidateSchema.pre('save', function (next) {
  try {
    const total = Number(this.total_votes_parliament) || 0;
    const marginValue = Number(this.margin) || 0;

    if (total > 0) {
      // Store as decimal fraction (e.g., 0.03 = 3%)
      this.margin_percentage = parseFloat((Math.abs(marginValue) / total).toFixed(6));
    } else {
      this.margin_percentage = 0;
    }
  } catch (e) {
    this.margin_percentage = 0;
  }

  next();
});

// Virtual for vote percentage
parliamentCandidateSchema.virtual('vote_percentage').get(function() {
  if (this.total_votes_parliament > 0) {
    return ((this.candidate_votes / this.total_votes_parliament) * 100).toFixed(2);
  }
  return 0;
});

// Ensure virtual fields are serialised
parliamentCandidateSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('ParliamentCandidate', parliamentCandidateSchema);