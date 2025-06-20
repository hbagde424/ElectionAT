const mongoose = require('mongoose');

const partyActivitySchema = new mongoose.Schema({
  party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: [true, 'Party reference is required']
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly'
  },
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth'
  },
  activity_type: {
    type: String,
    enum: {
      values: ['rally', 'sabha', 'meeting', 'campaign', 'door_to_door', 'press_conference'],
      message: 'Invalid activity type'
    },
    required: [true, 'Activity type is required']
  }, 
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true
  },
  activity_date: {
    type: Date,
    required: [true, 'Activity date is required']
  },
  status: {
    type: String,
    enum: {
      values: ['scheduled', 'completed', 'cancelled', 'postponed'],
      message: 'Invalid status'
    },
    default: 'scheduled'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator user reference is required']
  },
  attendance_count: {
    type: Number,
    min: [0, 'Attendance count cannot be negative']
  },
  media_coverage: {
    type: Boolean,
    default: false 
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
partyActivitySchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('PartyActivity', partyActivitySchema);  