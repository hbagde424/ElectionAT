const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: [true, 'Booth reference is required'],
    index: true
  },
  block_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
    required: [true, 'Block reference is required'],
    index: true
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: [true, 'Assembly reference is required'],
    index: true
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: [true, 'Parliament reference is required'],
    index: true
  },
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: [true, 'Division reference is required'],
    index: true
  },
  person_name: {
    type: String,
    required: [true, 'Person name is required'],
    trim: true,
    maxlength: [100, 'Person name cannot exceed 100 characters']
  },
  post: {
    type: String,
    required: [true, 'Post is required'],
    trim: true,
    maxlength: [100, 'Post cannot exceed 100 characters']
  },
  date: {
    type: Date,
    required: [true, 'Visit date is required']
  },
  declaration: {
    type: String,
    trim: true,
    maxlength: [500, 'Declaration cannot exceed 500 characters']
  },
  remark: {
    type: String,
    trim: true,
    maxlength: [500, 'Remark cannot exceed 500 characters']
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
visitSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
visitSchema.index({ booth_id: 1, date: -1 }); // For getting visits by booth sorted by date
visitSchema.index({ person_name: 'text' }); // For text search on person names

module.exports = mongoose.model('Visit', visitSchema);