const BoothPartyVoteShare = require('../models/boothPartyVoteShare');
const BoothElectionStats = require('../models/boothElectionStats');
const Party = require('../models/party');

// @desc    Get all vote shares
// @route   GET /api/vote-shares
// @access  Public
exports.getVoteShares = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = BoothPartyVoteShare.find()
      .populate('stat_id', 'booth_id election_id')
      .populate('party_id', 'name abbreviation symbol')
      .sort({ vote_percent: -1 });

    // Filter by stat ID
    if (req.query.statId) {
      query = query.where('stat_id').equals(req.query.statId);
    }

    // Filter by party ID
    if (req.query.partyId) {
      query = query.where('party_id').equals(req.query.partyId);
    }

    const voteShares = await query.skip(skip).limit(limit).exec();
    const total = await BoothPartyVoteShare.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: voteShares.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: voteShares
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single vote share record
// @route   GET /api/vote-shares/:id
// @access  Public
exports.getVoteShareById = async (req, res, next) => {
  try {
    const voteShare = await BoothPartyVoteShare.findById(req.params.id)
      .populate('stat_id', 'booth_id election_id')
      .populate('party_id', 'name abbreviation symbol');

    if (!voteShare) {
      return res.status(404).json({
        success: false,
        message: 'Vote share record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: voteShare
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create vote share record
// @route   POST /api/vote-shares
// @access  Private (Admin/Editor)
exports.createVoteShare = async (req, res, next) => {
  try {
    // Verify stat and party exist
    const [stat, party] = await Promise.all([
      BoothElectionStats.findById(req.body.stat_id),
      Party.findById(req.body.party_id)
    ]);

    if (!stat) {
      return res.status(400).json({
        success: false,
        message: 'Election stat not found'
      });
    }

    if (!party) {
      return res.status(400).json({
        success: false,
        message: 'Party not found'
      });
    }

    // Check if record already exists for this stat and party
    const existingRecord = await BoothPartyVoteShare.findOne({
      stat_id: req.body.stat_id,
      party_id: req.body.party_id
    });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Vote share record already exists for this party in the given election stat'
      });
    }

    const voteShare = await BoothPartyVoteShare.create(req.body);

    res.status(201).json({
      success: true,
      data: voteShare
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update vote share record
// @route   PUT /api/vote-shares/:id
// @access  Private (Admin/Editor)
exports.updateVoteShare = async (req, res, next) => {
  try {
    let voteShare = await BoothPartyVoteShare.findById(req.params.id);

    if (!voteShare) {
      return res.status(404).json({
        success: false,
        message: 'Vote share record not found'
      });
    }

    // Verify stat exists if being updated
    if (req.body.stat_id) {
      const stat = await BoothElectionStats.findById(req.body.stat_id);
      if (!stat) {
        return res.status(400).json({
          success: false,
          message: 'Election stat not found'
        });
      }
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

    voteShare = await BoothPartyVoteShare.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('stat_id party_id');

    res.status(200).json({
      success: true,
      data: voteShare
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete vote share record
// @route   DELETE /api/vote-shares/:id
// @access  Private (Admin)
exports.deleteVoteShare = async (req, res, next) => {
  try {
    const voteShare = await BoothPartyVoteShare.findById(req.params.id);

    if (!voteShare) {
      return res.status(404).json({
        success: false,
        message: 'Vote share record not found'
      });
    }

    await voteShare.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get vote shares by election stat ID
// @route   GET /api/vote-shares/stat/:statId
// @access  Public
exports.getVoteSharesByStat = async (req, res, next) => {
  try {
    // Verify stat exists
    const stat = await BoothElectionStats.findById(req.params.statId);
    if (!stat) {
      return res.status(404).json({
        success: false,
        message: 'Election stat not found'
      });
    }

    const voteShares = await BoothPartyVoteShare.find({ stat_id: req.params.statId })
      .populate('party_id', 'name abbreviation symbol')
      .sort({ vote_percent: -1 });

    res.status(200).json({
      success: true,
      count: voteShares.length,
      data: voteShares
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get vote shares by party ID
// @route   GET /api/vote-shares/party/:partyId
// @access  Public
exports.getVoteSharesByParty = async (req, res, next) => {
  try {
    // Verify party exists
    const party = await Party.findById(req.params.partyId);
    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    const voteShares = await BoothPartyVoteShare.find({ party_id: req.params.partyId })
      .populate('stat_id', 'booth_id election_id')
      .sort({ vote_percent: -1 });

    res.status(200).json({
      success: true,
      count: voteShares.length,
      data: voteShares
    });
  } catch (err) {
    next(err);
  }
};