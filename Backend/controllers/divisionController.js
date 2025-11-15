const Division = require('../models/Division');
const State = require('../models/state');
const User = require('../models/User'); // Make sure to import your User model
const ErrorResponse = require('../utils/errorResponse');

// Helper function for consistent population
const populateDivision = (query) => {
  return query
    .populate({
      path: 'state_id',
      select: '_id name'
    })
    .populate({
      path: 'created_by',
      select: 'name username email', // Include all fields you want
      model: 'User' // Explicit model reference
    })
    .populate({
      path: 'updated_by',
      select: 'name username email',
      model: 'User'
    });
};

// @desc    Get all divisions
// @route   GET /api/divisions
// @access  Public
exports.getDivisions = async (req, res, next) => {
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
    let filter = {};
    if (req.query.division) {
      filter.name = req.query.division;
    }
    let query = Division.find(filter);
    query = populateDivision(query);
    query = query.sort({ name: 1 });

    // Enhanced search functionality: only apply regex to string fields
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      query = query.find({
        $or: [
          { name: searchRegex },
          { division_code: searchRegex }
        ]
      });
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

    // Apply user hierarchy restriction when an authenticated user is present
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      if (h.division_id) {
        query = query.where('_id').equals(h.division_id);
      } else if (h.state_id) {
        query = query.where('state_id').equals(h.state_id);
      }
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
    let query = Division.findById(req.params.id);
    query = populateDivision(query);
    const division = await query.exec();

    if (!division) {
      return next(new ErrorResponse(`Division not found with id of ${req.params.id}`, 404));
    }

    // Enforce user hierarchy for single division
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      if (h.division_id && h.division_id.toString() !== division._id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
      if (h.state_id && division.state_id && h.state_id.toString() !== division.state_id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
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
      return next(new ErrorResponse('State not found', 404));
    }

    // Check if division code is already taken
    const isCodeTaken = await Division.isDivisionCodeTaken(req.body.division_code);
    if (isCodeTaken) {
      return next(new ErrorResponse('Division code already in use', 400));
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return next(new ErrorResponse('Not authorized - user not identified', 401));
    }

    const divisionData = {
      ...req.body,
      description: req.body.description || '',
      created_by: req.user.id
    };

    const division = await Division.create(divisionData);
    const populatedDivision = await populateDivision(Division.findById(division._id));

    res.status(201).json({
      success: true,
      data: populatedDivision
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
    // Verify division exists
    let division = await Division.findById(req.params.id);
    if (!division) {
      return next(new ErrorResponse(`Division not found with id of ${req.params.id}`, 404));
    }

    // Verify state exists if being updated
    if (req.body.state_id) {
      const state = await State.findById(req.body.state_id);
      if (!state) {
        return next(new ErrorResponse('State not found', 404));
      }
    }

    // Check if division code is already taken (excluding current division)
    if (req.body.division_code) {
      const isCodeTaken = await Division.isDivisionCodeTaken(req.body.division_code, req.params.id);
      if (isCodeTaken) {
        return next(new ErrorResponse('Division code already in use', 400));
      }
    }

    // Set updated_by to current user
    if (req.user && req.user.id) {
      req.body.updated_by = req.user.id;
    }
    req.body.updated_at = new Date();

    const updateData = {
      ...req.body,
      description: req.body.description || '',
    };
    division = await Division.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    const populatedDivision = await populateDivision(Division.findById(division._id));

    res.status(200).json({
      success: true,
      data: populatedDivision
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
      return next(new ErrorResponse(`Division not found with id of ${req.params.id}`, 404));
    }

    await division.deleteOne();

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
      return next(new ErrorResponse('State not found', 404));
    }

    let query = Division.find({ state_id: req.params.stateId }).sort({ name: 1 });
    query = populateDivision(query);
    // Enforce user hierarchy for divisions-by-state
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      if (h.state_id && h.state_id.toString() !== req.params.stateId) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
      if (h.division_id) {
        // If user is scoped to a division, ensure it belongs to this state
        const div = await Division.findById(h.division_id);
        if (!div || div.state_id.toString() !== req.params.stateId) {
          return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
        }
      }
    }
    const divisions = await query.exec();

    res.status(200).json({
      success: true,
      count: divisions.length,
      data: divisions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Debug endpoint for population issues
// @route   GET /api/divisions/:id/debug
// @access  Private (Admin only)
exports.debugDivision = async (req, res, next) => {
  try {
    const division = await Division.findById(req.params.id);

    if (!division) {
      return next(new ErrorResponse('Division not found', 404));
    }

    // Check if referenced users exist
    const createdUser = await User.findById(division.created_by);
    const updatedUser = await User.findById(division.updated_by || division.created_by);

    // Test population
    const testPopulated = await populateDivision(Division.findById(req.params.id));

    res.status(200).json({
      success: true,
      division_exists: !!division,
      created_user_exists: !!createdUser,
      updated_user_exists: !!updatedUser,
      created_user: createdUser,
      updated_user: updatedUser,
      populated_data: testPopulated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Import divisions from Excel
// @route   POST /api/divisions/import
// @access  Private/SuperAdmin
exports.importDivisions = async (req, res, next) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No data provided' });
    }

    const { resolveGeographicHierarchy, validateHierarchy } = require('./importHelpers');
    const summary = { total: rows.length, created: 0, skipped: 0, errors: [], ids: [] };
    const created = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.name || !row.division_code) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: 'Missing name or division_code' });
          continue;
        }

        const geo = await resolveGeographicHierarchy(row);
        const missingFields = validateHierarchy(geo, ['state']);
        if (missingFields.length > 0) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: `Missing: ${missingFields.join(', ')}` });
          continue;
        }

        // Check for duplicates
        const existing = await Division.findOne({ division_code: row.division_code });
        if (existing) {
          summary.skipped += 1;
          summary.errors.push({ row: i + 1, message: `Division code ${row.division_code} already exists` });
          continue;
        }

        const divisionData = {
          name: row.name,
          division_code: row.division_code,
          description: row.description || '',
          state_id: geo.state._id,
          created_by: req.user.id,
          updated_by: req.user.id
        };

        const division = await Division.create(divisionData);
        created.push(division._id);
        summary.created += 1;
      } catch (err) {
        summary.skipped += 1;
        summary.errors.push({ row: i + 1, message: err?.message || String(err) });
      }
    }

    return res.status(200).json({ success: true, ...summary, ids: created });
  } catch (err) {
    next(err);
  }
};