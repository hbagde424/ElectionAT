const mongoose = require('mongoose');

const parliamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Parliament name is required'],
    trim: true,
    maxlength: [200, 'Parliament name cannot exceed 200 characters']
  },
  parliament_no: {
    type: Number,
    required: [true, 'Parliament number is required'],
    unique: true,
    min: [1, 'Parliament number must be at least 1']
  },
  description: {
    type: String,
    default: ''
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
    enum: {
      values: ['General', 'SC', 'ST', 'OBC'],
      message: 'Please select valid category (General, SC, ST, OBC)'
    },
    default: 'General'
  },
  regional_type: {
    type: String,
    enum: {
      values: ['Urban', 'Rural', 'Semi-Urban', 'Tribal'],
      message: 'Please select valid regional type (Urban, Rural, Semi-Urban, Tribal)'
    },
    default: 'Urban'
  },
  election_year_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElectionYear',
    default: null
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
parliamentSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

// Indexes for search and filtering
parliamentSchema.index({ name: 'text' });
parliamentSchema.index({ parliament_no: 1 });
parliamentSchema.index({ division_id: 1 });

// Guard model registration to avoid OverwriteModelError during hot-reloads or multiple requires
module.exports = mongoose.models.Parliament || mongoose.model('Parliament', parliamentSchema);
