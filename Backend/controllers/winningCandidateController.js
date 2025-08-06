const WinningCandidate = require('../models/winningCandidate');
const State = require('../models/state');
const Division = require('../models/division');
const Parliament = require('../models/parliament');
const Assembly = require('../models/assembly');
const Party = require('../models/party');
const Candidate = require('../models/Candidate');
const Year = require('../models/electionYear');

// @desc    Get all winning candidates
// @route   GET /api/winning-candidates
// @access  Public
exports.getWinningCandidates = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    let query = WinningCandidate.find()
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name AC_NO') // ✅ added assembly_no
      .populate('party_id', 'name')
      .populate('year_id', 'year')
      .populate('candidate_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ total_votes: -1 });

    if (req.query.search) {
      query = query.find({
        $or: [
          { 'candidate_id.name': { $regex: req.query.search, $options: 'i' } },
          { 'party_id.name': { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    if (req.query.assembly) {
      query = query.where('assembly_id').equals(req.query.assembly);
    }
    if (req.query.parliament) {
      query = query.where('parliament_id').equals(req.query.parliament);
    }
    if (req.query.party) {
      query = query.where('party_id').equals(req.query.party);
    }
    if (req.query.state) {
      query = query.where('state_id').equals(req.query.state);
    }
    if (req.query.division) {
      query = query.where('division_id').equals(req.query.division);
    }
     let winningCandidates;
// TODO:We have to do this in all apis
if (req.query.all === 'true') {
    winningCandidates = await query.exec(); // fetch all
} else {
    winningCandidates = await query.skip(skip).limit(limit).exec(); // paginated
}

    const total = await WinningCandidate.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: winningCandidates.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: winningCandidates
    });
  } catch (err) {
    next(err);
  }
};


exports.getWinningCandidatesForGraph = async (req, res, next) => {
  try {
    // Basic query
    let query = WinningCandidate.find()
      .populate('party_id', 'name')
      .populate({
        path: 'year_id',
        select: 'year'
      });

    // Filter by year
    if (req.query.year) {
      // First find the year_id for the given year value
      const yearDoc = await Year.findOne({ year: req.query.year });
      if (!yearDoc) {
        return res.status(404).json({
          success: false,
          message: `No data found for year ${req.query.year}`
        });
      }
      query = query.where('year_id').equals(yearDoc._id);
    }

    const winningCandidates = await query.exec();
    const total = await WinningCandidate.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: winningCandidates.length,
      total,
      data: winningCandidates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single winning candidate
// @route   GET /api/winning-candidates/:id
// @access  Public
exports.getWinningCandidate = async (req, res, next) => {
  try {
    const winningCandidate = await WinningCandidate.findById(req.params.id)
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('party_id', 'name')
      .populate('candidate_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!winningCandidate) {
      return res.status(404).json({
        success: false,
        message: 'Winning candidate not found'
      });
    }

    res.status(200).json({
      success: true,
      data: winningCandidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create winning candidate
// @route   POST /api/winning-candidates
// @access  Private (Admin only)
exports.createWinningCandidate = async (req, res, next) => {
  try {
    // Verify all references exist
    const [
      state,
      division,
      parliament,
      assembly,
      party,
      candidate
    ] = await Promise.all([
      State.findById(req.body.state_id),
      Division.findById(req.body.division_id),
      Parliament.findById(req.body.parliament_id),
      Assembly.findById(req.body.assembly_id),
      Party.findById(req.body.party_id),
      Candidate.findById(req.body.candidate_id)
    ]);

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
    if (!party) {
      return res.status(400).json({ success: false, message: 'Party not found' });
    }
    if (!candidate) {
      return res.status(400).json({ success: false, message: 'Candidate not found' });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const winningCandidateData = {
      ...req.body,
      created_by: req.user.id
    };

    const winningCandidate = await WinningCandidate.create(winningCandidateData);

    res.status(201).json({
      success: true,
      data: winningCandidate
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Winning candidate with these details already exists'
      });
    }
    next(err);
  }
};

// @desc    Update winning candidate
// @route   PUT /api/winning-candidates/:id
// @access  Private (Admin only)
exports.updateWinningCandidate = async (req, res, next) => {
  try {
    let winningCandidate = await WinningCandidate.findById(req.params.id);

    if (!winningCandidate) {
      return res.status(404).json({
        success: false,
        message: 'Winning candidate not found'
      });
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.party_id) verificationPromises.push(Party.findById(req.body.party_id));
    if (req.body.candidate_id) verificationPromises.push(Candidate.findById(req.body.candidate_id));

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
    req.body.updated_at = new Date();

    winningCandidate = await WinningCandidate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('party_id', 'name')
      .populate('candidate_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: winningCandidate
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Winning candidate with these details already exists'
      });
    }
    next(err);
  }
};

// @desc    Delete winning candidate
// @route   DELETE /api/winning-candidates/:id
// @access  Private (Admin only)
exports.deleteWinningCandidate = async (req, res, next) => {
  try {
    const winningCandidate = await WinningCandidate.findById(req.params.id);

    if (!winningCandidate) {
      return res.status(404).json({
        success: false,
        message: 'Winning candidate not found'
      });
    }

    await winningCandidate.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get winning candidates by assembly
// @route   GET /api/winning-candidates/assembly/:assemblyId
// @access  Public
exports.getWinningCandidatesByAssembly = async (req, res, next) => {
  try {
    // Verify assembly exists
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    const winningCandidates = await WinningCandidate.find({ assembly_id: req.params.assemblyId })
      .sort({ total_votes: -1 })
      .populate('party_id', 'name')
      .populate('candidate_id', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: winningCandidates.length,
      data: winningCandidates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get winning candidates by parliament
// @route   GET /api/winning-candidates/parliament/:parliamentId
// @access  Public
exports.getWinningCandidatesByParliament = async (req, res, next) => {
  try {
    // Verify parliament exists
    const parliament = await Parliament.findById(req.params.parliamentId);
    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    const winningCandidates = await WinningCandidate.find({ parliament_id: req.params.parliamentId })
      .sort({ total_votes: -1 })
      .populate('party_id', 'name')
      .populate('candidate_id', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: winningCandidates.length,
      data: winningCandidates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get winning candidates by party
// @route   GET /api/winning-candidates/party/:partyId
// @access  Public
exports.getWinningCandidatesByParty = async (req, res, next) => {
  try {
    // Verify party exists
    const party = await Party.findById(req.params.partyId);
    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    const winningCandidates = await WinningCandidate.find({ party_id: req.params.partyId })
      .sort({ total_votes: -1 })
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('candidate_id', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: winningCandidates.length,
      data: winningCandidates
    });
  } catch (err) {
    next(err);
  }
};



// @desc    Get candidates by assembly and year with vote statistics
// @route   GET /api/winning-candidates/assembly/:assemblyId/year/:yearId
// @access  Public
exports.getCandidatesByAssemblyAndYear = async (req, res, next) => {
  try {
    // Verify assembly exists
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    // Verify year exists
    const year = await Year.findById(req.params.yearId);
    if (!year) {
      return res.status(404).json({
        success: false,
        message: 'Election year not found'
      });
    }

    // Get all candidates for this assembly and year
    const candidates = await WinningCandidate.find({
      assembly_id: req.params.assemblyId,
      year_id: req.params.yearId
    })
      .sort({ total_votes: -1 }) // Sort by votes in descending order
      .populate('party_id', 'name symbol') // Include party name and symbol
      .populate('candidate_id', 'name') // Include candidate name
      .lean(); // Convert to plain JavaScript object

    if (candidates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No candidates found for this assembly and year combination'
      });
    }

    // Calculate statistics
    const totalCandidates = candidates.length;
    const totalVotesCast = candidates.reduce((sum, candidate) => sum + candidate.total_votes, 0);
    const winner = candidates[0]; // First one after sorting by votes

    // Format the response
    const response = {
      success: true,
      data: {
        assembly: {
          id: assembly._id,
          name: assembly.name,
          ac_no: assembly.AC_NO
        },
        year: year.year,
        total_candidates: totalCandidates,
        total_votes_cast: totalVotesCast,
        winner: {
          candidate_id: winner.candidate_id._id,
          candidate_name: winner.candidate_id.name,
          party_id: winner.party_id._id,
          party_name: winner.party_id.name,
          votes_received: winner.total_votes,
          margin: winner.margin,
          margin_percentage: winner.margin_percentage
        },
        all_candidates: candidates.map(candidate => ({
          candidate_id: candidate.candidate_id._id,
          candidate_name: candidate.candidate_id.name,
          party_id: candidate.party_id._id,
          party_name: candidate.party_id.name,
          party_symbol: candidate.party_id.symbol,
          votes_received: candidate.total_votes,
          voting_percentage: candidate.voting_percentage
        }))
      }
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};