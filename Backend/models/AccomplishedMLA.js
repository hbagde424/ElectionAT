const mongoose = require('mongoose');

const accomplishedMLASchema = new mongoose.Schema({
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: [true, 'Assembly reference is required']
  },
  party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: [true, 'Party reference is required']
  },
  name: {
    type: String,
    required: [true, 'MLA name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  term_start: {
    type: Date,
    required: [true, 'Term start date is required']
  },
  term_end: {
    type: Date,
    validate: {
      validator: function(value) {
        return value > this.term_start;
      },
      message: 'Term end must be after term start'
    }
  },
  achievements: {
    type: [String],
    validate: {
      validator: function(value) {
        return value.length <= 20; // Maximum 20 achievements
      },
      message: 'Cannot have more than 20 achievements'
    }
  },
  contact_info: {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please fill a valid 10-digit phone number']
    },
    address: {
      type: String,
      maxlength: [200, 'Address cannot exceed 200 characters']
    }
  },
  is_current: {
    type: Boolean,
    default: false
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

// Update timestamp before saving
accomplishedMLASchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Ensure only one current MLA per assembly
accomplishedMLASchema.pre('save', async function(next) {
  if (this.is_current) {
    await mongoose.model('AccomplishedMLA').updateMany(
      { assembly_id: this.assembly_id, _id: { $ne: this._id } },
      { $set: { is_current: false } }
    );
  }
  next();
});

// Indexes for faster queries
accomplishedMLASchema.index({ assembly_id: 1 });
accomplishedMLASchema.index({ party_id: 1 });
accomplishedMLASchema.index({ is_current: 1 });

module.exports = mongoose.model('AccomplishedMLA', accomplishedMLASchema);