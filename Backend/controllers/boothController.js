const Booth = require('../models/booth');
const Block = require('../models/block');
const Assembly = require('../models/assembly');
const Parliament = require('../models/parliament');

// Create a new booth
exports.createBooth = async (req, res) => {
  try {
    // Check if block exists
    const block = await Block.findById(req.body.block_id);
    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }
    
    // Check if assembly exists
    const assembly = await Assembly.findById(req.body.assembly_id);
    if (!assembly) {
      return res.status(404).json({ error: 'Assembly not found' });
    }
    
    // Check if parliament exists
    const parliament = await Parliament.findById(req.body.parliament_id);
    if (!parliament) {
      return res.status(404).json({ error: 'Parliament not found' });
    }
    
    const booth = new Booth(req.body);
    await booth.save();
    res.status(201).json(booth);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all booths with related details
exports.getAllBooths = async (req, res) => {
  try {
    const booths = await Booth.find()
      .populate('block_id')
      .populate('assembly_id')
      .populate('parliament_id');
    res.json(booths);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get booth by ID with all details
exports.getBoothById = async (req, res) => {
  try {
    const booth = await Booth.findById(req.params.id)
      .populate('block_id')
      .populate('assembly_id')
      .populate('parliament_id');
    
    if (!booth) {
      return res.status(404).json({ error: 'Booth not found' });
    }
    
    res.json(booth);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Other CRUD operations similar to stateController...