const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  level: { 
    type: String, 
    enum: ['State', 'Division', 'Assembly', 'Parliament', 'Block', 'Booth'],
    required: true
  }
});

module.exports = mongoose.model('Permission', permissionSchema);
