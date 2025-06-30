const BlockVotes = require('../models/blockVotes');
const Candidate = require('../models/Candidate');
const Block = require('../models/block');
const Booth = require('../models/booth');
const ElectionYear = require('../models/electionYear');

// @desc    Get all block votes
// @route   GET /api/block-votes
// @access  Public
exports.getBlockVotes = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query with population
    let query = BlockVotes.find()
      .populate('candidate_id', 'name party')
      .populate('block_id', 'name code')
      .populate('booth_id', 'booth_number name')
      .populate('election_year_id', 'year')
      .sort({ updated_at: -1 });

    // Filter by block
    if (req.query.block) {
      query = query.where('block_id').equals(req.query.block);
    }

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

    const blockVotes = await query.skip(skip).limit(limit).exec();
    const total = await BlockVotes.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: blockVotes.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: blockVotes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single block vote record
// @route   GET /api/block-votes/:id
// @access  Public
exports.getBlockVote = async (req, res, next) => {
  try {
    const blockVote = await BlockVotes.findById(req.params.id)
      .populate('candidate_id', 'name party')
      .populate('block_id', 'name code')
      .populate('booth_id', 'booth_number name')
      .populate('election_year_id', 'year');

    if (!blockVote) {
      return res.status(404).json({
        success: false,
        message: 'Block vote record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: blockVote
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create block vote record
// @route   POST /api/block-votes
// @access  Private (Admin only)
exports.createBlockVote = async (req, res, next) => {
  try {
    // Verify all references exist
    const [candidate, block, booth, electionYear] = await Promise.all([
      Candidate.findById(req.body.candidate_id),
      Block.findById(req.body.block_id),
      Booth.findById(req.body.booth_id),
      ElectionYear.findById(req.body.election_year_id)
    ]);

    if (!candidate) {
      return res.status(400).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    if (!block) {
      return res.status(400).json({
        success: false,
        message: 'Block not found'
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

    // Verify booth belongs to the specified block
    if (booth.block_id.toString() !== req.body.block_id) {
      return res.status(400).json({
        success: false,
        message: 'Booth does not belong to the specified block'
      });
    }

    const blockVote = await BlockVotes.create(req.body);

    res.status(201).json({
      success: true,
      data: blockVote
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Vote record already exists for this candidate-booth-block-year combination'
      });
    }
    next(err);
  }
};

// @desc    Update block vote record
// @route   PUT /api/block-votes/:id
// @access  Private (Admin only)
exports.updateBlockVote = async (req, res, next) => {
  try {
    let blockVote = await BlockVotes.findById(req.params.id);

    if (!blockVote) {
      return res.status(404).json({
        success: false,
        message: 'Block vote record not found'
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
    if (req.body.block_id) {
      const block = await Block.findById(req.body.block_id);
      if (!block) {
        return res.status(400).json({
          success: false,
          message: 'Block not found'
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
      // Verify booth belongs to block if either is being updated
      const currentBlockId = req.body.block_id || blockVote.block_id.toString();
      if (booth.block_id.toString() !== currentBlockId) {
        return res.status(400).json({
          success: false,
          message: 'Booth does not belong to the specified block'
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

    blockVote = await BlockVotes.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    .populate('candidate_id', 'name party')
    .populate('block_id', 'name code')
    .populate('booth_id', 'booth_number name')
    .populate('election_year_id', 'year');

    res.status(200).json({
      success: true,
      data: blockVote
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Vote record already exists for this candidate-booth-block-year combination'
      });
    }
    next(err);
  }
};

// @desc    Delete block vote record
// @route   DELETE /api/block-votes/:id
// @access  Private (Admin only)
exports.deleteBlockVote = async (req, res, next) => {
  try {
    const blockVote = await BlockVotes.findById(req.params.id);

    if (!blockVote) {
      return res.status(404).json({
        success: false,
        message: 'Block vote record not found'
      });
    }

    await blockVote.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get votes by block
// @route   GET /api/block-votes/block/:blockId
// @access  Public
exports.getVotesByBlock = async (req, res, next) => {
  try {
    const block = await Block.findById(req.params.blockId);
    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    const votes = await BlockVotes.find({ block_id: req.params.blockId })
      .populate('candidate_id', 'name party')
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

// @desc    Get votes by booth
// @route   GET /api/block-votes/booth/:boothId
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

    const votes = await BlockVotes.find({ booth_id: req.params.boothId })
      .populate('candidate_id', 'name party')
      .populate('block_id', 'name code')
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
// @route   GET /api/block-votes/candidate/:candidateId
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

    const votes = await BlockVotes.find({ candidate_id: req.params.candidateId })
      .populate('block_id', 'name code')
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

// @desc    Get aggregated votes by block for a candidate
// @route   GET /api/block-votes/candidate/:candidateId/aggregated
// @access  Public
exports.getAggregatedVotesByCandidate = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    const aggregation = await BlockVotes.aggregate([
      { $match: { candidate_id: mongoose.Types.ObjectId(req.params.candidateId) } },
      {
        $group: {
          _id: '$block_id',
          total_votes: { $sum: '$total_votes' },
          booth_count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'blocks',
          localField: '_id',
          foreignField: '_id',
          as: 'block'
        }
      },
      { $unwind: '$block' },
      {
        $project: {
          block_id: '$_id',
          block_name: '$block.name',
          block_code: '$block.code',
          total_votes: 1,
          booth_count: 1,
          _id: 0
        }
      },
      { $sort: { total_votes: -1 } }
    ]);

    res.status(200).json({
      success: true,
      count: aggregation.length,
      data: aggregation
    });
  } catch (err) {
    next(err);
  }
};