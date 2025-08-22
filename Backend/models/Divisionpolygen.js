const mongoose = require('mongoose');
const { Schema } = mongoose;

const DivisionpolygenSchema = new Schema({
  type: {
    type: String,
    default: "FeatureCollection",
    required: true
  },
  name: {
    type: String,
    default: "Divstion",
    required: true
  },
  crs: {
    type: {
      type: String,
      default: "name",
      required: true
    },
    properties: {
      name: {
        type: String,
        default: "urn:ogc:def:crs:OGC:1.3:CRS84",
        required: true
      }
    }
  },
  features: [{
    type: {
      type: String,
      default: "Feature",
      required: true
    },
    geometry: {
      type: {
        type: String,
        default: "MultiPolygon",
        required: true
      },
      coordinates: {
        type: [[[[Number]]]],  // 4D array for MultiPolygon
        required: true
      }
    },
    properties: {
      OBJECTID: {
        type: Number,
        required: true
      },
      Name: {
        type: String,
        required: true,
        trim: true
      },
      District: {
        type: String,
        required: true,
        trim: true
      },
      Division: {
        type: String,
        required: true,
        trim: true
      },
      Parliament: {
        type: String,
        required: true,
        trim: true
      },
      VS_Code: {
        type: Number,
        required: true,
        min: 1
      },
      Shape_Leng: {
        type: Number,
        required: true
      },
      Shape_Area: {
        type: Number,
        required: true
      }
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add geospatial index for efficient queries
DivisionpolygenSchema.index({ 'features.geometry': '2dsphere' });
// Add index for Division field
DivisionpolygenSchema.index({ 'features.properties.Division': 1 });

module.exports = mongoose.model('Divisionpolygen', DivisionpolygenSchema);