const mongoose = require('mongoose');

const boothVolunteersSchema = new mongoose.Schema({
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: true
  },
  party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  area_responsibility: {
    type: String,
    trim: true
  },
  activity_level: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  remarks: {
    type: String,
    trim: true
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

boothVolunteersSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('BoothVolunteers', boothVolunteersSchema);