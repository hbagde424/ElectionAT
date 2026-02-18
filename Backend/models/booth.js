const mongoose = require('mongoose');

const boothSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Booth name is required'],
    trim: true,
    maxlength: [200, 'Booth name cannot exceed 200 characters']
  },
  booth_number: {
    type: Number,
    required: [true, 'Booth number is required'],
    unique: true,
    min: [1, 'Booth number must be at least 1']
  },
  full_address: {
    type: String,
    default: '',
    trim: true
  },
  latitude: {
    type: Number,
    default: 0
  },
  longitude: {
    type: Number,
    default: 0
  },
  Male_Count: {
    type: Number,
    default: 0,
    min: [0, 'Male count cannot be negative']
  },
  Female_Count: {
    type: Number,
    default: 0,
    min: [0, 'Female count cannot be negative']
  },
  others_Count: {
    type: Number,
    default: 0,
    min: [0, 'Others count cannot be negative']
  },
  Total: {
    type: Number,
    default: 0,
    min: [0, 'Total count cannot be negative']
  },
  block_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
    required: [true, 'Block reference is required']
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: [true, 'Assembly reference is required']
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: [true, 'Parliament reference is required']
  },
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: [true, 'Division reference is required']
  },
  state_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: [true, 'State reference is required']
  },
  polygon: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator user reference is required']
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

// Update timestamp before saving
boothSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

// Indexes for search and filtering
boothSchema.index({ name: 'text', full_address: 'text' });
boothSchema.index({ booth_number: 1 });
boothSchema.index({ block_id: 1 });
boothSchema.index({ assembly_id: 1 });

// Guard model registration to avoid OverwriteModelError during hot-reloads or multiple requires
module.exports = mongoose.models.Booth || mongoose.model('Booth', boothSchema);
