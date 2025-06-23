const mongoose = require('mongoose');

const divisionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Division name is required'],
    trim: true,
    maxlength: [100, 'Division name cannot exceed 100 characters']
  },
  state_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: [true, 'State reference is required'],
    index: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
divisionSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
divisionSchema.index({ state_id: 1 }); // For getting divisions by state

// Prevent model overwrite in Mongoose
module.exports = mongoose.models.Division || mongoose.model('Division', divisionSchema);