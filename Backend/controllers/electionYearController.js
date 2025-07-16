const ElectionYear = require('../models/electionYear');
const User = require('../models/User');

// @desc    Get all election years
// @route   GET /api/election-years
// @access  Public
exports.getElectionYears = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = ElectionYear.find()
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ year: -1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { year: { $regex: req.query.search, $options: 'i' } },
          { election_type: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Filter by election type
    if (req.query.type) {
      query = query.where('election_type').equals(req.query.type);
    }

    const electionYears = await query.skip(skip).limit(limit).exec();
    const total = await ElectionYear.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: electionYears.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: electionYears
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single election year
// @route   GET /api/election-years/:id
// @access  Public
exports.getElectionYear = async (req, res, next) => {
  try {
    const electionYear = await ElectionYear.findById(req.params.id)
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!electionYear) {
      return res.status(404).json({
        success: false,
        message: 'Election year not found'
      });
    }

    res.status(200).json({
      success: true,
      data: electionYear
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create election year
// @route   POST /api/election-years
// @access  Private (Admin only)
exports.createElectionYear = async (req, res, next) => {
  try {
    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const electionYearData = {
      ...req.body,
      created_by: req.user.id
    };

    const electionYear = await ElectionYear.create(electionYearData);

    res.status(201).json({
      success: true,
      data: electionYear
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Election year already exists'
      });
    }
    next(err);
  }
};

// @desc    Update election year
// @route   PUT /api/election-years/:id
// @access  Private (Admin only)
exports.updateElectionYear = async (req, res, next) => {
  try {
    let electionYear = await ElectionYear.findById(req.params.id);

    if (!electionYear) {
      return res.status(404).json({
        success: false,
        message: 'Election year not found'
      });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const updateData = {
      ...req.body,
      updated_by: req.user.id
    };

    electionYear = await ElectionYear.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: electionYear
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Election year already exists'
      });
    }
    next(err);
  }
};

// @desc    Delete election year
// @route   DELETE /api/election-years/:id
// @access  Private (Admin only)
exports.deleteElectionYear = async (req, res, next) => {
  try {
    const electionYear = await ElectionYear.findById(req.params.id);

    if (!electionYear) {
      return res.status(404).json({
        success: false,
        message: 'Election year not found'
      });
    }

    await electionYear.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};