const mongoose = require('mongoose');

const blaSchema = new mongoose.Schema({
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

    // BLA specific fields
    bla_name: {
        type: String,
        required: [true, 'BLA name is required'],
        trim: true,
        maxlength: [100, 'BLA name cannot exceed 100 characters']
    },
    contact_number: {
        type: String,
        required: false,
        trim: true,
        maxlength: [15, 'Contact number cannot exceed 15 characters']
    },
    email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
        maxlength: [100, 'Email cannot exceed 100 characters'],
        validate: {
            validator: function(email) {
                // Only validate if email is provided (not empty)
                if (!email || email.trim() === '') return true;
                // Basic email validation regex
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: 'Please enter a valid email address'
        }
    },
    full_address: {
        type: String,
        required: false,
        trim: true,
        maxlength: [500, 'Full address cannot exceed 500 characters']
    },
    is_active: {
        type: Boolean,
        default: true
    },
    
    // Performance/Rating field (1-5 stars)
    performance_rating: {
        type: Number,
        min: [0, 'Rating cannot be less than 0'],
        max: [5, 'Rating cannot exceed 5'],
        default: 0
    },
    
    // Election year reference
    election_year_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ElectionYear',
        required: false
    },
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
    collection: 'blas',
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
blaSchema.index({ state_id: 1, division_id: 1, parliament_id: 1, assembly_id: 1, block_id: 1, booth_id: 1 });
blaSchema.index({ bla_name: 1 });
blaSchema.index({ contact_number: 1 });
blaSchema.index({ is_active: 1 });
blaSchema.index({ created_at: -1 });

// Text index for search functionality
blaSchema.index({
    bla_name: 'text',
    contact_number: 'text',
    email: 'text',
    full_address: 'text'
});

// Virtual for formatted creation date
blaSchema.virtual('formatted_created_at').get(function() {
    return this.created_at ? this.created_at.toLocaleDateString('en-IN') : null;
});

// Virtual for formatted update date
blaSchema.virtual('formatted_updated_at').get(function() {
    return this.updated_at ? this.updated_at.toLocaleDateString('en-IN') : null;
});

// Static method to get BLAs with full population
blaSchema.statics.findWithFullDetails = function(filter = {}) {
    return this.find(filter)
        .populate('state_id', 'name')
        .populate('division_id', 'name')
        .populate('parliament_id', 'name')
        .populate('assembly_id', 'name AC_NO')
        .populate('block_id', 'name')
        .populate('booth_id', 'name booth_number')
        .populate('election_year_id', 'year')
        .populate('created_by', 'username')
        .populate('updated_by', 'username')
        .sort({ created_at: -1 });
};

// Export the model
module.exports = mongoose.models.BLA || mongoose.model('BLA', blaSchema);
