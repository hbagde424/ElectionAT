const Parliament = require('../models/Parliament');
const State = require('../models/state');
const Division = require('../models/Division');
const User = require('../models/User');

// @desc    Get all parliaments
// @route   GET /api/parliaments
// @access  Public
exports.getParliaments = async (req, res, next) => {
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

    // Basic query
    let query = Parliament.find()
      .populate('state_id', '_id name')
      .populate('division_id', '_id name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ name: 1 });

    // Enhanced search functionality: only apply regex to string fields
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      query = query.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
          { regional_type: searchRegex }
        ]
      });
    }

    // Filter by category (case-insensitive)
    if (req.query.category) {
      query = query.find({ category: { $regex: `^${req.query.category}$`, $options: 'i' } });
    }

    // Filter by regional type (case-insensitive)
    if (req.query.regional_type) {
      query = query.find({ regional_type: { $regex: `^${req.query.regional_type}$`, $options: 'i' } });
    }

    // Filter by state (ObjectId or name, dash-to-space, case-insensitive)
    if (req.query.state) {
      let stateValue = req.query.state.replace(/-/g, ' ');
      const isObjectId = /^[a-f\d]{24}$/i.test(stateValue);
      let stateId = null;
      if (isObjectId) {
        stateId = stateValue;
      } else {
        const stateDoc = await State.findOne({ name: { $regex: stateValue, $options: 'i' } });
        stateId = stateDoc ? stateDoc._id : null;
      }
      if (stateId) {
        query = query.where('state_id').equals(stateId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Filter by division
    if (req.query.division) {
      const isObjectId = /^[a-f\d]{24}$/i.test(req.query.division);
      if (isObjectId) {
        query = query.where('division_id').equals(req.query.division);
      } else {
        const divisionDoc = await Division.findOne({ name: req.query.division });
        if (divisionDoc) {
          query = query.where('division_id').equals(divisionDoc._id);
        } else {
          // No such division, return empty result
          return res.status(200).json({
            success: true,
            count: 0,
            total: 0,
            page,
            pages: 0,
            data: []
          });
        }
      }
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
      .populate('state_id', '_id name')
      .populate('division_id', '_id name')
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
      description: req.body.description || '',
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

    const updateData = {
      ...req.body,
      description: req.body.description || '',
    };
    parliament = await Parliament.findByIdAndUpdate(req.params.id, updateData, {
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