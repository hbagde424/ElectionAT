const mongoose = require('mongoose');

const assemblySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Assembly name is required'],
    trim: true,
    maxlength: [100, 'Assembly name cannot exceed 100 characters'],
    unique: true
  },
  type: {
    type: String,
    enum: {
      values: ['Urban', 'Rural', 'Mixed'],
      message: 'Please select valid type (Urban, Rural, Mixed)'
    },
    required: [true, 'Assembly type is required']
  },
  category: {
    type: String,
    enum: {
      values: ['General', 'Reserved', 'Special'],
      message: 'Please select valid category (General, Reserved, Special)'
    },
    required: [true, 'Assembly category is required'],
    default: 'General'
  },
  state_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: [true, 'State reference is required']
  },
  district_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    required: [true, 'District reference is required']
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
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // or 'Admin'
    required: [true, 'Creator reference is required']
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
assemblySchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
assemblySchema.index({ name: 'text' });
assemblySchema.index({ district_id: 1 });
assemblySchema.index({ division_id: 1 });
assemblySchema.index({ parliament_id: 1 });
assemblySchema.index({ type: 1, category: 1 });

module.exports = mongoose.model('Assembly', assemblySchema);