const mongoose = require('mongoose');

const ChangeSchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
    from: { type: mongoose.Schema.Types.Mixed, default: null },
    to: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { _id: false }
);

const ActivityLogSchema = new mongoose.Schema(
  {
    // Who
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  userEmail: { type: String, index: true },
  userName: { type: String, index: true },
    role: { type: String, index: true },

    // What
    action: {
      type: String,
      enum: ['LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'DOWNLOAD'],
      required: true,
      index: true
    },

    // On which resource
    entity: { type: String, index: true }, // e.g., 'ActiveParty'
    entityId: { type: String, index: true },

    // Request context
    endpoint: { type: String },
    method: { type: String },
    ip: { type: String },
    userAgent: { type: String },

    // Result
    success: { type: Boolean, default: true, index: true },
  message: { type: String },
  remark: { type: String },

    // Details
    changes: [ChangeSchema], // for UPDATE actions
    meta: { type: mongoose.Schema.Types.Mixed }, // any extra details
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

ActivityLogSchema.index({ timestamp: -1 });
ActivityLogSchema.index({ entity: 1, action: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
