const mongoose = require('mongoose');

const samitiSchema = new mongoose.Schema({
  samiti_name: {
    type: String,
    required: [true, 'Samiti name is required'],
    trim: true,
    maxlength: [200, 'Samiti name cannot exceed 200 characters']
  },
  // References for local administrative units
  panchayat_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Panchayat',
    required: false
  },
  village_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Village',
    required: false
  },
  falliya_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Falliya',
    required: false
  },
  year: {
    type: Number,
    min: 2020,
    max: 2030
  },
  count: {
    type: Number,
    required: [true, 'Count is required'],
    min: [0, 'Count cannot be negative'],
    default: 0
  },
  state_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: [true, 'State reference is required']
  },
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: [true, 'Division reference is required']
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: [true, 'Parliament reference is required']
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: [true, 'Assembly reference is required']
  },
  block_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
    required: [true, 'Block reference is required']
  },
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: [true, 'Booth reference is required']
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator reference is required']
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
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
samitiSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
samitiSchema.index({ samiti_name: 'text' });
samitiSchema.index({ state_id: 1 });
samitiSchema.index({ division_id: 1 });
samitiSchema.index({ parliament_id: 1 });
samitiSchema.index({ assembly_id: 1 });
samitiSchema.index({ block_id: 1 });
samitiSchema.index({ booth_id: 1 });
samitiSchema.index({ panchayat_id: 1 });
samitiSchema.index({ village_id: 1 });
samitiSchema.index({ falliya_id: 1 });
samitiSchema.index({ created_at: -1 });

module.exports = mongoose.model('Samiti', samitiSchema);