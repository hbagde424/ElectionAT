const mongoose = require('mongoose');

const parliamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
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
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: false // Make true if every parliament must map to one assembly
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // or 'Admin' depending on your auth model
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

parliamentSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Parliament', parliamentSchema);