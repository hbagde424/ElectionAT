const mongoose = require('mongoose');

const boothVolunteersSchema = new mongoose.Schema({
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: true,
    index: true
  },
  party_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true,
    index: true
  },
  state_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: true,
    index: true
  },
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: true,
    index: true
  },
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: true,
    index: true
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: true,
    index: true
  },
  block_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
    required: true,
    index: true
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
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
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
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
boothVolunteersSchema.index({ name: 'text' });
boothVolunteersSchema.index({ phone: 1 });
boothVolunteersSchema.index({ state_id: 1, division_id: 1 });
boothVolunteersSchema.index({ assembly_id: 1, parliament_id: 1 });

// Virtual population
boothVolunteersSchema.virtual('booth', {
  ref: 'Booth',
  localField: 'booth_id',
  foreignField: '_id',
  justOne: true
});

boothVolunteersSchema.virtual('party', {
  ref: 'Party',
  localField: 'party_id',
  foreignField: '_id',
  justOne: true
});

boothVolunteersSchema.virtual('state', {
  ref: 'State',
  localField: 'state_id',
  foreignField: '_id',
  justOne: true
});

boothVolunteersSchema.virtual('division', {
  ref: 'Division',
  localField: 'division_id',
  foreignField: '_id',
  justOne: true
});

boothVolunteersSchema.virtual('assembly', {
  ref: 'Assembly',
  localField: 'assembly_id',
  foreignField: '_id',
  justOne: true
});

boothVolunteersSchema.virtual('parliament', {
  ref: 'Parliament',
  localField: 'parliament_id',
  foreignField: '_id',
  justOne: true
});

boothVolunteersSchema.virtual('block', {
  ref: 'Block',
  localField: 'block_id',
  foreignField: '_id',
  justOne: true
});

boothVolunteersSchema.virtual('creator', {
  ref: 'User',
  localField: 'created_by',
  foreignField: '_id',
  justOne: true
});

boothVolunteersSchema.virtual('updater', {
  ref: 'User',
  localField: 'updated_by',
  foreignField: '_id',
  justOne: true
});

// Pre-save hook to auto-populate geographic references
boothVolunteersSchema.pre('save', async function(next) {
  try {
    this.updated_at = Date.now();
    
    if (this.isNew) {
      // Auto-populate state, division, assembly, parliament, block if not provided
      if (!this.state_id || !this.division_id || !this.assembly_id || !this.parliament_id || !this.block_id) {
        const booth = await mongoose.model('Booth').findById(this.booth_id)
          .select('state_id division_id assembly_id parliament_id block_id');
        
        if (booth) {
          this.state_id = this.state_id || booth.state_id;
          this.division_id = this.division_id || booth.division_id;
          this.assembly_id = this.assembly_id || booth.assembly_id;
          this.parliament_id = this.parliament_id || booth.parliament_id;
          this.block_id = this.block_id || booth.block_id;
        }
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('BoothVolunteers', boothVolunteersSchema);