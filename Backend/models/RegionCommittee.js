const mongoose = require('mongoose');

const regionCommitteeSchema = new mongoose.Schema({
  region_type: {
    type: String,
    enum: ['Division', 'Parliament', 'Assembly', 'Block'],
    required: true
  },
  region_ids: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'region_type'  // dynamic reference based on region_type
    }
  ],
  committee_name: {
    type: String,
    trim: true
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

module.exports = mongoose.model('RegionCommittee', regionCommitteeSchema);