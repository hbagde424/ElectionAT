const mongoose = require('mongoose');
const { Schema } = mongoose;

const AssemblySchema = new Schema({
  type: String,
  features: [{
    type: String,
    geometry: {
      type: { type: String },
      coordinates: [[[Number]]]
    },
    properties: {
      Name: String,
      District: String,
      Division: String,
      Parliament: String,
      VS_Code: Number
    }
  }]
});

module.exports = mongoose.model('Assemblypolygen', AssemblySchema);