const mongoose = require('mongoose');

const boothSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  booth_number: {
    type: String,
    required: true,
    trim: true
  },
  full_address: {
    type: String,
    required: true
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  },
  block_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
    required: true
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: true
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: true
  },
  district_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    required: false
  },
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: true
  },
  state_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: true
  },
    updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // or 'Admin'
    required: false
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // or 'Admin'
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

boothSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Booth', boothSchema);
