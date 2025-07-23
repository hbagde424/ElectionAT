const mongoose = require('mongoose');

const statePolygonSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['FeatureCollection']
    },
    name: {
        type: String,
        required: true
    },
    crs: {
        type: {
            type: String,
            required: true
        },
        properties: {
            name: {
                type: String,
                required: true
            }
        }
    },
    features: [{
        type: {
            type: String,
            required: true,
            enum: ['Feature']
        },
        properties: {
            Name: String,
            Type: String
        },
        geometry: {
            type: {
                type: String,
                required: true,
                enum: ['MultiPolygon']
            },
            coordinates: {
                type: [[[[Number]]]], // Array of arrays of arrays of arrays of numbers for MultiPolygon
                required: true
            }
        }
    }],
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const StatePolygon = mongoose.model('StatePolygon', statePolygonSchema, 'state_polygons'); // Explicitly specify collection name

module.exports = StatePolygon;
