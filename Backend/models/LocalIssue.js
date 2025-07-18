const mongoose = require('mongoose');

const localIssueSchema = new mongoose.Schema({
  issue_name: {
    type: String,
    required: [true, 'Issue name is required'],
    trim: true,
    maxlength: [200, 'Issue name cannot exceed 200 characters']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    maxlength: [100, 'Department name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['Reported', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Reported'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  state_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: [true, 'State reference is required'],
    index: true
  },
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: [true, 'Division reference is required'],
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
    required: [true, 'Assembly reference is required'],
    index: true
  },
  block_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
    required: [true, 'Block reference is required'],
    index: true
  },
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: [true, 'Booth reference is required'],
    index: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator reference is required']
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
localIssueSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
localIssueSchema.index({ issue_name: 'text' });
localIssueSchema.index({ status: 1 });
localIssueSchema.index({ priority: 1 });
localIssueSchema.index({ department: 1 });
localIssueSchema.index({
  state_id: 1,
  division_id: 1,
  parliament_id: 1,
  assembly_id: 1,
  block_id: 1,
  booth_id: 1
});

// Virtual population
localIssueSchema.virtual('state', {
  ref: 'State',
  localField: 'state_id',
  foreignField: '_id',
  justOne: true
});

localIssueSchema.virtual('division', {
  ref: 'Division',
  localField: 'division_id',
  foreignField: '_id',
  justOne: true
});

localIssueSchema.virtual('parliament', {
  ref: 'Parliament',
  localField: 'parliament_id',
  foreignField: '_id',
  justOne: true
});

localIssueSchema.virtual('assembly', {
  ref: 'Assembly',
  localField: 'assembly_id',
  foreignField: '_id',
  justOne: true
});

localIssueSchema.virtual('block', {
  ref: 'Block',
  localField: 'block_id',
  foreignField: '_id',
  justOne: true
});

localIssueSchema.virtual('booth', {
  ref: 'Booth',
  localField: 'booth_id',
  foreignField: '_id',
  justOne: true
});

localIssueSchema.virtual('creator', {
  ref: 'User',
  localField: 'created_by',
  foreignField: '_id',
  justOne: true
});

localIssueSchema.virtual('updater', {
  ref: 'User',
  localField: 'updated_by',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('LocalIssue', localIssueSchema);