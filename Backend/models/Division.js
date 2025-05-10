const mongoose = require('mongoose');
const { Schema } = mongoose;

const DivisionSchema = new Schema({
  type: String,
  features: [{
    type: String,
    geometry: {
      type: { type: String },
      coordinates: [[[Number]]]
    },
    properties: {
      Name: String,
      // Add other division properties as needed
    }
  }]
});

module.exports = mongoose.model('Division', DivisionSchema);