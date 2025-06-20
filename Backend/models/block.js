const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Block name is required'],
    trim: true,
    maxlength: [100, 'Block name cannot exceed 100 characters'],
    unique: true
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: [true, 'Assembly reference is required']
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

// Update timestamp and updated_by before saving
blockSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  
  // If this is an update operation, set updated_by
  if (this.isModified() && !this.isNew) {
    // Assuming we have access to the user making the change
    // In your controller, you'll need to set this value
    // For example: block.updated_by = req.user.id
  }
  
  next();
});

// Indexes for better performance
blockSchema.index({ name: 'text' }); // For text search on names
blockSchema.index({ assembly_id: 1 });
blockSchema.index({ category: 1 });
blockSchema.index({ is_active: 1 });

module.exports = mongoose.model('Block', blockSchema);