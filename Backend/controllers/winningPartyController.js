const WinningParty = require('../models/WinningParty');
const Candidate = require('../models/Candidate');
const Party = require('../models/party');
const Assembly = require('../models/Assembly');
const Parliament = require('../models/Parliament');
const State = require('../models/state');
const Division = require('../models/Division');
const Block = require('../models/block');
const Booth = require('../models/booth');
const ElectionYear = require('../models/electionYear');





// @desc    Get winning party data grouped by year and party for graph
// @route   GET /api/winning-parties/graph
// @access  Public
exports.getWinningPartysForGraph = async (req, res, next) => {
  try {
    let query = WinningParty.find()
      .populate('party_id', 'name')
      .populate('election_year', 'year');

    // Filter by year (optional query param)
    if (req.query.year) {
      const year = parseInt(req.query.year, 10);
      if (isNaN(year)) {
        return res.status(400).json({
          success: false,
          message: 'Year must be a valid number'
        });
      }

      const yearDoc = await ElectionYear.findOne({ year: year });
      if (!yearDoc) {
        return res.status(404).json({
          success: false,
          message: `No election data found for year ${year}`
        });
      }

      query = query.where('election_year').equals(yearDoc._id);
    }

    const winningParties = await query.exec();
    const total = await WinningParty.countDocuments(query.getFilter());

    // const graphData = winningParties.reduce((acc, record) => {
    //   const year = record.election_year?.year || 'Unknown Year';
    //   const party = record.party_id?.name || 'Unknown Party';

    //   if (!acc[year]) acc[year] = {};
    //   if (!acc[year][party]) acc[year][party] = 0;

    //   acc[year][party] += 1;

    //   return acc;
    // }, {});

    res.status(200).json({
      success: true,
      count: winningParties.length,
      total,
      data: winningParties
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all winning party records
// @route   GET /api/winning-parties
// @access  Public
const { getStateIdByName } = require('../utils/stateUtils');
exports.getWinningParties = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Basic query
    let query = WinningParty.find()
      .populate('candidate_id', 'name')
      .populate('party_id', 'name symbol')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('election_year', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ votes: -1 });


    // Helper function for ObjectId or name lookup (normalize dashes to spaces)
    const handleIdOrName = async (param, model, nameField = 'name') => {
      if (!req.query[param]) return null;
      let value = req.query[param];
      value = value.replace(/-/g, ' ');
      const isObjectId = /^[a-f\d]{24}$/i.test(value);
      if (isObjectId) {
        return value;
      } else {
        const doc = await model.findOne({ [nameField]: { $regex: value, $options: 'i' } });
        return doc ? doc._id : null;
      }
    };

    // Candidate
    if (req.query.candidate) {
      const candidateId = await handleIdOrName('candidate', Candidate);
      if (candidateId) {
        query = query.where('candidate_id').equals(candidateId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Party
    if (req.query.party) {
      const partyId = await handleIdOrName('party', Party);
      if (partyId) {
        query = query.where('party_id').equals(partyId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Assembly
    if (req.query.assembly) {
      const assemblyId = await handleIdOrName('assembly', Assembly);
      if (assemblyId) {
        query = query.where('assembly_id').equals(assemblyId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Parliament
    if (req.query.parliament) {
      const parliamentId = await handleIdOrName('parliament', Parliament);
      if (parliamentId) {
        query = query.where('parliament_id').equals(parliamentId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // State
    if (req.query.state) {
      const stateId = await handleIdOrName('state', State);
      if (stateId) {
        query = query.where('state_id').equals(stateId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Division
    if (req.query.division) {
      const divisionId = await handleIdOrName('division', Division);
      if (divisionId) {
        query = query.where('division_id').equals(divisionId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Block
    if (req.query.block) {
      const blockId = await handleIdOrName('block', Block);
      if (blockId) {
        query = query.where('block_id').equals(blockId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Booth
    if (req.query.booth) {
      const boothId = await handleIdOrName('booth', Booth);
      if (boothId) {
        query = query.where('booth_id').equals(boothId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Election Year
    if (req.query.electionYear) {
      let yearId = null;
      const isObjectId = /^[a-f\d]{24}$/i.test(req.query.electionYear);
      if (isObjectId) {
        yearId = req.query.electionYear;
      } else {
        const yearDoc = await ElectionYear.findOne({ year: req.query.electionYear });
        yearId = yearDoc ? yearDoc._id : null;
      }
      if (yearId) {
        query = query.where('election_year').equals(yearId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Filter by minimum votes
    if (req.query.min_votes) {
      query = query.where('votes').gte(req.query.min_votes);
    }

    // Filter by minimum margin
    if (req.query.min_margin) {
      query = query.where('margin').gte(req.query.min_margin);
    }

    const winningParties = await query.skip(skip).limit(limit).exec();
    const total = await WinningParty.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: winningParties.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: winningParties
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single winning party record
// @route   GET /api/winning-parties/:id
// @access  Public
exports.getWinningParty = async (req, res, next) => {
  try {
    const winningParty = await WinningParty.findById(req.params.id)
      .populate('candidate_id', 'name')
      .populate('party_id', 'name symbol')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('election_year', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

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
// @access  Private (Admin only)
exports.createWinningParty = async (req, res, next) => {
  try {
    // Verify all references exist
    const [
      candidate,
      party,
      assembly,
      parliament,
      state,
      division,
      block,
      booth,
      electionYear
    ] = await Promise.all([
      Candidate.findById(req.body.candidate_id),
      Party.findById(req.body.party_id),
      Assembly.findById(req.body.assembly_id),
      Parliament.findById(req.body.parliament_id),
      State.findById(req.body.state_id),
      Division.findById(req.body.division_id),
      Block.findById(req.body.block_id),
      Booth.findById(req.body.booth_id),
      ElectionYear.findById(req.body.election_year)
    ]);

    // Check reference existence
    const missingRefs = [];
    if (!candidate) missingRefs.push('Candidate');
    if (!party) missingRefs.push('Party');
    if (!assembly) missingRefs.push('Assembly');
    if (!state) missingRefs.push('State');
    if (!division) missingRefs.push('Division');
    if (!block) missingRefs.push('Block');
    if (!booth) missingRefs.push('Booth');
    if (!electionYear) missingRefs.push('Election Year');

    if (missingRefs.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${missingRefs.join(', ')} not found`
      });
    }

    // Check if user exists in request
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    // Check for existing record for same booth and election year
    const existingRecord = await WinningParty.findOne({
      booth_id: req.body.booth_id,
      election_year: req.body.election_year
    });

    if (existingRecord) {
      return res.status(409).json({
        success: false,
        message: 'Winning party record for this booth and election year already exists'
      });
    }

    const winningPartyData = {
      ...req.body,
      created_by: req.user.id,
      description: req.body.description || '',
    };

    const winningParty = await WinningParty.create(winningPartyData);

    res.status(201).json({
      success: true,
      data: winningParty
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate winning party record detected for this booth and election year'
      });
    }
    next(err);
  }
};

// @desc    Update winning party record
// @route   PUT /api/winning-parties/:id
// @access  Private (Admin only)
exports.updateWinningParty = async (req, res, next) => {
  try {
    let winningParty = await WinningParty.findById(req.params.id);

    if (!winningParty) {
      return res.status(404).json({
        success: false,
        message: 'Winning party record not found'
      });
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.candidate_id) verificationPromises.push(Candidate.findById(req.body.candidate_id));
    if (req.body.party_id) verificationPromises.push(Party.findById(req.body.party_id));
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.block_id) verificationPromises.push(Block.findById(req.body.block_id));
    if (req.body.booth_id) verificationPromises.push(Booth.findById(req.body.booth_id));
    if (req.body.election_year) verificationPromises.push(ElectionYear.findById(req.body.election_year));

    const verificationResults = await Promise.all(verificationPromises);

    for (const result of verificationResults) {
      if (!result) {
        return res.status(400).json({
          success: false,
          message: `${result.modelName} not found`
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
    req.body.description = req.body.description || '';
    req.body.updated_at = new Date();

    winningParty = await WinningParty.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('candidate_id', 'name')
      .populate('party_id', 'name symbol')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('election_year', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: winningParty
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Winning party record for this booth and election year already exists'
      });
    }
    next(err);
  }
};

// @desc    Delete winning party record
// @route   DELETE /api/winning-parties/:id
// @access  Private (Admin only)
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

// @desc    Get winning party records by party
// @route   GET /api/winning-parties/party/:partyId
// @access  Public
exports.getWinningPartiesByParty = async (req, res, next) => {
  try {
    // Verify party exists
    const party = await Party.findById(req.params.partyId);
    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    const winningParties = await WinningParty.find({
      party_id: req.params.partyId
    })
      .sort({ votes: -1 })
      .populate('candidate_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('election_year', 'year');

    res.status(200).json({
      success: true,
      count: winningParties.length,
      data: winningParties
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get winning party records by election year
// @route   GET /api/winning-parties/year/:yearId
// @access  Public
exports.getWinningPartiesByYear = async (req, res, next) => {
  try {
    // Verify election year exists
    const year = await ElectionYear.findById(req.params.yearId);
    if (!year) {
      return res.status(404).json({
        success: false,
        message: 'Election year not found'
      });
    }

    const winningParties = await WinningParty.find({
      election_year: req.params.yearId
    })
      .sort({ votes: -1 })
      .populate('candidate_id', 'name')
      .populate('party_id', 'name symbol')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name');

    res.status(200).json({
      success: true,
      count: winningParties.length,
      data: winningParties
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get winning party records by booth
// @route   GET /api/winning-parties/booth/:boothId
// @access  Public
exports.getWinningPartiesByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const winningParties = await WinningParty.find({
      booth_id: req.params.boothId
    })
      .sort({ election_year: -1 })
      .populate('candidate_id', 'name')
      .populate('party_id', 'name symbol')
      .populate('election_year', 'year');

    res.status(200).json({
      success: true,
      count: winningParties.length,
      data: winningParties
    });
  } catch (err) {
    next(err);
  }
};