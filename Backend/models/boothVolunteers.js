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
  assembly_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: true
  },
  parliament_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parliament',
    required: true
  },
  block_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
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

// Add indexes for better query performance
boothVolunteersSchema.index({ booth_id: 1 });
boothVolunteersSchema.index({ party_id: 1 });
boothVolunteersSchema.index({ assembly_id: 1 });
boothVolunteersSchema.index({ parliament_id: 1 });
boothVolunteersSchema.index({ block_id: 1 });

boothVolunteersSchema.pre('save', async function(next) {
  try {
    // Automatically populate the geographic references if not provided
    if (this.isNew) {
      if (!this.assembly_id || !this.parliament_id || !this.block_id) {
        const booth = await mongoose.model('Booth').findById(this.booth_id)
          .select('assembly_id parliament_id block_id');
        
        if (booth) {
          this.assembly_id = this.assembly_id || booth.assembly_id;
          this.parliament_id = this.parliament_id || booth.parliament_id;
          this.block_id = this.block_id || booth.block_id;
        }
      }
    }
    this.updated_at = Date.now();
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('BoothVolunteers', boothVolunteersSchema);