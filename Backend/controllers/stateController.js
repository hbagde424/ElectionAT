const State = require('../models/state');

// Create a new state
exports.createState = async (req, res) => {
  try {
    const state = new State(req.body);
    await state.save();
    res.status(201).json(state);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all states
exports.getAllStates = async (req, res) => {
  try {
    const states = await State.find();
    res.json(states);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single state by ID
exports.getStateById = async (req, res) => {
  try {
    const state = await State.findById(req.params.id);
    if (!state) {
      return res.status(404).json({ error: 'State not found' });
    }
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a state
exports.updateState = async (req, res) => {
  try {
    const state = await State.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!state) {
      return res.status(404).json({ error: 'State not found' });
    }
    res.json(state);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a state
exports.deleteState = async (req, res) => {
  try {
    const state = await State.findByIdAndDelete(req.params.id);
    if (!state) {
      return res.status(404).json({ error: 'State not found' });
    }
    res.json({ message: 'State deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};