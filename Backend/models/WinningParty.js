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
winningPartySchema.pre('save', function(next) {
  this.updated_at = Date.now();
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