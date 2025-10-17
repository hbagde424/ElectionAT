const mongoose = require('mongoose');

const panchayatSchema = new mongoose.Schema({
    // Administrative hierarchy references
    state_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'State',
        required: [true, 'State ID is required']
    },
    division_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Division',
        required: [true, 'Division ID is required']
    },
    parliament_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parliament',
        required: [true, 'Parliament ID is required']
    },
    assembly_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assembly',
        required: [true, 'Assembly ID is required']
    },
    block_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Block',
        required: [true, 'Block ID is required']
    },
    booth_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booth',
        required: [true, 'Booth ID is required']
    },

    // Panchayat specific fields
    panchayat_name: {
        type: String,
        required: [true, 'Panchayat name is required'],
        trim: true,
        maxlength: [100, 'Panchayat name cannot exceed 100 characters']
    },

    // Location fields
    location: {
        type: String,
        trim: true,
        maxlength: [200, 'Location cannot exceed 200 characters']
    },
    latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
    },

    // Population counts
    male_count: {
        type: Number,
        default: 0,
        min: [0, 'Male count cannot be negative']
    },
    female_count: {
        type: Number,
        default: 0,
        min: [0, 'Female count cannot be negative']
    },
    others_count: {
        type: Number,
        default: 0,
        min: [0, 'Others count cannot be negative']
    },
    total_count: {
        type: Number,
        default: 0,
        min: [0, 'Total count cannot be negative']
    },

    // Tracking fields
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
panchayatSchema.index({ state_id: 1, division_id: 1, parliament_id: 1, assembly_id: 1, block_id: 1, booth_id: 1 });
panchayatSchema.index({ panchayat_name: 1 });
panchayatSchema.index({ location: 1 });
panchayatSchema.index({ latitude: 1, longitude: 1 });
panchayatSchema.index({ created_at: -1 });

// Text index for search functionality
panchayatSchema.index({
    panchayat_name: 'text',
    location: 'text'
});

// Pre-save middleware to calculate total_count
panchayatSchema.pre('save', function(next) {
    if (this.isModified('male_count') || this.isModified('female_count') || this.isModified('others_count')) {
        this.total_count = (this.male_count || 0) + (this.female_count || 0) + (this.others_count || 0);
    }
    next();
});

// Virtual for formatted creation date
panchayatSchema.virtual('formatted_created_at').get(function() {
    return this.created_at ? this.created_at.toLocaleDateString('en-IN') : null;
});

// Virtual for formatted update date
panchayatSchema.virtual('formatted_updated_at').get(function() {
    return this.updated_at ? this.updated_at.toLocaleDateString('en-IN') : null;
});

// Static method to get panchayats with full population
panchayatSchema.statics.findWithFullDetails = function(filter = {}) {
    return this.find(filter)
        .populate('state_id', 'name')
        .populate('division_id', 'name')
        .populate('parliament_id', 'name')
        .populate('assembly_id', 'name AC_NO')
        .populate('block_id', 'name')
        .populate('booth_id', 'name booth_number')
        .populate('created_by', 'username')
        .populate('updated_by', 'username')
        .sort({ created_at: -1 });
};

// Export the model
module.exports = mongoose.models.Panchayat || mongoose.model('Panchayat', panchayatSchema);
