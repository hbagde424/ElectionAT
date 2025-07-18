const Parliament = require('../models/parliament');
const State = require('../models/state');
const Division = require('../models/division');
const User = require('../models/User');

// @desc    Get all parliaments
// @route   GET /api/parliaments
// @access  Public
exports.getParliaments = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Basic query
    let query = Parliament.find()
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ name: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({ name: { $regex: req.query.search, $options: 'i' } });
    }

    // Filter by category
    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
    }

    // Filter by regional type
    if (req.query.regional_type) {
      query = query.where('regional_type').equals(req.query.regional_type);
    }

    // Filter by state
    if (req.query.state) {
      query = query.where('state_id').equals(req.query.state);
    }

    // Filter by division
    if (req.query.division) {
      query = query.where('division_id').equals(req.query.division);
    }

    const parliaments = await query.skip(skip).limit(limit).exec();
    const total = await Parliament.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: parliaments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: parliaments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single parliament
// @route   GET /api/parliaments/:id
// @access  Public
exports.getParliament = async (req, res, next) => {
  try {
    const parliament = await Parliament.findById(req.params.id)
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    res.status(200).json({
      success: true,
      data: parliament
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create parliament
// @route   POST /api/parliaments
// @access  Private (Admin only)
exports.createParliament = async (req, res, next) => {
  try {
    // Verify state exists
    const state = await State.findById(req.body.state_id);
    if (!state) {
      return res.status(400).json({
        success: false,
        message: 'State not found'
      });
    }

    // Verify division exists
    const division = await Division.findById(req.body.division_id);
    if (!division) {
      return res.status(400).json({
        success: false,
        message: 'Division not found'
      });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }



    const parliamentData = {
      ...req.body,
      created_by: req.user.id
    };

    const parliament = new Parliament(parliamentData);
    parliament._locals = { user: req.user };  // Set user context
    await parliament.save();


    res.status(201).json({
      success: true,
      data: parliament
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update parliament
// @route   PUT /api/parliaments/:id
// @access  Private (Admin only)
exports.updateParliament = async (req, res, next) => {
  try {
    let parliament = await Parliament.findById(req.params.id);

    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
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

    // Verify division exists if being updated
    if (req.body.division_id) {
      const division = await Division.findById(req.body.division_id);
      if (!division) {
        return res.status(400).json({
          success: false,
          message: 'Division not found'
        });
      }
    }

    // Set updated_by from authenticated user
    req.body.updated_by = req.user.id;

    // Set user in locals for pre-save hook
    parliament._locals = { user: req.user };
    req.body.updated_at = new Date();

    parliament = await Parliament.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: parliament
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete parliament
// @route   DELETE /api/parliaments/:id
// @access  Private (Admin only)
exports.deleteParliament = async (req, res, next) => {
  try {
    const parliament = await Parliament.findById(req.params.id);

    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    await parliament.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get parliaments by state
// @route   GET /api/parliaments/state/:stateId
// @access  Public
exports.getParliamentsByState = async (req, res, next) => {
  try {
    // Verify state exists
    const state = await State.findById(req.params.stateId);
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    const parliaments = await Parliament.find({ state_id: req.params.stateId })
      .sort({ name: 1 })
      .populate('division_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      count: parliaments.length,
      data: parliaments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get parliaments by division
// @route   GET /api/parliaments/division/:divisionId
// @access  Public
exports.getParliamentsByDivision = async (req, res, next) => {
  try {
    // Verify division exists
    const division = await Division.findById(req.params.divisionId);
    if (!division) {
      return res.status(404).json({
        success: false,
        message: 'Division not found'
      });
    }

    const parliaments = await Parliament.find({ division_id: req.params.divisionId })
      .sort({ name: 1 })
      .populate('state_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      count: parliaments.length,
      data: parliaments
    });
  } catch (err) {
    next(err);
  }
};