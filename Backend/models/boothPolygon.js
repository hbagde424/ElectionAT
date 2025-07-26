const mongoose = require('mongoose');
const { Schema } = mongoose;

const boothPolygonSchema = new Schema({
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
    booth_id: {
      type: Schema.Types.ObjectId,
      ref: 'Booth',
      required: true
    },
    BoothName: {
      type: String,
      required: true
    },
    BoothNo: {
      type: String,
      required: true
    },
    BlockName: String,
    BlockNumber: String,
    AC_NAME: String,
    AC_NO: Number,
    PC_NAME: String,
    PC_NO: Number,
    ST_NAME: String,
    ST_CODE: Number,
    DIVISION_NAME: String,
    DIVISION_CODE: Number,
    election_year: {
      type: Schema.Types.ObjectId,
      ref: 'ElectionYear',
      required: true
    }
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updated_by: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Create 2dsphere index for geospatial queries
boothPolygonSchema.index({ 'geometry.coordinates': '2dsphere' });

// Update the updated_at timestamp before saving
boothPolygonSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('BoothPolygon', boothPolygonSchema);