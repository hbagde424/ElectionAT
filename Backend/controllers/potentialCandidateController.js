const PotentialCandidate = require('../models/PotentialCandidate');
const Party = require('../models/party');
const Assembly = require('../models/Assembly');
const ElectionYear = require('../models/electionYear');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const { resolveGeographicHierarchy } = require('./importHelpers');
// @desc    Get all potential candidates
// @route   GET /api/potential-candidates
// @access  Private (Requires authentication via serviceToken)
exports.getPotentialCandidates = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Base query with population
    let query = PotentialCandidate.find()
      .populate('party_id', 'name')
      .populate('constituency_id', 'name')
      .populate('election_year_id', 'year')
      .populate('supporter_candidates', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ name: 1 });

    // Apply user hierarchy scoping when available (booth->block->assembly->parliament->division->state)
    if (req.userHierarchy && !(req.user && req.user.role === 'superAdmin')) {
      const uh = req.userHierarchy;
      // PotentialCandidate is tied to an assembly/constituency via constituency_id
      if (uh.booth && uh.booth._id) {
        // If user is limited to a booth, filter by that booth's assembly via booth->assembly relation is not stored here
        // Conservatively filter by assembly if available on the hierarchy
        if (uh.booth.assembly_id) query = query.where('constituency_id').equals(uh.booth.assembly_id);
      } else if (uh.block && uh.block._id) {
        if (uh.block.assembly_id) query = query.where('constituency_id').equals(uh.block.assembly_id);
      } else if (uh.assembly && uh.assembly._id) {
        query = query.where('constituency_id').equals(uh.assembly._id);
      } else if (uh.parliament && uh.parliament._id) {
        query = query.where('parliament_id').equals(uh.parliament._id);
      } else if (uh.division && uh.division._id) {
        query = query.where('division_id').equals(uh.division._id);
      } else if (uh.state && uh.state._id) {
        query = query.where('state_id').equals(uh.state._id);
      }
    }

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { history: { $regex: req.query.search, $options: 'i' } },
          { pros: { $regex: req.query.search, $options: 'i' } },
          { cons: { $regex: req.query.search, $options: 'i' } },
          { 'post_details.postname': { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Filter by status
    if (req.query.status) {
      query = query.where('status').equals(req.query.status);
    }

    // Filter by party
    if (req.query.party_id || req.query.party) {
      const partyId = req.query.party_id || req.query.party;
      query = query.where('party_id').equals(partyId);
    }

    // Filter by constituency
    if (req.query.constituency_id || req.query.constituency) {
      const constituencyId = req.query.constituency_id || req.query.constituency;
      query = query.where('constituency_id').equals(constituencyId);
    }

    // Filter by election year
    if (req.query.election_year_id || req.query.election_year) {
      const electionYearId = req.query.election_year_id || req.query.election_year;
      query = query.where('election_year_id').equals(electionYearId);
    }

    const candidates = await query.skip(skip).limit(limit).exec();
    const total = await PotentialCandidate.countDocuments(query.getFilter());

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

// @desc    Get single potential candidate
// @route   GET /api/potential-candidates/:id
// @access  Private (Requires authentication via serviceToken)
exports.getPotentialCandidate = async (req, res, next) => {
  try {
    const candidate = await PotentialCandidate.findById(req.params.id)
      .populate('party_id', 'name symbol')
      .populate('constituency_id', 'name')
      .populate('election_year_id', 'year')
      .populate('supporter_candidates', 'name image')
      .populate('created_by', 'username email')
      .populate('updated_by', 'username email');

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Potential candidate not found'
      });
    }

    // If userHierarchy present and user is not superAdmin, ensure requested candidate is within scope
    if (req.userHierarchy && !(req.user && req.user.role === 'superAdmin')) {
      const uh = req.userHierarchy;
      // Candidate has constituency_id -> assembly; check assembly/parliament/division/state
      const cid = candidate.constituency_id ? (candidate.constituency_id._id || candidate.constituency_id) : null;
      if (uh.assembly && uh.assembly._id && cid && String(uh.assembly._id) !== String(cid)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
      if (uh.parliament && uh.parliament._id && candidate.parliament_id && String(uh.parliament._id) !== String(candidate.parliament_id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
      if (uh.division && uh.division._id && candidate.division_id && String(uh.division._id) !== String(candidate.division_id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
      if (uh.state && uh.state._id && candidate.state_id && String(uh.state._id) !== String(candidate.state_id)) {
        return res.status(403).json({ success: false, message: 'Forbidden: outside your scope' });
      }
    }

    res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create potential candidate
// @route   POST /api/potential-candidates
// @access  Private
exports.createPotentialCandidate = async (req, res, next) => {
  try {
    // Verify all references exist
    const [
      party,
      constituency,
      electionYear,
      supporters
    ] = await Promise.all([
      Party.findById(req.body.party_id),
      Assembly.findById(req.body.constituency_id),
      ElectionYear.findById(req.body.election_year_id),
      req.body.supporter_candidates && req.body.supporter_candidates.length > 0 ?
        Candidate.find({ _id: { $in: req.body.supporter_candidates } }) :
        Promise.resolve([])
    ]);

    if (!party) return res.status(400).json({ success: false, message: 'Party not found' });
    if (!constituency) return res.status(400).json({ success: false, message: 'Constituency not found' });
    if (!electionYear) return res.status(400).json({ success: false, message: 'Election year not found' });
    if (req.body.supporter_candidates && supporters.length !== req.body.supporter_candidates.length) {
      return res.status(400).json({ success: false, message: 'One or more supporter candidates not found' });
    }

    // Set created_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const candidateData = {
      ...req.body,
      created_by: req.user.id,
      updated_by: req.user.id,
      description: req.body.description || '',
    };

    const candidate = await PotentialCandidate.create(candidateData);

    res.status(201).json({
      success: true,
      data: candidate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update potential candidate
// @route   PUT /api/potential-candidates/:id
// @access  Private
exports.updatePotentialCandidate = async (req, res, next) => {
  try {
    let candidate = await PotentialCandidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Potential candidate not found'
      });
    }

    // Verify references if being updated
    const verificationPromises = [];
    if (req.body.party_id) verificationPromises.push(Party.findById(req.body.party_id));
    if (req.body.constituency_id) verificationPromises.push(Assembly.findById(req.body.constituency_id));
    if (req.body.election_year_id) verificationPromises.push(ElectionYear.findById(req.body.election_year_id));
    if (req.body.supporter_candidates) {
      verificationPromises.push(
        Candidate.find({ _id: { $in: req.body.supporter_candidates } })
          .then(supporters => ({
            found: supporters.length,
            expected: req.body.supporter_candidates.length
          }))
      );
    }

    const verificationResults = await Promise.all(verificationPromises);

    for (const result of verificationResults) {
      if (!result || (result.found !== undefined && result.found !== result.expected)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reference ID provided'
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

    candidate = await PotentialCandidate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('party_id', 'name')
      .populate('constituency_id', 'name')
      .populate('election_year_id', 'year')
      .populate('supporter_candidates', 'name')
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

// @desc    Delete potential candidate
// @route   DELETE /api/potential-candidates/:id
// @access  Private (Admin only)
exports.deletePotentialCandidate = async (req, res, next) => {
  try {
    const candidate = await PotentialCandidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Potential candidate not found'
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

// @desc    Get potential candidates by constituency
// @route   GET /api/potential-candidates/constituency/:constituencyId
// @access  Public
exports.getPotentialCandidatesByConstituency = async (req, res, next) => {
  try {
    // Verify constituency exists
    const constituency = await Assembly.findById(req.params.constituencyId);
    if (!constituency) {
      return res.status(404).json({
        success: false,
        message: 'Constituency not found'
      });
    }

    const candidates = await PotentialCandidate.find({ constituency_id: req.params.constituencyId })
      .sort({ name: 1 })
      .populate('party_id', 'name symbol')
      .populate('election_year_id', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get potential candidates by party
// @route   GET /api/potential-candidates/party/:partyId
// @access  Public
exports.getPotentialCandidatesByParty = async (req, res, next) => {
  try {
    // Verify party exists
    const party = await Party.findById(req.params.partyId);
    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    const candidates = await PotentialCandidate.find({ party_id: req.params.partyId })
      .sort({ name: 1 })
      .populate('constituency_id', 'name')
      .populate('election_year_id', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');


    res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Import potential candidates from Excel/CSV
// @route   POST /api/potential-candidates/import
// @access  Private (Admin/SuperAdmin)
exports.importPotentialCandidates = async (req, res, next) => {
  try {
    const rows = req.body.rows || req.body.data;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No data provided. Expected array of rows.' });
    }

    const results = { imported: 0, total: rows.length, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Resolve geographic hierarchy (we need assembly/constituency)
        const geo = await resolveGeographicHierarchy(row);
        // If resolveGeographicHierarchy didn't find assembly, try common alternative keys (assembly number / constituency number / constituency_name)
        if (!geo.assembly || !geo.assembly._id) {
          // Try numeric assembly identifiers commonly used in templates
          const acCandidates = [row.AC_NO, row.ac_no, row.acno, row.assembly_no, row.assemblyNumber, row.assembly_number, row.constituency_no, row.constituency_number];
          let foundAssembly = null;
          for (const ac of acCandidates) {
            if (ac === undefined || ac === null || String(ac).trim() === '') continue;
            const acStr = String(ac).trim();
            // try numeric match first
            if (!isNaN(Number(acStr))) {
              // prefer scoped lookup if state/parliament resolved
              if (geo.parliament && geo.parliament._id) {
                foundAssembly = await Assembly.findOne({ AC_NO: acStr, parliament_id: geo.parliament._id });
              }
              if (!foundAssembly && geo.state && geo.state._id) {
                foundAssembly = await Assembly.findOne({ AC_NO: acStr, state_id: geo.state._id });
              }
              if (!foundAssembly) {
                foundAssembly = await Assembly.findOne({ AC_NO: acStr });
              }
            }
            if (foundAssembly) break;
          }

          // Try constituency_name / constituency if provided (name match)
          if (!foundAssembly) {
            const cname = row.constituency_name || row.constituency || row.constituencyName || row.constituency_name;
            if (cname) {
              foundAssembly = await Assembly.findOne({ name: { $regex: `^${String(cname).trim()}$`, $options: 'i' } });
            }
          }

          if (foundAssembly) {
            geo.assembly = foundAssembly;
          }

          if (!geo.assembly || !geo.assembly._id) {
            results.errors.push({ row: i + 1, data: row, error: 'Constituency/Assembly not found (try providing AC_NO or constituency_no)' });
            continue;
          }
        }

        // Resolve party
        let party = null;
        if (row.party_id) party = await Party.findById(row.party_id);
        if (!party && row.party) party = await Party.findOne({ name: { $regex: `^${String(row.party).trim()}$`, $options: 'i' } });
        if (!party && row.party_name) party = await Party.findOne({ name: { $regex: `^${String(row.party_name).trim()}$`, $options: 'i' } });
        if (!party) {
          results.errors.push({ row: i + 1, data: row, error: 'Party not found' });
          continue;
        }

        // Resolve election year
        let electionYear = null;
        if (row.election_year_id) electionYear = await ElectionYear.findById(row.election_year_id);
        if (!electionYear && row.election_year) {
          electionYear = await ElectionYear.findOne({ year: Number(row.election_year) });
        }
        if (!electionYear) {
          results.errors.push({ row: i + 1, data: row, error: 'Election year not found' });
          continue;
        }

        // Supporter candidates validation (optional)
        let supporterCandidates = [];
        if (row.supporter_candidates) {
          const ids = Array.isArray(row.supporter_candidates) ? row.supporter_candidates : String(row.supporter_candidates).split(',').map(s => s.trim()).filter(Boolean);
          if (ids.length) {
            const found = await Candidate.find({ _id: { $in: ids } });
            if (found.length !== ids.length) {
              results.errors.push({ row: i + 1, data: row, error: 'One or more supporter candidate IDs not found' });
              continue;
            }
            supporterCandidates = ids;
          }
        }

        // Build and normalize potential candidate payload
        const getVal = (keys) => {
          for (const k of keys) {
            if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') return row[k];
          }
          return undefined;
        };

        const postName = getVal(['postname','postName','post','post_name']);
        const postPlace = getVal(['place','post_place','postPlace']);
        const fromDateRaw = getVal(['from_date','fromDate','post_from','postFrom']);
        const toDateRaw = getVal(['to_date','toDate','post_to','postTo']);
        const parseDate = (d) => {
          if (d === undefined || d === null || String(d).trim() === '') return undefined;
          const dt = new Date(d);
          if (isNaN(dt.getTime())) return undefined;
          return dt;
        };

        const postDetails = row.post_details || row.postDetails || (postName ? {
          postname: postName,
          place: postPlace || '',
          from_date: parseDate(fromDateRaw),
          to_date: parseDate(toDateRaw)
        } : undefined);

        // Ensure required post_details fields are present
        if (!postDetails || !postDetails.place || !postDetails.from_date || !postDetails.to_date) {
          results.errors.push({ row: i + 1, data: row, error: 'post_details missing required fields: place/from_date/to_date' });
          continue;
        }

        // Normalize status to allowed enum values: active, inactive, under_review
        const rawStatus = getVal(['status']);
        let statusNorm = 'under_review';
        if (rawStatus) {
          const s = String(rawStatus).toLowerCase().trim();
          if (s.startsWith('act')) statusNorm = 'active';
          else if (s.startsWith('inac') || s === 'inactive') statusNorm = 'inactive';
          else if (s.includes('under') || s.includes('review')) statusNorm = 'under_review';
        }

        // Validate image URL (if present), otherwise omit
        let imageVal = getVal(['image','Image']);
        if (imageVal) {
          try {
            const u = new URL(String(imageVal).trim());
            imageVal = u.href;
          } catch (e) {
            imageVal = undefined;
          }
        } else {
          imageVal = undefined;
        }

        const payload = {
          name: getVal(['name','Name']),
          party_id: party._id,
          constituency_id: geo.assembly._id,
          election_year_id: electionYear._id,
          history: getVal(['history','History']) || '',
          post_details: postDetails,
          pros: getVal(['pros']) || '',
          cons: getVal(['cons']) || '',
          supporter_candidates: supporterCandidates,
          ...(imageVal ? { image: imageVal } : {}),
          status: statusNorm,
          description: getVal(['description']) || '' ,
          created_by: req.user ? (req.user.id || req.user._id) : undefined,
          updated_by: req.user ? (req.user.id || req.user._id) : undefined
        };

        const created = await PotentialCandidate.create(payload);
        results.imported++;
      } catch (err) {
        results.errors.push({ row: i + 1, data: row, error: err.message || 'Failed to import' });
      }
    }

    res.status(200).json({ success: true, imported: results.imported, total: results.total, errors: results.errors });
  } catch (err) {
    next(err);
  }
};