const Division = require('../models/Division');

// Get all divisions
exports.getAllDivisions = async (req, res) => {
  try {
    const divisions = await Division.find();
    res.json(divisions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get division by name
exports.getDivisionByName = async (req, res) => {
  try {
    const division = await Division.findOne({
      'features.properties.Name': req.params.name
    });
    
    if (!division) {
      return res.status(404).json({ message: 'Division not found' });
    }
    
    res.json(division);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};