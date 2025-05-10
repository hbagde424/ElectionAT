const mongoose = require('mongoose');
const { Schema } = mongoose;

const DistrictSchema = new Schema({
  type: String,
  features: [{
    type: String,
    geometry: {
      type: { type: String },
      coordinates: [[[Number]]]
    },
    properties: {
      Name: String,
      // Add other district properties as needed
    }
  }]
});

module.exports = mongoose.model('District', DistrictSchema);