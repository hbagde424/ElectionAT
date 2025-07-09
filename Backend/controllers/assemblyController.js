const Assembly = require('../models/assembly');
const State = require('../models/state');
const District = require('../models/district');
const Division = require('../models/division');
const Parliament = require('../models/parliament');

// @desc    Get all assemblies
// @route   GET /api/assemblies
// @access  Public
exports.getAssemblies = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = Assembly.find()
      .populate('state_id', 'name')
      .populate('district_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('created_by', 'username')
      .sort({ name: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({ $text: { $search: req.query.search } });
    }

    // Filter by type
    if (req.query.type) {
      query = query.where('type').equals(req.query.type);
    }

    // Filter by category
    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
    }

    // Filter by state
    if (req.query.state) {
      query = query.where('state_id').equals(req.query.state);
    }

    // Filter by district
    if (req.query.district) {
      query = query.where('district_id').equals(req.query.district);
    }

    // Filter by division
    if (req.query.division) {
      query = query.where('division_id').equals(req.query.division);
    }

    // Filter by parliament
    if (req.query.parliament) {
      query = query.where('parliament_id').equals(req.query.parliament);
    }

    const assemblies = await query.skip(skip).limit(limit).exec();
    const total = await Assembly.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: assemblies.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: assemblies
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single assembly
// @route   GET /api/assemblies/:id
// @access  Public
exports.getAssembly = async (req, res, next) => {
  try {
    const assembly = await Assembly.findById(req.params.id)
      .populate('state_id', 'name')
      .populate('district_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('created_by', 'username');

    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    res.status(200).json({
      success: true,
      data: assembly
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create assembly
// @route   POST /api/assemblies
// @access  Private (Admin only)
exports.createAssembly = async (req, res, next) => {
  try {
    // Verify state exists
    const state = await State.findById(req.body.state_id);
    if (!state) {
      return res.status(400).json({
        success: false,
        message: 'State not found'
      });
    }

    // Verify district exists
    // const district = await District.findById(req.body.district_id);
    // if (!district) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'District not found'
    //   });
    // }

    // Verify division exists
    const division = await Division.findById(req.body.division_id);
    if (!division) {
      return res.status(400).json({
        success: false,
        message: 'Division not found'
      });
    }

    // Verify parliament exists
    const parliament = await Parliament.findById(req.body.parliament_id);
    if (!parliament) {
      return res.status(400).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const assemblyData = {
      ...req.body,
      created_by: req.user.id
    };

    const assembly = await Assembly.create(assemblyData);

    res.status(201).json({
      success: true,
      data: assembly
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Assembly with this name already exists'
      });
    }
    next(err);
  }
};

// @desc    Update assembly
// @route   PUT /api/assemblies/:id
// @access  Private (Admin only)
exports.updateAssembly = async (req, res, next) => {
  try {
    let assembly = await Assembly.findById(req.params.id);

    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
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

    // Verify district exists if being updated
    if (req.body.district_id) {
      const district = await District.findById(req.body.district_id);
      if (!district) {
        return res.status(400).json({
          success: false,
          message: 'District not found'
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

    assembly = await Assembly.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('state_id', 'name')
      .populate('district_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name');

    res.status(200).json({
      success: true,
      data: assembly
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Assembly with this name already exists'
      });
    }
    next(err);
  }
};

// @desc    Delete assembly
// @route   DELETE /api/assemblies/:id
// @access  Private (Admin only)
exports.deleteAssembly = async (req, res, next) => {
  try {
    const assembly = await Assembly.findById(req.params.id);

    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    await assembly.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get assemblies by parliament
// @route   GET /api/assemblies/parliament/:parliamentId
// @access  Public
exports.getAssembliesByParliament = async (req, res, next) => {
  try {
    // Verify parliament exists
    const parliament = await Parliament.findById(req.params.parliamentId);
    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    const assemblies = await Assembly.find({ parliament_id: req.params.parliamentId })
      .sort({ name: 1 })
      .populate('state_id', 'name')
      .populate('district_id', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: assemblies.length,
      data: assemblies
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get assemblies by division
// @route   GET /api/assemblies/division/:divisionId
// @access  Public
exports.getAssembliesByDivision = async (req, res, next) => {
  try {
    // Verify division exists
    const division = await Division.findById(req.params.divisionId);
    if (!division) {
      return res.status(404).json({
        success: false,
        message: 'Division not found'
      });
    }

    const assemblies = await Assembly.find({ division_id: req.params.divisionId })
      .sort({ name: 1 })
      .populate('state_id', 'name')
      .populate('district_id', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: assemblies.length,
      data: assemblies
    });
  } catch (err) {
    next(err);
  }
};