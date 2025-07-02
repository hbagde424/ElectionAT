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
    min: [0, 'Spent amount cannot be negative'],
    validate: {
      validator: function(value) {
        return value <= this.total_budget;
      },
      message: 'Spent amount cannot exceed total budget'
    }
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
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value >= this.start_date;
      },
      message: 'Actual end date must be after start date'
    }
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
  documents: [{
    name: {
      type: String,
      required: [true, 'Document name is required'],
      trim: true,
      maxlength: [200, 'Document name cannot exceed 200 characters']
    },
    url: {
      type: String,
      required: [true, 'Document URL is required'],
      trim: true,
      validate: {
        validator: function(v) {
          return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v);
        },
        message: props => `${props.value} is not a valid URL!`
      }
    },
    uploaded_at: {
      type: Date,
      default: Date.now
    }
  }],
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
workStatusSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Virtual population
workStatusSchema.virtual('division', {
  ref: 'Division',
  localField: 'division_id',
  foreignField: '_id',
  justOne: true
});

workStatusSchema.virtual('parliament', {
  ref: 'Parliament',
  localField: 'parliament_id',
  foreignField: '_id',
  justOne: true
});

workStatusSchema.virtual('assembly', {
  ref: 'Assembly',
  localField: 'assembly_id',
  foreignField: '_id',
  justOne: true
});

workStatusSchema.virtual('block', {
  ref: 'Block',
  localField: 'block_id',
  foreignField: '_id',
  justOne: true
});

workStatusSchema.virtual('booth', {
  ref: 'Booth',
  localField: 'booth_id',
  foreignField: '_id',
  justOne: true
});

workStatusSchema.virtual('creator', {
  ref: 'User',
  localField: 'created_by',
  foreignField: '_id',
  justOne: true
});

workStatusSchema.virtual('updater', {
  ref: 'User',
  localField: 'updated_by',
  foreignField: '_id',
  justOne: true
});

// Indexes for better performance
workStatusSchema.index({ work_name: 'text', description: 'text', falia: 'text' });
workStatusSchema.index({ status: 1, department: 1 });
workStatusSchema.index({ approved_fund_from: 1 });
workStatusSchema.index({ 
  division_id: 1, 
  parliament_id: 1, 
  assembly_id: 1,
  block_id: 1,
  booth_id: 1
});
workStatusSchema.index({ start_date: 1, expected_end_date: 1 });

module.exports = mongoose.model('WorkStatus', workStatusSchema);