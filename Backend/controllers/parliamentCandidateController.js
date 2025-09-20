// @desc    Get winning party for each parliament (for a given year or latest year)
// @route   GET /api/parliament-candidates/winning-party-by-parliament
// @access  Public
const Parliament = require('../models/Parliament');
const Party = require('../models/party');
const Year = require('../models/electionYear');
exports.getWinningPartyByParliament = async (req, res, next) => {
  try {
    let yearId = req.query.year_id;
    let yearDoc = null;
    if (yearId) {
      yearDoc = await Year.findById(yearId);
      if (!yearDoc) {
        return res.status(404).json({ success: false, message: 'Year not found' });
      }
    } else {
      // Find latest year in ParliamentCandidate
      const latest = await ParliamentCandidate.findOne().sort({ election_year_id: -1 }).populate('election_year_id', 'year');
      if (latest && latest.election_year_id) {
        yearId = latest.election_year_id._id;
        yearDoc = latest.election_year_id;
      }
    }
    if (!yearId) {
      return res.status(404).json({ success: false, message: 'No year data found' });
    }

    // For each parliament, find the candidate with position_result: 'win' for that year
    const winners = await ParliamentCandidate.find({
      election_year_id: yearId,
      position_result: 'win'
    })
      .populate({
        path: 'parliament_id',
        // Populate all fields of parliament
      })
      .populate('party_id', 'name color symbol')
      .populate('candidate_id', 'name');

    // Map parliament_id to winner info
    const result = winners.map(w => ({
      parliament: w.parliament_id, // full parliament object
      party_id: w.party_id?._id,
      party_name: w.party_id?.name,
      party_color: w.party_id?.color,
      party_symbol: w.party_id?.symbol,
      candidate_id: w.candidate_id?._id,
      candidate_name: w.candidate_id?.name,
      margin: w.margin,
      margin_percentage: w.margin_percentage,
      total_votes: w.total_votes_parliament,
      year: yearDoc?.year || null
    }));

    res.status(200).json({
      success: true,
      year: yearDoc?.year || null,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
const ParliamentCandidate = require('../models/ParliamentCandidate');

// @desc    Get all Parliament Candidates
// @route   GET /api/parliament-candidates
// @access  Public
exports.getParliamentCandidates = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = ParliamentCandidate.find()
      .populate('candidate_id', 'name ')
      // .populate('parliament_id', 'name parliament_no election_year_id')
       .populate({
        path: 'parliament_id',
        // Populate all fields of parliament
      })
      .populate('election_year_id', 'year')
      .populate('party_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ created_at: -1 });

    // Search functionality
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      query = query.find({
        $or: [
          { position_result: searchRegex }
        ]
      });
    }

    // Filter by parliament
    if (req.query.parliament_id) {
      query = query.where('parliament_id').equals(req.query.parliament_id);
    }

    // Filter by election year
    if (req.query.election_year_id) {
      query = query.where('election_year_id').equals(req.query.election_year_id);
    }

    // Filter by party
    if (req.query.party_id) {
      query = query.where('party_id').equals(req.query.party_id);
    }

    // Filter by result
    if (req.query.position_result) {
      query = query.where('position_result').equals(req.query.position_result);
    }

    // Check if all data requested (for CSV export)
    if (req.query.all === 'true') {
      const allCandidates = await query.exec();
      return res.status(200).json({
        success: true,
        count: allCandidates.length,
        data: allCandidates
      });
    }

    // Apply pagination
    const candidates = await query.skip(skip).limit(limit).exec();
    const total = await ParliamentCandidate.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: candidates.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: candidates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single Parliament Candidate
// @route   GET /api/parliament-candidates/:id
// @access  Public
exports.getParliamentCandidate = async (req, res, next) => {
  try {
    const candidate = await ParliamentCandidate.findById(req.params.id)
      .populate('candidate_id', 'name')
      .populate('parliament_id', 'name')
      .populate('election_year_id', 'year')
      .populate('party_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Parliament Candidate not found'
      });
    }

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create Parliament Candidate
// @route   POST /api/parliament-candidates
// @access  Private (Admin only)
exports.createParliamentCandidate = async (req, res, next) => {
  try {
    // Validate required fields
    const { candidate_id, parliament_id, election_year_id, party_id } = req.body;

    if (!candidate_id || !parliament_id || !election_year_id || !party_id) {
      return res.status(400).json({
        success: false,
        message: 'Candidate, Parliament, Election Year and Party are required'
      });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const candidateData = {
      ...req.body,
      created_by: req.user.id,
    };

    // Ensure margin is numeric and compute margin_percentage if not provided
    candidateData.margin = Number(candidateData.margin) || 0;
    const total = Number(candidateData.total_votes_parliament) || 0;
    if (!candidateData.margin_percentage) {
      candidateData.margin_percentage = total > 0 ? parseFloat((Math.abs(candidateData.margin) / total).toFixed(6)) : 0;
    } else {
      candidateData.margin_percentage = Number(candidateData.margin_percentage) || 0;
    }

    const candidate = await ParliamentCandidate.create(candidateData);

    // Populate the created candidate
    await candidate.populate([
      { path: 'candidate_id', select: 'name' },
      { path: 'parliament_id', select: 'name' },
      { path: 'election_year_id', select: 'year' },
      { path: 'party_id', select: 'name' },
      { path: 'created_by', select: 'username' }
    ]);

    res.status(201).json({
      success: true,
      data: candidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Parliament Candidate
// @route   PUT /api/parliament-candidates/:id
// @access  Private (Admin only)
exports.updateParliamentCandidate = async (req, res, next) => {
  try {
    let candidate = await ParliamentCandidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Parliament Candidate not found'
      });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const updateData = {
      ...req.body,
      updated_by: req.user.id,
    };

    // Normalize numeric fields and compute margin_percentage if needed
    updateData.margin = Number(updateData.margin) || 0;
    const total = Number(updateData.total_votes_parliament) || 0;
    if (!updateData.margin_percentage) {
      updateData.margin_percentage = total > 0 ? parseFloat((Math.abs(updateData.margin) / total).toFixed(6)) : 0;
    } else {
      updateData.margin_percentage = Number(updateData.margin_percentage) || 0;
    }

    candidate = await ParliamentCandidate.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('candidate_id', 'name')
      .populate('parliament_id', 'name')
      .populate('election_year_id', 'year')
      .populate('party_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete Parliament Candidate
// @route   DELETE /api/parliament-candidates/:id
// @access  Private (Admin only)
exports.deleteParliamentCandidate = async (req, res, next) => {
  try {
    const candidate = await ParliamentCandidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Parliament Candidate not found'
      });
    }

    await candidate.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Parliament Candidate statistics
// @route   GET /api/parliament-candidates/stats/overview
// @access  Public
exports.getParliamentCandidateStats = async (req, res, next) => {
  try {
    const totalCandidates = await ParliamentCandidate.countDocuments();
    const winningCandidates = await ParliamentCandidate.countDocuments({ position_result: 'win' });
    const losingCandidates = await ParliamentCandidate.countDocuments({ position_result: 'loss' });

    // Get results by party
    const resultsByParty = await ParliamentCandidate.aggregate([
      {
        $group: {
          _id: '$party_id',
          wins: {
            $sum: {
              $cond: [{ $eq: ['$position_result', 'win'] }, 1, 0]
            }
          },
          losses: {
            $sum: {
              $cond: [{ $eq: ['$position_result', 'loss'] }, 1, 0]
            }
          },
          total: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'parties',
          localField: '_id',
          foreignField: '_id',
          as: 'party'
        }
      },
      {
        $unwind: '$party'
      },
      {
        $project: {
          partyName: '$party.name',
          wins: 1,
          losses: 1,
          total: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCandidates,
        winningCandidates,
        losingCandidates,
        resultsByParty
      }
    });
  } catch (err) {
    next(err);
  }
};