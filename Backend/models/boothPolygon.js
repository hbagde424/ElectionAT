const mongoose = require('mongoose');

const boothPolygonSchema = new mongoose.Schema({
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
      type: [[[Number]]], // Array of arrays of arrays of numbers
      required: true
    }
  },
  properties: {
    BoothName: {
      type: String,
      required: true
    },
    BoothNo: {
      type: String,
      required: true
    },
    BlockName: {
      type: String,
      required: true
    },
    BlockNumber: {
      type: String,
      required: true
    },
    AC_NAME: {
      type: String,
      required: true
    },
    AC_NO: {
      type: Number,
      required: true
    },
    PC_NAME: {
      type: String,
      required: true
    },
    PC_NO: {
      type: Number,
      required: true
    },
    ST_NAME: {
      type: String,
      required: true
    },
    ST_CODE: {
      type: Number,
      required: true
    },
    DIVISION_NAME: {
      type: String,
      required: true
    },
    DIVISION_CODE: {
      type: Number,
      required: true
    }
  },
   BlockNumber: {
    type: String,  // or Number if you store it as number
    required: true
  },
  booth_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booth',
    required: false
  },
  election_year: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElectionYear',
    required: true
  }
}, { timestamps: true });

// Create 2dsphere index for geospatial queries
boothPolygonSchema.index({ 'geometry.coordinates': '2dsphere' });

module.exports = mongoose.model('BoothPolygon', boothPolygonSchema);