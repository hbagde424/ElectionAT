const PotentialCandidate = require('../models/PotentialCandidate');
const Party = require('../models/party');
const Constituency = require('../models/assembly');
const ElectionYear = require('../models/electionYear');
const Candidate = require('../models/Candidate');

// @desc    Get all potential candidates
// @route   GET /api/potential-candidates
// @access  Public
exports.getPotentialCandidates = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = PotentialCandidate.find()
      .populate('party_id', 'name symbol')
      .populate('constituency_id', 'name type')
      .populate('election_year_id', 'year')
      .populate('supporter_candidates', 'name')
      .populate('created_by', 'name email')
      .sort({ name: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({ $text: { $search: req.query.search } });
    }

    // Filter by party
    if (req.query.party_id) {
      query = query.where('party_id').equals(req.query.party_id);
    }

    // Filter by constituency
    if (req.query.constituency_id) {
      query = query.where('constituency_id').equals(req.query.constituency_id);
    }

    // Filter by election year
    if (req.query.election_year_id) {
      query = query.where('election_year_id').equals(req.query.election_year_id);
    }

    // Filter by status
    if (req.query.status) {
      query = query.where('status').equals(req.query.status);
    }

    const potentialCandidates = await query.skip(skip).limit(limit).exec();
    const total = await PotentialCandidate.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: potentialCandidates.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: potentialCandidates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single potential candidate
// @route   GET /api/potential-candidates/:id
// @access  Public
exports.getPotentialCandidate = async (req, res, next) => {
  try {
    const potentialCandidate = await PotentialCandidate.findById(req.params.id)
      .populate('party_id', 'name symbol')
      .populate('constituency_id', 'name type')
      .populate('election_year_id', 'year')
      .populate('supporter_candidates', 'name image')
      .populate('created_by', 'name email');

    if (!potentialCandidate) {
      return res.status(404).json({
        success: false,
        message: 'Potential candidate not found'
      });
    }

    res.status(200).json({
      success: true,
      data: potentialCandidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create potential candidate
// @route   POST /api/potential-candidates
// @access  Private (Admin)
exports.createPotentialCandidate = async (req, res, next) => {
  try {
    // Verify party exists
    const party = await Party.findById(req.body.party_id);
    if (!party) {
      return res.status(400).json({
        success: false,
        message: 'Party not found'
      });
    }

    // Verify constituency exists
    const constituency = await Constituency.findById(req.body.constituency_id);
    if (!constituency) {
      return res.status(400).json({
        success: false,
        message: 'Constituency not found'
      });
    }

    // Verify election year exists
    const electionYear = await ElectionYear.findById(req.body.election_year_id);
    if (!electionYear) {
      return res.status(400).json({
        success: false,
        message: 'Election year not found'
      });
    }

    // Verify supporter candidates exist if provided
    if (req.body.supporter_candidates && req.body.supporter_candidates.length > 0) {
      const supporters = await Candidate.find({ _id: { $in: req.body.supporter_candidates } });
      if (supporters.length !== req.body.supporter_candidates.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more supporter candidates not found'
        });
      }
    }

    // Add created_by from authenticated user
    req.body.created_by = req.user.id;

    const potentialCandidate = await PotentialCandidate.create(req.body);

    res.status(201).json({
      success: true,
      data: potentialCandidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update potential candidate
// @route   PUT /api/potential-candidates/:id
// @access  Private (Admin)
exports.updatePotentialCandidate = async (req, res, next) => {
  try {
    let potentialCandidate = await PotentialCandidate.findById(req.params.id);

    if (!potentialCandidate) {
      return res.status(404).json({
        success: false,
        message: 'Potential candidate not found'
      });
    }

    // Verify party exists if being updated
    if (req.body.party_id) {
      const party = await Party.findById(req.body.party_id);
      if (!party) {
        return res.status(400).json({
          success: false,
          message: 'Party not found'
        });
      }
    }

    // Verify constituency exists if being updated
    if (req.body.constituency_id) {
      const constituency = await Constituency.findById(req.body.constituency_id);
      if (!constituency) {
        return res.status(400).json({
          success: false,
          message: 'Constituency not found'
        });
      }
    }

    // Verify election year exists if being updated
    if (req.body.election_year_id) {
      const electionYear = await ElectionYear.findById(req.body.election_year_id);
      if (!electionYear) {
        return res.status(400).json({
          success: false,
          message: 'Election year not found'
        });
      }
    }

    // Verify supporter candidates exist if being updated
    if (req.body.supporter_candidates && req.body.supporter_candidates.length > 0) {
      const supporters = await Candidate.find({ _id: { $in: req.body.supporter_candidates } });
      if (supporters.length !== req.body.supporter_candidates.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more supporter candidates not found'
        });
      }
    }

    potentialCandidate = await PotentialCandidate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    .populate('party_id', 'name symbol')
    .populate('constituency_id', 'name type')
    .populate('election_year_id', 'year')
    .populate('supporter_candidates', 'name image')
    .populate('created_by', 'name email');

    res.status(200).json({
      success: true,
      data: potentialCandidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete potential candidate
// @route   DELETE /api/potential-candidates/:id
// @access  Private (Admin)
exports.deletePotentialCandidate = async (req, res, next) => {
  try {
    const potentialCandidate = await PotentialCandidate.findById(req.params.id);

    if (!potentialCandidate) {
      return res.status(404).json({
        success: false,
        message: 'Potential candidate not found'
      });
    }

    await potentialCandidate.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get potential candidates by party
// @route   GET /api/potential-candidates/party/:partyId
// @access  Public
exports.getPotentialCandidatesByParty = async (req, res, next) => {
  try {
    const potentialCandidates = await PotentialCandidate.find({ party_id: req.params.partyId })
      .populate('party_id', 'name symbol')
      .populate('constituency_id', 'name type')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: potentialCandidates.length,
      data: potentialCandidates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get potential candidates by constituency
// @route   GET /api/potential-candidates/constituency/:constituencyId
// @access  Public
exports.getPotentialCandidatesByConstituency = async (req, res, next) => {
  try {
    const potentialCandidates = await PotentialCandidate.find({ constituency_id: req.params.constituencyId })
      .populate('party_id', 'name symbol')
      .populate('constituency_id', 'name type')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: potentialCandidates.length,
      data: potentialCandidates
    });
  } catch (err) {
    next(err);
  }
};