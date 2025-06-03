const WinningParty = require('../models/WinningParty');
const Candidate = require('../models/Candidate');
const Assembly = require('../models/assembly');
const Parliament = require('../models/parliament');
const Party = require('../models/party');
const Year = require('../models/Year');

// @desc    Get all winning party records
// @route   GET /api/winning-parties
// @access  Public
exports.getWinningParties = async (req, res, next) => {
  try {
    const winningParties = await WinningParty.find()
      .populate('candidate_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('party_id', 'name abbreviation symbol')
      .populate('year_id', 'year')
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
      .populate('party_id', 'name abbreviation symbol')
      .populate('year_id', 'year');

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
    const { candidate_id, assembly_id, parliament_id, party_id, year_id } = req.body;

    // Check if all references exist
    const [candidate, assembly, parliament, party, year] = await Promise.all([
      Candidate.findById(candidate_id),
      Assembly.findById(assembly_id),
      Parliament.findById(parliament_id),
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
    // if (!parliament) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Parliament does not exist'
    //   });
    // }
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
        req.body.parliament_id || req.body.party_id || req.body.year_id) {
      return res.status(400).json({
        success: false,
        message: 'Candidate, constituency or year references cannot be changed'
      });
    }

    winningParty = await WinningParty.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('candidate_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('party_id', 'name abbreviation symbol')
      .populate('year_id', 'year');

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

    await winningParty.remove();

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