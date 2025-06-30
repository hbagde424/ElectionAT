const ParliamentVotes = require('../models/parliamentVotes');
const Candidate = require('../models/Candidate');
const Parliament = require('../models/parliament');
const Assembly = require('../models/assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');
const ElectionYear = require('../models/electionYear');
const mongoose = require('mongoose');

// @desc    Get all parliament votes
// @route   GET /api/parliament-votes
// @access  Public
exports.getParliamentVotes = async (req, res, next) => {
  try {
    // Advanced filtering, sorting, field limiting and pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const skip = (page - 1) * limit;
    
    // Build query
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    
    let query = ParliamentVotes.find(JSON.parse(queryStr))
      .populate('candidate_id', 'name party')
      .populate('parliament_id', 'name code')
      .populate('assembly_id', 'name code')
      .populate('block_id', 'name code')
      .populate('booth_id', 'booth_number name')
      .populate('election_year_id', 'year');

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-created_at');
    }

    // Field limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }

    // Pagination
    query = query.skip(skip).limit(limit);

    const parliamentVotes = await query;
    const total = await ParliamentVotes.countDocuments(JSON.parse(queryStr));

    res.status(200).json({
      success: true,
      count: parliamentVotes.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: parliamentVotes
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
    const parliamentVote = await ParliamentVotes.findById(req.params.id)
      .populate('candidate_id', 'name party')
      .populate('parliament_id', 'name code')
      .populate('assembly_id', 'name code')
      .populate('block_id', 'name code')
      .populate('booth_id', 'booth_number name')
      .populate('election_year_id', 'year');

    if (!parliamentVote) {
      return res.status(404).json({
        success: false,
        message: 'Parliament vote record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: parliamentVote
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
    // Verify all references exist and relationships are valid
    const [candidate, parliament, assembly, block, booth, electionYear] = await Promise.all([
      Candidate.findById(req.body.candidate_id),
      Parliament.findById(req.body.parliament_id),
      Assembly.findById(req.body.assembly_id),
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
    if (!parliament) {
      return res.status(400).json({
        success: false,
        message: 'Parliament constituency not found'
      });
    }
    if (!assembly) {
      return res.status(400).json({
        success: false,
        message: 'Assembly constituency not found'
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

    // Verify booth belongs to block
    if (booth.block_id.toString() !== req.body.block_id) {
      return res.status(400).json({
        success: false,
        message: 'Booth does not belong to the specified block'
      });
    }

    // Verify block belongs to assembly
    if (block.assembly_id.toString() !== req.body.assembly_id) {
      return res.status(400).json({
        success: false,
        message: 'Block does not belong to the specified assembly constituency'
      });
    }

    // Verify assembly belongs to parliament
    if (assembly.parliament_id.toString() !== req.body.parliament_id) {
      return res.status(400).json({
        success: false,
        message: 'Assembly constituency does not belong to the specified parliament constituency'
      });
    }

    const parliamentVote = await ParliamentVotes.create(req.body);

    res.status(201).json({
      success: true,
      data: parliamentVote
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate vote record: This candidate already has a vote entry for this booth-block-assembly-parliament-year combination'
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
    let parliamentVote = await ParliamentVotes.findById(req.params.id);

    if (!parliamentVote) {
      return res.status(404).json({
        success: false,
        message: 'Parliament vote record not found'
      });
    }

    // Verify references if being updated
    const verificationPromises = [];
    
    if (req.body.candidate_id) {
      verificationPromises.push(
        Candidate.findById(req.body.candidate_id).then(candidate => {
          if (!candidate) throw new Error('Candidate not found');
        })
      );
    }

    if (req.body.parliament_id) {
      verificationPromises.push(
        Parliament.findById(req.body.parliament_id).then(parliament => {
          if (!parliament) throw new Error('Parliament constituency not found');
        })
      );
    }

    if (req.body.assembly_id) {
      verificationPromises.push(
        Assembly.findById(req.body.assembly_id).then(assembly => {
          if (!assembly) throw new Error('Assembly constituency not found');
          // Verify assembly belongs to parliament if either is being updated
          const parliamentId = req.body.parliament_id || parliamentVote.parliament_id.toString();
          if (assembly.parliament_id.toString() !== parliamentId) {
            throw new Error('Assembly constituency does not belong to the specified parliament constituency');
          }
        })
      );
    }

    if (req.body.block_id) {
      verificationPromises.push(
        Block.findById(req.body.block_id).then(block => {
          if (!block) throw new Error('Block not found');
          // Verify block belongs to assembly if either is being updated
          const assemblyId = req.body.assembly_id || parliamentVote.assembly_id.toString();
          if (block.assembly_id.toString() !== assemblyId) {
            throw new Error('Block does not belong to the specified assembly constituency');
          }
        })
      );
    }

    if (req.body.booth_id) {
      verificationPromises.push(
        Booth.findById(req.body.booth_id).then(booth => {
          if (!booth) throw new Error('Booth not found');
          // Verify booth belongs to block if either is being updated
          const blockId = req.body.block_id || parliamentVote.block_id.toString();
          if (booth.block_id.toString() !== blockId) {
            throw new Error('Booth does not belong to the specified block');
          }
        })
      );
    }

    if (req.body.election_year_id) {
      verificationPromises.push(
        ElectionYear.findById(req.body.election_year_id).then(electionYear => {
          if (!electionYear) throw new Error('Election year not found');
        })
      );
    }

    await Promise.all(verificationPromises);

    parliamentVote = await ParliamentVotes.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    .populate('candidate_id', 'name party')
    .populate('parliament_id', 'name code')
    .populate('assembly_id', 'name code')
    .populate('block_id', 'name code')
    .populate('booth_id', 'booth_number name')
    .populate('election_year_id', 'year');

    res.status(200).json({
      success: true,
      data: parliamentVote
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate vote record: This candidate already has a vote entry for this booth-block-assembly-parliament-year combination'
      });
    }
    if (err.message) {
      return res.status(400).json({
        success: false,
        message: err.message
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
    const parliamentVote = await ParliamentVotes.findById(req.params.id);

    if (!parliamentVote) {
      return res.status(404).json({
        success: false,
        message: 'Parliament vote record not found'
      });
    }

    await parliamentVote.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get votes by parliament constituency
// @route   GET /api/parliament-votes/parliament/:parliamentId
// @access  Public
exports.getVotesByParliament = async (req, res, next) => {
  try {
    const parliament = await Parliament.findById(req.params.parliamentId);
    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament constituency not found'
      });
    }

    const votes = await ParliamentVotes.find({ parliament_id: req.params.parliamentId })
      .populate('candidate_id', 'name party')
      .populate('assembly_id', 'name code')
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

// @desc    Get votes by assembly constituency
// @route   GET /api/parliament-votes/assembly/:assemblyId
// @access  Public
exports.getVotesByAssembly = async (req, res, next) => {
  try {
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly constituency not found'
      });
    }

    const votes = await ParliamentVotes.find({ assembly_id: req.params.assemblyId })
      .populate('candidate_id', 'name party')
      .populate('parliament_id', 'name code')
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

// @desc    Get votes by block
// @route   GET /api/parliament-votes/block/:blockId
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

    const votes = await ParliamentVotes.find({ block_id: req.params.blockId })
      .populate('candidate_id', 'name party')
      .populate('parliament_id', 'name code')
      .populate('assembly_id', 'name code')
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
// @route   GET /api/parliament-votes/booth/:boothId
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

    const votes = await ParliamentVotes.find({ booth_id: req.params.boothId })
      .populate('candidate_id', 'name party')
      .populate('parliament_id', 'name code')
      .populate('assembly_id', 'name code')
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
// @route   GET /api/parliament-votes/candidate/:candidateId
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

    const votes = await ParliamentVotes.find({ candidate_id: req.params.candidateId })
      .populate('parliament_id', 'name code')
      .populate('assembly_id', 'name code')
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

// @desc    Get aggregated votes by parliament for a candidate
// @route   GET /api/parliament-votes/candidate/:candidateId/aggregated
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

    const aggregation = await ParliamentVotes.aggregate([
      { $match: { candidate_id: mongoose.Types.ObjectId(req.params.candidateId) } },
      {
        $group: {
          _id: '$parliament_id',
          total_votes: { $sum: '$total_votes' },
          assembly_count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'parliaments',
          localField: '_id',
          foreignField: '_id',
          as: 'parliament'
        }
      },
      { $unwind: '$parliament' },
      {
        $project: {
          parliament_id: '$_id',
          parliament_name: '$parliament.name',
          parliament_code: '$parliament.code',
          total_votes: 1,
          assembly_count: 1,
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

// @desc    Get election results by parliament constituency
// @route   GET /api/parliament-votes/results/parliament/:parliamentId/year/:yearId
// @access  Public
exports.getElectionResultsByParliament = async (req, res, next) => {
  try {
    const [parliament, electionYear] = await Promise.all([
      Parliament.findById(req.params.parliamentId),
      ElectionYear.findById(req.params.yearId)
    ]);

    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament constituency not found'
      });
    }
    if (!electionYear) {
      return res.status(404).json({
        success: false,
        message: 'Election year not found'
      });
    }

    const results = await ParliamentVotes.aggregate([
      { 
        $match: { 
          parliament_id: mongoose.Types.ObjectId(req.params.parliamentId),
          election_year_id: mongoose.Types.ObjectId(req.params.yearId)
        } 
      },
      {
        $group: {
          _id: '$candidate_id',
          total_votes: { $sum: '$total_votes' },
          booth_count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'candidates',
          localField: '_id',
          foreignField: '_id',
          as: 'candidate'
        }
      },
      { $unwind: '$candidate' },
      {
        $project: {
          candidate_id: '$_id',
          candidate_name: '$candidate.name',
          candidate_party: '$candidate.party',
          total_votes: 1,
          booth_count: 1,
          _id: 0
        }
      },
      { $sort: { total_votes: -1 } }
    ]);

    // Calculate total votes cast in the parliament
    const totalVotes = results.reduce((sum, candidate) => sum + candidate.total_votes, 0);

    // Add percentage of total votes to each candidate
    const resultsWithPercentage = results.map(candidate => ({
      ...candidate,
      vote_percentage: totalVotes > 0 ? ((candidate.total_votes / totalVotes) * 100).toFixed(2) : 0
    }));

    res.status(200).json({
      success: true,
      count: results.length,
      total_votes: totalVotes,
      data: resultsWithPercentage
    });
  } catch (err) {
    next(err);
  }
};