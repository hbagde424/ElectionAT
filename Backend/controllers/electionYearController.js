const ElectionYear = require('../models/electionYear');

exports.createElectionYear = async (req, res) => {
  try {
    const electionYear = new ElectionYear(req.body);
    await electionYear.save();
    res.status(201).json(electionYear);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllElectionYears = async (req, res) => {
  try {
    const electionYears = await ElectionYear.find().sort({ year: -1 });
    res.json(electionYears);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getElectionYearById = async (req, res) => {
  try {
    const electionYear = await ElectionYear.findById(req.params.id);
    if (!electionYear) {
      return res.status(404).json({ error: 'Election year not found' });
    }
    res.json(electionYear);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateElectionYear = async (req, res) => {
  try {
    const electionYear = await ElectionYear.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!electionYear) {
      return res.status(404).json({ error: 'Election year not found' });
    }
    res.json(electionYear);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteElectionYear = async (req, res) => {
  try {
    const electionYear = await ElectionYear.findByIdAndDelete(req.params.id);
    if (!electionYear) {
      return res.status(404).json({ error: 'Election year not found' });
    }
    res.json({ message: 'Election year deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};