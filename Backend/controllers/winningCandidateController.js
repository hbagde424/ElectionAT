const WinningCandidate = require('../models/winningCandidate');
const State = require('../models/state');
const Division = require('../models/division');
const Parliament = require('../models/parliament');
const Assembly = require('../models/assembly');
const WinningParty = require('../models/WinningParty');
const Candidate = require('../models/Candidate');

// @desc    Get all winning candidates
// @route   GET /api/winning-candidates
// @access  Public
exports.getWinningCandidates = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    // Basic query
    let query = WinningCandidate.find()
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('winning_party_id', 'name')
      .populate('candidate_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ total_votes: -1 });

    // Filter by assembly
    if (req.query.assembly) {
      query = query.where('assembly_id').equals(req.query.assembly);
    }

    // Filter by parliament
    if (req.query.parliament) {
      query = query.where('parliament_id').equals(req.query.parliament);
    }

    // Filter by state
    if (req.query.state) {
      query = query.where('state_id').equals(req.query.state);
    }

    // Filter by division
    if (req.query.division) {
      query = query.where('division_id').equals(req.query.division);
    }

    // Filter by party
    if (req.query.party) {
      query = query.where('winning_party_id').equals(req.query.party);
    }

    // Filter by candidate
    if (req.query.candidate) {
      query = query.where('candidate_id').equals(req.query.candidate);
    }

    const winningCandidates = await query.skip(skip).limit(limit).exec();
    const total = await WinningCandidate.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: winningCandidates.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: winningCandidates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single winning candidate
// @route   GET /api/winning-candidates/:id
// @access  Public
exports.getWinningCandidate = async (req, res, next) => {
  try {
    const winningCandidate = await WinningCandidate.findById(req.params.id)
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('winning_party_id', 'name')
      .populate('candidate_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!winningCandidate) {
      return res.status(404).json({
        success: false,
        message: 'Winning candidate not found'
      });
    }

    res.status(200).json({
      success: true,
      data: winningCandidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create winning candidate
// @route   POST /api/winning-candidates
// @access  Private (Admin only)
exports.createWinningCandidate = async (req, res, next) => {
  try {
    // Verify all references exist
    const [
      state,
      division,
      parliament,
      assembly,
      winningParty,
      candidate
    ] = await Promise.all([
      State.findById(req.body.state_id),
      Division.findById(req.body.division_id),
      Parliament.findById(req.body.parliament_id),
      Assembly.findById(req.body.assembly_id),
      WinningParty.findById(req.body.winning_party_id),
      Candidate.findById(req.body.candidate_id)
    ]);

    if (!state) {
      return res.status(400).json({ success: false, message: 'State not found' });
    }
    if (!division) {
      return res.status(400).json({ success: false, message: 'Division not found' });
    }
    if (!parliament) {
      return res.status(400).json({ success: false, message: 'Parliament not found' });
    }
    if (!assembly) {
      return res.status(400).json({ success: false, message: 'Assembly not found' });
    }
    if (!winningParty) {
      return res.status(400).json({ success: false, message: 'Winning party not found' });
    }
    if (!candidate) {
      return res.status(400).json({ success: false, message: 'Candidate not found' });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const winningCandidateData = {
      ...req.body,
      created_by: req.user.id
    };

    const winningCandidate = await WinningCandidate.create(winningCandidateData);

    res.status(201).json({
      success: true,
      data: winningCandidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update winning candidate
// @route   PUT /api/winning-candidates/:id
// @access  Private (Admin only)
exports.updateWinningCandidate = async (req, res, next) => {
  try {
    let winningCandidate = await WinningCandidate.findById(req.params.id);

    if (!winningCandidate) {
      return res.status(404).json({
        success: false,
        message: 'Winning candidate not found'
      });
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.winning_party_id) verificationPromises.push(WinningParty.findById(req.body.winning_party_id));
    if (req.body.candidate_id) verificationPromises.push(Candidate.findById(req.body.candidate_id));

    const verificationResults = await Promise.all(verificationPromises);
    
    for (const result of verificationResults) {
      if (!result) {
        return res.status(400).json({
          success: false,
          message: 'One or more references not found'
        });
      }
    }

    // Set updated_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }
    req.body.updated_by = req.user.id;
    req.body.updated_at = new Date();

    winningCandidate = await WinningCandidate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('winning_party_id', 'name')
      .populate('candidate_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: winningCandidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete winning candidate
// @route   DELETE /api/winning-candidates/:id
// @access  Private (Admin only)
exports.deleteWinningCandidate = async (req, res, next) => {
  try {
    const winningCandidate = await WinningCandidate.findById(req.params.id);

    if (!winningCandidate) {
      return res.status(404).json({
        success: false,
        message: 'Winning candidate not found'
      });
    }

    await winningCandidate.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get winning candidates by assembly
// @route   GET /api/winning-candidates/assembly/:assemblyId
// @access  Public
exports.getWinningCandidatesByAssembly = async (req, res, next) => {
  try {
    // Verify assembly exists
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    const winningCandidates = await WinningCandidate.find({ assembly_id: req.params.assemblyId })
      .sort({ total_votes: -1 })
      .populate('winning_party_id', 'name')
      .populate('candidate_id', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: winningCandidates.length,
      data: winningCandidates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get winning candidates by parliament
// @route   GET /api/winning-candidates/parliament/:parliamentId
// @access  Public
exports.getWinningCandidatesByParliament = async (req, res, next) => {
  try {
    // Verify parliament exists
    const parliament = await Parliament.findById(req.params.parliamentId);
    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    const winningCandidates = await WinningCandidate.find({ parliament_id: req.params.parliamentId })
      .sort({ total_votes: -1 })
      .populate('winning_party_id', 'name')
      .populate('candidate_id', 'name')
      .populate('assembly_id', 'name');

    res.status(200).json({
      success: true,
      count: winningCandidates.length,
      data: winningCandidates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get winning candidates by election year
// @route   GET /api/winning-candidates/year/:yearId
// @access  Public
exports.getWinningCandidatesByYear = async (req, res, next) => {
  try {
    // Verify election year exists
    const year = await ElectionYear.findById(req.params.yearId);
    if (!year) {
      return res.status(404).json({
        success: false,
        message: 'Election year not found'
      });
    }

    const winningCandidates = await WinningCandidate.find({ election_year: req.params.yearId })
      .sort({ total_votes: -1 })
      .populate('winning_party_id', 'name')
      .populate('candidate_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name');

    res.status(200).json({
      success: true,
      count: winningCandidates.length,
      data: winningCandidates
    });
  } catch (err) {
    next(err);
  }
};