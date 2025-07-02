const mongoose = require('mongoose');

const potentialCandidateSchema = new mongoose.Schema({
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
  constituency_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: [true, 'Constituency reference is required']
  },
  history: {
    type: String,
    trim: true,
    maxlength: [1000, 'History cannot exceed 1000 characters']
  },
  post_details: {
    postname: { 
      type: String, 
      required: [true, 'Post name is required'],
      maxlength: [100, 'Post name cannot exceed 100 characters']
    },
    from_date: { 
      type: Date, 
      required: [true, 'From date is required'] 
    },
    to_date: { 
      type: Date, 
      required: [true, 'To date is required'] 
    },
    place: { 
      type: String, 
      required: [true, 'Place is required'],
      maxlength: [100, 'Place cannot exceed 100 characters']
    }
  },
  pros: {
    type: String,
    trim: true,
    maxlength: [500, 'Pros cannot exceed 500 characters']
  },
  cons: {
    type: String,
    trim: true,
    maxlength: [500, 'Cons cannot exceed 500 characters']
  },
  election_year_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElectionYear',
    required: [true, 'Election year reference is required']
  },
  supporter_candidates: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate'
    }
  ],
  image: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'under_review'],
      message: 'Status must be either active, inactive, or under_review'
    },
    default: 'under_review'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
potentialCandidateSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
potentialCandidateSchema.index({ name: 1 });
potentialCandidateSchema.index({ party_id: 1 });
potentialCandidateSchema.index({ constituency_id: 1 });
potentialCandidateSchema.index({ election_year_id: 1 });
potentialCandidateSchema.index({ status: 1 });
potentialCandidateSchema.index({ 'post_details.postname': 'text', history: 'text', pros: 'text', cons: 'text' });

module.exports = mongoose.model('PotentialCandidate', potentialCandidateSchema);