const mongoose = require('mongoose');

const codingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid mobile number!`
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  facebook: {
    type: String,
    trim: true
  },
  instagram: {
    type: String,
    trim: true
  },
  twitter: {
    type: String,
    trim: true
  },
  whatsapp_number: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid WhatsApp number!`
    }
  },
  coding_types: {
    type: [{
      type: String,
      enum: ['BC', 'PP', 'IP', 'FH', 'SMM', 'MS', 'FP', 'ER', 'AK', 'FM', 'वरिष्ठ', 'युवा', 'वोटर प्रभारी']
    }],
    required: [true, 'At least one coding type is required'],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: props => 'At least one coding type is required'
    }
  },
  state_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: [true, 'State reference is required'],
    index: true
  },
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: [true, 'Division reference is required'],
    index: true
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: [true, 'Parliament reference is required'],
    index: true
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: [true, 'Assembly reference is required'],
    index: true
  },
  block_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
    required: [true, 'Block reference is required'],
    index: true
  },
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: [true, 'Booth reference is required'],
    index: true
  },
    description: {
    type: String,
    default: ''
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator reference is required']
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update timestamp before saving
codingSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Indexes for better performance
codingSchema.index({ name: 1, mobile: 1 });
codingSchema.index({ coding_types: 1 });
codingSchema.index({ 
  state_id: 1,
  division_id: 1, 
  parliament_id: 1, 
  assembly_id: 1,
  block_id: 1,
  booth_id: 1
});

// Virtual population (same as before)
codingSchema.virtual('state', {
  ref: 'State',
  localField: 'state_id',
  foreignField: '_id',
  justOne: true
});

// Virtual population
codingSchema.virtual('state', {
  ref: 'State',
  localField: 'state_id',
  foreignField: '_id',
  justOne: true
});

codingSchema.virtual('division', {
  ref: 'Division',
  localField: 'division_id',
  foreignField: '_id',
  justOne: true
});

codingSchema.virtual('parliament', {
  ref: 'Parliament',
  localField: 'parliament_id',
  foreignField: '_id',
  justOne: true
});

codingSchema.virtual('assembly', {
  ref: 'Assembly',
  localField: 'assembly_id',
  foreignField: '_id',
  justOne: true
});

codingSchema.virtual('block', {
  ref: 'Block',
  localField: 'block_id',
  foreignField: '_id',
  justOne: true
});

codingSchema.virtual('booth', {
  ref: 'Booth',
  localField: 'booth_id',
  foreignField: '_id',
  justOne: true
});

codingSchema.virtual('creator', {
  ref: 'User',
  localField: 'created_by',
  foreignField: '_id',
  justOne: true
});

codingSchema.virtual('updater', {
  ref: 'User',
  localField: 'updated_by',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Coding', codingSchema);