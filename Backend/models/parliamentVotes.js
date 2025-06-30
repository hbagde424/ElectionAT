const mongoose = require('mongoose');

const parliamentVotesSchema = new mongoose.Schema({
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: [true, 'Candidate reference is required'],
    index: true
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: [true, 'Parliament constituency reference is required'],
    index: true
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: [true, 'Assembly constituency reference is required'],
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
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update timestamp before saving
parliamentVotesSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Compound indexes for optimized queries
parliamentVotesSchema.index({ parliament_id: 1, election_year_id: 1 });
parliamentVotesSchema.index({ candidate_id: 1, election_year_id: 1 });
parliamentVotesSchema.index({ assembly_id: 1, parliament_id: 1, election_year_id: 1 });

// Prevent duplicate votes for same candidate-booth-block-assembly-parliament-year combination
parliamentVotesSchema.index(
  { 
    candidate_id: 1, 
    parliament_id: 1,
    assembly_id: 1, 
    block_id: 1, 
    booth_id: 1, 
    election_year_id: 1 
  }, 
  { 
    unique: true,
    name: 'unique_parliament_vote_record' 
  }
);

// Virtual population for easier queries
parliamentVotesSchema.virtual('candidate', {
  ref: 'Candidate',
  localField: 'candidate_id',
  foreignField: '_id',
  justOne: true
});

parliamentVotesSchema.virtual('parliament', {
  ref: 'Parliament',
  localField: 'parliament_id',
  foreignField: '_id',
  justOne: true
});

parliamentVotesSchema.virtual('assembly', {
  ref: 'Assembly',
  localField: 'assembly_id',
  foreignField: '_id',
  justOne: true
});

parliamentVotesSchema.virtual('block', {
  ref: 'Block',
  localField: 'block_id',
  foreignField: '_id',
  justOne: true
});

parliamentVotesSchema.virtual('booth', {
  ref: 'Booth',
  localField: 'booth_id',
  foreignField: '_id',
  justOne: true
});

parliamentVotesSchema.virtual('election_year', {
  ref: 'ElectionYear',
  localField: 'election_year_id',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('ParliamentVotes', parliamentVotesSchema);