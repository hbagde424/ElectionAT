const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: [true, 'Party reference is required']
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: [true, 'Assembly reference is required']
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: [true, 'Parliament reference is required']
  },
  election_year: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElectionYear',
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

// Update timestamp and updated_by before saving
candidateSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  if (this.isNew) {
    this.updated_by = this.created_by;
  }
  next();
});

// Indexes for better performance
candidateSchema.index({ name: 'text' });
candidateSchema.index({ caste: 1 });
candidateSchema.index({ assembly_id: 1, parliament_id: 1, election_year: 1, party_id: 1 }, { unique: true });

module.exports = mongoose.model('Candidate', candidateSchema);