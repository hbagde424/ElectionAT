const Candidate = require('../models/Candidate');
const Party = require('../models/party');
const Year = require('../models/Year');

// @desc    Get all candidates
// @route   GET /api/candidates
// @access  Public
exports.getCandidates = async (req, res, next) => {
  try {
    const candidates = await Candidate.find()
      .populate('party', 'name abbreviation symbol')
      .populate('election_year', 'year')
      .populate('assembly', 'name');

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single candidate
// @route   GET /api/candidates/:id
// @access  Public
exports.getCandidate = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('party', 'name abbreviation symbol')
      .populate('election_year', 'year')
      .populate('assembly', 'name');

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create candidate
// @route   POST /api/candidates
// @access  Private
exports.createCandidate = async (req, res, next) => {
  try {
    const { party, assembly, election_year } = req.body;

    // Check if party exists
    const partyExists = await Party.findById(party);
    if (!partyExists) {
      return res.status(400).json({
        success: false,
        message: 'Party does not exist'
      });
    }

    // Check if year exists
    const yearExists = await Year.findById(election_year);
    if (!yearExists) {
      return res.status(400).json({
        success: false,
        message: 'Election year does not exist'
      });
    }

    // Check for existing candidate from same party in same assembly and year
    const existingCandidate = await Candidate.findOne({
      party,
      assembly,
      election_year
    });

    if (existingCandidate) {
      return res.status(400).json({
        success: false,
        message: 'Candidate from this party already exists for this assembly in the given year'
      });
    }

    const candidate = await Candidate.create(req.body);

    res.status(201).json({
      success: true,
      data: candidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update candidate
// @route   PUT /api/candidates/:id
// @access  Private
exports.updateCandidate = async (req, res, next) => {
  try {
    let candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Prevent changing party, assembly or election year
    if (req.body.party || req.body.assembly || req.body.election_year) {
      return res.status(400).json({
        success: false,
        message: 'Party, assembly or election year cannot be changed'
      });
    }

    candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('party', 'name abbreviation symbol')
      .populate('election_year', 'year')
      .populate('assembly', 'name');

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle candidate active status
// @route   PUT /api/candidates/toggle-status/:id
// @access  Private
exports.toggleCandidateStatus = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    candidate.is_active = !candidate.is_active;
    await candidate.save();

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete candidate
// @route   DELETE /api/candidates/:id
// @access  Private
exports.deleteCandidate = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    await candidate.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get candidates by assembly and year
// @route   GET /api/candidates/assembly/:assemblyId/year/:yearId
// @access  Public
exports.getCandidatesByassemblyAndYear = async (req, res, next) => {
  try {
    const candidates = await Candidate.find({
      assembly: req.params.assemblyId,
      election_year: req.params.yearId,
      is_active: true
    })
      .populate('party', 'name abbreviation symbol')
      .sort({ votes: -1 });

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    next(err);
  }
};