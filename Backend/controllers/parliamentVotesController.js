const ParliamentVotes = require('../models/parliamentVotes');
const Candidate = require('../models/Candidate');
const Parliament = require('../models/parliament');
const State = require('../models/state');
const Division = require('../models/division');
const Assembly = require('../models/assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');
const ElectionYear = require('../models/electionYear');
const User = require('../models/User');

// @desc    Get all parliament votes
// @route   GET /api/parliament-votes
// @access  Public
exports.getParliamentVotes = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = ParliamentVotes.find()
      .populate('candidate', 'name party')
      .populate('parliament', 'name')
      .populate('state', 'name')
      .populate('division', 'name')
      .populate('assembly', 'name')
      .populate('block', 'name')
      .populate('booth', 'name booth_number')
      .populate('election_year', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ total_votes: -1 });

    // Filter by candidate
    if (req.query.candidate) {
      query = query.where('candidate_id').equals(req.query.candidate);
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

    // Filter by assembly
    if (req.query.assembly) {
      query = query.where('assembly_id').equals(req.query.assembly);
    }

    // Filter by block
    if (req.query.block) {
      query = query.where('block_id').equals(req.query.block);
    }

    // Filter by booth
    if (req.query.booth) {
      query = query.where('booth_id').equals(req.query.booth);
    }

    // Filter by election year
    if (req.query.year) {
      query = query.where('election_year_id').equals(req.query.year);
    }

    // Filter by minimum votes
    if (req.query.minVotes) {
      query = query.where('total_votes').gte(parseInt(req.query.minVotes));
    }

    // Filter by maximum votes
    if (req.query.maxVotes) {
      query = query.where('total_votes').lte(parseInt(req.query.maxVotes));
    }

    const votes = await query.skip(skip).limit(limit).exec();
    const total = await ParliamentVotes.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: votes.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: votes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single parliament vote record
// @route   GET /api/parliament-votes/:id
// @access  Public
exports.getParliamentVote = async (req, res, next) => {
  try {
    const vote = await ParliamentVotes.findById(req.params.id)
      .populate('candidate', 'name party')
      .populate('parliament', 'name')
      .populate('state', 'name')
      .populate('division', 'name')
      .populate('assembly', 'name')
      .populate('block', 'name')
      .populate('booth', 'name booth_number')
      .populate('election_year', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!vote) {
      return res.status(404).json({
        success: false,
        message: 'Vote record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: vote
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create parliament vote record
// @route   POST /api/parliament-votes
// @access  Private (Admin only)
exports.createParliamentVote = async (req, res, next) => {
  try {
    // Verify all references exist
    const [
      candidate,
      parliament,
      state,
      division,
      assembly,
      block,
      booth,
      electionYear
    ] = await Promise.all([
      Candidate.findById(req.body.candidate_id),
      Parliament.findById(req.body.parliament_id),
      State.findById(req.body.state_id),
      Division.findById(req.body.division_id),
      Assembly.findById(req.body.assembly_id),
      Block.findById(req.body.block_id),
      Booth.findById(req.body.booth_id),
      ElectionYear.findById(req.body.election_year_id)
    ]);

    if (!candidate) {
      return res.status(400).json({ success: false, message: 'Candidate not found' });
    }
    if (!parliament) {
      return res.status(400).json({ success: false, message: 'Parliament not found' });
    }
    if (!state) {
      return res.status(400).json({ success: false, message: 'State not found' });
    }
    if (!division) {
      return res.status(400).json({ success: false, message: 'Division not found' });
    }
    if (!assembly) {
      return res.status(400).json({ success: false, message: 'Assembly not found' });
    }
    if (!block) {
      return res.status(400).json({ success: false, message: 'Block not found' });
    }
    if (!booth) {
      return res.status(400).json({ success: false, message: 'Booth not found' });
    }
    if (!electionYear) {
      return res.status(400).json({ success: false, message: 'Election year not found' });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const voteData = {
      ...req.body,
      created_by: req.user.id
    };

    const vote = await ParliamentVotes.create(voteData);

    res.status(201).json({
      success: true,
      data: vote
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Vote record already exists for this candidate-booth-election year combination'
      });
    }
    next(err);
  }
};

// @desc    Update parliament vote record
// @route   PUT /api/parliament-votes/:id
// @access  Private (Admin only)
exports.updateParliamentVote = async (req, res, next) => {
  try {
    let vote = await ParliamentVotes.findById(req.params.id);

    if (!vote) {
      return res.status(404).json({
        success: false,
        message: 'Vote record not found'
      });
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.candidate_id) verificationPromises.push(Candidate.findById(req.body.candidate_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.block_id) verificationPromises.push(Block.findById(req.body.block_id));
    if (req.body.booth_id) verificationPromises.push(Booth.findById(req.body.booth_id));
    if (req.body.election_year_id) verificationPromises.push(ElectionYear.findById(req.body.election_year_id));

    const verificationResults = await Promise.all(verificationPromises);
    
    for (const result of verificationResults) {
      if (!result) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reference ID provided'
        });
      }
    }

    // Add updated_by info
    req.body.updated_by = req.user.id;
    req.body.updated_at = new Date();

    vote = await ParliamentVotes.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('candidate', 'name party')
      .populate('parliament', 'name')
      .populate('state', 'name')
      .populate('division', 'name')
      .populate('assembly', 'name')
      .populate('block', 'name')
      .populate('booth', 'name booth_number')
      .populate('election_year', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: vote
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Vote record already exists for this candidate-booth-election year combination'
      });
    }
    next(err);
  }
};

// @desc    Delete parliament vote record
// @route   DELETE /api/parliament-votes/:id
// @access  Private (Admin only)
exports.deleteParliamentVote = async (req, res, next) => {
  try {
    const vote = await ParliamentVotes.findById(req.params.id);

    if (!vote) {
      return res.status(404).json({
        success: false,
        message: 'Vote record not found'
      });
    }

    await vote.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get votes by parliament
// @route   GET /api/parliament-votes/parliament/:parliamentId
// @access  Public
exports.getVotesByParliament = async (req, res, next) => {
  try {
    // Verify parliament exists
    const parliament = await Parliament.findById(req.params.parliamentId);
    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    const votes = await ParliamentVotes.find({ parliament_id: req.params.parliamentId })
      .sort({ total_votes: -1 })
      .populate('candidate', 'name party')
      .populate('booth', 'name booth_number')
      .populate('election_year', 'year');

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
// @route   GET /api/parliament-votes/candidate/:candidateId
// @access  Public
exports.getVotesByCandidate = async (req, res, next) => {
  try {
    // Verify candidate exists
    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    const votes = await ParliamentVotes.find({ candidate_id: req.params.candidateId })
      .sort({ total_votes: -1 })
      .populate('parliament', 'name')
      .populate('election_year', 'year');

    res.status(200).json({
      success: true,
      count: votes.length,
      data: votes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get votes by state
// @route   GET /api/parliament-votes/state/:stateId
// @access  Public
exports.getVotesByState = async (req, res, next) => {
  try {
    // Verify state exists
    const state = await State.findById(req.params.stateId);
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    const votes = await ParliamentVotes.find({ state_id: req.params.stateId })
      .sort({ total_votes: -1 })
      .populate('candidate', 'name party')
      .populate('parliament', 'name')
      .populate('election_year', 'year');

    res.status(200).json({
      success: true,
      count: votes.length,
      data: votes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get votes by election year
// @route   GET /api/parliament-votes/year/:yearId
// @access  Public
exports.getVotesByElectionYear = async (req, res, next) => {
  try {
    // Verify election year exists
    const year = await ElectionYear.findById(req.params.yearId);
    if (!year) {
      return res.status(404).json({
        success: false,
        message: 'Election year not found'
      });
    }

    const votes = await ParliamentVotes.find({ election_year_id: req.params.yearId })
      .sort({ total_votes: -1 })
      .populate('candidate', 'name party')
      .populate('parliament', 'name')
      .populate('state', 'name');

    res.status(200).json({
      success: true,
      count: votes.length,
      data: votes
    });
  } catch (err) {
    next(err);
  }
};