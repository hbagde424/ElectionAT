const mongoose = require('mongoose');

const blockPolygonSchema = new mongoose.Schema({
  type: {
    type: String,
    default: "FeatureCollection"
  },
  features: [{
    type: {
      type: String,
      default: "Feature"
    },
    geometry: {
      type: {
        type: String,
        enum: ["Polygon"],
        required: true
      },
      coordinates: {
        type: [[[Number]]], // Array of arrays of coordinate pairs
        required: true
      }
    },
    properties: {
      Name: String,
      District: String,
      Division: String,
      Parliament: String,
      VS_Code: Number,
      booth_number: String, // Adding booth number for booth-wise data
      booth_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booth'
      }
    }
  }],
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
blockPolygonSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('BlockPolygon', blockPolygonSchema);