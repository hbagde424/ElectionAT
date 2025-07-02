const mongoose = require('mongoose');

const boothSurveySchema = new mongoose.Schema({
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: [true, 'Booth reference is required'],
    index: true
  },
  survey_done_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Surveyor reference is required'],
    index: true
  },
  survey_date: {
    type: Date,
    required: [true, 'Survey date is required'],
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Verified', 'Rejected'],
    default: 'Pending',
    index: true
  },
  remark: {
    type: String,
    trim: true,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  },
  poll_result: {
    type: String,
    trim: true,
    maxlength: [200, 'Poll result cannot exceed 200 characters']
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
boothSurveySchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
boothSurveySchema.index({ booth_id: 1, status: 1 });
boothSurveySchema.index({ survey_done_by: 1, survey_date: -1 });
boothSurveySchema.index({ 
  division_id: 1, 
  parliament_id: 1, 
  assembly_id: 1, 
  block_id: 1 
});

// Virtual population
boothSurveySchema.virtual('booth', {
  ref: 'Booth',
  localField: 'booth_id',
  foreignField: '_id',
  justOne: true
});

boothSurveySchema.virtual('surveyor', {
  ref: 'User',
  localField: 'survey_done_by',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('BoothSurvey', boothSurveySchema);