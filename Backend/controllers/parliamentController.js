const Parliament = require('../models/parliament');
const Division = require('../models/division');

// Create a new parliament
exports.createParliament = async (req, res) => {
  try {
    // Check if division exists
    const division = await Division.findById(req.body.division_id);
    if (!division) {
      return res.status(404).json({ error: 'Division not found' });
    }
    
    const parliament = new Parliament(req.body);
    await parliament.save();
    res.status(201).json(parliament);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all parliaments with division details
exports.getAllParliaments = async (req, res) => {
  try {
    const parliaments = await Parliament.find().populate('division_id');
    res.json(parliaments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get parliaments by division ID
exports.getParliamentsByDivision = async (req, res) => {
  try {
    const parliaments = await Parliament.find({ division_id: req.params.divisionId }).populate('division_id');
    res.json(parliaments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Other CRUD operations similar to stateController...