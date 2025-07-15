const mongoose = require('mongoose');

const genderSchema = new mongoose.Schema({
  male: {
    type: Number,
    required: [true, 'Male count is required'],
    min: [0, 'Male count cannot be negative'],
    index: true
  },
  female: {
    type: Number,
    required: [true, 'Female count is required'],
    min: [0, 'Female count cannot be negative'],
    index: true
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
genderSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
genderSchema.index({ male: 1, female: 1 });
genderSchema.index({ 
  state_id: 1,
  division_id: 1, 
  parliament_id: 1, 
  assembly_id: 1,
  block_id: 1,
  booth_id: 1
});

// Virtual population
genderSchema.virtual('state', {
  ref: 'State',
  localField: 'state_id',
  foreignField: '_id',
  justOne: true
});

genderSchema.virtual('division', {
  ref: 'Division',
  localField: 'division_id',
  foreignField: '_id',
  justOne: true
});

genderSchema.virtual('parliament', {
  ref: 'Parliament',
  localField: 'parliament_id',
  foreignField: '_id',
  justOne: true
});

genderSchema.virtual('assembly', {
  ref: 'Assembly',
  localField: 'assembly_id',
  foreignField: '_id',
  justOne: true
});

genderSchema.virtual('block', {
  ref: 'Block',
  localField: 'block_id',
  foreignField: '_id',
  justOne: true
});

genderSchema.virtual('booth', {
  ref: 'Booth',
  localField: 'booth_id',
  foreignField: '_id',
  justOne: true
});

genderSchema.virtual('creator', {
  ref: 'User',
  localField: 'created_by',
  foreignField: '_id',
  justOne: true
});

genderSchema.virtual('updater', {
  ref: 'User',
  localField: 'updated_by',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Gender', genderSchema);