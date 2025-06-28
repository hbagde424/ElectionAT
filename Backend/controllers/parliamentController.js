const Parliament = require('../models/parliament');
const Division = require('../models/division');
const State = require('../models/state');
const Assembly = require('../models/assembly');

// @desc    Get all parliaments
// @route   GET /api/parliaments
// @access  Public
exports.getParliaments = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = Parliament.find()
      .populate('state_id', 'name code')
      .populate('division_id', 'name')
      .populate('assembly_id', 'name')
      .populate('created_by', 'name email')
      .sort({ name: 1 });

    // Filter by category
    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
    }

    // Filter by regional type
    if (req.query.regional_type) {
      query = query.where('regional_type').equals(req.query.regional_type);
    }

    // Filter by state
    if (req.query.state_id) {
      query = query.where('state_id').equals(req.query.state_id);
    }

    // Filter by division
    if (req.query.division_id) {
      query = query.where('division_id').equals(req.query.division_id);
    }

    // Search by name
    if (req.query.search) {
      query = query.where('name').regex(new RegExp(req.query.search, 'i'));
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
      .populate('state_id', 'name code')
      .populate('division_id', 'name')
      .populate('assembly_id', 'name')
      .populate('created_by', 'name email');

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
// @access  Private (Admin)
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

    // Verify assembly exists if provided
    if (req.body.assembly_id) {
      const assembly = await Assembly.findById(req.body.assembly_id);
      if (!assembly) {
        return res.status(400).json({
          success: false,
          message: 'Assembly not found'
        });
      }
    }

    // Add created_by from authenticated user
    req.body.created_by = req.user.id;

    const parliament = await Parliament.create(req.body);

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
// @access  Private (Admin)
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

    // Verify assembly exists if being updated
    if (req.body.assembly_id) {
      const assembly = await Assembly.findById(req.body.assembly_id);
      if (!assembly) {
        return res.status(400).json({
          success: false,
          message: 'Assembly not found'
        });
      }
    }

    parliament = await Parliament.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    .populate('state_id', 'name code')
    .populate('division_id', 'name')
    .populate('assembly_id', 'name')
    .populate('created_by', 'name email');

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
// @access  Private (Admin)
exports.deleteParliament = async (req, res, next) => {
  try {
    const parliament = await Parliament.findById(req.params.id);

    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    await parliament.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get parliaments by category
// @route   GET /api/parliaments/category/:category
// @access  Public
exports.getParliamentsByCategory = async (req, res, next) => {
  try {
    const parliaments = await Parliament.find({ category: req.params.category })
      .populate('state_id', 'name code')
      .populate('division_id', 'name')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: parliaments.length,
      data: parliaments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get parliaments by regional type
// @route   GET /api/parliaments/regional/:type
// @access  Public
exports.getParliamentsByRegionalType = async (req, res, next) => {
  try {
    const parliaments = await Parliament.find({ regional_type: req.params.type })
      .populate('state_id', 'name code')
      .populate('division_id', 'name')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: parliaments.length,
      data: parliaments
    });
  } catch (err) {
    next(err);
  }
};