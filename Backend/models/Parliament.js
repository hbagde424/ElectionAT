const mongoose = require('mongoose');
const { Schema } = mongoose;

const ParliamentSchema = new Schema({
  type: String,
  features: [{
    type: String,
    geometry: {
      type: { type: String },
      coordinates: [[[Number]]]
    },
    properties: {
      Name: String,
      // Add other parliament properties as needed
    }
  }]
});

module.exports = mongoose.model('Parliament', ParliamentSchema);