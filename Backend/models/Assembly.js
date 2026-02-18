const mongoose = require('mongoose');

const assemblySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Assembly name is required'],
    trim: true,
    maxlength: [200, 'Assembly name cannot exceed 200 characters']
  },
  AC_NO: {
    type: String,
    required: [true, 'Assembly constituency number is required'],
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: {
      values: ['Urban', 'Rural', 'Semi-Urban', 'Tribal'],
      message: 'Please select valid type (Urban, Rural, Semi-Urban, Tribal)'
    },
    default: 'Urban'
  },
  category: {
    type: String,
    enum: {
      values: ['General', 'SC', 'ST', 'OBC'],
      message: 'Please select valid category (General, SC, ST, OBC)'
    },
    default: 'General'
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
  description: {
    type: String,
    default: ''
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
assemblySchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

// Indexes for search and filtering
assemblySchema.index({ name: 'text', AC_NO: 'text' });
assemblySchema.index({ AC_NO: 1 });
assemblySchema.index({ parliament_id: 1 });
assemblySchema.index({ state_id: 1 });

// Guard model registration to avoid OverwriteModelError during hot-reloads or multiple requires
module.exports = mongoose.models.Assembly || mongoose.model('Assembly', assemblySchema);
