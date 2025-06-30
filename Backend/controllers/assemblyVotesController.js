const AssemblyVotes = require('../models/assemblyVotes');
const Candidate = require('../models/Candidate');
const Assembly = require('../models/assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');
const ElectionYear = require('../models/electionYear');
const mongoose = require('mongoose');

// @desc    Get all assembly votes
// @route   GET /api/assembly-votes
// @access  Public
exports.getAssemblyVotes = async (req, res, next) => {
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
    
    let query = AssemblyVotes.find(JSON.parse(queryStr))
      .populate('candidate_id', 'name party')
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

    const assemblyVotes = await query;
    const total = await AssemblyVotes.countDocuments(JSON.parse(queryStr));

    res.status(200).json({
      success: true,
      count: assemblyVotes.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: assemblyVotes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single assembly vote record
// @route   GET /api/assembly-votes/:id
// @access  Public
exports.getAssemblyVote = async (req, res, next) => {
  try {
    const assemblyVote = await AssemblyVotes.findById(req.params.id)
      .populate('candidate_id', 'name party')
      .populate('assembly_id', 'name code')
      .populate('block_id', 'name code')
      .populate('booth_id', 'booth_number name')
      .populate('election_year_id', 'year');

    if (!assemblyVote) {
      return res.status(404).json({
        success: false,
        message: 'Assembly vote record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assemblyVote
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create assembly vote record
// @route   POST /api/assembly-votes
// @access  Private (Admin only)
exports.createAssemblyVote = async (req, res, next) => {
  try {
    // Verify all references exist and relationships are valid
    const [candidate, assembly, block, booth, electionYear] = await Promise.all([
      Candidate.findById(req.body.candidate_id),
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

    const assemblyVote = await AssemblyVotes.create(req.body);

    res.status(201).json({
      success: true,
      data: assemblyVote
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate vote record: This candidate already has a vote entry for this booth-block-assembly-year combination'
      });
    }
    next(err);
  }
};

// @desc    Update assembly vote record
// @route   PUT /api/assembly-votes/:id
// @access  Private (Admin only)
exports.updateAssemblyVote = async (req, res, next) => {
  try {
    let assemblyVote = await AssemblyVotes.findById(req.params.id);

    if (!assemblyVote) {
      return res.status(404).json({
        success: false,
        message: 'Assembly vote record not found'
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

    if (req.body.assembly_id) {
      verificationPromises.push(
        Assembly.findById(req.body.assembly_id).then(assembly => {
          if (!assembly) throw new Error('Assembly constituency not found');
        })
      );
    }

    if (req.body.block_id) {
      verificationPromises.push(
        Block.findById(req.body.block_id).then(block => {
          if (!block) throw new Error('Block not found');
          // Verify block belongs to assembly if either is being updated
          const assemblyId = req.body.assembly_id || assemblyVote.assembly_id.toString();
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
          const blockId = req.body.block_id || assemblyVote.block_id.toString();
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

    assemblyVote = await AssemblyVotes.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    .populate('candidate_id', 'name party')
    .populate('assembly_id', 'name code')
    .populate('block_id', 'name code')
    .populate('booth_id', 'booth_number name')
    .populate('election_year_id', 'year');

    res.status(200).json({
      success: true,
      data: assemblyVote
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate vote record: This candidate already has a vote entry for this booth-block-assembly-year combination'
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

// @desc    Delete assembly vote record
// @route   DELETE /api/assembly-votes/:id
// @access  Private (Admin only)
exports.deleteAssemblyVote = async (req, res, next) => {
  try {
    const assemblyVote = await AssemblyVotes.findById(req.params.id);

    if (!assemblyVote) {
      return res.status(404).json({
        success: false,
        message: 'Assembly vote record not found'
      });
    }

    await assemblyVote.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get votes by assembly constituency
// @route   GET /api/assembly-votes/assembly/:assemblyId
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

    const votes = await AssemblyVotes.find({ assembly_id: req.params.assemblyId })
      .populate('candidate_id', 'name party')
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
// @route   GET /api/assembly-votes/block/:blockId
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

    const votes = await AssemblyVotes.find({ block_id: req.params.blockId })
      .populate('candidate_id', 'name party')
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
// @route   GET /api/assembly-votes/booth/:boothId
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

    const votes = await AssemblyVotes.find({ booth_id: req.params.boothId })
      .populate('candidate_id', 'name party')
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
// @route   GET /api/assembly-votes/candidate/:candidateId
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

    const votes = await AssemblyVotes.find({ candidate_id: req.params.candidateId })
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

// @desc    Get aggregated votes by assembly for a candidate
// @route   GET /api/assembly-votes/candidate/:candidateId/aggregated
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

    const aggregation = await AssemblyVotes.aggregate([
      { $match: { candidate_id: mongoose.Types.ObjectId(req.params.candidateId) } },
      {
        $group: {
          _id: '$assembly_id',
          total_votes: { $sum: '$total_votes' },
          block_count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'assemblies',
          localField: '_id',
          foreignField: '_id',
          as: 'assembly'
        }
      },
      { $unwind: '$assembly' },
      {
        $project: {
          assembly_id: '$_id',
          assembly_name: '$assembly.name',
          assembly_code: '$assembly.code',
          total_votes: 1,
          block_count: 1,
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

// @desc    Get election results by assembly constituency
// @route   GET /api/assembly-votes/results/assembly/:assemblyId/year/:yearId
// @access  Public
exports.getElectionResultsByAssembly = async (req, res, next) => {
  try {
    const [assembly, electionYear] = await Promise.all([
      Assembly.findById(req.params.assemblyId),
      ElectionYear.findById(req.params.yearId)
    ]);

    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly constituency not found'
      });
    }
    if (!electionYear) {
      return res.status(404).json({
        success: false,
        message: 'Election year not found'
      });
    }

    const results = await AssemblyVotes.aggregate([
      { 
        $match: { 
          assembly_id: mongoose.Types.ObjectId(req.params.assemblyId),
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

    // Calculate total votes cast in the assembly
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