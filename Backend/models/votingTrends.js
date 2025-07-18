const mongoose = require('mongoose');

const votingTrendsSchema = new mongoose.Schema({
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: true
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: true
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: true
  },
  block_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
    required: true
  },
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: true
  },
  election_year: {
    type: Number,
    required: true,
    min: 1950,
    max: new Date().getFullYear() + 5 // Allow future elections up to 5 years
  },
  turnout_percent: {
    type: Number,
    min: 0,
    max: 100
  },
  leading_party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party'
  },
  victory_margin: {
    type: Number,
    min: 0
  },
  party_vote_shares: [{
    party_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Party',
      required: true
    },
    vote_share: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
votingTrendsSchema.index({ booth_id: 1, election_year: 1 }, { unique: true });
votingTrendsSchema.index({ assembly_id: 1 });
votingTrendsSchema.index({ parliament_id: 1 });
votingTrendsSchema.index({ block_id: 1 });
votingTrendsSchema.index({ division_id: 1 });
votingTrendsSchema.index({ leading_party_id: 1 });
votingTrendsSchema.index({ election_year: 1 });

votingTrendsSchema.pre('save', async function(next) {
  try {
    // Automatically populate geographic references from booth if not provided
    if (!this.assembly_id || !this.parliament_id || !this.block_id || !this.division_id) {
      const booth = await mongoose.model('Booth').findById(this.booth_id)
        .select('assembly_id parliament_id block_id division_id');
      
      if (booth) {
        this.assembly_id = this.assembly_id || booth.assembly_id;
        this.parliament_id = this.parliament_id || booth.parliament_id;
        this.block_id = this.block_id || booth.block_id;
        this.division_id = this.division_id || booth.division_id;
      }
    }
    this.updated_at = Date.now();
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('VotingTrends', votingTrendsSchema);