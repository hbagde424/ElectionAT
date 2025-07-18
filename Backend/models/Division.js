const mongoose = require('mongoose');

const divisionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Division name is required'],
    trim: true,
    maxlength: [100, 'Division name cannot exceed 100 characters']
  },
  division_code: {
    type: String,
    required: [true, 'Division code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [20, 'Division code cannot exceed 20 characters']
  },
  state_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: [true, 'State reference is required'],
    index: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Make sure this matches your User model name
    required: [true, 'Creator reference is required']
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Make sure this matches your User model name
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

// Static method for checking if division code is taken
divisionSchema.statics.isDivisionCodeTaken = async function(divisionCode, excludeDivisionId) {
  const division = await this.findOne({ division_code: divisionCode, _id: { $ne: excludeDivisionId } });
  return !!division;
};

// Indexes
divisionSchema.index({ division_code: 1 }, { unique: true });
divisionSchema.index({ state_id: 1 });

module.exports = mongoose.models.Division || mongoose.model('Division', divisionSchema);