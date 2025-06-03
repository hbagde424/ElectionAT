const mongoose = require('mongoose');

const boothDemographicsSchema = new mongoose.Schema({
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: true,
    unique: true
  },
  total_population: Number,
  total_electors: Number,
  male_electors: Number,
  female_electors: Number,
  other_electors: Number,
  age_18_25: Number,
  age_26_40: Number,
  age_41_60: Number,
  age_60_above: Number,
  sc_percent: Number,
  st_percent: Number,
  obc_percent: Number,
  general_percent: Number,
  literacy_rate: Number,
  religious_composition: mongoose.Schema.Types.Mixed,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

boothDemographicsSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('BoothDemographics', boothDemographicsSchema);