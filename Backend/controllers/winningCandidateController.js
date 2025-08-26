
const mongoose = require('mongoose');
const WinningCandidate = require('../models/winningCandidate');
const State = require('../models/state');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const Assembly = require('../models/Assembly');
const Party = require('../models/party');
const Candidate = require('../models/Candidate');
const Year = require('../models/electionYear');

// @desc    Get all winning candidates
// @route   GET /api/winning-candidates
// @access  Public
exports.getWinningCandidates = async (req, res, next) => {
  try {
    console.log('Getting winning candidates with query:', req.query);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    // First check if we have any data in the collection
    const totalDocuments = await WinningCandidate.countDocuments();
    console.log('Total documents in collection:', totalDocuments);

    // Add timeout and debug the query
    let query = WinningCandidate.find()
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name AC_NO')
      .populate('party_id', 'name')
      .populate('year_id', 'year')
      .populate('candidate_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .maxTimeMS(30000) // Set 30 second timeout
      .sort({ total_votes: -1 });

    // Log the mongoose query before execution
    console.log('Mongoose query:', query.getFilter());

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
    if (req.query.type) {
      query = query.where('type').all([req.query.type]);
    }
    if (req.query.candidate) {
      query = query.where('candidate_id').equals(req.query.candidate);
    }
    if (req.query.electionYear) {
      query = query.where('year_id').equals(req.query.electionYear);
    }


    let winningCandidates;
    try {
      console.log('Executing query with skip:', skip, 'limit:', limit);

      // Execute query with proper error handling
      if (req.query.all === 'true') {
        winningCandidates = await query.lean().exec();
      } else {
        winningCandidates = await query.skip(skip).limit(limit).lean().exec();
      }

      console.log('Query executed successfully. Found records:', winningCandidates?.length || 0);

      // Debug first record if available
      if (winningCandidates && winningCandidates.length > 0) {
        console.log('Sample record:', JSON.stringify(winningCandidates[0], null, 2));
      }

      const total = await WinningCandidate.countDocuments(query.getFilter());
      console.log('Total matching records:', total);

      // Check if populated fields are present
      const sampleRecord = winningCandidates[0];
      if (sampleRecord) {
        console.log('Populated fields check:', {
          state: !!sampleRecord.state_id,
          division: !!sampleRecord.division_id,
          parliament: !!sampleRecord.parliament_id,
          assembly: !!sampleRecord.assembly_id,
          party: !!sampleRecord.party_id,
          year: !!sampleRecord.year_id,
          candidate: !!sampleRecord.candidate_id
        });
      }

      res.status(200).json({
        success: true,
        count: winningCandidates.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: winningCandidates
      });
    } catch (queryErr) {
      console.error('Query execution error:', queryErr);

      // Check for specific error types
      if (queryErr.name === 'MongooseError' || queryErr.name === 'MongoServerError') {
        return res.status(500).json({
          success: false,
          error: 'Database query failed',
          details: queryErr.message,
          code: queryErr.code
        });
      }

      throw queryErr; // Re-throw if it's not a database error
    }
  } catch (err) {
    console.error('WinningCandidate Controller Error:', err);

    // Handle specific MongoDB timeout errors
    if (err.name === 'MongoServerError' || err.message.includes('buffering timed out')) {
      return res.status(500).json({
        success: false,
        error: 'Database connection timeout. Please try again later.',
        details: 'The database query took too long to execute.'
      });
    }

    // Handle other MongoDB errors
    if (err.name === 'MongoError' || err.name === 'MongoTimeoutError') {
      return res.status(500).json({
        success: false,
        error: 'Database error occurred.',
        details: err.message
      });
    }

    next(err);
  }
};

exports.getWinningCandidatesForGraph = async (req, res, next) => {
  try {
    let query = WinningCandidate.find()
      .populate('party_id', 'name')
      .populate({
        path: 'year_id',
        select: 'year'
      });

    if (req.query.year) {
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
// Get party-wise assembly count for a specific year
exports.getPartyAssemblyCountByYear = async (req, res, next) => {
  try {
    const { year } = req.query;
    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year parameter is required'
      });
    }

    const yearDoc = await Year.findOne({ year });
    if (!yearDoc) {
      return res.status(404).json({
        success: false,
        message: `No data found for year ${year}`
      });
    }

    const result = await WinningCandidate.aggregate([
      { $match: { year_id: yearDoc._id } },
      {
        $group: {
          _id: '$party_id',
          count: { $sum: 1 }
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
      { $unwind: '$party' },
      {
        $project: {
          party_name: '$party.name',
          count: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// Predict party assembly count for 2028
exports.getPredictedPartyAssemblyCount2028 = async (req, res, next) => {
  try {
    // Here you would implement your prediction logic
    // For now, we'll return a simplified response
    const predictions = await WinningCandidate.aggregate([
      {
        $lookup: {
          from: 'electionyears',
          localField: 'year_id',
          foreignField: '_id',
          as: 'year'
        }
      },
      { $unwind: '$year' },
      {
        $group: {
          _id: {
            party: '$party_id',
            year: '$year.year'
          },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'parties',
          localField: '_id.party',
          foreignField: '_id',
          as: 'party'
        }
      },
      { $unwind: '$party' },
      {
        $project: {
          party_name: '$party.name',
          year: '$_id.year',
          count: 1
        }
      },
      { $sort: { year: -1, count: -1 } }
    ]);

    // Use the historical data to make simple predictions
    const latestYear = Math.max(...predictions.map(p => p.year));
    const predictedCounts = predictions
      .filter(p => p.year === latestYear)
      .map(p => ({
        party_name: p.party_name,
        predicted_count: Math.round(p.count * 1.1) // Simple 10% growth prediction
      }));

    res.status(200).json({
      success: true,
      year: 2028,
      data: predictedCounts
    });
  } catch (err) {
    next(err);
  }
};

// Predict winning party for next election year
exports.predictWinningPartyForNextYear = async (req, res, next) => {
  try {
    const { year } = req.query;
    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year parameter is required'
      });
    }

    const yearDoc = await Year.findOne({ year });
    if (!yearDoc) {
      return res.status(404).json({
        success: false,
        message: `No data found for year ${year}`
      });
    }

    // Implement your prediction logic here
    const predictions = await WinningCandidate.aggregate([
      { $match: { year_id: yearDoc._id } },
      {
        $group: {
          _id: '$party_id',
          seats: { $sum: 1 },
          total_votes: { $sum: '$total_votes' }
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
      { $unwind: '$party' },
      {
        $project: {
          party_name: '$party.name',
          seats: 1,
          total_votes: 1,
          predicted_growth: { $multiply: ['$seats', 1.1] } // Simple 10% growth prediction
        }
      },
      { $sort: { seats: -1 } }
    ]);

    res.status(200).json({
      success: true,
      prediction_year: parseInt(year),
      data: predictions
    });
  } catch (err) {
    next(err);
  }
};

// Get candidates by assembly and year
exports.getCandidatesByAssemblyAndYear = async (req, res, next) => {
  try {
    const { assemblyId, yearId } = req.params;

    const candidates = await WinningCandidate.find({
      assembly_id: assemblyId,
      year_id: yearId
    })
      .populate('candidate_id', 'name')
      .populate('party_id', 'name')
      .populate('assembly_id', 'name AC_NO')
      .populate('year_id', 'year')
      .sort({ total_votes: -1 });

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    next(err);
  }
};

// Get single winning candidate
exports.getWinningCandidate = async (req, res, next) => {
  try {
    const winningCandidate = await WinningCandidate.findById(req.params.id)
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name AC_NO')
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
    const [
      state,
      division,
      parliament,
      assembly,
      party,
      candidate,
      year
    ] = await Promise.all([
      State.findById(req.body.state_id),
      Division.findById(req.body.division_id),
      Parliament.findById(req.body.parliament_id),
      Assembly.findById(req.body.assembly_id),
      Party.findById(req.body.party_id),
      Candidate.findById(req.body.candidate_id),
      Year.findById(req.body.year_id)
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
    if (!year) {
      return res.status(400).json({ success: false, message: 'Election year not found' });
    }

    // // Validate assembly_no matches assembly's AC_NO
    // if (req.body.assembly_no !== assembly.AC_NO) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Assembly number does not match the referenced assembly'
    //   });
    // }

    // Validate poll_percentage format
    if (!/^\d{1,3}(\.\d{1,2})?%$/.test(req.body.poll_percentage)) {
      return res.status(400).json({
        success: false,
        message: 'Poll percentage must be in format like "50.25%"'
      });
    }

    // Validate type array
    const allowedTypes = ['General', 'Bye', 'Midterm', 'Special'];
    if (!req.body.type || !req.body.type.every(t => allowedTypes.includes(t))) {
      return res.status(400).json({
        success: false,
        message: `Type must be one or more of: ${allowedTypes.join(', ')}`
      });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const winningCandidateData = {
      ...req.body,
      created_by: req.user.id,
      description: req.body.description || '',
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

    const verificationPromises = [];
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.party_id) verificationPromises.push(Party.findById(req.body.party_id));
    if (req.body.candidate_id) verificationPromises.push(Candidate.findById(req.body.candidate_id));
    if (req.body.year_id) verificationPromises.push(Year.findById(req.body.year_id));

    const verificationResults = await Promise.all(verificationPromises);

    for (const result of verificationResults) {
      if (!result) {
        return res.status(400).json({
          success: false,
          message: 'Referenced document not found'
        });
      }
    }

    // Validate poll_percentage if being updated
    if (req.body.poll_percentage && !/^\d{1,3}(\.\d{1,2})?%$/.test(req.body.poll_percentage)) {
      return res.status(400).json({
        success: false,
        message: 'Poll percentage must be in format like "50.25%"'
      });
    }

    // Validate type if being updated
    if (req.body.type) {
      const allowedTypes = ['General', 'Bye', 'Midterm', 'Special'];
      if (!req.body.type.every(t => allowedTypes.includes(t))) {
        return res.status(400).json({
          success: false,
          message: `Type must be one or more of: ${allowedTypes.join(', ')}`
        });
      }
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }
    req.body.updated_by = req.user.id;
    req.body.description = req.body.description || '';
    req.body.updated_at = new Date();

    winningCandidate = await WinningCandidate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name AC_NO')
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
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    const year = await Year.findById(req.params.yearId);
    if (!year) {
      return res.status(404).json({
        success: false,
        message: 'Election year not found'
      });
    }

    const candidates = await WinningCandidate.find({
      assembly_id: req.params.assemblyId,
      year_id: req.params.yearId
    })
      .sort({ total_votes: -1 })
      .populate('party_id', 'name symbol')
      .populate('candidate_id', 'name')
      .lean();

    if (candidates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No candidates found for this assembly and year combination'
      });
    }

    // Optional: Filter out incomplete records (uncomment if needed)
    // const candidatesFiltered = candidates.filter(c => c.candidate_id && c.party_id);
    // if (candidatesFiltered.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'No complete candidate records found'
    //   });
    // }

    const totalCandidates = candidates.length;
    const totalVotesCast = candidates.reduce((sum, candidate) => sum + candidate.total_votes, 0);
    const winner = candidates[0];

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
          candidate_id: winner.candidate_id?._id || null,
          candidate_name: winner.candidate_id?.name || null,
          party_id: winner.party_id?._id || null,
          party_name: winner.party_id?.name || null,
          votes_received: winner.total_votes,
          margin: winner.margin,
          margin_percentage: winner.margin_percentage,
          assembly_no: winner.assembly_no,
          election_type: winner.type,
          poll_percentage: winner.poll_percentage
        },
        all_candidates: candidates.map(candidate => ({
          candidate_id: candidate.candidate_id?._id || null,
          candidate_name: candidate.candidate_id?.name || null,
          party_id: candidate.party_id?._id || null,
          party_name: candidate.party_id?.name || null,
          party_symbol: candidate.party_id?.symbol || null,
          votes_received: candidate.total_votes,
          voting_percentage: candidate.voting_percentage,
          assembly_no: candidate.assembly_id?.AC_NO || null,
          election_type: candidate.type,
          poll_percentage: candidate.poll_percentage
        }))
      }
    };

    res.status(200).json(response);
  } catch (err) {
    console.error("Error in getCandidatesByAssemblyAndYear:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};


// @desc    Get predicted assembly win count per party for 2028
// @route   GET /api/winning-candidates/predicted-party-assembly-count
// @access  Public
exports.getPredictedPartyAssemblyCount2028 = async (req, res, next) => {
  try {
    // Use the same logic as predictWinningPartyForNextYear to get predictions
    const assemblies = await Assembly.find({}, '_id name AC_NO');
    const years = await Year.find({ year: { $ne: '2028' } }, '_id year');
    const yearIds = years.map(y => y._id);

    // For each assembly, find party with most wins in past years
    const predictions = [];
    for (const assembly of assemblies) {
      const winners = await WinningCandidate.find({
        assembly_id: assembly._id,
        year_id: { $in: yearIds }
      }).populate('party_id', 'name symbol color');

      const partyWinCount = {};
      for (const winner of winners) {
        const partyId = winner.party_id?._id?.toString() || winner.party_id?.toString();
        if (!partyId) continue;
        if (!partyWinCount[partyId]) {
          partyWinCount[partyId] = { count: 0, party: winner.party_id };
        }
        partyWinCount[partyId].count++;
      }
      // Find party with max wins
      let predictedParty = null;
      let maxWins = 0;
      Object.values(partyWinCount).forEach(obj => {
        if (obj.count > maxWins) {
          maxWins = obj.count;
          predictedParty = obj.party;
        }
      });
      predictions.push({
        assembly_id: assembly._id,
        predicted_party: predictedParty ? {
          id: predictedParty._id,
          name: predictedParty.name,
          symbol: predictedParty.symbol,
          color: predictedParty.color
        } : null
      });
    }

    // Count how many assemblies each party is predicted to win
    const partyAssemblyCount = {};
    for (const pred of predictions) {
      if (pred.predicted_party && pred.predicted_party.id) {
        const pid = pred.predicted_party.id.toString();
        if (!partyAssemblyCount[pid]) {
          partyAssemblyCount[pid] = {
            party_id: pid,
            party_name: pred.predicted_party.name,
            party_symbol: pred.predicted_party.symbol,
            party_color: pred.predicted_party.color,
            assembly_count: 0
          };
        }
        partyAssemblyCount[pid].assembly_count++;
      }
    }

    // Convert to array and sort descending
    const result = Object.values(partyAssemblyCount).sort((a, b) => b.assembly_count - a.assembly_count);

    res.status(200).json({
      success: true,
      year: 2028,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
// @desc    Predict winning party for each assembly for 2028 based on historical data
// @route   GET /api/winning-candidates/predict/2028
// @access  Public
exports.predictWinningPartyForNextYear = async (req, res, next) => {
  try {
    // Get all assemblies
    const assemblies = await Assembly.find({}, '_id name AC_NO');
    // Get all years except 2028
    const years = await Year.find({ year: { $ne: '2028' } }, '_id year');
    const yearIds = years.map(y => y._id);

    // For each assembly, find party with most wins in past years
    const predictions = [];
    for (const assembly of assemblies) {
      // Find all winning candidates for this assembly in past years
      const winners = await WinningCandidate.find({
        assembly_id: assembly._id,
        year_id: { $in: yearIds }
      }).populate('party_id', 'name symbol color');

      // Count wins per party
      const partyWinCount = {};
      for (const winner of winners) {
        const partyId = winner.party_id?._id?.toString() || winner.party_id?.toString();
        if (!partyId) continue;
        if (!partyWinCount[partyId]) {
          partyWinCount[partyId] = { count: 0, party: winner.party_id };
        }
        partyWinCount[partyId].count++;
      }
      // Find party with max wins
      let predictedParty = null;
      let maxWins = 0;
      Object.values(partyWinCount).forEach(obj => {
        if (obj.count > maxWins) {
          maxWins = obj.count;
          predictedParty = obj.party;
        }
      });
      predictions.push({
        assembly_id: assembly._id,
        assembly_name: assembly.name,
        assembly_no: assembly.AC_NO,
        predicted_party: predictedParty ? {
          id: predictedParty._id,
          name: predictedParty.name,
          symbol: predictedParty.symbol,
          color: predictedParty.color
        } : null,
        win_count: maxWins
      });
    }
    res.status(200).json({
      success: true,
      year: 2028,
      total_assemblies: assemblies.length,
      predictions
    });
  } catch (err) {
    next(err);
  }
};
// @desc    Get number of assemblies won by each party for a given year
// @route   GET /api/winning-candidates/party-assembly-count?year=YEAR_ID
// @access  Public
exports.getPartyAssemblyCountByYear = async (req, res, next) => {
  try {
    const { year } = req.query;
    if (!year) {
      return res.status(400).json({ success: false, message: 'Year ID is required as query param' });
    }

    let yearObjId;
    try {
      yearObjId = new mongoose.Types.ObjectId(year);
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid year ID format' });
    }

    // Aggregate: group by party, count unique assemblies for the given year
    const result = await WinningCandidate.aggregate([
      { $match: { year_id: yearObjId } },
      {
        $group: {
          _id: "$party_id",
          assemblies: { $addToSet: "$assembly_id" }
        }
      },
      {
        $project: {
          party_id: "$_id",
          assembly_count: { $size: "$assemblies" },
          _id: 0
        }
      },
      { $sort: { assembly_count: -1 } }
    ]);

    // Populate party name and color
    const populated = await Party.populate(result, { path: 'party_id', select: 'name symbol color' });

    res.status(200).json({
      success: true,
      data: populated.map(r => ({
        party_id: r.party_id?._id || r.party_id,
        party_name: r.party_id?.name || null,
        party_symbol: r.party_id?.symbol || null,
        party_color: r.party_id?.color || null,
        assembly_count: r.assembly_count
      }))
    });
  } catch (err) {
    next(err);
  }
};