const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Block name is required'],
    trim: true,
    maxlength: [100, 'Block name cannot exceed 100 characters'],
    example: "Block A"
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: [true, 'Assembly reference is required'],
    example: "507f1f77bcf86cd799439011"
  },
  created_at: {
    type: Date,
    default: Date.now,
    example: "2023-05-15T10:00:00Z"
  },
  updated_at: {
    type: Date,
    default: Date.now,
    example: "2023-05-15T10:00:00Z"
  }
});

// Update timestamp before saving
blockSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Block', blockSchema);