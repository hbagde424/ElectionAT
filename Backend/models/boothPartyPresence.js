const mongoose = require('mongoose');

const boothPartyPresenceSchema = new mongoose.Schema({
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
  local_unit_head_name: String,
  head_phone: String,
  registered_members: Number,
  has_booth_committee: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
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

boothPartyPresenceSchema.index({ booth_id: 1, party_id: 1 }, { unique: true });

boothPartyPresenceSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('BoothPartyPresence', boothPartyPresenceSchema);