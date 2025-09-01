const State = require('../models/state');

// @desc    Get all states
// @route   GET /api/states
// @access  Public
exports.getStates = async (req, res, next) => {
  try {
    const Division = require('../models/Division');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    let stateFilter = {};
    let divisionFilter = {};

    // If filtering by division name
    if (req.query.division) {
      divisionFilter.name = req.query.division;
    }

    // If search by state name
    if (req.query.search) {
      stateFilter.name = { $regex: req.query.search, $options: 'i' };
    }

    // If filtering by division, find matching divisions and their state_ids
    if (Object.keys(divisionFilter).length > 0) {
      const divisions = await Division.find(divisionFilter);
      if (divisions.length === 0) {
        // No matching divisions, return empty
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          page,
          pages: 0,
          data: []
        });
      }
      const stateIds = divisions.map(d => d.state_id);
      stateFilter._id = { $in: stateIds };
    }

    // Query states
    let query = State.find(stateFilter)
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ name: 1 });

    const states = await query.skip(skip).limit(limit).exec();
    const total = await State.countDocuments(stateFilter);

    // For each state, include its divisions
    const stateIds = states.map(s => s._id);
    const divisionsByState = await Division.find({ state_id: { $in: stateIds } });
    const divisionsMap = {};
    divisionsByState.forEach(div => {
      const sid = div.state_id.toString();
      if (!divisionsMap[sid]) divisionsMap[sid] = [];
      divisionsMap[sid].push({
        _id: div._id,
        name: div.name,
        division_code: div.division_code,
        description: div.description
      });
    });

    let responseData;
    if (req.query.division) {
      // Flat structure: one object per matching division, with parent state info
      responseData = [];
      states.forEach(s => {
        const sObj = s.toObject();
        const divisions = (divisionsMap[s._id.toString()] || []).filter(div => div.name.toLowerCase() === req.query.division.toLowerCase());
        divisions.forEach(div => {
          responseData.push({
            state_id: sObj._id,
            state_name: sObj.name,
            division_id: div._id,
            division_name: div.name,
            division_code: div.division_code,
            description: div.description
          });
        });
      });
      return res.status(200).json({
        success: true,
        count: responseData.length,
        total: responseData.length,
        page,
        pages: 1,
        data: responseData
      });
    } else {
      let statesWithDivisions = states.map(s => {
        const sObj = s.toObject();
        sObj.divisions = divisionsMap[s._id.toString()] || [];
        return sObj;
      });
      res.status(200).json({
        success: true,
        count: statesWithDivisions.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: statesWithDivisions
      });
    }
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
      description: req.body.description || '',
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
      description: req.body.description || '',
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