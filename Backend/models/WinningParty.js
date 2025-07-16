const mongoose = require('mongoose');

const winningPartySchema = new mongoose.Schema({
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: true
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament'
  },
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
  block_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
    required: true
  },
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: true
  },
  party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  year_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Year',
    required: true
  },
  votes: {
    type: Number,
    required: true
  },
  margin: {
    type: Number,
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

// Update timestamp and updated_by before saving
winningPartySchema.pre('save', function(next) {
  this.updated_at = Date.now();
  if (this.isNew) {
    this.created_at = this.updated_at;
  }
  next();
});

// Ensure unique combination of assembly/parliament and year
winningPartySchema.index(
  { $or: [
    { assembly_id: 1, year_id: 1 },
    { parliament_id: 1, year_id: 1 }
  ] }, 
  { unique: true }
);

module.exports = mongoose.model('WinningParty', winningPartySchema);