const State = require('../models/state');

// @desc    Get all states
// @route   GET /api/states
// @access  Private (Requires authentication via serviceToken)
exports.getStates = async (req, res, next) => {
  try {
    const Division = require('../models/Division');
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit);

    if (!!req.query.search || !limit || limit <= 0) {
      limit = 10000;
    }
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
// @desc    Get single state
// @route   GET /api/states/:id
// @access  Private (Requires authentication via serviceToken)
exports.getState = async (req, res, next) => {
  try {
    const stateId = req.params.id;
    
    // Check if it's a valid ObjectId
    const isObjectId = /^[a-f\d]{24}$/i.test(stateId);
    let state;
    
    if (isObjectId) {
      state = await State.findById(stateId)
        .populate('created_by', 'username')
        .populate('updated_by', 'username');
    } else {
      // Try to find by name
      state = await State.findOne({ name: stateId })
        .populate('created_by', 'username')
        .populate('updated_by', 'username');
    }

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

// @desc    Upload state polygon (GeoJSON)
// @route   POST /api/states/upload-polygon
// @access  Private (Admin only)
exports.uploadStatePolygon = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const geoJsonData = req.body;

    if (!geoJsonData || !geoJsonData.type) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GeoJSON data'
      });
    }

    let features = [];
    if (geoJsonData.type === 'FeatureCollection') {
      features = geoJsonData.features;
    } else if (geoJsonData.type === 'Feature') {
      features = [geoJsonData];
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid GeoJSON type. Must be FeatureCollection or Feature'
      });
    }

    let updatedCount = 0;
    let errors = [];

    for (const feature of features) {
      if (!feature.properties) continue;

      const props = feature.properties;
      // Try to find state by name variants
      const stateName = props.STNAME || props.STNAME_SH || props.name || props.Name || props.NAME;

      if (!stateName) {
        errors.push('Feature passed without a valid name property (STNAME, STNAME_SH, name)');
        continue;
      }

      // Case-insensitive search
      const state = await State.findOne({
        name: { $regex: new RegExp(`^${stateName}$`, 'i') }
      });

      if (state) {
        // Update state with polygon feature (geometry + properties)
        state.polygon = feature;
        // Optionally update other metadata if needed
        await state.save();
        updatedCount++;
      } else {
        errors.push(`State not found for: ${stateName}`);
      }
    }

    if (updatedCount === 0 && errors.length > 0) {
      return res.status(404).json({
        success: false,
        message: 'No states matched',
        errors
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully updated polygons for ${updatedCount} states`,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    next(err);
  }
};