const mongoose = require('mongoose');

const partyActivitySchema = new mongoose.Schema({
  party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: [true, 'Party reference is required'],
    index: true
  },
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    index: true
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: [true, 'Parliament reference is required'],
    index: true
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    index: true
  },
  block_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
    index: true
  },
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    index: true
  },
  activity_type: {
    type: String,
    enum: {
      values: ['rally', 'sabha', 'meeting', 'campaign', 'door_to_door', 'press_conference'],
      message: 'Invalid activity type'
    },
    required: [true, 'Activity type is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  activity_date: {
    type: Date,
    required: [true, 'Activity date is required'],
    index: true
  },
  end_date: {
    type: Date,
    validate: {
      validator: function (value) {
        // During updates, this.activity_date might not be available
        const activityDate = this.activity_date || this.getUpdate().$set.activity_date;
        return !value || !activityDate || new Date(value) >= new Date(activityDate);
      },
      message: 'End date must be after activity date'
    }
  },
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['scheduled', 'completed', 'cancelled', 'postponed'],
      message: 'Invalid status'
    },
    default: 'scheduled',
    index: true
  },
  attendance_count: {
    type: Number,
    min: [0, 'Attendance count cannot be negative']
  },
  media_coverage: {
    type: Boolean,
    default: false
  },
  media_links: [{
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  }],
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator user reference is required']
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Update timestamp before saving
partyActivitySchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

// Virtual population
partyActivitySchema.virtual('party', {
  ref: 'Party',
  localField: 'party_id',
  foreignField: '_id',
  justOne: true
});

partyActivitySchema.virtual('division', {
  ref: 'Division',
  localField: 'division_id',
  foreignField: '_id',
  justOne: true
});

partyActivitySchema.virtual('parliament', {
  ref: 'Parliament',
  localField: 'parliament_id',
  foreignField: '_id',
  justOne: true
});

partyActivitySchema.virtual('assembly', {
  ref: 'Assembly',
  localField: 'assembly_id',
  foreignField: '_id',
  justOne: true
});

partyActivitySchema.virtual('block', {
  ref: 'Block',
  localField: 'block_id',
  foreignField: '_id',
  justOne: true
});

partyActivitySchema.virtual('booth', {
  ref: 'Booth',
  localField: 'booth_id',
  foreignField: '_id',
  justOne: true
});

partyActivitySchema.virtual('creator', {
  ref: 'User',
  localField: 'created_by',
  foreignField: '_id',
  justOne: true
});

partyActivitySchema.virtual('updater', {
  ref: 'User',
  localField: 'updated_by',
  foreignField: '_id',
  justOne: true
});

// Indexes for better performance
partyActivitySchema.index({ title: 'text', description: 'text', location: 'text' });
partyActivitySchema.index({
  party_id: 1,
  division_id: 1,
  parliament_id: 1,
  assembly_id: 1,
  block_id: 1,
  activity_type: 1,
  status: 1
});
partyActivitySchema.index({ activity_date: -1 });

module.exports = mongoose.model('PartyActivity', partyActivitySchema);