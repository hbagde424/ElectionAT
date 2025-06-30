const BoothVotes = require('../models/boothVotes');
const Candidate = require('../models/Candidate');
const Booth = require('../models/booth');
const ElectionYear = require('../models/electionYear');

// @desc    Get all booth votes
// @route   GET /api/booth-votes
// @access  Public
exports.getBoothVotes = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query with population
    let query = BoothVotes.find()
      .populate('candidate_id', 'name party')
      .populate('booth_id', 'booth_number name')
      .populate('election_year_id', 'year')
      .sort({ updated_at: -1 });

    // Filter by booth
    if (req.query.booth) {
      query = query.where('booth_id').equals(req.query.booth);
    }

    // Filter by candidate
    if (req.query.candidate) {
      query = query.where('candidate_id').equals(req.query.candidate);
    }

    // Filter by election year
    if (req.query.election_year) {
      query = query.where('election_year_id').equals(req.query.election_year);
    }

    const boothVotes = await query.skip(skip).limit(limit).exec();
    const total = await BoothVotes.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: boothVotes.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: boothVotes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single booth vote record
// @route   GET /api/booth-votes/:id
// @access  Public
exports.getBoothVote = async (req, res, next) => {
  try {
    const boothVote = await BoothVotes.findById(req.params.id)
      .populate('candidate_id', 'name party')
      .populate('booth_id', 'booth_number name')
      .populate('election_year_id', 'year');

    if (!boothVote) {
      return res.status(404).json({
        success: false,
        message: 'Booth vote record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: boothVote
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create booth vote record
// @route   POST /api/booth-votes
// @access  Private (Admin only)
exports.createBoothVote = async (req, res, next) => {
  try {
    // Verify all references exist
    const [candidate, booth, electionYear] = await Promise.all([
      Candidate.findById(req.body.candidate_id),
      Booth.findById(req.body.booth_id),
      ElectionYear.findById(req.body.election_year_id)
    ]);

    if (!candidate) {
      return res.status(400).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    if (!booth) {
      return res.status(400).json({
        success: false,
        message: 'Booth not found'
      });
    }
    if (!electionYear) {
      return res.status(400).json({
        success: false,
        message: 'Election year not found'
      });
    }

    const boothVote = await BoothVotes.create(req.body);

    res.status(201).json({
      success: true,
      data: boothVote
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update booth vote record
// @route   PUT /api/booth-votes/:id
// @access  Private (Admin only)
exports.updateBoothVote = async (req, res, next) => {
  try {
    let boothVote = await BoothVotes.findById(req.params.id);

    if (!boothVote) {
      return res.status(404).json({
        success: false,
        message: 'Booth vote record not found'
      });
    }

    // Verify references if being updated
    if (req.body.candidate_id) {
      const candidate = await Candidate.findById(req.body.candidate_id);
      if (!candidate) {
        return res.status(400).json({
          success: false,
          message: 'Candidate not found'
        });
      }
    }
    if (req.body.booth_id) {
      const booth = await Booth.findById(req.body.booth_id);
      if (!booth) {
        return res.status(400).json({
          success: false,
          message: 'Booth not found'
        });
      }
    }
    if (req.body.election_year_id) {
      const electionYear = await ElectionYear.findById(req.body.election_year_id);
      if (!electionYear) {
        return res.status(400).json({
          success: false,
          message: 'Election year not found'
        });
      }
    }

    boothVote = await BoothVotes.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    .populate('candidate_id', 'name party')
    .populate('booth_id', 'booth_number name')
    .populate('election_year_id', 'year');

    res.status(200).json({
      success: true,
      data: boothVote
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete booth vote record
// @route   DELETE /api/booth-votes/:id
// @access  Private (Admin only)
exports.deleteBoothVote = async (req, res, next) => {
  try {
    const boothVote = await BoothVotes.findById(req.params.id);

    if (!boothVote) {
      return res.status(404).json({
        success: false,
        message: 'Booth vote record not found'
      });
    }

    await boothVote.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get votes by booth
// @route   GET /api/booth-votes/booth/:boothId
// @access  Public
exports.getVotesByBooth = async (req, res, next) => {
  try {
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const votes = await BoothVotes.find({ booth_id: req.params.boothId })
      .populate('candidate_id', 'name party')
      .populate('election_year_id', 'year')
      .sort({ total_votes: -1 });

    res.status(200).json({
      success: true,
      count: votes.length,
      data: votes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get votes by candidate
// @route   GET /api/booth-votes/candidate/:candidateId
// @access  Public
exports.getVotesByCandidate = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    const votes = await BoothVotes.find({ candidate_id: req.params.candidateId })
      .populate('booth_id', 'booth_number name')
      .populate('election_year_id', 'year')
      .sort({ total_votes: -1 });

    res.status(200).json({
      success: true,
      count: votes.length,
      data: votes
    });
  } catch (err) {
    next(err);
  }
};