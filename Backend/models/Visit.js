const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  state_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: false,
    index: true
  },
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: false,
    index: true
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: false,
    index: true
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: false,
    index: true
  },
  block_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
    required: false, // Made optional
    index: true
  },
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: false, // Made optional
    index: true
  },
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: false
  },
  election_year_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElectionYear',
    required: false,
    index: true
  },
  post: {
    type: String,
    required: false,
    trim: true,
    maxlength: [100, 'Post cannot exceed 100 characters']
  },
  date: {
    type: Date,
    required: false
  },
  work_status: {
    type: String,
    enum: ['announced', 'approved', 'in progress', 'complete', 'other', 'speech subject', 'N/A'],
    default: 'announced',
    required: false
  },
  // New fields requested
  workName: {
    type: String,
    trim: true,
    maxlength: [200, 'Work name cannot exceed 200 characters']
  },
  visitAgenda: {
    type: String,
    trim: true,
    maxlength: [1000, 'Visit agenda cannot exceed 1000 characters']
  },
  speechFiveLines: {
    type: String,
    trim: true,
    maxlength: [2000, 'Speech five lines cannot exceed 2000 characters']
  },
  speechIssue: {
    type: String,
    trim: true,
    maxlength: [2000, 'Speech issue cannot exceed 2000 characters']
  },
  announcementDate: {
    type: Date
  },
  completionDate: {
    type: Date
  },
  budgetAnnouncedDate: {
    type: Date
  },
  documents: [
    {
      name: { type: String, trim: true },
      filePath: { type: String, trim: true }
    }
  ],
  remark: {
    type: String,
    trim: true,
    maxlength: [500, 'Remark cannot exceed 500 characters']
  },
  // New fields for location data
  longitude: {
    type: Number,
    required: false,
    min: -180,
    max: 180
  },
  latitude: {
    type: Number,
    required: false,
    min: -90,
    max: 90
  },
  locationName: {
    type: String,
    trim: true,
    maxlength: [200, 'Location name cannot exceed 200 characters']
  },
    description: {
    type: String,
    default: ''
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
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

// Indexes for geospatial queries
visitSchema.index({ location: '2dsphere' });

// Update timestamp and updated_by before saving
visitSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  if (this.isNew) {
    this.created_at = this.updated_at;
  }
  next();
});

// Indexes for better performance
visitSchema.index({ booth_id: 1, date: -1 }); // For getting visits by booth sorted by date
visitSchema.index({ work_status: 1 }); // Index for work_status field

module.exports = mongoose.model('Visit', visitSchema);