const mongoose = require('mongoose');

const workStatusSchema = new mongoose.Schema({
  work_name: {
    type: String,
    required: [true, 'Work name is required'],
    trim: true,
    maxlength: [200, 'Work name cannot exceed 200 characters']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    maxlength: [100, 'Department name cannot exceed 100 characters']
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Halted', 'Cancelled'],
    default: 'Pending'
  },
  approved_fund: {
    type: Number,
    required: [true, 'Approved fund is required'],
    min: [0, 'Approved fund cannot be negative']
  },
  total_budget: {
    type: Number,
    required: [true, 'Total budget is required'],
    min: [0, 'Total budget cannot be negative']
  },
  falia: {
    type: String,
    trim: true,
    maxlength: [200, 'Falia name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
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
});

// Update timestamp before saving
workStatusSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
workStatusSchema.index({ work_name: 'text' }); // For text search on work names
workStatusSchema.index({ status: 1 }); // For filtering by status
workStatusSchema.index({ booth_id: 1, status: 1 }); // For getting works by booth and status
workStatusSchema.index({ created_by: 1 }); // For getting works by creator

module.exports = mongoose.model('WorkStatus', workStatusSchema);