const mongoose = require('mongoose');

const boothInfrastructureSchema = new mongoose.Schema({
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: true,
    unique: true
  },
  premises_type: {
    type: String,
    enum: ['School', 'Community Hall', 'Government Building', 'Other'],
    required: true
  },
  categorization: {
    type: String,
    enum: ['Normal', 'Sensitive', 'Hyper-sensitive'],
    default: 'Normal'
  },
  accessibility_issues: {
    type: String,
    trim: true
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

boothInfrastructureSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('BoothInfrastructure', boothInfrastructureSchema);