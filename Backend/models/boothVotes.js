const mongoose = require('mongoose');

const boothVotesSchema = new mongoose.Schema({
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: [true, 'Candidate reference is required'],
    index: true
  },
  state_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: [true, 'State reference is required'],
    index: true
  },
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: [true, 'Division reference is required'],
    index: true
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: [true, 'Parliament reference is required'],
    index: true
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: [true, 'Assembly reference is required'],
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
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator reference is required']
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
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update timestamp before saving
boothVotesSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Compound indexes for optimized queries
boothVotesSchema.index({ booth_id: 1, election_year_id: 1 });
boothVotesSchema.index({ candidate_id: 1, election_year_id: 1 });
boothVotesSchema.index({ state_id: 1, division_id: 1 });
boothVotesSchema.index({ parliament_id: 1, assembly_id: 1 });
boothVotesSchema.index({ block_id: 1, booth_id: 1 });

// Prevent duplicate votes for same candidate-booth-election year combination
boothVotesSchema.index(
  { 
    candidate_id: 1, 
    booth_id: 1, 
    election_year_id: 1 
  }, 
  { 
    unique: true,
    name: 'unique_booth_vote_record'
  }
);

// Virtual population for easier queries
boothVotesSchema.virtual('candidate', {
  ref: 'Candidate',
  localField: 'candidate_id',
  foreignField: '_id',
  justOne: true
});

boothVotesSchema.virtual('state', {
  ref: 'State',
  localField: 'state_id',
  foreignField: '_id',
  justOne: true
});

boothVotesSchema.virtual('division', {
  ref: 'Division',
  localField: 'division_id',
  foreignField: '_id',
  justOne: true
});

boothVotesSchema.virtual('parliament', {
  ref: 'Parliament',
  localField: 'parliament_id',
  foreignField: '_id',
  justOne: true
});

boothVotesSchema.virtual('assembly', {
  ref: 'Assembly',
  localField: 'assembly_id',
  foreignField: '_id',
  justOne: true
});

boothVotesSchema.virtual('block', {
  ref: 'Block',
  localField: 'block_id',
  foreignField: '_id',
  justOne: true
});

boothVotesSchema.virtual('booth', {
  ref: 'Booth',
  localField: 'booth_id',
  foreignField: '_id',
  justOne: true
});

boothVotesSchema.virtual('election_year', {
  ref: 'ElectionYear',
  localField: 'election_year_id',
  foreignField: '_id',
  justOne: true
});

boothVotesSchema.virtual('creator', {
  ref: 'User',
  localField: 'created_by',
  foreignField: '_id',
  justOne: true
});

boothVotesSchema.virtual('updater', {
  ref: 'User',
  localField: 'updated_by',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('BoothVotes', boothVotesSchema);