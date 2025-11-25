const mongoose = require('mongoose');
const WinningCandidate = require('../models/winningCandidate');
const State = require('../models/state');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const Assembly = require('../models/Assembly');
const Party = require('../models/party');
const Candidate = require('../models/Candidate');
const Year = require('../models/electionYear');
const Block = require('../models/block');
const Booth = require('../models/booth');

// @desc    Get all winning candidates
// @route   GET /api/winning-candidates
// @access  Public
exports.getWinningCandidates = async (req, res, next) => {
  try {
    console.log('Getting winning candidates with query:', req.query);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    // If client requests aggregated data for all (and optional year), return party-wise summary
    if (req.query.all === 'true') {
      try {
        let matchStage = {};
        let doAggregate = false;
        if (req.query.year) {
          const yearValue = parseInt(req.query.year);
          const yearDoc = await Year.findOne({ year: yearValue });
          if (!yearDoc) {
            return res.status(404).json({ success: false, message: `No data found for year ${req.query.year}` });
          }
          matchStage = { year_id: yearDoc._id };
          // If a specific year is requested along with all=true, return aggregated summary for graphs
          doAggregate = true;
        }

        if (doAggregate) {
          const aggregated = await WinningCandidate.aggregate([
            { $match: matchStage },
            {
              $group: {
                _id: '$party_id',
                totalSeats: { $sum: 1 },
                totalVotes: { $sum: '$total_votes' }
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
                _id: 0,
                partyName: '$party.name',
                totalSeats: 1,
                totalVotes: 1
              }
            },
            { $sort: { totalSeats: -1 } }
          ]);

          return res.status(200).json({ success: true, data: aggregated });
        }

        // Default for all=true (no year): return fully populated list used by tables/CSV
        const list = await WinningCandidate.find(matchStage)
          .populate('candidate_id')
          .populate('party_id')
          .populate('year_id')
          .populate('assembly_id')
          .populate('state_id')
          .populate('division_id')
          .populate('parliament_id')
          .lean();

        return res.status(200).json({ success: true, data: list, total: list.length });
      } catch (err) {
        console.error('Error processing all=true request:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch winning candidates', error: err.message });
      }
    }

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

    // Enforce scope for single resource if userHierarchy present
    if (req.userHierarchy && !(req.user && req.user.role === 'superAdmin')) {
      const uh = req.userHierarchy;
      if (uh.booth && uh.booth._id && winningCandidate.booth_id && String(uh.booth._id) !== String(winningCandidate.booth_id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
      if (uh.block && uh.block._id && winningCandidate.block_id && String(uh.block._id) !== String(winningCandidate.block_id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
      if (uh.assembly && uh.assembly._id && winningCandidate.assembly_id && String(uh.assembly._id) !== String(winningCandidate.assembly_id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
      if (uh.parliament && uh.parliament._id && winningCandidate.parliament_id && String(uh.parliament._id) !== String(winningCandidate.parliament_id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
      if (uh.division && uh.division._id && winningCandidate.division_id && String(uh.division._id) !== String(winningCandidate.division_id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
      if (uh.state && uh.state._id && winningCandidate.state_id && String(uh.state._id) !== String(winningCandidate.state_id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
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

// @desc    Get winning candidate stats for map hover (assembly/parliament)
// @route   GET /api/winning-candidates/stats/:type/:id
// @access  Public
exports.getWinningCandidateStatsForMap = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    let query = {};

    // Validate type
    const validTypes = ['assembly', 'parliament'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be assembly or parliament'
      });
    }

    console.log('Received request for type:', type, 'id:', id);

    // Use aggregation pipeline to match assembly by AC_NO
    let aggregationPipeline = [];

    switch (type) {
      case 'assembly':
        // Match winning candidates where assembly.AC_NO equals the provided id
        aggregationPipeline = [
          {
            $lookup: {
              from: 'assemblies', // Collection name in MongoDB
              localField: 'assembly_id',
              foreignField: '_id',
              as: 'assembly'
            }
          },
          {
            $unwind: '$assembly'
          },
          {
            $match: {
              'assembly.AC_NO': parseInt(id) // Match by AC_NO
            }
          },
          {
            $lookup: {
              from: 'parties',
              localField: 'party_id',
              foreignField: '_id',
              as: 'party'
            }
          },
          {
            $unwind: '$party'
          },
          {
            $lookup: {
              from: 'electionyears',
              localField: 'year_id',
              foreignField: '_id',
              as: 'year'
            }
          },
          {
            $unwind: '$year'
          },
          {
            $sort: { 'year_id': -1 }
          }
        ];
        break;
      case 'parliament':
        // For parliament, use direct match (if needed later)
        aggregationPipeline = [
          {
            $match: { parliament_id: id }
          }
        ];
        break;
    }

    console.log('Aggregation pipeline created for:', type);

    // Execute aggregation to get all matching records
    const allRecords = await WinningCandidate.aggregate(aggregationPipeline);

    console.log('Total records found:', allRecords.length);

    if (allRecords.length === 0) {
      return res.status(404).json({
        success: false,
        error: `No winning candidates found for ${type} ${id}`
      });
    }

    // Get latest winner (first record after sorting)
    const latestWinner = allRecords[0];

    // Get last 3 years
    const last3Years = allRecords.slice(0, 3);

    console.log('Latest winner found:', !!latestWinner);
    console.log('Last 3 years records:', last3Years.length);

    // Calculate total votes from all records
    const totalVotes = allRecords.reduce((sum, record) => sum + (record.total_votes || 0), 0);

    // Format last 3 years winners
    const last3YearWinners = last3Years
      .filter(record => record.year && record.party)
      .map(record => `${record.year.year}-${record.party.name}`)
      .join('<br />');

    const result = {
      totalVotes: totalVotes,
      last3YearWinner: latestWinner ? latestWinner.party?.name || 'N/A' : 'N/A',
      last3YearWinners: last3YearWinners || 'N/A',
      latestElectionYear: latestWinner ? latestWinner.year?.year || 'N/A' : 'N/A',
      electors: latestWinner ? latestWinner.electors || latestWinner.total_electors || 'N/A' : 'N/A',
      male_electors: latestWinner ? latestWinner.male_electors || 'N/A' : 'N/A',
      female_electors: latestWinner ? latestWinner.female_electors || 'N/A' : 'N/A'
    };

    console.log('Final result for assembly stats:', result);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Import winning candidates from Excel
// @route   POST /api/winning-candidates/import
// @access  Private/Admin
exports.importWinningCandidates = async (req, res, next) => {
  try {
    const rows = Array.isArray(req.body.rows) ? req.body.rows : (Array.isArray(req.body) ? req.body : []);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows provided for import' });
    }

    const results = { total: rows.length, created: 0, skipped: 0, errors: [] };

    const parseNum = (v) => {
      if (v === undefined || v === null || v === '') return null;
      const n = Number(String(v).replace(/,/g, ''));
      return Number.isFinite(n) ? n : null;
    };

    const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] || {};
      try {
        // Resolve year (allow year_id or election_year)
        let yearDoc = null;
        if (row.year_id && mongoose.Types.ObjectId.isValid(String(row.year_id))) {
          yearDoc = await Year.findById(row.year_id);
        }
        if (!yearDoc && row.election_year) {
          const y = parseNum(row.election_year) || row.election_year;
          yearDoc = await Year.findOne({ year: y });
          if (!yearDoc && parseNum(y)) {
            yearDoc = await Year.create({ year: parseNum(y) });
          }
        }

        // Resolve party
        let party = null;
        if (row.party_id && mongoose.Types.ObjectId.isValid(String(row.party_id))) {
          party = await Party.findById(row.party_id);
        }
        if (!party && row.party_name) {
          const name = row.party_name.trim();
          party = await Party.findOne({ name: new RegExp('^' + escapeRegex(name) + '$', 'i') });
        }

        // Resolve candidate (id preferred, else name)
        let candidate = null;
        if (row.candidate_id && mongoose.Types.ObjectId.isValid(String(row.candidate_id))) {
          candidate = await Candidate.findById(row.candidate_id);
        }
        if (!candidate && row.candidate_name) {
          const cname = row.candidate_name.trim();
          const q = { name: new RegExp('^' + escapeRegex(cname) + '$', 'i') };
          // narrow by assembly if ac provided
          const acNo = parseNum(row.AC_NO || row.assembly_no) || null;
          if (acNo) {
            const assemblyDoc = await Assembly.findOne({ AC_NO: acNo });
            if (assemblyDoc) q.assembly_id = assemblyDoc._id;
          } else if (row.assembly_id && mongoose.Types.ObjectId.isValid(String(row.assembly_id))) {
            q.assembly_id = row.assembly_id;
          }
          candidate = await Candidate.findOne(q);
        }

        if (!candidate) {
          results.skipped++;
          results.errors.push({ row: i + 1, message: 'Candidate not found or missing' });
          continue;
        }

        // Resolve geography using numeric fallbacks and names
        let state = null, division = null, parliament = null, assembly = null, block = null, booth = null;

        if (row.state_id && mongoose.Types.ObjectId.isValid(String(row.state_id))) state = await State.findById(row.state_id);
        if (!state) {
          const sNo = parseNum(row.state_no) || parseNum(row.state_number) || null;
          if (sNo) state = await State.findOne({ state_no: sNo });
          if (!state && row.state_name) state = await State.findOne({ name: new RegExp('^' + escapeRegex(row.state_name.trim()) + '$', 'i') });
        }

        if (row.division_id && mongoose.Types.ObjectId.isValid(String(row.division_id))) division = await Division.findById(row.division_id);
        if (!division) {
          const dCode = row.division_code || row.division_code_no || null;
          if (dCode) division = await Division.findOne({ code: dCode }) || await Division.findOne({ division_code: dCode });
          if (!division && row.division_name) division = await Division.findOne({ name: new RegExp('^' + escapeRegex(row.division_name.trim()) + '$', 'i') });
          if (!division && state) division = await Division.findOne({ state_id: state._id });
        }

        if (row.parliament_id && mongoose.Types.ObjectId.isValid(String(row.parliament_id))) parliament = await Parliament.findById(row.parliament_id);
        if (!parliament) {
          const pNo = parseNum(row.parliament_no) || parseNum(row.parliament_number) || null;
          if (pNo) parliament = await Parliament.findOne({ parliament_no: pNo }) || await Parliament.findOne({ no: pNo });
          if (!parliament && row.parliament_name) parliament = await Parliament.findOne({ name: new RegExp('^' + escapeRegex(row.parliament_name.trim()) + '$', 'i') });
          if (!parliament && division) parliament = await Parliament.findOne({ division_id: division._id });
        }

        if (row.assembly_id && mongoose.Types.ObjectId.isValid(String(row.assembly_id))) assembly = await Assembly.findById(row.assembly_id);
        if (!assembly) {
          const acNo = parseNum(row.AC_NO) || parseNum(row.AC) || parseNum(row.assembly_no) || null;
          if (acNo) assembly = await Assembly.findOne({ AC_NO: acNo }) || await Assembly.findOne({ ac_no: acNo });
          if (!assembly && row.assembly_name) assembly = await Assembly.findOne({ name: new RegExp('^' + escapeRegex(row.assembly_name.trim()) + '$', 'i') });
          if (!assembly && parliament) assembly = await Assembly.findOne({ parliament_id: parliament._id });
        }

        if (row.block_id && mongoose.Types.ObjectId.isValid(String(row.block_id))) block = await Block.findById(row.block_id);
        if (!block) {
          const bNo = parseNum(row.block_number) || parseNum(row.block_no) || null;
          if (bNo && assembly) block = await Block.findOne({ assembly_id: assembly ? assembly._id : undefined, block_no: bNo }) || await Block.findOne({ block_number: bNo });
          if (!block && row.block_name) block = await Block.findOne({ name: new RegExp('^' + escapeRegex(row.block_name.trim()) + '$', 'i') });
        }

        if (row.booth_id && mongoose.Types.ObjectId.isValid(String(row.booth_id))) booth = await Booth.findById(row.booth_id);
        if (!booth) {
          const boothNo = parseNum(row.booth_number) || parseNum(row.booth_no) || null;
          if (boothNo && assembly) booth = await Booth.findOne({ assembly_id: assembly ? assembly._id : undefined, booth_number: boothNo }) || await Booth.findOne({ booth_no: boothNo });
          if (!booth && row.booth_name) booth = await Booth.findOne({ name: new RegExp('^' + escapeRegex(row.booth_name.trim()) + '$', 'i') });
        }

        // build payload
        const payload = {
          candidate_id: candidate._id,
          party_id: party ? party._id : undefined,
          year_id: yearDoc ? yearDoc._id : undefined,
          state_id: state ? state._id : undefined,
          division_id: division ? division._id : undefined,
          parliament_id: parliament ? parliament._id : undefined,
          assembly_id: assembly ? assembly._id : undefined,
          block_id: block ? block._id : undefined,
          booth_id: booth ? booth._id : undefined,
          AC_NO: assembly ? assembly.AC_NO || assembly.AC : (row.AC_NO || row.assembly_no || row.AC),
          total_votes: parseNum(row.total_votes) || parseNum(row.votes) || 0,
          margin: parseNum(row.margin) || 0,
          margin_percentage: parseNum(row.margin_percentage) || null,
          poll_percentage: typeof row.poll_percentage === 'string' ? row.poll_percentage : (row.poll_percentage ? String(row.poll_percentage) + '%' : undefined),
          voting_percentage: parseNum(row.voting_percentage) || null,
          electors: parseNum(row.electors) || null,
          total_electors: parseNum(row.total_electors) || parseNum(row.electors) || null,
          male_electors: parseNum(row.male_electors) || null,
          female_electors: parseNum(row.female_electors) || null,
          nota_votes: parseNum(row.nota_votes) || null,
          description: row.description || row.notes || '',
          type: Array.isArray(row.type) ? row.type : (row.type ? String(row.type).split(/[,;|]/).map(t => t.trim()) : ['General']),
          created_by: req.user && req.user.id ? req.user.id : undefined,
          assembly_no: assembly ? (assembly.AC_NO || assembly.AC || row.AC_NO || row.assembly_no) : (row.AC_NO || row.assembly_no)
        };

        Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

        // avoid duplicates: if same assembly+year exists, update
        const existing = (payload.year_id && payload.assembly_id) ? await WinningCandidate.findOne({ assembly_id: payload.assembly_id, year_id: payload.year_id }) : null;
        if (existing) {
          await WinningCandidate.findByIdAndUpdate(existing._id, payload, { new: true, runValidators: true });
          results.created++;
        } else {
          await WinningCandidate.create(payload);
          results.created++;
        }

      } catch (rowErr) {
        results.skipped++;
        results.errors.push({ row: i + 1, message: rowErr.message });
      }
    }

    res.status(200).json({ success: true, results });
  } catch (err) {
    console.error('importWinningCandidates error:', err);
    next(err);
  }
};