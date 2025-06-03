const mongoose = require('mongoose');

const boothSurveySchema = new mongoose.Schema({
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: [true, 'Booth reference is required']
  },
  survey_done_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Surveyor reference is required']
  },
  survey_date: {
    type: Date,
    required: [true, 'Survey date is required'],
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Verified', 'Rejected'],
    default: 'Pending'
  },
  remark: {
    type: String,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
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
boothSurveySchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Indexes for faster queries
boothSurveySchema.index({ booth_id: 1 });
boothSurveySchema.index({ survey_done_by: 1 });
boothSurveySchema.index({ status: 1 });

module.exports = mongoose.model('BoothSurvey', boothSurveySchema);