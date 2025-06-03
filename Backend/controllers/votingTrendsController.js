const VotingTrends = require('../models/votingTrends');
const Booth = require('../models/booth');
const Party = require('../models/party');

exports.createVotingTrend = async (req, res) => {
  try {
    const [booth, party] = await Promise.all([
      Booth.findById(req.body.booth_id),
      req.body.leading_party_id ? Party.findById(req.body.leading_party_id) : Promise.resolve(null)
    ]);
    
    if (!booth) return res.status(404).json({ error: 'Booth not found' });
    if (req.body.leading_party_id && !party) {
      return res.status(404).json({ error: 'Party not found' });
    }
    
    const trend = new VotingTrends(req.body);
    await trend.save();
    res.status(201).json(trend);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getVotingTrendsByBooth = async (req, res) => {
  try {
    const trends = await VotingTrends.find({ booth_id: req.params.boothId })
      .populate('booth_id')
      .populate('leading_party_id');
    
    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getVotingTrendByBoothAndYear = async (req, res) => {
  try {
    const trend = await VotingTrends.findOne({
      booth_id: req.params.boothId,
      election_year: req.params.year
    })
    .populate('booth_id')
    .populate('leading_party_id');
    
    if (!trend) {
      return res.status(404).json({ error: 'Voting trend not found' });
    }
    res.json(trend);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateVotingTrend = async (req, res) => {
  try {
    const trend = await VotingTrends.findOneAndUpdate(
      { booth_id: req.params.boothId, election_year: req.params.year },
      req.body,
      { new: true, runValidators: true }
    )
    .populate('booth_id')
    .populate('leading_party_id');
    
    if (!trend) {
      return res.status(404).json({ error: 'Voting trend not found' });
    }
    res.json(trend);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteVotingTrend = async (req, res) => {
  try {
    const trend = await VotingTrends.findOneAndDelete({
      booth_id: req.params.boothId,
      election_year: req.params.year
    });
    
    if (!trend) {
      return res.status(404).json({ error: 'Voting trend not found' });
    }
    res.json({ message: 'Voting trend deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};