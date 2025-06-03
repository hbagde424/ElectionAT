const mongoose = require('mongoose');

const localNewsSchema = new mongoose.Schema({
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: [true, 'Booth reference is required'],
    index: true
  },
  headline: {
    type: String,
    required: [true, 'Headline is required'],
    trim: true,
    maxlength: [200, 'Headline cannot exceed 200 characters']
  },
  source: {
    type: String,
    required: [true, 'Source is required'],
    trim: true,
    maxlength: [100, 'Source name cannot exceed 100 characters']
  },
  published_date: {
    type: Date,
    required: [true, 'Published date is required'],
    default: Date.now
  },
  news_url: {
    type: String,
    required: [true, 'News URL is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
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
localNewsSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
localNewsSchema.index({ booth_id: 1, published_date: -1 }); // For getting news by booth sorted by date
localNewsSchema.index({ headline: 'text' }); // For text search on headlines

module.exports = mongoose.model('LocalNews', localNewsSchema);