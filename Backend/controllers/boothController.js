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
// @access  Public
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
      // Use array-based IDs from User model
      const boothIds = h.booth_ids || [];
      const blockIds = h.block_ids || [];
      const assemblyIds = h.assembly_ids || [];
      const parliamentIds = h.parliament_ids || [];
      const divisionIds = h.division_ids || [];
      const stateIds = h.state_ids || [];

      if (boothIds.length > 0) {
        aggregationPipeline.push({ $match: { _id: { $in: boothIds.map(id => new mongoose.Types.ObjectId(id)) } } });
      } else if (blockIds.length > 0) {
        aggregationPipeline.push({ $match: { block_id: { $in: blockIds.map(id => new mongoose.Types.ObjectId(id)) } } });
      } else if (assemblyIds.length > 0) {
        aggregationPipeline.push({ $match: { assembly_id: { $in: assemblyIds.map(id => new mongoose.Types.ObjectId(id)) } } });
      } else if (parliamentIds.length > 0) {
        aggregationPipeline.push({ $match: { parliament_id: { $in: parliamentIds.map(id => new mongoose.Types.ObjectId(id)) } } });
      } else if (divisionIds.length > 0) {
        aggregationPipeline.push({ $match: { division_id: { $in: divisionIds.map(id => new mongoose.Types.ObjectId(id)) } } });
      } else if (stateIds.length > 0) {
        aggregationPipeline.push({ $match: { state_id: { $in: stateIds.map(id => new mongoose.Types.ObjectId(id)) } } });
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
      // Use array-based IDs from User model
      const boothIds = h.booth_ids || [];
      const blockIds = h.block_ids || [];
      const assemblyIds = h.assembly_ids || [];
      const parliamentIds = h.parliament_ids || [];
      const divisionIds = h.division_ids || [];
      const stateIds = h.state_ids || [];

      if (boothIds.length > 0) {
        countPipeline.push({ $match: { _id: { $in: boothIds.map(id => new mongoose.Types.ObjectId(id)) } } });
      } else if (blockIds.length > 0) {
        countPipeline.push({ $match: { block_id: { $in: blockIds.map(id => new mongoose.Types.ObjectId(id)) } } });
      } else if (assemblyIds.length > 0) {
        countPipeline.push({ $match: { assembly_id: { $in: assemblyIds.map(id => new mongoose.Types.ObjectId(id)) } } });
      } else if (parliamentIds.length > 0) {
        countPipeline.push({ $match: { parliament_id: { $in: parliamentIds.map(id => new mongoose.Types.ObjectId(id)) } } });
      } else if (divisionIds.length > 0) {
        countPipeline.push({ $match: { division_id: { $in: divisionIds.map(id => new mongoose.Types.ObjectId(id)) } } });
      } else if (stateIds.length > 0) {
        countPipeline.push({ $match: { state_id: { $in: stateIds.map(id => new mongoose.Types.ObjectId(id)) } } });
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
// @access  Public
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
      // Use array-based IDs from User model
      const boothIds = h.booth_ids || [];
      const blockIds = h.block_ids || [];
      const assemblyIds = h.assembly_ids || [];
      const parliamentIds = h.parliament_ids || [];
      const divisionIds = h.division_ids || [];
      const stateIds = h.state_ids || [];

      const boothIdStr = booth._id.toString();
      const blockIdStr = booth.block_id ? booth.block_id.toString() : null;
      const assemblyIdStr = booth.assembly_id ? booth.assembly_id.toString() : null;
      const parliamentIdStr = booth.parliament_id ? booth.parliament_id.toString() : null;
      const divisionIdStr = booth.division_id ? booth.division_id.toString() : null;
      const stateIdStr = booth.state_id ? booth.state_id.toString() : null;

      const outOfScope = (boothIds.length > 0 && !boothIds.some(id => id.toString() === boothIdStr)) ||
        (blockIds.length > 0 && blockIdStr && !blockIds.some(id => id.toString() === blockIdStr)) ||
        (assemblyIds.length > 0 && assemblyIdStr && !assemblyIds.some(id => id.toString() === assemblyIdStr)) ||
        (parliamentIds.length > 0 && parliamentIdStr && !parliamentIds.some(id => id.toString() === parliamentIdStr)) ||
        (divisionIds.length > 0 && divisionIdStr && !divisionIds.some(id => id.toString() === divisionIdStr)) ||
        (stateIds.length > 0 && stateIdStr && !stateIds.some(id => id.toString() === stateIdStr));

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
// @access  Public
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
      // Use array-based IDs from User model
      const assemblyIds = h.assembly_ids || [];
      const parliamentIds = h.parliament_ids || [];
      const divisionIds = h.division_ids || [];
      const stateIds = h.state_ids || [];

      // Check if requested assembly is within user's scope
      const requestedAssemblyId = req.params.assemblyId;
      const hasAccess = (assemblyIds.length === 0 || assemblyIds.some(id => id.toString() === requestedAssemblyId)) &&
                       (parliamentIds.length === 0 || assembly.parliament_id && parliamentIds.some(id => id.toString() === assembly.parliament_id.toString())) &&
                       (divisionIds.length === 0 || assembly.division_id && divisionIds.some(id => id.toString() === assembly.division_id.toString())) &&
                       (stateIds.length === 0 || assembly.state_id && stateIds.some(id => id.toString() === assembly.state_id.toString()));

      if (!hasAccess) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
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
// @access  Public
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
// @access  Public
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