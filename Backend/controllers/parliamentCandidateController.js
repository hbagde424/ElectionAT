// @desc    Get winning party for each parliament (for a given year or latest year)
// @route   GET /api/parliament-candidates/winning-party-by-parliament
// @access  Public
const Parliament = require('../models/Parliament');
const Party = require('../models/party');
const Year = require('../models/electionYear');
const Candidate = require('../models/Candidate');
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

    // Map parliament_id to winner info and normalize
    const result = winners.map(w => {
      const norm = normalizeCandidateDoc(w);
      return {
        parliament: w.parliament_id, // full parliament object
        party_id: w.party_id?._id,
        party_name: w.party_id?.name,
        party_color: w.party_id?.color,
        party_symbol: w.party_id?.symbol,
        candidate_id: w.candidate_id?._id,
        candidate_name: w.candidate_id?.name,
        margin: norm.margin,
        margin_percentage: norm.margin_percentage,
        total_votes: norm.total_votes_parliament,
        year: yearDoc?.year || null
      };
    });

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
const mongoose = require('mongoose');

// Helper to normalize mixed-case and formatted fields from DB documents
function normalizeCandidateDoc(doc) {
  if (!doc) return doc;
  // Ensure plain object and include virtuals
  let obj = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc };

  const mappings = [
    ['Margin', 'margin'],
    ['Margin_percentage', 'margin_percentage'],
    ['Electors', 'electors'],
    ['Turnout', 'turnout'],
    ['Male_Electors', 'male_electors'],
    ['Female_Electors', 'female_electors'],
    ['Total_Votes_Polled', 'total_votes_polled'],
    ['Valid_Votes', 'valid_votes'],
    ['Total_Male_Voters', 'total_male_voters'],
    ['Female_Voters', 'female_voters'],
    ['NOTA_Votes', 'nota_votes'],
    ['Candidate_Votes', 'candidate_votes']
  ];

  const parseNumber = (v) => {
    if (v === undefined || v === null || v === '') return undefined;
    if (typeof v === 'number') return v;
    const s = String(v);
    // If percent like "68.3%"
    const percentMatch = s.match(/([\d.,]+)\s*%/);
    if (percentMatch) {
      const cleaned = percentMatch[1].replace(/,/g, '');
      const n = Number(cleaned);
      return isNaN(n) ? undefined : n / 100;
    }
    // Extract first numeric group
    const m = s.match(/[-+]?[0-9,]*\.?[0-9]+/);
    if (!m) return undefined;
    const cleaned = m[0].replace(/,/g, '');
    const n = Number(cleaned);
    return isNaN(n) ? undefined : n;
  };

  mappings.forEach(([upper, lower]) => {
    const upperVal = obj[upper];
    const lowerVal = obj[lower];
    // If upper exists and lower is missing/zero/invalid, prefer upper
    if (upperVal !== undefined && (lowerVal === undefined || lowerVal === null || lowerVal === 0)) {
      const parsed = parseNumber(upperVal);
      if (parsed !== undefined) obj[lower] = parsed;
    }
  });

  // Ensure candidate_votes is numeric
  obj.candidate_votes = parseNumber(obj.candidate_votes) ?? 0;
  obj.total_votes_parliament = parseNumber(obj.total_votes_parliament) ?? parseNumber(obj.total_votes) ?? obj.total_votes_parliament ?? 0;

  // margin already handled above; ensure numeric
  obj.margin = parseNumber(obj.margin) ?? 0;

  // margin_percentage might be decimal fraction or percent number; normalize to decimal fraction
  if (obj.margin_percentage === undefined || obj.margin_percentage === null) {
    obj.margin_percentage = (obj.total_votes_parliament > 0) ? parseFloat((Math.abs(obj.margin) / obj.total_votes_parliament).toFixed(6)) : 0;
  } else {
    const mp = parseNumber(obj.margin_percentage);
    if (mp !== undefined) {
      // if parsed value was from a percent like "8.6%", parseNumber returned 0.086; if it returned 8.6, convert
      obj.margin_percentage = mp > 1 ? (mp <= 100 ? mp / 100 : mp) : mp;
    }
  }

  // Compute vote_percentage if missing or invalid
  const vp = parseNumber(obj.vote_percentage);
  if (vp === undefined || isNaN(vp)) {
    obj.vote_percentage = (obj.total_votes_parliament > 0) ? parseFloat(((obj.candidate_votes / obj.total_votes_parliament) * 100).toFixed(2)) : 0;
  } else {
    // ensure it's a plain number (percentage number, not fraction)
    obj.vote_percentage = vp > 1 ? vp : parseFloat((vp).toFixed(2));
  }

  return obj;
}

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

    // Apply optional user hierarchy filtering if provided and user is not superAdmin
    try {
      if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
        const h = req.userHierarchy;
        // Parliament-level data: if user has a parliament_id, restrict to it
        if (h.parliament_id) {
          query = query.where('parliament_id').equals(h.parliament_id);
        } else if (h.division_id) {
          query = query.where('division_id').equals(h.division_id);
        } else if (h.state_id) {
          query = query.where('state_id').equals(h.state_id);
        }
      }
    } catch (e) {
      // ignore malformed hierarchy
    }

    // Search functionality: support searching by candidate name, party name, parliament name/no, year or result
    if (req.query.search) {
      const q = String(req.query.search).trim();
      const searchRegex = { $regex: q, $options: 'i' };

      const orClauses = [];

      // position_result (win/loss)
      orClauses.push({ position_result: searchRegex });

      // Try to resolve candidate IDs matching the search term
      try {
        const candDocs = await Candidate.find({ name: searchRegex }).select('_id').limit(50).lean();
        if (Array.isArray(candDocs) && candDocs.length) orClauses.push({ candidate_id: { $in: candDocs.map(c => c._id) } });
      } catch (e) {
        // ignore lookup error
      }

      // Try to resolve party IDs matching the search term
      try {
        const partyDocs = await Party.find({ name: searchRegex }).select('_id').limit(50).lean();
        if (Array.isArray(partyDocs) && partyDocs.length) orClauses.push({ party_id: { $in: partyDocs.map(p => p._id) } });
      } catch (e) {
        // ignore
      }

      // Try to resolve parliament by name or number
      try {
        // exact number match
        const num = parseInt(q);
        if (!isNaN(num)) {
          const pByNo = await Parliament.find({ parliament_no: num }).select('_id').limit(20).lean();
          if (pByNo.length) orClauses.push({ parliament_id: { $in: pByNo.map(p => p._id) } });
        }
        // name match
        const pByName = await Parliament.find({ name: searchRegex }).select('_id').limit(50).lean();
        if (pByName.length) orClauses.push({ parliament_id: { $in: pByName.map(p => p._id) } });
      } catch (e) {
        // ignore
      }

      // Try to resolve election years (search by year number or name)
      try {
        const yNum = parseInt(q);
        if (!isNaN(yNum)) {
          const yDocs = await Year.find({ year: yNum }).select('_id').limit(20).lean();
          if (Array.isArray(yDocs) && yDocs.length) orClauses.push({ election_year_id: { $in: yDocs.map(y => y._id) } });
        }
        const yByName = await Year.find({ year: searchRegex }).select('_id').limit(20).lean();
        if (Array.isArray(yByName) && yByName.length) orClauses.push({ election_year_id: { $in: yByName.map(y => y._id) } });
      } catch (e) {
        // ignore
      }

      if (orClauses.length) {
        query = query.find({ $or: orClauses });
      }
    }

    // Filter by parliament
    if (req.query.parliament_id) {
      query = query.where('parliament_id').equals(req.query.parliament_id);
    }

    // Filter by candidate
    if (req.query.candidate_id) {
      query = query.where('candidate_id').equals(req.query.candidate_id);
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
      const normalized = Array.isArray(allCandidates) ? allCandidates.map(normalizeCandidateDoc) : [];
      return res.status(200).json({
        success: true,
        count: normalized.length,
        data: normalized
      });
    }

    // Apply pagination
    const candidates = await query.skip(skip).limit(limit).exec();
    const total = await ParliamentCandidate.countDocuments(query.getFilter());

    // Normalize paginated candidates
    const normalizedCandidates = Array.isArray(candidates) ? candidates.map(normalizeCandidateDoc) : [];
    res.status(200).json({
      success: true,
      count: normalizedCandidates.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: normalizedCandidates
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

    // Enforce scope for non-superAdmin users
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      if (h.parliament_id && candidate.parliament_id && candidate.parliament_id.toString() !== h.parliament_id) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
      if (h.division_id && candidate.division_id && candidate.division_id.toString() !== h.division_id) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
      if (h.state_id && candidate.state_id && candidate.state_id.toString() !== h.state_id) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
    }

    const normalized = normalizeCandidateDoc(candidate);
    res.status(200).json({
      success: true,
      data: normalized
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
    // Normalize incoming body to handle legacy/mixed-case fields saved in DB
    const normalizeIncoming = (body) => {
      if (!body || typeof body !== 'object') return body;
      const map = {
        Margin: 'margin',
        Margin_percentage: 'margin_percentage',
        Electors: 'electors',
        Turnout: 'turnout',
        Male_Electors: 'male_electors',
        Female_Electors: 'female_electors',
        Total_Votes_Polled: 'total_votes_polled',
        Valid_Votes: 'valid_votes',
        Total_Male_Voters: 'total_male_voters',
        Female_Voters: 'female_voters',
        NOTA_Votes: 'nota_votes'
      };

      const parseNumber = (val) => {
        if (val === undefined || val === null) return undefined;
        if (typeof val === 'number') return val;
        const cleaned = String(val).replace(/[(),%\s]/g, '').replace(/,/g, '');
        const n = Number(cleaned);
        return isNaN(n) ? val : n;
      };

      const out = { ...body };
      Object.keys(map).forEach((upper) => {
        const lower = map[upper];
        if (body[upper] !== undefined && out[lower] === undefined) {
          out[lower] = parseNumber(body[upper]);
        }
      });
      return out;
    };

    req.body = normalizeIncoming(req.body);

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
    // Normalize newly added numeric fields
    candidateData.electors = Number(candidateData.electors) || 0;
    candidateData.turnout = Number(candidateData.turnout) || 0;
    candidateData.male_electors = Number(candidateData.male_electors) || 0;
    candidateData.female_electors = Number(candidateData.female_electors) || 0;
    candidateData.total_votes_polled = Number(candidateData.total_votes_polled) || 0;
    candidateData.valid_votes = Number(candidateData.valid_votes) || 0;
    candidateData.total_male_voters = Number(candidateData.total_male_voters) || 0;
    candidateData.female_voters = Number(candidateData.female_voters) || 0;
    candidateData.nota_votes = Number(candidateData.nota_votes) || 0;
    const total = Number(candidateData.total_votes_parliament) || 0;
    // Robust parsing for margin_percentage: accept "1%", "0.01", or numeric strings
    const parseMarginPercentage = (mp) => {
      if (mp === undefined || mp === null || mp === '') return undefined;
      if (typeof mp === 'number') return mp <= 1 ? mp : mp <= 100 ? mp / 100 : mp;
      if (typeof mp === 'string') {
        if (mp.includes('%')) {
          const num = Number(mp.replace('%', '').trim());
          return isNaN(num) ? undefined : num / 100;
        }
        const cleaned = mp.replace(/,/g, '').trim();
        const n = Number(cleaned);
        if (!isNaN(n)) return n <= 1 ? n : (n <= 100 ? n / 100 : n);
      }
      return undefined;
    };

    const parsedMp = parseMarginPercentage(candidateData.margin_percentage);
    if (parsedMp === undefined) {
      candidateData.margin_percentage = total > 0 ? parseFloat((Math.abs(candidateData.margin) / total).toFixed(6)) : 0;
    } else {
      candidateData.margin_percentage = parsedMp;
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

    // Normalize incoming body to handle legacy/mixed-case fields
    const normalizeIncoming = (body) => {
      if (!body || typeof body !== 'object') return body;
      const map = {
        Margin: 'margin',
        Margin_percentage: 'margin_percentage',
        Electors: 'electors',
        Turnout: 'turnout',
        Male_Electors: 'male_electors',
        Female_Electors: 'female_electors',
        Total_Votes_Polled: 'total_votes_polled',
        Valid_Votes: 'valid_votes',
        Total_Male_Voters: 'total_male_voters',
        Female_Voters: 'female_voters',
        NOTA_Votes: 'nota_votes'
      };

      const parseNumber = (val) => {
        if (val === undefined || val === null) return undefined;
        if (typeof val === 'number') return val;
        const cleaned = String(val).replace(/[(),%\s]/g, '').replace(/,/g, '');
        const n = Number(cleaned);
        return isNaN(n) ? val : n;
      };

      const out = { ...body };
      Object.keys(map).forEach((upper) => {
        const lower = map[upper];
        if (body[upper] !== undefined && out[lower] === undefined) {
          out[lower] = parseNumber(body[upper]);
        }
      });
      return out;
    };

    const updateData = {
      ...normalizeIncoming(req.body),
      updated_by: req.user.id,
    };

    // Normalize numeric fields and compute margin_percentage if needed
    updateData.margin = Number(updateData.margin) || 0;
    // Normalize newly added numeric fields on update
    updateData.electors = Number(updateData.electors) || 0;
    updateData.turnout = Number(updateData.turnout) || 0;
    updateData.male_electors = Number(updateData.male_electors) || 0;
    updateData.female_electors = Number(updateData.female_electors) || 0;
    updateData.total_votes_polled = Number(updateData.total_votes_polled) || 0;
    updateData.valid_votes = Number(updateData.valid_votes) || 0;
    updateData.total_male_voters = Number(updateData.total_male_voters) || 0;
    updateData.female_voters = Number(updateData.female_voters) || 0;
    updateData.nota_votes = Number(updateData.nota_votes) || 0;
    const total = Number(updateData.total_votes_parliament) || 0;

    const parseMarginPercentage = (mp) => {
      if (mp === undefined || mp === null || mp === '') return undefined;
      if (typeof mp === 'number') return mp <= 1 ? mp : mp <= 100 ? mp / 100 : mp;
      if (typeof mp === 'string') {
        if (mp.includes('%')) {
          const num = Number(mp.replace('%', '').trim());
          return isNaN(num) ? undefined : num / 100;
        }
        const cleaned = mp.replace(/,/g, '').trim();
        const n = Number(cleaned);
        if (!isNaN(n)) return n <= 1 ? n : (n <= 100 ? n / 100 : n);
      }
      return undefined;
    };

    const parsedMp = parseMarginPercentage(updateData.margin_percentage);
    if (parsedMp === undefined) {
      updateData.margin_percentage = total > 0 ? parseFloat((Math.abs(updateData.margin) / total).toFixed(6)) : 0;
    } else {
      updateData.margin_percentage = parsedMp;
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

// @desc    Get Parliament Candidate stats by Parliament ID or Number
// @route   GET /api/parliament-candidates/stats/parliament/:parliamentId
// @access  Public
exports.getParliamentCandidateStatsByParliament = async (req, res, next) => {
  try {
    const rawParliamentId = req.params.parliamentId;
    const parliamentId = decodeURIComponent(rawParliamentId);
    console.log('=== PARLIAMENT CANDIDATE STATS REQUEST ===');
    console.log('Raw received parliamentId:', rawParliamentId);
    console.log('Decoded parliamentId:', parliamentId);
    
    // First find the parliament by either ObjectId or parliament_no
    const Parliament = require('../models/Parliament');
    let parliament;
    
    // Check if parliamentId is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(parliamentId)) {
      parliament = await Parliament.findById(parliamentId);
      console.log('Found parliament by ObjectId:', parliament);
    }
    
    // If not found by ObjectId, try by parliament_no (convert to number if possible)
    if (!parliament) {
      const parliamentNo = parseInt(parliamentId);
      if (!isNaN(parliamentNo)) {
        parliament = await Parliament.findOne({ parliament_no: parliamentNo });
        console.log('Found parliament by parliament_no:', parliament);
      }
    }
    
    // If still not found, try to match by name (for cases like "DHAR (ST)" -> "Dhar")
    if (!parliament) {
      // First try exact match
      parliament = await Parliament.findOne({ name: parliamentId });
      console.log('Found parliament by exact name match:', parliament);
      
      if (!parliament) {
        // Extract the main name part (before any parentheses) and search
        const cleanName = parliamentId.toString().split('(')[0].trim();
        console.log('Searching for parliament with clean name:', cleanName);
        parliament = await Parliament.findOne({ 
          name: { $regex: new RegExp(`^${cleanName}`, 'i') } 
        });
        console.log('Found parliament by name search:', parliament);
      }
    }
    
    if (!parliament) {
      console.log('Parliament not found for ID:', parliamentId);
      // Let's check what parliaments exist
      const allParliaments = await Parliament.find().limit(5);
      console.log('Sample parliaments in DB:', allParliaments);
      
      return res.status(404).json({
        success: false,
        message: 'Parliament not found',
        debug: { searchedId: parliamentId, sampleParliaments: allParliaments }
      });
    }

    console.log('Using parliament:', parliament._id, parliament.name);

    // Get latest winning candidate for this parliament (for last 3 years)
    const latestWinner = await ParliamentCandidate.findOne({
      parliament_id: parliament._id,
      position_result: 'win'
    })
    .populate('party_id', 'name color symbol')
    .populate('election_year_id', 'year')
    .sort({ 'election_year_id': -1 })
    .limit(1);

    console.log('Latest winner found:', latestWinner);

    if (!latestWinner) {
      // Let's check what parliament candidates exist
      const allCandidates = await ParliamentCandidate.find({ parliament_id: parliament._id }).limit(5);
      console.log('Sample candidates for this parliament:', allCandidates);
      
      return res.status(404).json({
        success: false,
        message: 'No winning candidate data found for this parliament',
        debug: { parliamentId: parliament._id, parliamentName: parliament.name, sampleCandidates: allCandidates }
      });
    }

    const normalized = normalizeCandidateDoc(latestWinner);
    console.log('Normalized candidate data:', normalized);

    const statsData = {
      electors: normalized.electors || 0,
      male_electors: normalized.male_electors || 0,
      female_electors: normalized.female_electors || 0,
      last3YearWinner: latestWinner.party_id?.name || 'N/A',
      winnerPartyColor: latestWinner.party_id?.color || null,
      winnerPartySymbol: latestWinner.party_id?.symbol || null,
      electionYear: latestWinner.election_year_id?.year || null,
      totalVotes: normalized.total_votes_parliament || 0,
      candidateVotes: normalized.candidate_votes || 0,
      margin: normalized.margin || 0,
      marginPercentage: normalized.margin_percentage || 0,
      turnout: normalized.turnout || 0
    };

    console.log('Returning stats data:', statsData);

    res.status(200).json({
      success: true,
      data: statsData
    });
  } catch (err) {
    console.error('Error in getParliamentCandidateStatsByParliament:', err);
    next(err);  
  }
};