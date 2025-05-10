// models/AssemblyMap.js
const mongoose = require('mongoose');

const AssemblyMapSchema = new mongoose.Schema({
  assemblyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assembly',
    required: true,
    unique: true
  },
  vsCode: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  division: {
    type: String,
    required: true
  },
  parliament: {
    type: String,
    required: true
  },
  geoData: {
    type: {
      type: String,
      enum: ['FeatureCollection'],
      required: true
    },
    features: [
      {
        type: {
          type: String,
          enum: ['Feature'],
          required: true
        },
        geometry: {
          type: {
            type: String,
            enum: ['Polygon'],
            required: true
          },
          coordinates: {
            type: [[[Number]]],
            required: true
          }
        },
        properties: {
          type: Object,
          required: true
        }
      }
    ]
  }
});

module.exports = mongoose.model('AssemblyMap', AssemblyMapSchema);