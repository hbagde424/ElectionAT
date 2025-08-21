const mongoose = require('mongoose');

const scopeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['State', 'Division', 'Assembly', 'Parliament', 'Block', 'Booth'],
    required: true
  },
  name: { type: String, required: true },
});

module.exports = mongoose.model('Scope', scopeSchema);
