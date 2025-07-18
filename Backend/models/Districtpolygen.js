const mongoose = require('mongoose');
const { Schema } = mongoose;

const DistrictpolygenSchema = new Schema({
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
        required: true,
        validate: {
          validator: function(coords) {
            // Validate Polygon coordinates (first and last points must match)
            return coords[0][0][0] === coords[0][coords[0].length-1][0] && 
                   coords[0][0][1] === coords[0][coords[0].length-1][1];
          },
          message: 'Polygon coordinates must form a closed loop'
        }
      }
    },
    properties: {
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
      }
    }
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true } 
});

// Add geospatial index for efficient queries
DistrictpolygenSchema.index({ 'features.geometry': '2dsphere' });

module.exports = mongoose.model('Districtpolygen', DistrictpolygenSchema);