const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  caste: {
    type: String,
    required: [true, 'Caste is required'],
    trim: true,
    enum: ['General', 'OBC', 'SC', 'ST', 'Other'],
    default: 'General'
  },
  criminal_cases: {
    type: Number,
    default: 0,
    min: [0, 'Criminal cases cannot be negative']
  },
  assets: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  liabilities: {
    type: String,
    trim: true
  },
  education: {
    type: String,
    trim: true
  },
  photo: {
    type: String,
    default: '',
    validate: {
      validator: function (v) {
        // Allow empty string or valid URL or local path
        if (v === '') return true;
        if (/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v)) return true;
        if (v.startsWith('/uploads/candidate/')) return true;
        return false;
      },
      message: props => `Invalid photo path: ${props.value}. Must be empty, a URL, or start with /uploads/candidate/`
    }
  },
  party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: false
  },
  is_active: {
    type: Boolean,
    default: true
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

// Update timestamp before saving
candidateSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Candidate', candidateSchema);