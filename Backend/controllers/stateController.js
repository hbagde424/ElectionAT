const State = require('../models/state');

// @desc    Get all states
// @route   GET /api/states
// @access  Public
exports.getStates = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = State.find()
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ name: 1 });

    if (req.query.search) {
      query = query.find({
        name: { $regex: req.query.search, $options: 'i' }
      });
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
exports.getState = async (req, res, next) => {
  try {
    const state = await State.findById(req.params.id)
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

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

// @desc    Create state
// @route   POST /api/states
// @access  Private (Admin only)
exports.createState = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const stateData = {
      ...req.body,
      created_by: req.user.id
    };

    const state = await State.create(stateData);

    res.status(201).json({
      success: true,
      data: state
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'State with this name already exists'
      });
    }
    next(err);
  }
};

// @desc    Update state
// @route   PUT /api/states/:id
// @access  Private (Admin only)
exports.updateState = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const state = await State.findById(req.params.id);

    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    const updateData = {
      ...req.body,
      updated_by: req.user.id,
      updated_at: Date.now()
    };

    const updatedState = await State.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: updatedState
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'State with this name already exists'
      });
    }
    next(err);
  }
};

// @desc    Delete state
// @route   DELETE /api/states/:id
// @access  Private (Admin only)
exports.deleteState = async (req, res, next) => {
  try {
    const state = await State.findById(req.params.id);

    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    await state.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};