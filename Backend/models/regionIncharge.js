const mongoose = require('mongoose');

const regionInchargeSchema = new mongoose.Schema({
  committee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RegionCommittee',
    required: [true, 'Committee reference is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    trim: true,
    maxlength: [100, 'Designation cannot exceed 100 characters']
  },
  role: {
    type: String,
    enum: ['incharge', 'coordinator', 'member'],
    default: 'member',
    required: true
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

// Indexes
regionInchargeSchema.index({ committee_id: 1, role: 1 }); // For getting incharges by committee and role
regionInchargeSchema.index({ phone: 1 }, { unique: true }); // Phone should be unique
regionInchargeSchema.index({ email: 1 }, { unique: true, sparse: true }); // Email should be unique if provided

// Update timestamp before saving
regionInchargeSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('RegionIncharge', regionInchargeSchema);