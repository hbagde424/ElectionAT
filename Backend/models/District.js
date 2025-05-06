const mongoose = require('mongoose');

const DistrictSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  dtCode: {
    type: String,
    required: true,
    unique: true,
  },
  division: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: true,
  },
  parliament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: true,
  },
  assemblies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
  }],
});

module.exports = mongoose.model('District', DistrictSchema);