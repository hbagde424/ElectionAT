
const mongoose = require('mongoose');

const boothSurveySchema = new mongoose.Schema({
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: [true, 'Booth reference is required']
  },
  survey_date: {
    type: Date,
    required: [true, 'Survey date is required'],
    default: Date.now
  },
  remark: {
    type: String,
    trim: true,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  },
  // New respondent information (optional)
  respondent_name: {
    type: String,
    trim: true,
    maxlength: [200, 'Respondent name cannot exceed 200 characters']
  },
  respondent_mobile: {
    type: String,
    trim: true,
    maxlength: [20, 'Respondent mobile cannot exceed 20 characters']
  },
  // Survey question fields (panchayat level)
  q3: { type: String },
  q4: { type: String },
  q5: { type: String },
  q6: { type: String },
  q7: { type: String },
  q8: { type: String },
  q9: { type: String },
  q10: { type: String },
  q11: { type: String },
  q12: { type: String },
  q13: { type: String },
  q14: { type: String },
  q15: { type: String },
  q16: { type: String },
  q17: { type: String },
  q18: { type: String },
  q19: { type: String },
  q20: { type: String },
  q21: { type: String },
  q22: { type: String },
  q23: { type: String },
  q24: { type: String },
  q25: { type: String },
  q26: { type: String },
  q27: { type: String },
  q28: { type: String },
  q29: { type: String },
  q30: { type: String },
  q31: { type: String },
  q32: { type: String },
  // Free text answers
  q33: { type: String },
  q34: { type: String },
  q35: { type: String },
  q36: { type: String },
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
boothSurveySchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
boothSurveySchema.index({ booth_id: 1 });
boothSurveySchema.index({ survey_date: -1 });
boothSurveySchema.index({
  state_id: 1,
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

// surveyor virtual removed (survey_done_by field removed)

module.exports = mongoose.model('BoothSurvey', boothSurveySchema);