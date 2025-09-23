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
  electors: {
    type: Number,
    default: 0,
    min: 0
  },
  turnout: {
    type: Number,
    default: 0,
    min: 0
  },
  male_electors: {
    type: Number,
    default: 0,
    min: 0
  },
  female_electors: {
    type: Number,
    default: 0,
    min: 0
  },
  total_votes_polled: {
    type: Number,
    default: 0,
    min: 0
  },
  valid_votes: {
    type: Number,
    default: 0,
    min: 0
  },
  total_male_voters: {
    type: Number,
    default: 0,
    min: 0
  },
  female_voters: {
    type: Number,
    default: 0,
    min: 0
  },
  nota_votes: {
    type: Number,
    default: 0,
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
  virtuals: true,
  transform: function (doc, ret) {
    // Ensure mixed-case DB fields are mapped to lowercase fields for API consumers
    const map = {
      Margin: 'margin',
      Margin_percentage: 'margin_percentage',
      Electors: 'electors',
      Turnout: 'turnout',
      Male_Electors: 'male_electors',
      Female_Electors: 'female_electors',
      Total_Votes_Polled: 'total_votes_polled',
      Valid_Votes: 'valid_votes',
      Total_Male_Voters: 'total_male_voters',
      Female_Voters: 'female_voters',
      NOTA_Votes: 'nota_votes'
    };

    function parsePossibleNumber(val) {
      if (val === undefined || val === null) return val;
      if (typeof val === 'number') return val;
      // Remove commas, parentheses and percent signs then parse
      const cleaned = String(val).replace(/[(),%\s]/g, '').replace(/,/g, '');
      const num = Number(cleaned);
      return isNaN(num) ? String(val) : num;
    }

    Object.keys(map).forEach(upper => {
      const lower = map[upper];
      if ((ret[lower] === undefined || ret[lower] === null) && ret[upper] !== undefined) {
        ret[lower] = parsePossibleNumber(ret[upper]);
      }
      // Also keep the uppercase variant in the JSON so legacy consumers still work
    });
    return ret;
  }
});

// Normalize both uppercase and lowercase fields before saving so DB remains consistent
parliamentCandidateSchema.pre('save', function (next) {
  const mapping = {
    Margin: 'margin',
    Margin_percentage: 'margin_percentage',
    Electors: 'electors',
    Turnout: 'turnout',
    Male_Electors: 'male_electors',
    Female_Electors: 'female_electors',
    Total_Votes_Polled: 'total_votes_polled',
    Valid_Votes: 'valid_votes',
    Total_Male_Voters: 'total_male_voters',
    Female_Voters: 'female_voters',
    NOTA_Votes: 'nota_votes'
  };

  function parseNumberFromString(v) {
    if (v === undefined || v === null) return undefined;
    if (typeof v === 'number') return v;
    const cleaned = String(v).replace(/[(),%\s]/g, '').replace(/,/g, '');
    const n = Number(cleaned);
    return isNaN(n) ? undefined : n;
  }

  try {
    Object.keys(mapping).forEach(upper => {
      const lower = mapping[upper];
      // If uppercase exists but lowercase does not, set lowercase (and coerce types)
      if (this[upper] !== undefined && (this[lower] === undefined || this[lower] === null)) {
        const parsed = parseNumberFromString(this[upper]);
        this[lower] = parsed !== undefined ? parsed : this[upper];
      }
      // If lowercase exists but uppercase does not, keep uppercase in DB for legacy
      if (this[lower] !== undefined && (this[upper] === undefined || this[upper] === null)) {
        this[upper] = this[lower];
      }
    });

    // Ensure margin_percentage stored as decimal fraction (0.03 for 3%)
    const total = Number(this.total_votes_parliament) || 0;
    const marginValue = Number(this.margin) || 0;
    if (total > 0) {
      this.margin_percentage = parseFloat((Math.abs(marginValue) / total).toFixed(6));
    } else {
      this.margin_percentage = 0;
    }
    // mirror into uppercase stored field
    this.Margin_percentage = this.margin_percentage;
    this.Margin = this.margin;
  } catch (e) {
    // ignore and continue
  }

  next();
});

module.exports = mongoose.model('ParliamentCandidate', parliamentCandidateSchema);