const mongoose = require('mongoose');

const assemblySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Assembly name is required'],
    trim: true,
    maxlength: [100, 'Assembly name cannot exceed 100 characters'],
    example: "Lucknow West"
  },
  type: {
    type: String,
    enum: {
      values: ['Urban', 'Rural', 'Mixed'],
      message: 'Please select valid type (Urban, Rural, Mixed)'
    },
    required: [true, 'Assembly type is required'],
    example: "Urban"
  },
  district_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    required: [true, 'District reference is required'],
    example: "507f1f77bcf86cd799439011"
  },
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: [true, 'Division reference is required'],
    example: "507f1f77bcf86cd799439012"
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: [true, 'Parliament reference is required'],
    example: "507f1f77bcf86cd799439013"
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

module.exports = mongoose.model('Assembly', assemblySchema);