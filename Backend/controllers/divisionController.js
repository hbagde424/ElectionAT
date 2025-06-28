const Division = require('../models/division');
const State = require('../models/state');

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
    let query = Division.find()
      .populate('state_id', 'name')
      .populate('created_by', 'name')
      .sort({ name: 1 });

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
    const division = await Division.findById(req.params.id)
      .populate('state_id', 'name')
      .populate('created_by', 'name');

    if (!division) {
      return res.status(404).json({
        success: false,
        message: 'Division not found'
      });
    }

    res.status(200).json({
      success: true,
      data: division
    });
  } catch (err) {
    next(err);
  }
};

// controllers/divisionController.js

// @desc    Create division
// @route   POST /api/divisions
// @access  Private (Admin only)
exports.createDivision = async (req, res, next) => {
  try {
    // Verify state exists
    const state = await State.findById(req.body.state_id);
    if (!state) {
      return res.status(400).json({
        success: false,
        message: 'State not found'
      });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const divisionData = {
      ...req.body,
      created_by: req.user.id // Set creator from authenticated user
    };

    const division = await Division.create(divisionData);

    res.status(201).json({
      success: true,
      data: division
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
    let division = await Division.findById(req.params.id);

    if (!division) {
      return res.status(404).json({
        success: false,
        message: 'Division not found'
      });
    }

    // Verify state exists if being updated
    if (req.body.state_id) {
      const state = await State.findById(req.body.state_id);
      if (!state) {
        return res.status(400).json({
          success: false,
          message: 'State not found'
        });
      }
    }

    division = await Division.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('state_id', 'name');

    res.status(200).json({
      success: true,
      data: division
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
      return res.status(404).json({
        success: false,
        message: 'Division not found'
      });
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
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    const divisions = await Division.find({ state_id: req.params.stateId })
      .sort({ name: 1 })
      .populate('created_by', 'name');

    res.status(200).json({
      success: true,
      count: divisions.length,
      data: divisions
    });
  } catch (err) {
    next(err);
  }
};