const mongoose = require('mongoose');

const ParliamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  pcCode: {
    type: String,
    required: true,
    unique: true,
  },
  division: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: true, 
  },
  districts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
  }],
});

module.exports = mongoose.model('Parliament', ParliamentSchema);