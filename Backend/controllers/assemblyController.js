const Assembly = require('../models/Assembly');
const State = require('../models/state');
const District = require('../models/District');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');

// @desc    Get all assemblies
// @route   GET /api/assemblies
// @access  Public
exports.getAssemblies = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Enhanced search functionality: search across all string fields in the model
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { AC_NO: searchRegex },
        { type: searchRegex },
        { category: searchRegex }
      ];
    }

    // Filter by type (case-insensitive)
    if (req.query.type) {
      filter.type = { $regex: `^${req.query.type}$`, $options: 'i' };
    }

    // Filter by category (case-insensitive)
    if (req.query.category) {
      filter.category = { $regex: `^${req.query.category}$`, $options: 'i' };
    }

    // Filter by state
    if (req.query.state_id) {
      filter.state_id = req.query.state_id;
    }

    // Filter by district
    if (req.query.district) {
      filter.district_id = req.query.district;
    }

    // Filter by division
    if (req.query.division) {
      filter.division_id = req.query.division;
    }

    // Filter by parliament
    if (req.query.parliament) {
      filter.parliament_id = req.query.parliament;
    }

    let query = Assembly.find(filter)
      .populate('state_id', '_id name')
      .populate('district_id', '_id name')
      .populate('division_id', '_id name')
      .populate('parliament_id', '_id name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ name: 1 });

    const assemblies = await query.skip(skip).limit(limit).exec();
    const total = await Assembly.countDocuments(filter);

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
      .populate('state_id', '_id name')
      .populate('district_id', '_id name')
      .populate('division_id', '_id name')
      .populate('parliament_id', '_id name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username'); // Add population of updated_by


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


    // Only allow fields that are in the schema
    const assemblyData = {
      name: req.body.name,
      description: req.body.description || '',
      AC_NO: req.body.AC_NO,
      type: req.body.type,
      category: req.body.category,
      state_id: req.body.state_id,
      district_id: req.body.district_id,
      division_id: req.body.division_id,
      parliament_id: req.body.parliament_id,
      created_by: req.user.id,
      updated_by: req.user.id
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

    // Set updated_by from authenticated user
    req.body.updated_by = req.user.id;


    // Only allow fields that are in the schema
    const updateData = {
      name: req.body.name,
      description: req.body.description || '',
      AC_NO: req.body.AC_NO,
      type: req.body.type,
      category: req.body.category,
      state_id: req.body.state_id,
      district_id: req.body.district_id,
      division_id: req.body.division_id,
      parliament_id: req.body.parliament_id,
      updated_by: req.user.id,
      updated_at: new Date()
    };

    assembly = await Assembly.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('state_id', 'name')
      .populate('district_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username'); // Add population of updated_by

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
      .populate('created_by', 'username')
      .populate('updated_by', 'username'); // Add population of updated_by


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
      .populate('created_by', 'username')
      .populate('updated_by', 'username'); // Add population of updated_by


    res.status(200).json({
      success: true,
      count: assemblies.length,
      data: assemblies
    });
  } catch (err) {
    next(err);
  }
};