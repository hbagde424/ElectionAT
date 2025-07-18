const mongoose = require('mongoose');

const activePartySchema = new mongoose.Schema({
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: [true, 'Booth reference is required'],
    index: true
  },
  party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: [true, 'Party reference is required'],
    index: true
  },
  Active_status: {
    type: Boolean,
    required: [true, 'Active status is required'],
    default: true
  },
  last_Active_status: {
    type: Boolean,
    required: [true, 'Last active status is required'],
    default: true
  },
  last_updated: {
    type: Date,
    default: Date.now
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps and last status before saving
activePartySchema.pre('save', function(next) {
  if (this.isModified('Active_status')) {
    this.last_Active_status = this.get('last_Active_status') || this.Active_status;
    this.last_updated = Date.now();
  }
  next();
});

// Compound index to ensure unique party per booth
activePartySchema.index({ booth_id: 1, party_id: 1 }, { unique: true });

module.exports = mongoose.model('ActiveParty', activePartySchema);