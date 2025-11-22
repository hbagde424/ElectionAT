const mongoose = require('mongoose');
const Booth = require('../models/booth');
const Block = require('../models/block');
const Assembly = require('../models/Assembly');
const Parliament = require('../models/Parliament');
const Division = require('../models/Division');
const State = require('../models/state');
const ElectionYear = require('../models/electionYear');

// Helper to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Get all booths
// @route   GET /api/booths
// @access  Private (Requires authentication via serviceToken)
exports.getBooths = async (req, res, next) => {
  try {
    // Pagination
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit);
    // If searching, ignore pagination and return all results (set high limit)
    const isSearching = !!req.query.search;
    if (isSearching) {
      limit = 10000;
      page = 1;
    } else {
      if (!limit || limit <= 0) {
        limit = 10000;
      }
    }
    const skip = (page - 1) * limit;

    // Enhanced search functionality: search across all table fields including populated references
    let matchStage = {};
    if (req.query.search) {
      const searchTerm = req.query.search.trim();

      // Skip if search term is empty
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Search term cannot be empty'
        });
      }

  const searchRegex = { $regex: searchTerm, $options: 'i' };
  // If searchTerm is numeric, also add direct numeric match to booth_number
  const numericSearch = !isNaN(searchTerm) ? parseInt(searchTerm) : null;

      try {
        // First, find related IDs from referenced collections that match the search
        const searchPromises = [
          Block.find({ name: searchRegex }).select('_id').catch(() => []),
          Assembly.find({ name: searchRegex }).select('_id').catch(() => []),
          Parliament.find({ name: searchRegex }).select('_id').catch(() => []),
          Division.find({ name: searchRegex }).select('_id').catch(() => []),
          State.find({ name: searchRegex }).select('_id').catch(() => [])
        ];

        // Add election year search only if search term is numeric
        if (!isNaN(searchTerm)) {
          searchPromises.push(
            ElectionYear.find({ year: parseInt(searchTerm) }).select('_id').catch(() => [])
          );
        }

        const searchResults = await Promise.all(searchPromises);
        const [matchingBlocks, matchingAssemblies, matchingParliaments,
          matchingDivisions, matchingStates, matchingElectionYears = []] = searchResults;

        // Extract just the IDs
        const blockIds = matchingBlocks.map(b => b._id);
        const assemblyIds = matchingAssemblies.map(a => a._id);
        const parliamentIds = matchingParliaments.map(p => p._id);
        const divisionIds = matchingDivisions.map(d => d._id);
        const stateIds = matchingStates.map(s => s._id);
        const electionYearIds = matchingElectionYears.map(y => y._id);

        // Build OR clauses; include numeric booth_number match when applicable
        const orClauses = [
          { name: searchRegex },
          { booth_number: searchRegex },
          { full_address: searchRegex },
          { description: searchRegex }
        ];
        if (numericSearch !== null) {
          // match numeric field equality as well as string regex
          orClauses.push({ booth_number: numericSearch });
        }
        if (blockIds.length > 0) orClauses.push({ block_id: { $in: blockIds } });
        if (assemblyIds.length > 0) orClauses.push({ assembly_id: { $in: assemblyIds } });
        if (parliamentIds.length > 0) orClauses.push({ parliament_id: { $in: parliamentIds } });
        if (divisionIds.length > 0) orClauses.push({ division_id: { $in: divisionIds } });
        if (stateIds.length > 0) orClauses.push({ state_id: { $in: stateIds } });
        if (electionYearIds.length > 0) orClauses.push({ election_year: { $in: electionYearIds } });

        matchStage = { $or: orClauses };
      } catch (error) {
        console.error('Search error:', error);
        // If search fails, fall back to basic search
        matchStage = {
          $or: [
            { name: searchRegex },
            { booth_number: searchRegex },
            { full_address: searchRegex },
            { description: searchRegex }
          ]
        };
      }
    }


    // Build the aggregation pipeline
    const aggregationPipeline = [
      { $match: matchStage },
      // Filter by block
      ...(req.query.block && isValidObjectId(req.query.block) ? [{ $match: { block_id: new mongoose.Types.ObjectId(req.query.block) } }] : []),
      // Filter by assembly
      ...(req.query.assembly && isValidObjectId(req.query.assembly) ? [{ $match: { assembly_id: new mongoose.Types.ObjectId(req.query.assembly) } }] : []),
      // Filter by parliament
      ...(req.query.parliament && isValidObjectId(req.query.parliament) ? [{ $match: { parliament_id: new mongoose.Types.ObjectId(req.query.parliament) } }] : []),
      // Filter by division
      ...(req.query.division && isValidObjectId(req.query.division) ? [
        { $match: { division_id: new mongoose.Types.ObjectId(req.query.division) } }
      ] : []),
      // Filter by state
      ...(req.query.state && isValidObjectId(req.query.state) ? [{ $match: { state_id: new mongoose.Types.ObjectId(req.query.state) } }] : []),
      // Filter by election year
      ...(req.query.election_year && isValidObjectId(req.query.election_year) ? [{ $match: { election_year: new mongoose.Types.ObjectId(req.query.election_year) } }] : []),
      // Lookup all references
      {
        $lookup: {
          from: 'blocks',
          localField: 'block_id',
          foreignField: '_id',
          as: 'block_id'
        }
      },
      { $unwind: { path: '$block_id', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'assemblies',
          localField: 'assembly_id',
          foreignField: '_id',
          as: 'assembly_id'
        }
      },
      { $unwind: { path: '$assembly_id', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'parliaments',
          localField: 'parliament_id',
          foreignField: '_id',
          as: 'parliament_id'
        }
      },
      { $unwind: { path: '$parliament_id', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'divisions',
          localField: 'division_id',
          foreignField: '_id',
          as: 'division_id'
        }
      },
      { $unwind: { path: '$division_id', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'states',
          localField: 'state_id',
          foreignField: '_id',
          as: 'state_id'
        }
      },
      { $unwind: { path: '$state_id', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'electionyears',
          localField: 'election_year',
          foreignField: '_id',
          as: 'election_year'
        }
      },
      { $unwind: { path: '$election_year', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'created_by',
          foreignField: '_id',
          as: 'created_by'
        }
      },
      { $unwind: { path: '$created_by', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'updated_by',
          foreignField: '_id',
          as: 'updated_by'
        }
      },
      { $unwind: { path: '$updated_by', preserveNullAndEmptyArrays: true } }
    ];

    // Apply user hierarchy restriction when an authenticated user is present
    // Precedence: booth -> block -> assembly -> parliament -> division -> state
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      // Extract IDs from populated objects or direct ID values
      const boothId = h.booth?._id || h.booth;
      const blockId = h.block?._id || h.block;
      const assemblyId = h.assembly?._id || h.assembly;
      const parliamentId = h.parliament?._id || h.parliament;
      const divisionId = h.division?._id || h.division;
      const stateId = h.state?._id || h.state;

      if (boothId) {
        aggregationPipeline.push({ $match: { _id: new mongoose.Types.ObjectId(boothId) } });
      } else if (blockId) {
        aggregationPipeline.push({ $match: { block_id: new mongoose.Types.ObjectId(blockId) } });
      } else if (assemblyId) {
        aggregationPipeline.push({ $match: { assembly_id: new mongoose.Types.ObjectId(assemblyId) } });
      } else if (parliamentId) {
        aggregationPipeline.push({ $match: { parliament_id: new mongoose.Types.ObjectId(parliamentId) } });
      } else if (divisionId) {
        aggregationPipeline.push({ $match: { division_id: new mongoose.Types.ObjectId(divisionId) } });
      } else if (stateId) {
        aggregationPipeline.push({ $match: { state_id: new mongoose.Types.ObjectId(stateId) } });
      }
    }

    // Sort and paginate
    aggregationPipeline.push(
      { $sort: { booth_number: 1 } },
      { $skip: skip },
      { $limit: limit }
    );

    // Execute aggregation
    const booths = await Booth.aggregate(aggregationPipeline);

    // Get total count for pagination
    const countPipeline = [
      { $match: matchStage },
      // Filter by block
      ...(req.query.block && isValidObjectId(req.query.block) ? [{ $match: { block_id: new mongoose.Types.ObjectId(req.query.block) } }] : []),
      // Filter by assembly
      ...(req.query.assembly && isValidObjectId(req.query.assembly) ? [{ $match: { assembly_id: new mongoose.Types.ObjectId(req.query.assembly) } }] : []),
      // Filter by parliament
      ...(req.query.parliament && isValidObjectId(req.query.parliament) ? [{ $match: { parliament_id: new mongoose.Types.ObjectId(req.query.parliament) } }] : []),
      // Filter by division
      ...(req.query.division && isValidObjectId(req.query.division) ? [
        { $match: { division_id: new mongoose.Types.ObjectId(req.query.division) } }
      ] : []),
      // Filter by state
      ...(req.query.state && isValidObjectId(req.query.state) ? [{ $match: { state_id: new mongoose.Types.ObjectId(req.query.state) } }] : []),
      // Filter by election year
      ...(req.query.election_year && isValidObjectId(req.query.election_year) ? [{ $match: { election_year: new mongoose.Types.ObjectId(req.query.election_year) } }] : [])
    ];

    // Apply user hierarchy restriction for count pipeline as well
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      // Extract IDs from populated objects or direct ID values
      const boothId = h.booth?._id || h.booth;
      const blockId = h.block?._id || h.block;
      const assemblyId = h.assembly?._id || h.assembly;
      const parliamentId = h.parliament?._id || h.parliament;
      const divisionId = h.division?._id || h.division;
      const stateId = h.state?._id || h.state;

      if (boothId) {
        countPipeline.push({ $match: { _id: new mongoose.Types.ObjectId(boothId) } });
      } else if (blockId) {
        countPipeline.push({ $match: { block_id: new mongoose.Types.ObjectId(blockId) } });
      } else if (assemblyId) {
        countPipeline.push({ $match: { assembly_id: new mongoose.Types.ObjectId(assemblyId) } });
      } else if (parliamentId) {
        countPipeline.push({ $match: { parliament_id: new mongoose.Types.ObjectId(parliamentId) } });
      } else if (divisionId) {
        countPipeline.push({ $match: { division_id: new mongoose.Types.ObjectId(divisionId) } });
      } else if (stateId) {
        countPipeline.push({ $match: { state_id: new mongoose.Types.ObjectId(stateId) } });
      }
    }

    countPipeline.push({ $count: "total" });

    const totalResult = await Booth.aggregate(countPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    res.status(200).json({
      success: true,
      count: booths.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: booths
    });
  } catch (err) {
    next(err);
  }
};

// The rest of your controller methods remain the same...
// @desc    Get single booth
// @route   GET /api/booths/:id
// @access  Private (Requires authentication via serviceToken)
exports.getBooth = async (req, res, next) => {
  try {
    // Validate ObjectId
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booth ID format'
      });
    }

    const booth = await Booth.findById(req.params.id)
      .populate('block_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('election_year', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    // Enforce user hierarchy: only allow access if booth is within user's scope
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      // Extract IDs from populated objects or direct ID values
      const boothId = h.booth?._id || h.booth;
      const blockId = h.block?._id || h.block;
      const assemblyId = h.assembly?._id || h.assembly;
      const parliamentId = h.parliament?._id || h.parliament;
      const divisionId = h.division?._id || h.division;
      const stateId = h.state?._id || h.state;

      const outOfScope = (boothId && booth._id.toString() !== boothId.toString()) ||
        (blockId && booth.block_id && booth.block_id.toString() !== blockId.toString()) ||
        (assemblyId && booth.assembly_id && booth.assembly_id.toString() !== assemblyId.toString()) ||
        (parliamentId && booth.parliament_id && booth.parliament_id.toString() !== parliamentId.toString()) ||
        (divisionId && booth.division_id && booth.division_id.toString() !== divisionId.toString()) ||
        (stateId && booth.state_id && booth.state_id.toString() !== stateId.toString());

      if (outOfScope) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
    }

    res.status(200).json({
      success: true,
      data: booth
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create booth
// @route   POST /api/booths
// @access  Private (Admin only)
exports.createBooth = async (req, res, next) => {
  try {
    // Verify all references exist
    const [
      block,
      assembly,
      parliament,
      division,
      state,
      electionYear
    ] = await Promise.all([
      Block.findById(req.body.block_id),
      Assembly.findById(req.body.assembly_id),
      Parliament.findById(req.body.parliament_id),
      Division.findById(req.body.division_id),
      State.findById(req.body.state_id),
      ElectionYear.findById(req.body.election_year)
    ]);

    if (!block) {
      return res.status(400).json({ success: false, message: 'Block not found' });
    }
    if (!assembly) {
      return res.status(400).json({ success: false, message: 'Assembly not found' });
    }
    if (!parliament) {
      return res.status(400).json({ success: false, message: 'Parliament not found' });
    }
    if (!division) {
      return res.status(400).json({ success: false, message: 'Division not found' });
    }
    if (!state) {
      return res.status(400).json({ success: false, message: 'State not found' });
    }
    if (!electionYear) {
      return res.status(400).json({ success: false, message: 'Election year not found' });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const boothData = {
      ...req.body,
      created_by: req.user.id,
      description: req.body.description || '',

    };

    const booth = await Booth.create(boothData);

    res.status(201).json({
      success: true,
      data: booth
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Booth with this number already exists'
      });
    }
    next(err);
  }
};

// @desc    Update booth
// @route   PUT /api/booths/:id
// @access  Private (Admin only)
exports.updateBooth = async (req, res, next) => {
  try {
    // Validate ObjectId
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booth ID format'
      });
    }

    let booth = await Booth.findById(req.params.id);

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.block_id) verificationPromises.push(Block.findById(req.body.block_id));
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));
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
    req.body.updated_at = new Date();
    req.body.description = req.body.description || '';


    booth = await Booth.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('block_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('election_year', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: booth
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Booth with this number already exists'
      });
    }
    next(err);
  }
};

// @desc    Delete booth
// @route   DELETE /api/booths/:id
// @access  Private (Admin only)
exports.deleteBooth = async (req, res, next) => {
  try {
    // Validate ObjectId
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booth ID format'
      });
    }

    const booth = await Booth.findById(req.params.id);

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    await booth.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get booths by assembly
// @route   GET /api/booths/assembly/:assemblyId
// @access  Private (Requires authentication via serviceToken)
exports.getBoothsByAssembly = async (req, res, next) => {
  try {
    // Validate ObjectId
    if (!isValidObjectId(req.params.assemblyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assembly ID format'
      });
    }

    // Verify assembly exists
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    // Enforce user hierarchy for assembly-scoped listing
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      // Extract IDs from populated objects or direct ID values
      const boothId = h.booth?._id || h.booth;
      const blockId = h.block?._id || h.block;
      const assemblyId = h.assembly?._id || h.assembly;
      const parliamentId = h.parliament?._id || h.parliament;
      const divisionId = h.division?._id || h.division;
      const stateId = h.state?._id || h.state;

      // If user's scope is narrower than the requested assembly and doesn't match, forbid
      if (assemblyId && assemblyId.toString() !== req.params.assemblyId) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
      // If user has booth or block level access, ensure the assembly matches
      if (boothId || blockId) {
        const testBooth = await Booth.findOne({ assembly_id: req.params.assemblyId });
        if (testBooth) {
          if (boothId && testBooth._id.toString() !== boothId.toString()) {
            return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
          }
          if (blockId && testBooth.block_id.toString() !== blockId.toString()) {
            return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
          }
        }
      }
    }

    const booths = await Booth.find({ assembly_id: req.params.assemblyId })
      .sort({ booth_number: 1 })
      .populate('block_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .populate('election_year', 'year');

    res.status(200).json({
      success: true,
      count: booths.length,
      data: booths
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get booths by block
// @route   GET /api/booths/block/:blockId
// @access  Private (Requires authentication via serviceToken)
exports.getBoothsByBlock = async (req, res, next) => {
  try {
    // Validate ObjectId
    if (!isValidObjectId(req.params.blockId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid block ID format'
      });
    }

    // Verify block exists
    const block = await Block.findById(req.params.blockId);
    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    const booths = await Booth.find({ block_id: req.params.blockId })
      .sort({ booth_number: 1 })
      .populate('assembly_id', 'name')
      .populate('created_by', 'username')
      .populate('election_year', 'year');

    res.status(200).json({
      success: true,
      count: booths.length,
      data: booths
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get booths by election year
// @route   GET /api/booths/year/:yearId
// @access  Private (Requires authentication via serviceToken)
exports.getBoothsByYear = async (req, res, next) => {
  try {
    // Validate ObjectId
    if (!isValidObjectId(req.params.yearId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid election year ID format'
      });
    }

    // Verify election year exists
    const year = await ElectionYear.findById(req.params.yearId);
    if (!year) {
      return res.status(404).json({
        success: false,
        message: 'Election year not found'
      });
    }

    const booths = await Booth.find({ election_year: req.params.yearId })
      .sort({ booth_number: 1 })
      .populate('block_id', 'name')
      .populate('assembly_id', 'name')
      .populate('created_by', 'username')
      .populate('election_year', 'year');

    res.status(200).json({
      success: true,
      count: booths.length,
      data: booths
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Import booths from Excel
// @route   POST /api/booths/import
// @access  Private/SuperAdmin
exports.importBooths = async (req, res, next) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No data provided' });
    }

    const { resolveGeographicHierarchy, validateHierarchy } = require('./importHelpers');
    const summary = { total: rows.length, created: 0, skipped: 0, errors: [], ids: [] };
    const created = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.name || !row.booth_number || !row.full_address) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: 'Missing name, booth_number, or full_address' });
          continue;
        }

        const geo = await resolveGeographicHierarchy(row);
        const missingFields = validateHierarchy(geo, ['state', 'division', 'parliament', 'assembly', 'block']);
        if (missingFields.length > 0) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: `Missing: ${missingFields.join(', ')}` });
          continue;
        }

        // Resolve election year from common variants (id, numeric year, or name)
        let electionYearDoc = null;
        const eyVal = row.election_year ?? row.year ?? row.electionYear ?? row.election ?? row.election_year_id ?? row.year_id;
        if (eyVal !== undefined && eyVal !== null && String(eyVal).trim() !== '') {
          const eyRaw = String(eyVal).trim();
          const isObjectId = /^[a-fA-F0-9]{24}$/.test(eyRaw);
          if (isObjectId) {
            electionYearDoc = await ElectionYear.findById(eyRaw);
          }
          if (!electionYearDoc && !isNaN(Number(eyRaw))) {
            electionYearDoc = await ElectionYear.findOne({ year: Number(eyRaw) });
          }
          if (!electionYearDoc) {
            electionYearDoc = await ElectionYear.findOne({ name: { $regex: `^${eyRaw}$`, $options: 'i' } });
          }
        }

        if (!electionYearDoc) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: 'Missing: election_year not found' });
          continue;
        }

        // Check for duplicates
        const existing = await Booth.findOne({ 
          booth_number: row.booth_number,
          assembly_id: geo.assembly._id 
        });
        if (existing) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: `Booth number ${row.booth_number} already exists in this assembly` });
          continue;
        }

        const boothData = {
          name: row.name,
          booth_number: row.booth_number,
          full_address: row.full_address,
          latitude: row.latitude || null,
          longitude: row.longitude || null,
          block_id: geo.block._id,
          assembly_id: geo.assembly._id,
          parliament_id: geo.parliament._id,
          division_id: geo.division._id,
          state_id: geo.state._id,
          election_year: electionYearDoc._id,
          // Map gender/count fields from common variants (normalized keys from frontend are lowercase_with_underscores)
          Male_Count: Number(row.male_count ?? row.Male_Count ?? row.MaleCount ?? row.male ?? 0) || 0,
          Female_Count: Number(row.female_count ?? row.Female_Count ?? row.FemaleCount ?? row.female ?? 0) || 0,
          others_Count: Number(row.others_count ?? row.others_Count ?? row.othersCount ?? row.others ?? 0) || 0,
          Total: Number(row.total ?? row.Total ?? row.TotalCount ?? ((Number(row.male_count ?? row.Male_Count ?? 0) || 0) + (Number(row.female_count ?? row.Female_Count ?? 0) || 0) + (Number(row.others_count ?? row.others_Count ?? 0) || 0))) || 0,
          created_by: req.user.id,
          updated_by: req.user.id
        };

        const booth = await Booth.create(boothData);
        created.push(booth._id);
        summary.created += 1;
      } catch (err) {
        summary.skipped += 1;
        summary.errors.push({ row: i + 1, message: err?.message || String(err) });
      }
    }

    return res.status(200).json({ success: true, ...summary, ids: created });
  } catch (err) {
    next(err);
  }
};