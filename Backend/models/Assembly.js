const mongoose = require('mongoose');

const AssemblySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  acNo: {
    type: String,
    required: true,
    unique: true,
  },
  district: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    required: true,
  },
  parliament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: true,
  },
  division: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: true,
  },
});

module.exports = mongoose.model('Assembly', AssemblySchema);