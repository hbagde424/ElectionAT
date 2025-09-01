const Booth = require('../models/booth');
const Block = require('../models/block');
const Assembly = require('../models/Assembly');
const Parliament = require('../models/Parliament');
const Division = require('../models/Division');
const State = require('../models/state');
const ElectionYear = require('../models/electionYear');

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
      const searchRegex = { $regex: req.query.search, $options: 'i' };

      // First, find related IDs from referenced collections that match the search
      const [matchingBlocks, matchingAssemblies, matchingParliaments,
        matchingDivisions, matchingStates, matchingElectionYears] = await Promise.all([
          Block.find({ name: searchRegex }).select('_id'),
          Assembly.find({ name: searchRegex }).select('_id'),
          Parliament.find({ name: searchRegex }).select('_id'),
          Division.find({ name: searchRegex }).select('_id'),
          State.find({ name: searchRegex }).select('_id'),
          ElectionYear.find({ year: searchRegex }).select('_id')
        ]);

      // Extract just the IDs
      const blockIds = matchingBlocks.map(b => b._id);
      const assemblyIds = matchingAssemblies.map(a => a._id);
      const parliamentIds = matchingParliaments.map(p => p._id);
      const divisionIds = matchingDivisions.map(d => d._id);
      const stateIds = matchingStates.map(s => s._id);
      const electionYearIds = matchingElectionYears.map(y => y._id);

      matchStage = {
        $or: [
          { name: searchRegex },
          { booth_number: searchRegex },
          { full_address: searchRegex },
          { description: searchRegex },
          { block_id: { $in: blockIds } },
          { assembly_id: { $in: assemblyIds } },
          { parliament_id: { $in: parliamentIds } },
          { division_id: { $in: divisionIds } },
          { state_id: { $in: stateIds } },
          { election_year: { $in: electionYearIds } }
        ]
      };
    }

    // Helper to validate ObjectId
    const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

    // Build the aggregation pipeline
    const aggregationPipeline = [
      { $match: matchStage },
      // Filter by block
      ...(req.query.block && isValidObjectId(req.query.block) ? [{ $match: { block_id: mongoose.Types.ObjectId(req.query.block) } }] : []),
      // Filter by assembly
      ...(req.query.assembly && isValidObjectId(req.query.assembly) ? [{ $match: { assembly_id: mongoose.Types.ObjectId(req.query.assembly) } }] : []),
      // Filter by parliament
      ...(req.query.parliament && isValidObjectId(req.query.parliament) ? [{ $match: { parliament_id: mongoose.Types.ObjectId(req.query.parliament) } }] : []),
      // Filter by division
      ...(req.query.division && isValidObjectId(req.query.division) ? [
        { $match: { division_id: mongoose.Types.ObjectId(req.query.division) } }
      ] : []),
      // Filter by state
      ...(req.query.state && isValidObjectId(req.query.state) ? [{ $match: { state_id: mongoose.Types.ObjectId(req.query.state) } }] : []),
      // Filter by election year
      ...(req.query.election_year && isValidObjectId(req.query.election_year) ? [{ $match: { election_year: mongoose.Types.ObjectId(req.query.election_year) } }] : []),
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
      { $unwind: { path: '$updated_by', preserveNullAndEmptyArrays: true } },
      // Sort and paginate
      { $sort: { booth_number: 1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    // Execute aggregation
    const booths = await Booth.aggregate(aggregationPipeline);

    // Get total count for pagination
    const countPipeline = [
      { $match: matchStage },
      // Filter by block
      ...(req.query.block ? [{ $match: { block_id: mongoose.Types.ObjectId(req.query.block) } }] : []),
      // Filter by assembly
      ...(req.query.assembly ? [{ $match: { assembly_id: mongoose.Types.ObjectId(req.query.assembly) } }] : []),
      // Filter by parliament
      ...(req.query.parliament ? [{ $match: { parliament_id: mongoose.Types.ObjectId(req.query.parliament) } }] : []),
      // Filter by division
      ...(req.query.division ? [
        (() => {
          const isObjectId = /^[a-f\d]{24}$/i.test(req.query.division);
          if (isObjectId) {
            return { $match: { division_id: mongoose.Types.ObjectId(req.query.division) } };
          } else {
            // Will be replaced below after async lookup
            return null;
          }
        })()
      ].filter(Boolean) : []),
      // Filter by state
      ...(req.query.state ? [{ $match: { state_id: mongoose.Types.ObjectId(req.query.state) } }] : []),
      // Filter by election year
      ...(req.query.election_year ? [{ $match: { election_year: mongoose.Types.ObjectId(req.query.election_year) } }] : []),
      { $count: "total" }
    ];

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
    // Verify assembly exists
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
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