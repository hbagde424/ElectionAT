const State = require('../models/state');

// @desc    Get all states
// @route   GET /api/states
// @access  Public
exports.getStates = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = State.find().sort({ name: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.where('name').regex(new RegExp(req.query.search, 'i'));
    }

    const states = await query.skip(skip).limit(limit).exec();
    const total = await State.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: states.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: states
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single state
// @route   GET /api/states/:id
// @access  Public
exports.getStateById = async (req, res, next) => {
  try {
    const state = await State.findById(req.params.id);

    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    res.status(200).json({
      success: true,
      data: state
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new state
// @route   POST /api/states
// @access  Private (Admin)
exports.createState = async (req, res, next) => {
  try {
    // Check if state already exists
    const existingState = await State.findOne({ name: req.body.name });
    if (existingState) {
      return res.status(400).json({
        success: false,
        message: 'State with this name already exists'
      });
    }

    const state = await State.create(req.body);

    res.status(201).json({
      success: true,
      data: state
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update state
// @route   PUT /api/states/:id
// @access  Private (Admin)
exports.updateState = async (req, res, next) => {
  try {
    let state = await State.findById(req.params.id);

    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    // Check if new name already exists
    if (req.body.name && req.body.name !== state.name) {
      const existingState = await State.findOne({ name: req.body.name });
      if (existingState) {
        return res.status(400).json({
          success: false,
          message: 'State with this name already exists'
        });
      }
    }

    state = await State.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: state
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete state
// @route   DELETE /api/states/:id
// @access  Private (Admin)
exports.deleteState = async (req, res, next) => {
  try {
    const state = await State.findById(req.params.id);

    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    await state.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};