const mongoose = require('mongoose');

const otpTokenSchema = new mongoose.Schema({
  purpose: {
    type: String,
    required: true,
    enum: ['csv_export', 'bla_phone_reveal']
  },
  codeHash: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    enum: ['sms'],
    default: 'sms'
  },
  sentTo: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  usedAt: {
    type: Date,
    default: null
  },
  attempts: {
    type: Number,
    default: 0
  },
  meta: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// TTL index to automatically clean up expired tokens (expire 1 minute after expiresAt)
otpTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 });

module.exports = mongoose.model('OtpToken', otpTokenSchema);
