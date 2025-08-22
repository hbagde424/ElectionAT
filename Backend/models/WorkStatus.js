const mongoose = require('mongoose');

const workStatusSchema = new mongoose.Schema({
  work_name: {
    type: String,
    required: [true, 'Work name is required'],
    trim: true,
    maxlength: [200, 'Work name cannot exceed 200 characters'],
    index: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    maxlength: [100, 'Department name cannot exceed 100 characters'],
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ['Pending', 'In Progress', 'Completed', 'Halted', 'Cancelled'],
      message: 'Status must be Pending, In Progress, Completed, Halted, or Cancelled'
    },
    default: 'Pending',
    index: true
  },
  work_type: {
    type: String,
    enum: {
      values: ['infrastructure', 'social', 'education', 'health', 'other'],
      message: 'Work type must be infrastructure, social, education, health, or other'
    },
    required: [true, 'Work type is required'],
    index: true
  },
  approved_fund_from: {
    type: String,
    enum: {
      values: ['vidhayak nidhi', 'swechcha nidhi'],
      message: 'Approved fund source must be either vidhayak nidhi or swechcha nidhi'
    },
    required: [true, 'Approved fund source is required'],
    index: true
  },
  total_budget: {
    type: Number,
    required: [true, 'Total budget is required'],
    min: [0, 'Total budget cannot be negative']
  },
  spent_amount: {
    type: Number,
    default: 0,
    min: [0, 'Spent amount cannot be negative']
    // ❌ Removed schema validator here to avoid duplicate messages
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
  start_date: {
    type: Date,
    required: [true, 'Start date is required']
  },
  expected_end_date: {
    type: Date,
    required: [true, 'Expected end date is required']
  },
  actual_end_date: {
    type: Date
    // ❌ Removed schema validator here to avoid duplicate messages
  },
  state_id: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true, index: true },
  division_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Division', required: true, index: true },
  parliament_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Parliament', required: true, index: true },
  assembly_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Assembly', required: true, index: true },
  block_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Block', required: true, index: true },
  booth_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booth', required: true },

  documents: [{
    name: { type: String, required: true, trim: true, maxlength: 200 },
    url: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: v => /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v),
        message: props => `${props.value} is not a valid URL!`
      }
    },
    uploaded_at: { type: Date, default: Date.now }
  }],

  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

workStatusSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('WorkStatus', workStatusSchema);
