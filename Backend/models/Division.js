const mongoose = require('mongoose');

const DivisionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  state: {
    type: String,
    required: true,
  },
  stateCode: {
    type: String,
    required: true,
  },
  districts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
  }],
});

module.exports = mongoose.model('Division', DivisionSchema);