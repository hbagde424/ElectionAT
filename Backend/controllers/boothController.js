const mongoose = require('mongoose');
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
      const searchTerm = req.query.search.trim();

      // Skip if search term is empty
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Search term cannot be empty'
        });
      }

      const searchRegex = { $regex: searchTerm, $options: 'i' };

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

        matchStage = {
          $or: [
            { name: searchRegex },
            { booth_number: searchRegex },
            { full_address: searchRegex },
            { description: searchRegex },
            ...(blockIds.length > 0 ? [{ block_id: { $in: blockIds } }] : []),
            ...(assemblyIds.length > 0 ? [{ assembly_id: { $in: assemblyIds } }] : []),
            ...(parliamentIds.length > 0 ? [{ parliament_id: { $in: parliamentIds } }] : []),
            ...(divisionIds.length > 0 ? [{ division_id: { $in: divisionIds } }] : []),
            ...(stateIds.length > 0 ? [{ state_id: { $in: stateIds } }] : []),
            ...(electionYearIds.length > 0 ? [{ election_year: { $in: electionYearIds } }] : [])
          ]
        };
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

    // Helper to validate ObjectId
    const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

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
    console.log('Update request body:', req.body); // Debug log

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booth ID format'
      });
    }

    // For update operations, we only validate fields that are actually being updated
    const requiredFields = ['name', 'booth_number', 'full_address', 'block_id', 'assembly_id',
      'parliament_id', 'division_id', 'state_id', 'election_year'];

    // Only check fields that are present in the request body
    const providedFields = Object.keys(req.body);
    const invalidFields = providedFields.filter(field =>
      requiredFields.includes(field) && !req.body[field]
    );

    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid or empty fields provided: ${invalidFields.join(', ')}`
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
    const fieldsToVerify = {
      block_id: { model: Block, name: 'Block' },
      assembly_id: { model: Assembly, name: 'Assembly' },
      parliament_id: { model: Parliament, name: 'Parliament' },
      division_id: { model: Division, name: 'Division' },
      state_id: { model: State, name: 'State' },
      election_year: { model: ElectionYear, name: 'Election Year' }
    };

    // Only verify fields that are being updated
    for (const [field, { model, name }] of Object.entries(fieldsToVerify)) {
      if (req.body[field]) {
        const result = await model.findById(req.body[field]);
        if (!result) {
          return res.status(400).json({
            success: false,
            message: `${name} not found`
          });
        }
      }
    }

    // Set updated_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    // Validate booth number format if it's being updated
    if (req.body.booth_number) {
      if (!/^[A-Za-z0-9-]+$/.test(req.body.booth_number)) {
        return res.status(400).json({
          success: false,
          message: 'Booth number can only contain letters, numbers, and hyphens'
        });
      }
    }

    // Prepare the update data with proper defaults and data cleaning
    const updateData = {
      ...req.body,
      updated_by: req.user.id,
      updated_at: new Date(),
      description: req.body.description || '',
      name: req.body.name ? req.body.name.trim() : undefined,
      booth_number: req.body.booth_number ? req.body.booth_number.trim() : undefined,
      full_address: req.body.full_address ? req.body.full_address.trim() : undefined
    };

    // Remove any undefined values
    Object.keys(updateData).forEach(key =>
      updateData[key] === undefined && delete updateData[key]
    );

    try {
      console.log('Update data:', updateData); // Debug log

      // First check if the booth number already exists (if it's being updated)
      if (updateData.booth_number) {
        const existingBooth = await Booth.findOne({
          booth_number: updateData.booth_number,
          _id: { $ne: req.params.id } // exclude current booth
        });

        if (existingBooth) {
          return res.status(400).json({
            success: false,
            message: 'Booth number already exists'
          });
        }
      }

      // Ensure all ObjectId fields are valid before update
      const objectIdFields = ['block_id', 'assembly_id', 'parliament_id',
        'division_id', 'state_id', 'election_year'];

      for (const field of objectIdFields) {
        if (updateData[field] && !mongoose.Types.ObjectId.isValid(updateData[field])) {
          return res.status(400).json({
            success: false,
            message: `Invalid ${field} format`
          });
        }
      }

      booth = await Booth.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true
        }
      ).populate([
        { path: 'block_id', select: 'name' },
        { path: 'assembly_id', select: 'name' },
        { path: 'parliament_id', select: 'name' },
        { path: 'division_id', select: 'name' },
        { path: 'state_id', select: 'name' },
        { path: 'election_year', select: 'year' },
        { path: 'created_by', select: 'username' },
        { path: 'updated_by', select: 'username' }
      ]);

      if (!booth) {
        return res.status(404).json({
          success: false,
          message: 'Booth update failed'
        });
      }
    } catch (error) {
      console.error('Booth update error:', error);

      // Handle specific MongoDB errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: Object.values(error.errors).map(err => err.message)
        });
      }

      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Booth number already exists'
        });
      }

      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: `Invalid ${error.path} format`
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Failed to save booth. Please check the form data.',
        error: error.message
      });
    }

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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
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
      .populate('state_id', 'name');

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    // Check for user authorization
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete booth'
      });
    }

    try {
      await booth.deleteOne();

      res.status(200).json({
        success: true,
        message: 'Booth deleted successfully',
        data: {
          id: booth._id,
          name: booth.name,
          booth_number: booth.booth_number,
          block: booth.block_id?.name,
          assembly: booth.assembly_id?.name
        }
      });
    } catch (deleteError) {
      console.error('Error deleting booth:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete booth',
        error: deleteError.message
      });
    }
  } catch (err) {
    console.error('Error in delete booth operation:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to process delete request',
      error: err.message
    });
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