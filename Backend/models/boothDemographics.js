const mongoose = require('mongoose');

const boothDemographicsSchema = new mongoose.Schema({
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: true,
    unique: true
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
  total_population: {
    type: Number,
    min: 0,
    required: true
  },
  total_electors: {
    type: Number,
    min: 0,
    required: true
  },
  male_electors: {
    type: Number,
    min: 0,
    required: true
  },
  female_electors: {
    type: Number,
    min: 0,
    required: true
  },
  other_electors: {
    type: Number,
    min: 0,
    default: 0
  },
  age_groups: {
    _18_25: { type: Number, min: 0, default: 0 },
    _26_40: { type: Number, min: 0, default: 0 },
    _41_60: { type: Number, min: 0, default: 0 },
    _60_above: { type: Number, min: 0, default: 0 }
  },
  caste_population: {
    sc: { type: Number, min: 0, default: 0 },
    st: { type: Number, min: 0, default: 0 },
    obc: { type: Number, min: 0, default: 0 },
    general: { type: Number, min: 0, default: 0 },
    other: { type: Number, min: 0, default: 0 }
  },
  literacy_rate: {
    type: Number,
    min: 0,
    max: 100
  },
  religious_composition: {
    type: Map,
    of: Number,
    default: {}
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

// Indexes
boothDemographicsSchema.index({ booth_id: 1 });
boothDemographicsSchema.index({ assembly_id: 1 });
boothDemographicsSchema.index({ parliament_id: 1 });
boothDemographicsSchema.index({ block_id: 1 });

// Auto-fill geo IDs from Booth if missing
boothDemographicsSchema.pre('save', async function(next) {
  try {
    if (!this.assembly_id || !this.parliament_id || !this.block_id) {
      const booth = await mongoose.model('Booth').findById(this.booth_id)
        .select('assembly_id parliament_id block_id');
      if (booth) {
        this.assembly_id = this.assembly_id || booth.assembly_id;
        this.parliament_id = this.parliament_id || booth.parliament_id;
        this.block_id = this.block_id || booth.block_id;
      }
    }
    this.updated_at = Date.now();
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('BoothDemographics', boothDemographicsSchema);