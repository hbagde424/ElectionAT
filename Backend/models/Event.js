const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    maxlength: [100, 'Event name cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: {
      values: ['event', 'campaign', 'activity'],
      message: 'Event type must be either event, campaign, or activity'
    },
    required: [true, 'Event type is required']
  },
  status: {
    type: String,
    enum: {
      values: ['done', 'incomplete', 'cancelled', 'postponed'],
      message: 'Status must be either done, incomplete, cancelled, or postponed'
    },
    default: 'incomplete'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  start_date: {
    type: Date,
    required: [true, 'Start date is required']
  },
  end_date: {
    type: Date,
    required: [true, 'End date is required']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  state_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: [true, 'State reference is required']
  },
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: [true, 'Division reference is required']
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: [true, 'Parliament reference is required']
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: [true, 'Assembly reference is required']
  },
  block_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
    required: [true, 'Block reference is required']
  },
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: [true, 'Booth reference is required']
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
eventSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
eventSchema.index({ name: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ start_date: 1 });
eventSchema.index({ end_date: 1 });
// Add to indexes
eventSchema.index({ state_id: 1 });
eventSchema.index({ division_id: 1 });
eventSchema.index({ parliament_id: 1 });
eventSchema.index({ assembly_id: 1 });
eventSchema.index({ block_id: 1 });
eventSchema.index({ booth_id: 1 });
eventSchema.index({ name: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Event', eventSchema);