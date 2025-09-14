const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['General Questions', 'Account & Login', 'Data & Analytics', 'Technical Support', 'Other'],
    default: 'General Questions'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  order_index: {
    type: Number,
    default: 0
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
});

// Index for better search performance
faqSchema.index({ category: 1, is_active: 1 });
faqSchema.index({ question: 'text', answer: 'text' });

// Pre-save middleware to update the updated_at field
faqSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('FAQ', faqSchema);