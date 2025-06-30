const mongoose = require('mongoose');

const assemblyVotesSchema = new mongoose.Schema({
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: [true, 'Candidate reference is required'],
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
assemblyVotesSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Compound indexes for optimized queries
assemblyVotesSchema.index({ assembly_id: 1, election_year_id: 1 });
assemblyVotesSchema.index({ candidate_id: 1, election_year_id: 1 });
assemblyVotesSchema.index({ block_id: 1, assembly_id: 1, election_year_id: 1 });

// Prevent duplicate votes for same candidate-booth-block-assembly-year combination
assemblyVotesSchema.index(
  { 
    candidate_id: 1, 
    assembly_id: 1, 
    block_id: 1, 
    booth_id: 1, 
    election_year_id: 1 
  }, 
  { 
    unique: true,
    name: 'unique_vote_record' 
  }
);

// Virtual population for easier queries
assemblyVotesSchema.virtual('candidate', {
  ref: 'Candidate',
  localField: 'candidate_id',
  foreignField: '_id',
  justOne: true
});

assemblyVotesSchema.virtual('assembly', {
  ref: 'Assembly',
  localField: 'assembly_id',
  foreignField: '_id',
  justOne: true
});

assemblyVotesSchema.virtual('block', {
  ref: 'Block',
  localField: 'block_id',
  foreignField: '_id',
  justOne: true
});

assemblyVotesSchema.virtual('booth', {
  ref: 'Booth',
  localField: 'booth_id',
  foreignField: '_id',
  justOne: true
});

assemblyVotesSchema.virtual('election_year', {
  ref: 'ElectionYear',
  localField: 'election_year_id',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('AssemblyVotes', assemblyVotesSchema);