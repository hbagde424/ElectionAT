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
// @access  Private (Requires authentication via serviceToken)
exports.getWinningPartysForGraph = async (req, res, next) => {
  try {
    // Build base query and ensure election_year is populated
    let query = WinningParty.find().populate('party_id', 'name').populate('election_year', 'year');

    const yearParam = req.query.year;
    let fallbackYearFilter = null;

    if (yearParam) {
      const year = parseInt(yearParam, 10);
      if (isNaN(year)) {
        return res.status(400).json({ success: false, message: 'Year must be a valid number' });
      }

      // Try to find ElectionYear document first
      const yearDoc = await ElectionYear.findOne({ year: year });
      if (yearDoc) {
        query = query.where('election_year').equals(yearDoc._id);
      } else {
        // If ElectionYear doc not found, we'll fetch records and filter by populated election_year.year
        // as some records may store/populate the year differently (or election_year may be numeric)
        fallbackYearFilter = year;
      }
    }

    const winningParties = await query.exec();
    // Debug log: incoming year param and fetched count
    console.debug('[winningPartysForGraph] requestedYear=', req.query.year, 'fetchedRecords=', winningParties.length);

    // If fallbackYearFilter is set, filter results in-memory by election_year.year or numeric election_year
    let filtered = winningParties;
    if (fallbackYearFilter !== null) {
      filtered = winningParties.filter(r => {
        try {
          // If election_year is populated object with .year
          if (r.election_year && typeof r.election_year === 'object' && r.election_year.year) {
            return Number(r.election_year.year) === Number(fallbackYearFilter);
          }
          // If election_year stored as plain number/string
          if (r.election_year && (typeof r.election_year === 'number' || typeof r.election_year === 'string')) {
            return Number(r.election_year) === Number(fallbackYearFilter);
          }
        } catch (e) {
          return false;
        }
        return false;
      });
    }

    const total = filtered.length;
    res.status(200).json({ success: true, count: filtered.length, total, data: filtered });
  } catch (err) {
    next(err);
  }
};

// Debug endpoint - return counts of winning party records grouped by populated election_year.year
exports.getWinningPartysYearCounts = async (req, res, next) => {
  try {
    // Populate election_year.year
    const all = await WinningParty.find().populate('election_year', 'year');
    const counts = {};
    all.forEach(r => {
      let y = 'unknown';
      if (r.election_year && typeof r.election_year === 'object' && r.election_year.year) {
        y = String(r.election_year.year);
      } else if (r.election_year && (typeof r.election_year === 'number' || typeof r.election_year === 'string')) {
        y = String(r.election_year);
      }
      counts[y] = (counts[y] || 0) + 1;
    });
    console.debug('[getWinningPartysYearCounts] counts=', counts);
    res.status(200).json({ success: true, counts });
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

    // Apply user hierarchy scoping when available (booth->block->assembly->parliament->division->state)
    if (req.userHierarchy && !(req.user && req.user.role === 'superAdmin')) {
      const h = req.userHierarchy;
      const boothId = h.booth?._id || h.booth;
      const blockId = h.block?._id || h.block;
      const assemblyId = h.assembly?._id || h.assembly;
      const parliamentId = h.parliament?._id || h.parliament;
      const divisionId = h.division?._id || h.division;
      const stateId = h.state?._id || h.state;

      if (boothId) {
        query = query.where('booth_id').equals(boothId);
      } else if (blockId) {
        query = query.where('block_id').equals(blockId);
      } else if (assemblyId) {
        query = query.where('assembly_id').equals(assemblyId);
      } else if (parliamentId) {
        query = query.where('parliament_id').equals(parliamentId);
      } else if (divisionId) {
        query = query.where('division_id').equals(divisionId);
      } else if (stateId) {
        query = query.where('state_id').equals(stateId);
      }
    }


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
// @access  Private (Requires authentication via serviceToken)
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

    // Enforce scope for single resource if userHierarchy present
    if (req.userHierarchy && !(req.user && req.user.role === 'superAdmin')) {
      const h = req.userHierarchy;
      const boothId = h.booth?._id || h.booth;
      const blockId = h.block?._id || h.block;
      const assemblyId = h.assembly?._id || h.assembly;
      const parliamentId = h.parliament?._id || h.parliament;
      const divisionId = h.division?._id || h.division;
      const stateId = h.state?._id || h.state;

      if (boothId && winningParty.booth_id && String(boothId) !== String(winningParty.booth_id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
      if (blockId && winningParty.block_id && String(blockId) !== String(winningParty.block_id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
      if (assemblyId && winningParty.assembly_id && String(assemblyId) !== String(winningParty.assembly_id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
      if (parliamentId && winningParty.parliament_id && String(parliamentId) !== String(winningParty.parliament_id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
      if (divisionId && winningParty.division_id && String(divisionId) !== String(winningParty.division_id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
      if (stateId && winningParty.state_id && String(stateId) !== String(winningParty.state_id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
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

// @desc    Import Winning Parties from Excel
// @route   POST /api/winning-parties/import
// @access  Private (SuperAdmin)
exports.importWinningParties = async (req, res, next) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No data provided' });
    }

    const { resolveGeographicHierarchy } = require('./importHelpers');
    const summary = { total: rows.length, created: 0, skipped: 0, errors: [] };

    const parseNum = (v) => {
      if (v === undefined || v === null || v === '') return null;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Candidate resolution: prefer candidate_id if provided, else by name
        let candidate = null;
        if (row.candidate_id && /^[a-f\d]{24}$/i.test(String(row.candidate_id))) {
          candidate = await Candidate.findById(row.candidate_id);
        }
        if (!candidate && row.candidate_name) {
          candidate = await Candidate.findOne({ name: new RegExp(`^${row.candidate_name}$`, 'i') });
        }

        // Party resolution
        let party = null;
        if (row.party_id && /^[a-f\d]{24}$/i.test(String(row.party_id))) {
          party = await Party.findById(row.party_id);
        }
        if (!party && row.party_name) {
          party = await Party.findOne({ name: new RegExp(`^${row.party_name}$`, 'i') });
        }

        // Election year: accept numeric year or id; create minimal doc if numeric year missing
        let electionYear = null;
        if (row.election_year && /^[a-f\d]{24}$/i.test(String(row.election_year))) {
          electionYear = await ElectionYear.findById(row.election_year);
        } else if (row.election_year) {
          const y = parseNum(row.election_year) || row.election_year;
          if (y) {
            electionYear = await ElectionYear.findOne({ year: y });
            if (!electionYear) {
              // create a minimal election year record
              try {
                electionYear = await ElectionYear.create({ year: Number(y) });
              } catch (e) {
                // ignore create errors
                electionYear = await ElectionYear.findOne({ year: y });
              }
            }
          }
        }

        // Resolve geographic hierarchy (name-first)
        const geo = await resolveGeographicHierarchy(row);

        // Numeric fallbacks
        let state = geo.state || null;
        let division = geo.division || null;
        let parliament = geo.parliament || null;
        let assembly = geo.assembly || null;
        let block = geo.block || null;
        let booth = geo.booth || null;

        if (!state) {
          const sNo = parseNum(row.state_no) || parseNum(row.state_number) || parseNum(row.state);
          if (sNo != null) state = await State.findOne({ state_no: sNo });
        }
        if (!division) {
          const dCode = row.division_code || row.divisioncode || row.division_code_number;
          if (dCode) division = await Division.findOne({ code: String(dCode) });
        }
        if (!parliament) {
          const pNo = parseNum(row.parliament_no) || parseNum(row.parliament_number) || parseNum(row.parliament);
          if (pNo != null) parliament = await Parliament.findOne({ parliament_no: pNo });
        }
        if (!assembly) {
          const ac = parseNum(row.AC_NO) || parseNum(row.ac_no) || parseNum(row.constituency_no) || parseNum(row.AC);
          if (ac != null) assembly = await Assembly.findOne({ AC_NO: ac });
        }
        if (!block) {
          const bNo = parseNum(row.block_number) || parseNum(row.block_no) || parseNum(row.block);
          if (bNo != null) block = await Block.findOne({ block_number: bNo });
        }
        if (!booth) {
          const bo = parseNum(row.booth_number) || parseNum(row.booth_no) || parseNum(row.booth);
          if (bo != null) booth = await Booth.findOne({ booth_number: bo });
        }

        // Candidate is required for winning party
        if (!candidate) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: `Candidate '${row.candidate_name || row.candidate || ''}' not found` });
          continue;
        }

        const winningPartyData = {
          candidate_id: candidate._id,
          party_id: party ? party._id : null,
          election_year: electionYear ? electionYear._id : null,
          votes: parseNum(row.votes) || 0,
          margin: parseNum(row.margin) || 0,
          electors: parseNum(row.electors) || null,
          male_electors: parseNum(row.male_electors) || null,
          female_electors: parseNum(row.female_electors) || null,
          nota_votes: parseNum(row.nota_votes) || null,
          description: row.description || row.remark || '',
          state_id: (state && state._id) || (geo.state ? geo.state._id : null),
          division_id: (division && division._id) || (geo.division ? geo.division._id : null),
          parliament_id: (parliament && parliament._id) || (geo.parliament ? geo.parliament._id : null),
          assembly_id: (assembly && assembly._id) || (geo.assembly ? geo.assembly._id : null),
          block_id: (block && block._id) || (geo.block ? geo.block._id : null),
          booth_id: (booth && booth._id) || (geo.booth ? geo.booth._id : null),
          booth_number: parseNum(row.booth_number) || row.booth_number || (booth && booth.booth_number) || null,
          created_by: req.user.id,
          updated_by: req.user.id
        };

        await WinningParty.create(winningPartyData);
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