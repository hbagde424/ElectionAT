const VoterTurnout = require('../models/voterTurnout');
const State = require('../models/state');
const ElectionYear = require('../models/electionYear');

// @desc    Get all voter turnout records
// @route   GET /api/voter-turnout
// @access  Public
exports.getVoterTurnouts = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    // Basic query
    let query = VoterTurnout.find()
      .populate('state_id', 'name')
      .populate('year_id', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ year_id: -1, state_id: 1 });

    // Filter by state
    if (req.query.state) {
      query = query.where('state_id').equals(req.query.state);
    }

    // Filter by year
    if (req.query.year) {
      query = query.where('year_id').equals(req.query.year);
    }

    const turnouts = await query.skip(skip).limit(limit).exec();
    const total = await VoterTurnout.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: turnouts.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: turnouts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single voter turnout record
// @route   GET /api/voter-turnout/:id
// @access  Public
exports.getVoterTurnout = async (req, res, next) => {
  try {
    const turnout = await VoterTurnout.findById(req.params.id)
      .populate('state_id', 'name')
      .populate('year_id', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!turnout) {
      return res.status(404).json({
        success: false,
        message: 'Voter turnout record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: turnout
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create voter turnout record
// @route   POST /api/voter-turnout
// @access  Private (Admin only)
exports.createVoterTurnout = async (req, res, next) => {
  try {
    // Verify references exist
    const [state, year] = await Promise.all([
      State.findById(req.body.state_id),
      ElectionYear.findById(req.body.year_id)
    ]);

    if (!state) {
      return res.status(400).json({ success: false, message: 'State not found' });
    }
    if (!year) {
      return res.status(400).json({ success: false, message: 'Election year not found' });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const turnoutData = {
      ...req.body,
      created_by: req.user.id
    };

    const turnout = await VoterTurnout.create(turnoutData);

    res.status(201).json({
      success: true,
      data: turnout
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Voter turnout record for this state and year already exists'
      });
    }
    next(err);
  }
};

// @desc    Update voter turnout record
// @route   PUT /api/voter-turnout/:id
// @access  Private (Admin only)
exports.updateVoterTurnout = async (req, res, next) => {
  try {
    let turnout = await VoterTurnout.findById(req.params.id);

    if (!turnout) {
      return res.status(404).json({
        success: false,
        message: 'Voter turnout record not found'
      });
    }

    // Verify references exist if being updated
    const verificationPromises = [];
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));
    if (req.body.year_id) verificationPromises.push(ElectionYear.findById(req.body.year_id));

    const verificationResults = await Promise.all(verificationPromises);
    
    for (const result of verificationResults) {
      if (!result) {
        return res.status(400).json({
          success: false,
          message: `${result.modelName} not found`
        });
      }
    }

    // Set updated_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }
    req.body.updated_by = req.user.id;
    req.body.updated_at = new Date();

    turnout = await VoterTurnout.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('state_id', 'name')
      .populate('year_id', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: turnout
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Voter turnout record for this state and year already exists'
      });
    }
    next(err);
  }
};

// @desc    Delete voter turnout record
// @route   DELETE /api/voter-turnout/:id
// @access  Private (Admin only)
exports.deleteVoterTurnout = async (req, res, next) => {
  try {
    const turnout = await VoterTurnout.findById(req.params.id);

    if (!turnout) {
      return res.status(404).json({
        success: false,
        message: 'Voter turnout record not found'
      });
    }

    await turnout.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get voter turnout by state
// @route   GET /api/voter-turnout/state/:stateId
// @access  Public
exports.getVoterTurnoutsByState = async (req, res, next) => {
  try {
    // Verify state exists
    const state = await State.findById(req.params.stateId);
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    const turnouts = await VoterTurnout.find({ state_id: req.params.stateId })
      .sort({ year_id: -1 })
      .populate('year_id', 'year')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: turnouts.length,
      data: turnouts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get voter turnout by year
// @route   GET /api/voter-turnout/year/:yearId
// @access  Public
exports.getVoterTurnoutsByYear = async (req, res, next) => {
  try {
    // Verify year exists
    const year = await ElectionYear.findById(req.params.yearId);
    if (!year) {
      return res.status(404).json({
        success: false,
        message: 'Election year not found'
      });
    }

    const turnouts = await VoterTurnout.find({ year_id: req.params.yearId })
      .sort({ state_id: 1 })
      .populate('state_id', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: turnouts.length,
      data: turnouts
    });
  } catch (err) {
    next(err);
  }
};