const mongoose = require('mongoose');

const parliamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Parliament name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
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
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['reserved', 'special', 'general'],
      message: 'Category must be either reserved, special, or general'
    }
  },
  regional_type: {
    type: String,
    required: [true, 'Regional type is required'],
    enum: {
      values: ['urban', 'rural', 'mixed'],
      message: 'Regional type must be either urban, rural, or mixed'
    }
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update timestamp and updated_by before saving
parliamentSchema.pre('save', function (next) {
  this.updated_at = Date.now();

  // Set updated_by only if document is NOT new (i.e., it's an update)
  if (!this.isNew && this.isModified()) {
    this.updated_by = this._locals.user?.id;
  }

  next();
});


// Indexes for better performance
parliamentSchema.index({ name: 1 });
parliamentSchema.index({ state_id: 1 });
parliamentSchema.index({ division_id: 1 });
parliamentSchema.index({ category: 1 });
parliamentSchema.index({ regional_type: 1 });

module.exports = mongoose.model('Parliament', parliamentSchema);