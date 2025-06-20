const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: [true, 'Party reference is required']
  },
  assembly: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'assemblyModel',
    required: [true, 'Assembly reference is required']
  },
  assemblyModel: {
    type: String,
    required: [true, 'Assembly model type is required'],
    enum: ['Division', 'Parliament', 'Block', 'Assembly'],
    default: 'Assembly'
  },
  election_year: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Year',
    required: [true, 'Election year is required']
  },
  caste: {
    type: String,
    required: [true, 'Caste is required'],
    trim: true,
    enum: ['General', 'OBC', 'SC', 'ST', 'Other'],
    default: 'General'
  },
  votes: {
    type: Number,
    default: 0,
    min: [0, 'Votes cannot be negative']
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
    validate: {
      validator: function(v) {
        return v === '' || /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  is_active: {
    type: Boolean,
    default: true
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
candidateSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
candidateSchema.index({ name: 'text' }); // For text search on names
candidateSchema.index({ caste: 1 }); // For filtering by caste
candidateSchema.index({ assembly: 1, election_year: 1, party: 1 }, { unique: true });

module.exports = mongoose.model('Candidate', candidateSchema);