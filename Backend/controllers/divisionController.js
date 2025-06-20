const Division = require('../models/division');
const State = require('../models/state');
const ElectionYear = require('../models/ElectionYear');

// @desc    Get all divisions
// @route   GET /api/divisions
// @access  Public
exports.getDivisions = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query with population
    let query = Division.find()
      .populate('state_id', 'name')
      .populate('election_year_id', 'year')
      .sort({ name: 1 });

    // Filter by state
    if (req.query.state) {
      query = query.where('state_id').equals(req.query.state);
    }

    // Filter by election year
    if (req.query.election_year) {
      query = query.where('election_year_id').equals(req.query.election_year);
    }

    // Search functionality
    if (req.query.search) {
      query = query.find({ name: { $regex: req.query.search, $options: 'i' } });
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
      .populate('election_year_id', 'year');

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

    // Verify election year exists if provided
    if (req.body.election_year_id) {
      const electionYear = await ElectionYear.findById(req.body.election_year_id);
      if (!electionYear) {
        return res.status(400).json({
          success: false,
          message: 'Election year not found'
        });
      }
    }

    const division = await Division.create(req.body);

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

    // Verify election year exists if being updated
    if (req.body.election_year_id) {
      const electionYear = await ElectionYear.findById(req.body.election_year_id);
      if (!electionYear) {
        return res.status(400).json({
          success: false,
          message: 'Election year not found'
        });
      }
    }

    division = await Division.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('state_id', 'name')
      .populate('election_year_id', 'year');

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

    await division.remove();

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
      .populate('state_id', 'name')
      .populate('election_year_id', 'year')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: divisions.length,
      data: divisions
    });
  } catch (err) {
    next(err);
  }
};