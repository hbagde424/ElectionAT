const mongoose = require('mongoose');

const userHierarchySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    state: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'State'
    },
    division: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Division'
    },
    parliament: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parliament'
    },
    assembly: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assembly'
    },
    block: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Block'
    },
    booth: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booth'
    },
    assignedAt: {
        type: Date,
        default: Date.now
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserHierarchy', userHierarchySchema);
