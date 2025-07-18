const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Block name is required'],
    trim: true,
    maxlength: [100, 'Block name cannot exceed 100 characters'],
    unique: true
  },
  category: {
    type: String,
    enum: {
      values: ['Urban', 'Rural', 'Semi-Urban', 'Tribal'],
      message: 'Please select valid category (Urban, Rural, Semi-Urban, Tribal)'
    },
    required: [true, 'Block category is required'],
    default: 'Urban'
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: [true, 'Assembly reference is required']
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: true
  },
  district_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    required: true
  },
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: true
  },
  state_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: true
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

// Update timestamp before saving
blockSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

// Indexes for search and filtering
blockSchema.index({ name: 'text' });
blockSchema.index({ assembly_id: 1 });
blockSchema.index({ category: 1 });
blockSchema.index({ is_active: 1 });

module.exports = mongoose.model('Block', blockSchema);