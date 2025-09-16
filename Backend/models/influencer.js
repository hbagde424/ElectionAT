const mongoose = require('mongoose');

const influencerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contact_number: {
    type: String,
    required: true,
    trim: true
  },
  alternate_number: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  full_address: {
    type: String,
    required: true
  },
  state_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: true
  },
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: true
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: true
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: true
  },
  block_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
    required: true
  },
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: true
  },
  category: {
    type: String,
    enum: [
      'Political Leader',
      'Community Leader',
      'Religious Leader', 
      'Business Leader',
      'Social Activist',
      'Media Person',
      'Celebrity',
      'Youth Leader',
      'Women Leader',
      'Other'
    ],
    default: 'Other'
  },
  caste: {
    type: String,
    enum: [
      'General',
      'OBC',
      'SC',
      'ST',
      'Minority',
      'Other',
      'Not Specified'
    ],
    default: 'Not Specified'
  },
  party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: false
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  social_media_links: [{
    platform: {
      type: String,
      required: true,
      enum: ['Facebook', 'Twitter', 'Instagram', 'LinkedIn', 'YouTube', 'WhatsApp', 'Telegram', 'Other']
    },
    link: {
      type: String,
      required: true,
      trim: true
    },
    followers: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
    description: {
    type: String,
    default: ''
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updated_by: {
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
});

influencerSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Influencer', influencerSchema);