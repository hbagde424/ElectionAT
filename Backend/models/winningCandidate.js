const mongoose = require('mongoose');

const winningCandidateSchema = new mongoose.Schema({
  state_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: true
  },
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: true
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: true
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: true
  },
  assembly_no: {
    type: String,
    required: true
  },
  type: {
    type: [String],
    required: true,
    enum: ['General', 'Bye', 'Midterm', 'Special'], // example types
    default: ['General']
  },
  poll_percentage: {
    type: String,
    required: true
  },
  party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  year_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElectionYear',
    required: true
  },
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  total_electors: {
    type: String,
    required: true
  },
  total_votes: {
    type: Number,
    required: true
  },
  voting_percentage: {
    type: String,
    required: true
  },
  margin: {
    type: Number,
    required: true
  },
  margin_percentage: {
    type: String,
    required: true
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

winningCandidateSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('WinningCandidate', winningCandidateSchema);