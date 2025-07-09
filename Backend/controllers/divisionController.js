const Division = require('../models/division');
const State = require('../models/state');
const User = require('../models/User'); // Make sure to import your User model
const ErrorResponse = require('../utils/errorResponse');

// Helper function for consistent population
const populateDivision = (query) => {
  return query
    .populate({
      path: 'state_id',
      select: 'name'
    })
    .populate({
      path: 'created_by',
      select: 'name username email', // Include all fields you want
      model: 'User' // Explicit model reference
    })
    .populate({
      path: 'updated_by',
      select: 'name username email',
      model: 'User'
    });
};

// @desc    Get all divisions
// @route   GET /api/divisions
// @access  Public
exports.getDivisions = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = Division.find();
    query = populateDivision(query);
    query = query.sort({ name: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { division_code: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Filter by state
    if (req.query.state) {
      query = query.where('state_id').equals(req.query.state);
    }

    const divisions = await query.skip(skip).limit(limit).exec();
    const total = await Division.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: divisions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: divisions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single division
// @route   GET /api/divisions/:id
// @access  Public
exports.getDivision = async (req, res, next) => {
  try {
    let query = Division.findById(req.params.id);
    query = populateDivision(query);
    const division = await query.exec();

    if (!division) {
      return next(new ErrorResponse(`Division not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: division
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create division
// @route   POST /api/divisions
// @access  Private (Admin only)
exports.createDivision = async (req, res, next) => {
  try {
    // Verify state exists
    const state = await State.findById(req.body.state_id);
    if (!state) {
      return next(new ErrorResponse('State not found', 404));
    }

    // Check if division code is already taken
    const isCodeTaken = await Division.isDivisionCodeTaken(req.body.division_code);
    if (isCodeTaken) {
      return next(new ErrorResponse('Division code already in use', 400));
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return next(new ErrorResponse('Not authorized - user not identified', 401));
    }

    const divisionData = {
      ...req.body,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    const division = await Division.create(divisionData);
    const populatedDivision = await populateDivision(Division.findById(division._id));

    res.status(201).json({
      success: true,
      data: populatedDivision
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update division
// @route   PUT /api/divisions/:id
// @access  Private (Admin only)
exports.updateDivision = async (req, res, next) => {
  try {
    // Verify division exists
    let division = await Division.findById(req.params.id);
    if (!division) {
      return next(new ErrorResponse(`Division not found with id of ${req.params.id}`, 404));
    }

    // Verify state exists if being updated
    if (req.body.state_id) {
      const state = await State.findById(req.body.state_id);
      if (!state) {
        return next(new ErrorResponse('State not found', 404));
      }
    }

    // Check if division code is already taken (excluding current division)
    if (req.body.division_code) {
      const isCodeTaken = await Division.isDivisionCodeTaken(req.body.division_code, req.params.id);
      if (isCodeTaken) {
        return next(new ErrorResponse('Division code already in use', 400));
      }
    }

    // Set updated_by to current user
    if (req.user && req.user.id) {
      req.body.updated_by = req.user.id;
    }

    division = await Division.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    const populatedDivision = await populateDivision(Division.findById(division._id));

    res.status(200).json({
      success: true,
      data: populatedDivision
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete division
// @route   DELETE /api/divisions/:id
// @access  Private (Admin only)
exports.deleteDivision = async (req, res, next) => {
  try {
    const division = await Division.findById(req.params.id);

    if (!division) {
      return next(new ErrorResponse(`Division not found with id of ${req.params.id}`, 404));
    }

    await division.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get divisions by state
// @route   GET /api/divisions/state/:stateId
// @access  Public
exports.getDivisionsByState = async (req, res, next) => {
  try {
    // Verify state exists
    const state = await State.findById(req.params.stateId);
    if (!state) {
      return next(new ErrorResponse('State not found', 404));
    }

    let query = Division.find({ state_id: req.params.stateId }).sort({ name: 1 });
    query = populateDivision(query);
    const divisions = await query.exec();

    res.status(200).json({
      success: true,
      count: divisions.length,
      data: divisions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Debug endpoint for population issues
// @route   GET /api/divisions/:id/debug
// @access  Private (Admin only)
exports.debugDivision = async (req, res, next) => {
  try {
    const division = await Division.findById(req.params.id);
    
    if (!division) {
      return next(new ErrorResponse('Division not found', 404));
    }

    // Check if referenced users exist
    const createdUser = await User.findById(division.created_by);
    const updatedUser = await User.findById(division.updated_by || division.created_by);

    // Test population
    const testPopulated = await populateDivision(Division.findById(req.params.id));

    res.status(200).json({
      success: true,
      division_exists: !!division,
      created_user_exists: !!createdUser,
      updated_user_exists: !!updatedUser,
      created_user: createdUser,
      updated_user: updatedUser,
      populated_data: testPopulated
    });
  } catch (err) {
    next(err);
  }
};