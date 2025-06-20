const VotingTrends = require('../models/votingTrends');
const Booth = require('../models/booth');
const Assembly = require('../models/assembly');
const Parliament = require('../models/parliament');
const Block = require('../models/block');
const Division = require('../models/division');
const Party = require('../models/party');

// @desc    Get all voting trends
// @route   GET /api/voting-trends
// @access  Public
exports.getVotingTrends = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = VotingTrends.find()
      .populate('booth_id', 'booth_number location')
      .populate('assembly_id', 'name number')
      .populate('parliament_id', 'name number')
      .populate('block_id', 'name code')
      .populate('division_id', 'name code')
      .populate('leading_party_id', 'name abbreviation symbol')
      .populate('party_vote_shares.party_id', 'name abbreviation symbol')
      .sort({ election_year: -1 });

    // Filter by booth
    if (req.query.booth) {
      query = query.where('booth_id').equals(req.query.booth);
    }

    // Filter by assembly
    if (req.query.assembly) {
      query = query.where('assembly_id').equals(req.query.assembly);
    }

    // Filter by parliament
    if (req.query.parliament) {
      query = query.where('parliament_id').equals(req.query.parliament);
    }

    // Filter by block
    if (req.query.block) {
      query = query.where('block_id').equals(req.query.block);
    }

    // Filter by division
    if (req.query.division) {
      query = query.where('division_id').equals(req.query.division);
    }

    // Filter by party
    if (req.query.party) {
      query = query.where('leading_party_id').equals(req.query.party);
    }

    // Filter by year
    if (req.query.year) {
      query = query.where('election_year').equals(parseInt(req.query.year));
    }

    // Filter by turnout range
    if (req.query.minTurnout) {
      query = query.where('turnout_percent').gte(parseFloat(req.query.minTurnout));
    }
    if (req.query.maxTurnout) {
      query = query.where('turnout_percent').lte(parseFloat(req.query.maxTurnout));
    }

    const trends = await query.skip(skip).limit(limit).exec();
    const total = await VotingTrends.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: trends.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: trends
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single voting trend record
// @route   GET /api/voting-trends/:id
// @access  Public
exports.getVotingTrendById = async (req, res, next) => {
  try {
    const trend = await VotingTrends.findById(req.params.id)
      .populate('booth_id', 'booth_number location')
      .populate('assembly_id', 'name number')
      .populate('parliament_id', 'name number')
      .populate('block_id', 'name code')
      .populate('division_id', 'name code')
      .populate('leading_party_id', 'name abbreviation symbol')
      .populate('party_vote_shares.party_id', 'name abbreviation symbol');

    if (!trend) {
      return res.status(404).json({
        success: false,
        message: 'Voting trend not found'
      });
    }

    res.status(200).json({
      success: true,
      data: trend
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new voting trend record
// @route   POST /api/voting-trends
// @access  Private (Admin/Editor)
exports.createVotingTrend = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.body.booth_id);
    if (!booth) {
      return res.status(400).json({
        success: false,
        message: 'Booth not found'
      });
    }

    // Verify all geographic references exist and match booth
    const [assembly, parliament, block, division] = await Promise.all([
      Assembly.findById(req.body.assembly_id || booth.assembly_id),
      Parliament.findById(req.body.parliament_id || booth.parliament_id),
      Block.findById(req.body.block_id || booth.block_id),
      Division.findById(req.body.division_id || booth.division_id)
    ]);

    if (!assembly) {
      return res.status(400).json({
        success: false,
        message: 'Assembly constituency not found'
      });
    }
    if (!parliament) {
      return res.status(400).json({
        success: false,
        message: 'Parliamentary constituency not found'
      });
    }
    if (!block) {
      return res.status(400).json({
        success: false,
        message: 'Block not found'
      });
    }
    if (!division) {
      return res.status(400).json({
        success: false,
        message: 'Division not found'
      });
    }

    // Check if record already exists for this booth and year
    const existingRecord = await VotingTrends.findOne({
      booth_id: req.body.booth_id,
      election_year: req.body.election_year
    });
    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Voting trend already exists for this booth and election year'
      });
    }

    // Ensure geographic references match booth's references
    if ((req.body.assembly_id && req.body.assembly_id !== booth.assembly_id.toString()) ||
        (req.body.parliament_id && req.body.parliament_id !== booth.parliament_id.toString()) ||
        (req.body.block_id && req.body.block_id !== booth.block_id.toString()) ||
        (req.body.division_id && req.body.division_id !== booth.division_id.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Geographic references do not match the booth location'
      });
    }

    // Set geographic references from booth if not provided
    const trendData = {
      ...req.body,
      assembly_id: req.body.assembly_id || booth.assembly_id,
      parliament_id: req.body.parliament_id || booth.parliament_id,
      block_id: req.body.block_id || booth.block_id,
      division_id: req.body.division_id || booth.division_id
    };

    // Verify leading party exists if provided
    if (req.body.leading_party_id) {
      const party = await Party.findById(req.body.leading_party_id);
      if (!party) {
        return res.status(400).json({
          success: false,
          message: 'Leading party not found'
        });
      }
    }

    // Verify party vote shares references exist
    if (req.body.party_vote_shares) {
      for (const share of req.body.party_vote_shares) {
        const party = await Party.findById(share.party_id);
        if (!party) {
          return res.status(400).json({
            success: false,
            message: `Party with ID ${share.party_id} not found`
          });
        }
      }
    }

    const trend = await VotingTrends.create(trendData);

    res.status(201).json({
      success: true,
      data: trend
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update voting trend record
// @route   PUT /api/voting-trends/:id
// @access  Private (Admin/Editor)
exports.updateVotingTrend = async (req, res, next) => {
  try {
    let trend = await VotingTrends.findById(req.params.id);

    if (!trend) {
      return res.status(404).json({
        success: false,
        message: 'Voting trend not found'
      });
    }

    // Verify booth exists if being updated
    if (req.body.booth_id) {
      const booth = await Booth.findById(req.body.booth_id);
      if (!booth) {
        return res.status(400).json({
          success: false,
          message: 'Booth not found'
        });
      }

      // Check if new booth_id and year combination already exists
      const existingRecord = await VotingTrends.findOne({
        booth_id: req.body.booth_id,
        election_year: req.body.election_year || trend.election_year,
        _id: { $ne: req.params.id } // Exclude current record
      });
      if (existingRecord) {
        return res.status(400).json({
          success: false,
          message: 'Voting trend already exists for this booth and election year'
        });
      }

      // Ensure geographic references match new booth's references
      if ((req.body.assembly_id && req.body.assembly_id !== booth.assembly_id.toString()) ||
          (req.body.parliament_id && req.body.parliament_id !== booth.parliament_id.toString()) ||
          (req.body.block_id && req.body.block_id !== booth.block_id.toString()) ||
          (req.body.division_id && req.body.division_id !== booth.division_id.toString())) {
        return res.status(400).json({
          success: false,
          message: 'Geographic references do not match the new booth location'
        });
      }

      // Set geographic references from new booth if not provided
      req.body.assembly_id = req.body.assembly_id || booth.assembly_id;
      req.body.parliament_id = req.body.parliament_id || booth.parliament_id;
      req.body.block_id = req.body.block_id || booth.block_id;
      req.body.division_id = req.body.division_id || booth.division_id;
    }

    // Verify geographic references exist if being updated
    const verificationPromises = [];
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    if (req.body.block_id) verificationPromises.push(Block.findById(req.body.block_id));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));

    const [assembly, parliament, block, division] = await Promise.all(verificationPromises);

    if (assembly && !assembly) {
      return res.status(400).json({
        success: false,
        message: 'Assembly constituency not found'
      });
    }
    if (parliament && !parliament) {
      return res.status(400).json({
        success: false,
        message: 'Parliamentary constituency not found'
      });
    }
    if (block && !block) {
      return res.status(400).json({
        success: false,
        message: 'Block not found'
      });
    }
    if (division && !division) {
      return res.status(400).json({
        success: false,
        message: 'Division not found'
      });
    }

    // Verify leading party exists if being updated
    if (req.body.leading_party_id) {
      const party = await Party.findById(req.body.leading_party_id);
      if (!party) {
        return res.status(400).json({
          success: false,
          message: 'Leading party not found'
        });
      }
    }

    // Verify party vote shares references exist if being updated
    if (req.body.party_vote_shares) {
      for (const share of req.body.party_vote_shares) {
        const party = await Party.findById(share.party_id);
        if (!party) {
          return res.status(400).json({
            success: false,
            message: `Party with ID ${share.party_id} not found`
          });
        }
      }
    }

    trend = await VotingTrends.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    .populate('booth_id assembly_id parliament_id block_id division_id leading_party_id')
    .populate('party_vote_shares.party_id');

    res.status(200).json({
      success: true,
      data: trend
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete voting trend record
// @route   DELETE /api/voting-trends/:id
// @access  Private (Admin)
exports.deleteVotingTrend = async (req, res, next) => {
  try {
    const trend = await VotingTrends.findById(req.params.id);

    if (!trend) {
      return res.status(404).json({
        success: false,
        message: 'Voting trend not found'
      });
    }

    await trend.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get voting trends by booth ID
// @route   GET /api/voting-trends/booth/:boothId
// @access  Public
exports.getTrendsByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const trends = await VotingTrends.find({ booth_id: req.params.boothId })
      .populate('assembly_id', 'name number')
      .populate('parliament_id', 'name number')
      .populate('block_id', 'name code')
      .populate('division_id', 'name code')
      .populate('leading_party_id', 'name abbreviation symbol')
      .populate('party_vote_shares.party_id', 'name abbreviation symbol')
      .sort({ election_year: -1 });

    res.status(200).json({
      success: true,
      count: trends.length,
      data: trends
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get voting trends by assembly constituency ID
// @route   GET /api/voting-trends/assembly/:assemblyId
// @access  Public
exports.getTrendsByAssembly = async (req, res, next) => {
  try {
    // Verify assembly exists
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly constituency not found'
      });
    }

    const trends = await VotingTrends.find({ assembly_id: req.params.assemblyId })
      .populate('booth_id', 'booth_number location')
      .populate('parliament_id', 'name number')
      .populate('block_id', 'name code')
      .populate('division_id', 'name code')
      .populate('leading_party_id', 'name abbreviation symbol')
      .populate('party_vote_shares.party_id', 'name abbreviation symbol')
      .sort({ election_year: -1 });

    res.status(200).json({
      success: true,
      count: trends.length,
      data: trends
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get voting trends by parliamentary constituency ID
// @route   GET /api/voting-trends/parliament/:parliamentId
// @access  Public
exports.getTrendsByParliament = async (req, res, next) => {
  try {
    // Verify parliament exists
    const parliament = await Parliament.findById(req.params.parliamentId);
    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliamentary constituency not found'
      });
    }

    const trends = await VotingTrends.find({ parliament_id: req.params.parliamentId })
      .populate('booth_id', 'booth_number location')
      .populate('assembly_id', 'name number')
      .populate('block_id', 'name code')
      .populate('division_id', 'name code')
      .populate('leading_party_id', 'name abbreviation symbol')
      .populate('party_vote_shares.party_id', 'name abbreviation symbol')
      .sort({ election_year: -1 });

    res.status(200).json({
      success: true,
      count: trends.length,
      data: trends
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get voting trends by block ID
// @route   GET /api/voting-trends/block/:blockId
// @access  Public
exports.getTrendsByBlock = async (req, res, next) => {
  try {
    // Verify block exists
    const block = await Block.findById(req.params.blockId);
    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    const trends = await VotingTrends.find({ block_id: req.params.blockId })
      .populate('booth_id', 'booth_number location')
      .populate('assembly_id', 'name number')
      .populate('parliament_id', 'name number')
      .populate('division_id', 'name code')
      .populate('leading_party_id', 'name abbreviation symbol')
      .populate('party_vote_shares.party_id', 'name abbreviation symbol')
      .sort({ election_year: -1 });

    res.status(200).json({
      success: true,
      count: trends.length,
      data: trends
    });
  } catch (err) {
    next(err);
  }
};
// @desc    Get voting trends by division ID
// @route   GET /api/voting-trends/division/:divisionId
// @access  Public
exports.getTrendsByDivision = async (req, res, next) => {
  try {
    // Verify division exists
    const division = await Division.findById(req.params.divisionId);
    if (!division) {
      return res.status(404).json({
        success: false,
        message: 'Division not found'
      });
    }

    const trends = await VotingTrends.find({ division_id: req.params.divisionId })
      .populate('booth_id', 'booth_number location')
      .populate('assembly_id', 'name number')
      .populate('parliament_id', 'name number')
      .populate('block_id', 'name code')
      .populate('leading_party_id', 'name abbreviation symbol')
      .populate('party_vote_shares.party_id', 'name abbreviation symbol')
      .sort({ election_year: -1 });

    res.status(200).json({
      success: true,
      count: trends.length,
      data: trends
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get voting trends by party ID
// @route   GET /api/voting-trends/party/:partyId
// @access  Public
exports.getTrendsByParty = async (req, res, next) => {
  try {
    // Verify party exists
    const party = await Party.findById(req.params.partyId);
    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    // Get trends where this party was the leading party
    const trends = await VotingTrends.find({ leading_party_id: req.params.partyId })
      .populate('booth_id', 'booth_number location')
      .populate('assembly_id', 'name number')
      .populate('parliament_id', 'name number')
      .populate('block_id', 'name code')
      .populate('division_id', 'name code')
      .populate('party_vote_shares.party_id', 'name abbreviation symbol')
      .sort({ election_year: -1 });

    res.status(200).json({
      success: true,
      count: trends.length,
      data: trends
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get voting trends by election year
// @route   GET /api/voting-trends/year/:year
// @access  Public
exports.getTrendsByYear = async (req, res, next) => {
  try {
    const year = parseInt(req.params.year);
    if (isNaN(year)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year format'
      });
    }

    const trends = await VotingTrends.find({ election_year: year })
      .populate('booth_id', 'booth_number location')
      .populate('assembly_id', 'name number')
      .populate('parliament_id', 'name number')
      .populate('block_id', 'name code')
      .populate('division_id', 'name code')
      .populate('leading_party_id', 'name abbreviation symbol')
      .populate('party_vote_shares.party_id', 'name abbreviation symbol')
      .sort({ turnout_percent: -1 });

    res.status(200).json({
      success: true,
      count: trends.length,
      data: trends
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get voting trends statistics (aggregated data)
// @route   GET /api/voting-trends/stats
// @access  Public
exports.getVotingTrendsStats = async (req, res, next) => {
  try {
    // Aggregate statistics by year
    const statsByYear = await VotingTrends.aggregate([
      {
        $group: {
          _id: '$election_year',
          totalBooths: { $sum: 1 },
          avgTurnout: { $avg: '$turnout_percent' },
          minTurnout: { $min: '$turnout_percent' },
          maxTurnout: { $max: '$turnout_percent' },
          parties: { $addToSet: '$leading_party_id' }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Aggregate statistics by party
    const statsByParty = await VotingTrends.aggregate([
      {
        $group: {
          _id: '$leading_party_id',
          count: { $sum: 1 },
          avgVictoryMargin: { $avg: '$victory_margin' },
          avgVoteShare: { $avg: '$party_vote_shares.vote_share' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Populate party names in statsByParty
    const partyIds = statsByParty.map(stat => stat._id).filter(id => id);
    const parties = await Party.find({ _id: { $in: partyIds } });

    const statsByPartyWithNames = statsByParty.map(stat => {
      const party = parties.find(p => p._id.equals(stat._id));
      return {
        ...stat,
        partyName: party ? party.name : 'Unknown',
        partyAbbreviation: party ? party.abbreviation : 'UNK'
      };
    });

    // Populate party counts in statsByYear
    const populatedStatsByYear = await Promise.all(statsByYear.map(async yearStat => {
      const partyCounts = await VotingTrends.aggregate([
        { $match: { election_year: yearStat._id } },
        { $group: { _id: '$leading_party_id', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const populatedPartyCounts = await Promise.all(partyCounts.map(async pc => {
        const party = await Party.findById(pc._id);
        return {
          partyId: pc._id,
          partyName: party ? party.name : 'Unknown',
          count: pc.count
        };
      }));

      return {
        ...yearStat,
        partyCounts: populatedPartyCounts
      };
    }));

    res.status(200).json({
      success: true,
      data: {
        byYear: populatedStatsByYear,
        byParty: statsByPartyWithNames
      }
    });
  } catch (err) {
    next(err);
  }
};