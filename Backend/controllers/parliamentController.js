const Parliament = require('../models/Parliament');

// Get all parliaments
exports.getAllParliaments = async (req, res) => {
  try {
    const parliaments = await Parliament.find();
    res.json(parliaments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get parliament by name
exports.getParliamentByName = async (req, res) => {
  try {
    const parliament = await Parliament.findOne({
      'features.properties.Name': req.params.name
    });
    
    if (!parliament) {
      return res.status(404).json({ message: 'Parliament not found' });
    }
    
    res.json(parliament);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};