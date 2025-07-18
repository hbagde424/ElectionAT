const District = require('../models/district');
const State = require('../models/state');
const Assembly = require('../models/assembly');
const Parliament = require('../models/parliament');
const Division = require('../models/division');

// @desc    Get all districts
// @route   GET /api/districts
// @access  Public
exports.getDistricts = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = District.find()
      .populate('state_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('division_id', 'name')
      .populate('created_by', 'username')
      // In getDistricts and getDistrict methods, update the populate calls:
      .populate('updated_by', 'username')
      .sort({ name: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({ name: { $regex: req.query.search, $options: 'i' } });
    }

    // Filter by state
    if (req.query.state) {
      query = query.where('state_id').equals(req.query.state);
    }

    // Filter by assembly
    if (req.query.assembly) {
      query = query.where('assembly_id').equals(req.query.assembly);
    }

    // Filter by parliament
    if (req.query.parliament) {
      query = query.where('parliament_id').equals(req.query.parliament);
    }

    // Filter by division
    if (req.query.division) {
      query = query.where('division_id').equals(req.query.division);
    }

    const districts = await query.skip(skip).limit(limit).exec();
    const total = await District.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: districts.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: districts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single district
// @route   GET /api/districts/:id
// @access  Public
exports.getDistrict = async (req, res, next) => {
  try {
    const district = await District.findById(req.params.id)
      .populate('state_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('division_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')


    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'District not found'
      });
    }

    res.status(200).json({
      success: true,
      data: district
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create district
// @route   POST /api/districts
// @access  Private (Admin only)
exports.createDistrict = async (req, res, next) => {
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

    // Verify parliament exists if provided
    if (req.body.parliament_id) {
      const parliament = await Parliament.findById(req.body.parliament_id);
      if (!parliament) {
        return res.status(400).json({
          success: false,
          message: 'Parliament not found'
        });
      }
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const districtData = {
      ...req.body,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    const district = await District.create(districtData);

    res.status(201).json({
      success: true,
      data: district
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update district
// @route   PUT /api/districts/:id
// @access  Private (Admin only)
exports.updateDistrict = async (req, res, next) => {
  try {
    let district = await District.findById(req.params.id);

    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'District not found'
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

    // Verify parliament exists if being updated
    if (req.body.parliament_id) {
      const parliament = await Parliament.findById(req.body.parliament_id);
      if (!parliament) {
        return res.status(400).json({
          success: false,
          message: 'Parliament not found'
        });
      }
    }

    req.body.updated_by = req.user.id;

    // Set user in locals for pre-save hook
    district._locals = { user: req.user };

    district = await District.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('state_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('division_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username'); // Add population of updated_by

    res.status(200).json({
      success: true,
      data: district
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete district
// @route   DELETE /api/districts/:id
// @access  Private (Admin only)
exports.deleteDistrict = async (req, res, next) => {
  try {
    const district = await District.findById(req.params.id);

    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'District not found'
      });
    }

    await district.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get districts by state
// @route   GET /api/districts/state/:stateId
// @access  Public
exports.getDistrictsByState = async (req, res, next) => {
  try {
    // Verify state exists
    const state = await State.findById(req.params.stateId);
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    const districts = await District.find({ state_id: req.params.stateId })
      .sort({ name: 1 })
      .populate('division_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')


    res.status(200).json({
      success: true,
      count: districts.length,
      data: districts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get districts by division
// @route   GET /api/districts/division/:divisionId
// @access  Public
exports.getDistrictsByDivision = async (req, res, next) => {
  try {
    // Verify division exists
    const division = await Division.findById(req.params.divisionId);
    if (!division) {
      return res.status(404).json({
        success: false,
        message: 'Division not found'
      });
    }

    const districts = await District.find({ division_id: req.params.divisionId })
      .sort({ name: 1 })
      .populate('state_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')


    res.status(200).json({
      success: true,
      count: districts.length,
      data: districts
    });
  } catch (err) {
    next(err);
  }
};