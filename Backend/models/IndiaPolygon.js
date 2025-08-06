const mongoose = require('mongoose');

const indiaPolygonSchema = new mongoose.Schema({
  type: {
    type: String,
    default: 'FeatureCollection'
  },
  name: {
    type: String,
    default: 'india'
  },
  features: [
    {
      type: {
        type: String,
        enum: ['Feature'],
        required: true
      },
      properties: {
        Area: Number,
        name: String
      },
      geometry: {
        type: {
          type: String,
          enum: ['MultiPolygon'],
          required: true
        },
        coordinates: {
          type: [[[Number]]],
          required: true
        }
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('IndiaPolygon', indiaPolygonSchema);
