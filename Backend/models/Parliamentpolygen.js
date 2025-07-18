const mongoose = require('mongoose');
const { Schema } = mongoose;

const ParliamentpolygenSchema = new Schema({
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
        default: "Polygon"
      },
      coordinates: {
        type: [[[Number]]],
        required: true
      }
    },
    properties: {
      Name: {
        type: String,
        required: true
      },
      District: {
        type: String,
        required: true
      },
      Division: {
        type: String,
        required: true
      },
      Parliament: {
        type: String,
        required: true
      },
      VS_Code: {
        type: Number,
        required: true
      }
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Parliamentpolygen', ParliamentpolygenSchema);