const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  assembly: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'Assembly',
    required: true
  },
  assemblyModel: {
    type: String,
    required: true,
    enum: ['Division', 'Parliament', 'Block', 'Assembly']
  },
  election_year: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Year',
    required: true
  },
  votes: {
    type: Number,
    default: 0
  },
  criminal_cases: {
    type: Number,
    default: 0
  },
  assets: {
    type: String
  },
  liabilities: {
    type: String
  },
  education: {
    type: String
  },
  photo: {
    type: String
  },
  is_active: {
    type: Boolean,
    default: true
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

// Update the timestamp before saving
candidateSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Ensure unique candidate for a assembly in an election year
candidateSchema.index(
  { assembly: 1, election_year: 1, party: 1 }, 
  { unique: true }
);

module.exports = mongoose.model('Candidate', candidateSchema);