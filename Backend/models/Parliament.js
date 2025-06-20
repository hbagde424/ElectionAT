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
  election_year_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElectionYear',
    required: false // Change to true if this field is mandatory
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
