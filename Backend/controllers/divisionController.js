const Division = require('../models/division');
const State = require('../models/state');

// Create a new division
exports.createDivision = async (req, res) => {
  try {
    // Check if state exists
    const state = await State.findById(req.body.state_id);
    if (!state) {
      return res.status(404).json({ error: 'State not found' });
    }
    
    const division = new Division(req.body);
    await division.save();
    res.status(201).json(division);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all divisions with state details
exports.getAllDivisions = async (req, res) => {
  try {
    const divisions = await Division.find().populate('state_id');
    res.json(divisions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get divisions by state ID
exports.getDivisionsByState = async (req, res) => {
  try {
    const divisions = await Division.find({ state_id: req.params.stateId }).populate('state_id');
    res.json(divisions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Other CRUD operations similar to stateController...