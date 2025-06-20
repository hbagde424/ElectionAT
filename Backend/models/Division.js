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
  election_year_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElectionYear',
    required: false,
    index: true
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

// Update timestamp hook
divisionSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Prevent model overwrite in Mongoose
module.exports = mongoose.models.Division || mongoose.model('Division', divisionSchema);