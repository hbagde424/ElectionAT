const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Status name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Status name cannot exceed 100 characters'],
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },
  is_system: {
    type: Boolean,
    default: false,
    index: true
  },
  color_code: {
    type: String,
    default: '#6c757d', // Bootstrap secondary color
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color code']
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator reference is required']
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
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update timestamp before saving
statusSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Prevent modifying system statuses
statusSchema.pre('remove', function(next) {
  if (this.is_system) {
    throw new Error('System statuses cannot be deleted');
  }
  next();
});

// Indexes for better performance
statusSchema.index({ name: 'text' }); // For text search on status names

// Virtual population
statusSchema.virtual('creator', {
  ref: 'User',
  localField: 'created_by',
  foreignField: '_id',
  justOne: true
});

statusSchema.virtual('updater', {
  ref: 'User',
  localField: 'updated_by',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Status', statusSchema);