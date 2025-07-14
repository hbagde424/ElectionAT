const WinningParty = require('../models/WinningParty');
const Candidate = require('../models/Candidate');
const Assembly = require('../models/assembly');
const Parliament = require('../models/parliament');
const Party = require('../models/party');
const Year = require('../models/Year');
const State = require('../models/state');
const Division = require('../models/Division');
const Block = require('../models/block');
const Booth = require('../models/booth');

// @desc    Get all winning party records
// @route   GET /api/winning-parties
// @access  Public
exports.getWinningParties = async (req, res, next) => {
  try {
    const winningParties = await WinningParty.find()
      .populate('candidate_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'booth_number name')
      .populate('party_id', 'name abbreviation symbol')
      .populate('year_id', 'year')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email')
      .sort({ year_id: -1 });

    res.status(200).json({
      success: true,
      count: winningParties.length,
      data: winningParties
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get winning party by ID
// @route   GET /api/winning-parties/:id
// @access  Public
exports.getWinningParty = async (req, res, next) => {
  try {
    const winningParty = await WinningParty.findById(req.params.id)
      .populate('candidate_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'booth_number name')
      .populate('party_id', 'name abbreviation symbol')
      .populate('year_id', 'year')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email');

    if (!winningParty) {
      return res.status(404).json({
        success: false,
        message: 'Winning party record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: winningParty
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create winning party record
// @route   POST /api/winning-parties
// @access  Private
exports.createWinningParty = async (req, res, next) => {
  try {
    const { 
      candidate_id, 
      assembly_id, 
      parliament_id, 
      state_id,
      division_id,
      block_id,
      booth_id,
      party_id, 
      year_id 
    } = req.body;

    // Check if all references exist
    const [
      candidate, 
      assembly, 
      parliament, 
      state,
      division,
      block,
      booth,
      party, 
      year
    ] = await Promise.all([
      Candidate.findById(candidate_id),
      Assembly.findById(assembly_id),
      Parliament.findById(parliament_id),
      State.findById(state_id),
      Division.findById(division_id),
      Block.findById(block_id),
      Booth.findById(booth_id),
      Party.findById(party_id),
      Year.findById(year_id)
    ]);

    if (!candidate) {
      return res.status(400).json({
        success: false,
        message: 'Candidate does not exist'
      });
    }
    if (!assembly) {
      return res.status(400).json({
        success: false,
        message: 'Assembly does not exist'
      });
    }
    if (!state) {
      return res.status(400).json({
        success: false,
        message: 'State does not exist'
      });
    }
    if (!division) {
      return res.status(400).json({
        success: false,
        message: 'Division does not exist'
      });
    }
    if (!block) {
      return res.status(400).json({
        success: false,
        message: 'Block does not exist'
      });
    }
    if (!booth) {
      return res.status(400).json({
        success: false,
        message: 'Booth does not exist'
      });
    }
    if (!party) {
      return res.status(400).json({
        success: false,
        message: 'Party does not exist'
      });
    }
    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year does not exist'
      });
    }

    // Check if winning record already exists for this assembly/parliament and year
    const existingRecord = await WinningParty.findOne({
      $or: [
        { assembly_id, year_id },
        { parliament_id, year_id }
      ]
    });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Winning party record already exists for this constituency and year'
      });
    }

    // Set created_by and updated_by to current user
    req.body.created_by = req.user.id;
    req.body.updated_by = req.user.id;

    const winningParty = await WinningParty.create(req.body);

    res.status(201).json({
      success: true,
      data: winningParty
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update winning party record
// @route   PUT /api/winning-parties/:id
// @access  Private
exports.updateWinningParty = async (req, res, next) => {
  try {
    let winningParty = await WinningParty.findById(req.params.id);

    if (!winningParty) {
      return res.status(404).json({
        success: false,
        message: 'Winning party record not found'
      });
    }

    // Prevent changing critical references
    if (req.body.candidate_id || req.body.assembly_id || 
        req.body.parliament_id || req.body.party_id || req.body.year_id ||
        req.body.state_id || req.body.division_id || req.body.block_id || req.body.booth_id) {
      return res.status(400).json({
        success: false,
        message: 'Candidate, constituency, location or year references cannot be changed'
      });
    }

    // Set updated_by to current user
    req.body.updated_by = req.user.id;

    winningParty = await WinningParty.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('candidate_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'booth_number name')
      .populate('party_id', 'name abbreviation symbol')
      .populate('year_id', 'year')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email');

    res.status(200).json({
      success: true,
      data: winningParty
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete winning party record
// @route   DELETE /api/winning-parties/:id
// @access  Private
exports.deleteWinningParty = async (req, res, next) => {
  try {
    const winningParty = await WinningParty.findById(req.params.id);

    if (!winningParty) {
      return res.status(404).json({
        success: false,
        message: 'Winning party record not found'
      });
    }

    await winningParty.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get winning parties by assembly (last 4 years)
// @route   GET /api/winning-parties/assembly/:assemblyId
// @access  Public
exports.getWinningPartiesByAssembly = async (req, res, next) => {
  try {
    const winningParties = await WinningParty.find({ assembly_id: req.params.assemblyId })
      .populate('candidate_id', 'name')
      .populate('party_id', 'name abbreviation symbol')
      .populate('year_id', 'year')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'booth_number name')
      .sort({ year_id: -1 })
      .limit(4);

    res.status(200).json({
      success: true,
      count: winningParties.length,
      data: winningParties
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get winning parties by parliament (last 4 years)
// @route   GET /api/winning-parties/parliament/:parliamentId
// @access  Public
exports.getWinningPartiesByParliament = async (req, res, next) => {
  try {
    const winningParties = await WinningParty.find({ parliament_id: req.params.parliamentId })
      .populate('candidate_id', 'name')
      .populate('party_id', 'name abbreviation symbol')
      .populate('year_id', 'year')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'booth_number name')
      .sort({ year_id: -1 })
      .limit(4);

    res.status(200).json({
      success: true,
      count: winningParties.length,
      data: winningParties
    });
  } catch (err) {
    next(err);
  }
};