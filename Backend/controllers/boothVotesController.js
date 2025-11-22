const BoothVotes = require('../models/boothVotes');
const Candidate = require('../models/Candidate');
const State = require('../models/state');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const Assembly = require('../models/Assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');
const ElectionYear = require('../models/electionYear');
const User = require('../models/User');

// @desc    Get all booth votes
// @route   GET /api/booth-votes
// @access  Private (Requires authentication via serviceToken)
exports.getBoothVotes = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Basic query

    let query = BoothVotes.find()
      .populate({
        path: 'candidate',
        select: 'name party_id',
        populate: {
          path: 'party_id',
          select: 'name abbreviation'
        }
      })
      .populate('state', 'name')
      .populate('division', 'name')
      .populate('parliament', 'name')
      .populate('assembly', 'name')
      .populate('block', 'name')
      .populate('booth', 'name booth_number')
      .populate('election_year', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ total_votes: -1 });

    // Debug: log incoming query params
    console.log('Incoming booth-votes query:', req.query);

    // Apply user hierarchy scoping when available (booth->block->assembly->parliament->division->state)
    if (req.userHierarchy && !(req.user && req.user.role === 'superAdmin')) {
      const uh = req.userHierarchy;
      if (uh.booth && uh.booth._id) {
        query = query.where('booth_id').equals(uh.booth._id);
      } else if (uh.block && uh.block._id) {
        query = query.where('block_id').equals(uh.block._id);
      } else if (uh.assembly && uh.assembly._id) {
        query = query.where('assembly_id').equals(uh.assembly._id);
      } else if (uh.parliament && uh.parliament._id) {
        query = query.where('parliament_id').equals(uh.parliament._id);
      } else if (uh.division && uh.division._id) {
        query = query.where('division_id').equals(uh.division._id);
      } else if (uh.state && uh.state._id) {
        query = query.where('state_id').equals(uh.state._id);
      }
    }


    // Helper function for ObjectId or name lookup (normalize dashes to spaces)
    const handleIdOrName = async (param, model, idField, nameField = 'name') => {
      if (!req.query[param]) return null;
      let value = req.query[param];
      value = value.replace(/-/g, ' ');
      const isObjectId = /^[a-f\d]{24}$/i.test(value);
      if (isObjectId) {
        return value;
        console.log(`Resolved ${param} name '${value}' to id:`, doc ? doc._id : null);
      } else {
        // Support "like" (case-insensitive partial match) for name
        const doc = await model.findOne({ [nameField]: { $regex: value, $options: 'i' } });
        return doc ? doc._id : null;
      }
    };

    // Candidate
    if (req.query.candidate) {
      const candidateId = await handleIdOrName('candidate', Candidate, 'candidate_id');
      if (candidateId) {
        query = query.where('candidate_id').equals(candidateId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // State
    if (req.query.state) {
      const stateId = await handleIdOrName('state', State, 'state_id');
      if (stateId) {
        query = query.where('state_id').equals(stateId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Division
    if (req.query.division) {
      const divisionId = await handleIdOrName('division', Division, 'division_id');
      if (divisionId) {
        query = query.where('division_id').equals(divisionId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Parliament
    if (req.query.parliament) {
      const parliamentId = await handleIdOrName('parliament', Parliament, 'parliament_id');
      if (parliamentId) {
        query = query.where('parliament_id').equals(parliamentId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Assembly
    if (req.query.assembly) {
      const assemblyId = await handleIdOrName('assembly', Assembly, 'assembly_id');
      if (assemblyId) {
        query = query.where('assembly_id').equals(assemblyId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Block
    if (req.query.block) {
      const blockId = await handleIdOrName('block', Block, 'block_id');
      if (blockId) {
        query = query.where('block_id').equals(blockId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Booth
    if (req.query.booth) {
      const boothId = await handleIdOrName('booth', Booth, 'booth_id');
      if (boothId) {
        query = query.where('booth_id').equals(boothId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Election Year
    if (req.query.year) {
      // Try both _id and year field
      const isObjectId = /^[a-f\d]{24}$/i.test(req.query.year);
      let yearId = null;
      if (isObjectId) {
        yearId = req.query.year;
      } else {
        const yearDoc = await ElectionYear.findOne({ year: req.query.year });
        yearId = yearDoc ? yearDoc._id : null;
      }
      if (yearId) {
        query = query.where('election_year_id').equals(yearId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Filter by minimum votes
    if (req.query.minVotes) {
      query = query.where('total_votes').gte(parseInt(req.query.minVotes));
    }

    // Filter by maximum votes
    if (req.query.maxVotes) {
      query = query.where('total_votes').lte(parseInt(req.query.maxVotes));
    }

    // Debug: log final mongoose query filter
    console.log('BoothVotes mongoose query filter:', query.getFilter());

    const votes = await query.skip(skip).limit(limit).exec();
    const total = await BoothVotes.countDocuments(query.getFilter());

    // Populate division info for each booth vote
    const populatedVotes = await Promise.all(votes.map(async (bv) => {
      const bvObj = bv.toObject();
      if (bv.division_id) {
        const division = await Division.findById(bv.division_id);
        bvObj.division = division ? {
          _id: division._id,
          name: division.name,
          division_code: division.division_code,
          description: division.description
        } : null;
      }
      return bvObj;
    }));

    res.status(200).json({
      success: true,
      count: populatedVotes.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: populatedVotes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single booth vote record
// @route   GET /api/booth-votes/:id
// @access  Private (Requires authentication via serviceToken)
exports.getBoothVote = async (req, res, next) => {
  try {
    const vote = await BoothVotes.findById(req.params.id)
      .populate({
        path: 'candidate',
        select: 'name party_id',
        populate: {
          path: 'party_id',
          select: 'name abbreviation'
        }
      })
      .populate('state', 'name')
      .populate('division', 'name')
      .populate('parliament', 'name')
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

    // If userHierarchy present and user not superAdmin, ensure requested vote is within scope
    if (req.userHierarchy && !(req.user && req.user.role === 'superAdmin')) {
      const uh = req.userHierarchy;
      if (uh.booth && uh.booth._id && vote.booth && String(uh.booth._id) !== String(vote.booth._id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
      if (uh.block && uh.block._id && vote.block && String(uh.block._id) !== String(vote.block._id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
      if (uh.assembly && uh.assembly._id && vote.assembly && String(uh.assembly._id) !== String(vote.assembly._id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
      if (uh.parliament && uh.parliament._id && vote.parliament && String(uh.parliament._id) !== String(vote.parliament._id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
      if (uh.division && uh.division._id && vote.division && String(uh.division._id) !== String(vote.division._id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
      if (uh.state && uh.state._id && vote.state && String(uh.state._id) !== String(vote.state._id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
    }

    res.status(200).json({
      success: true,
      data: vote
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
    const [
      candidate,
      state,
      division,
      parliament,
      assembly,
      block,
      booth,
      electionYear
    ] = await Promise.all([
      Candidate.findById(req.body.candidate_id),
      State.findById(req.body.state_id),
      Division.findById(req.body.division_id),
      Parliament.findById(req.body.parliament_id),
      Assembly.findById(req.body.assembly_id),
      Block.findById(req.body.block_id),
      Booth.findById(req.body.booth_id),
      ElectionYear.findById(req.body.election_year_id)
    ]);

    if (!candidate) {
      return res.status(400).json({ success: false, message: 'Candidate not found' });
    }
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

    const vote = await BoothVotes.create(voteData);

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

// @desc    Update booth vote record
// @route   PUT /api/booth-votes/:id
// @access  Private (Admin only)
exports.updateBoothVote = async (req, res, next) => {
  try {
    let vote = await BoothVotes.findById(req.params.id);

    if (!vote) {
      return res.status(404).json({
        success: false,
        message: 'Vote record not found'
      });
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.candidate_id) verificationPromises.push(Candidate.findById(req.body.candidate_id));
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
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

    vote = await BoothVotes.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate({
        path: 'candidate',
        select: 'name party_id',
        populate: {
          path: 'party_id',
          select: 'name abbreviation'
        }
      })
      .populate('state', 'name')
      .populate('division', 'name')
      .populate('parliament', 'name')
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

// @desc    Delete booth vote record
// @route   DELETE /api/booth-votes/:id
// @access  Private (Admin only)
exports.deleteBoothVote = async (req, res, next) => {
  try {
    const vote = await BoothVotes.findById(req.params.id);

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

// @desc    Get votes by booth
// @route   GET /api/booth-votes/booth/:boothId
// @access  Private (Requires authentication via serviceToken)
exports.getVotesByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const votes = await BoothVotes.find({ booth_id: req.params.boothId })
      .sort({ total_votes: -1 })
      .populate({
        path: 'candidate',
        select: 'name party_id',
        populate: {
          path: 'party_id',
          select: 'name abbreviation'
        }
      })
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
// @route   GET /api/booth-votes/candidate/:candidateId
// @access  Private (Requires authentication via serviceToken)
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

    const votes = await BoothVotes.find({ candidate_id: req.params.candidateId })
      .sort({ total_votes: -1 })
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

// @desc    Get votes by state
// @route   GET /api/booth-votes/state/:stateId
// @access  Private (Requires authentication via serviceToken)
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

    const votes = await BoothVotes.find({ state_id: req.params.stateId })
      .sort({ total_votes: -1 })
      .populate({
        path: 'candidate',
        select: 'name party_id',
        populate: {
          path: 'party_id',
          select: 'name abbreviation'
        }
      })
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

// @desc    Get votes by election year
// @route   GET /api/booth-votes/year/:yearId
// @access  Private (Requires authentication via serviceToken)
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

    const votes = await BoothVotes.find({ election_year_id: req.params.yearId })
      .sort({ total_votes: -1 })
      .populate({
        path: 'candidate',
        select: 'name party_id',
        populate: {
          path: 'party_id',
          select: 'name abbreviation'
        }
      })
      .populate('booth', 'name booth_number')
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

// @desc    Import Booth Votes from Excel
// @route   POST /api/booth-votes/import
// @access  Private (SuperAdmin)
exports.importBoothVotes = async (req, res, next) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No data provided' });
    }

    const { resolveGeographicHierarchy } = require('./importHelpers');
    const summary = { total: rows.length, created: 0, skipped: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        let candidate = null;
        if (row.candidate_name) {
          candidate = await Candidate.findOne({ name: new RegExp(`^${row.candidate_name}$`, 'i') });
        }

        let booth = null;
        if (row.booth_name || row.booth_number) {
          booth = await Booth.findOne({
            $or: [
              { name: new RegExp(`^${row.booth_name}$`, 'i') },
              { booth_number: row.booth_number }
            ]
          });
        }

        let electionYear = null;
        if (row.election_year) {
          electionYear = await ElectionYear.findOne({ year: row.election_year });
        }

        const geo = await resolveGeographicHierarchy(row);

        if (!candidate) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: `Candidate '${row.candidate_name}' not found` });
          continue;
        }
        if (!booth) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: `Booth '${row.booth_name || row.booth_number}' not found` });
          continue;
        }

        const voteData = {
          candidate: candidate._id,
          booth: booth._id,
          election_year_id: electionYear ? electionYear._id : null,
          total_votes: parseInt(row.total_votes) || 0,
          vote_percentage: parseFloat(row.vote_percentage) || 0,
          margin: parseInt(row.margin) || 0,
          state: geo.state ? geo.state._id : null,
          division: geo.division ? geo.division._id : null,
          parliament: geo.parliament ? geo.parliament._id : null,
          assembly: geo.assembly ? geo.assembly._id : null,
          block: geo.block ? geo.block._id : null,
          created_by: req.user.id,
          updated_by: req.user.id
        };

        await BoothVotes.create(voteData);
        summary.created += 1;
      } catch (err) {
        summary.skipped += 1;
        summary.errors.push({ row: i + 1, message: err.message || String(err) });
      }
    }

    return res.status(200).json({ success: true, ...summary });
  } catch (err) {
    next(err);
  }
};