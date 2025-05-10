const District = require('../models/District');

// Get all districts
exports.getAllDistricts = async (req, res) => {
  try {
    const districts = await District.find();
    res.json(districts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get district by name
exports.getDistrictByName = async (req, res) => {
  try {
    const district = await District.findOne({
      'features.properties.Name': req.params.name
    });
    
    if (!district) {
      return res.status(404).json({ message: 'District not found' });
    }
    
    res.json(district);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};