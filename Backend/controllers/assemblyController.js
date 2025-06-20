const Assembly = require('../models/assembly');
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
    let query = Assembly.find({ is_active: true })
      .populate('district_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .sort({ name: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({ $text: { $search: req.query.search } });
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

    // Filter by type
    if (req.query.type) {
      query = query.where('type').equals(req.query.type);
    }

    // Filter by category
    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
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
      .populate('district_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name');

    if (!assembly || !assembly.is_active) {
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
    // Verify district exists
    const district = await District.findById(req.body.district_id);
    if (!district) {
      return res.status(400).json({
        success: false,
        message: 'District not found'
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

    // Verify parliament exists
    const parliament = await Parliament.findById(req.body.parliament_id);
    if (!parliament) {
      return res.status(400).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    // Check for duplicate assembly name
    const existingAssembly = await Assembly.findOne({ name: req.body.name });
    if (existingAssembly) {
      return res.status(400).json({
        success: false,
        message: 'Assembly with this name already exists'
      });
    }

    const assembly = await Assembly.create(req.body);

    res.status(201).json({
      success: true,
      data: assembly
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update assembly
// @route   PUT /api/assemblies/:id
// @access  Private (Admin only)
exports.updateAssembly = async (req, res, next) => {
  try {
    let assembly = await Assembly.findById(req.params.id);

    if (!assembly || !assembly.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
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

    // Check for duplicate assembly name if being updated
    if (req.body.name && req.body.name !== assembly.name) {
      const existingAssembly = await Assembly.findOne({ name: req.body.name });
      if (existingAssembly) {
        return res.status(400).json({
          success: false,
          message: 'Assembly with this name already exists'
        });
      }
    }

    assembly = await Assembly.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('district_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name');

    res.status(200).json({
      success: true,
      data: assembly
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete assembly
// @route   DELETE /api/assemblies/:id
// @access  Private (Admin only)
exports.deleteAssembly = async (req, res, next) => {
  try {
    const assembly = await Assembly.findById(req.params.id);

    if (!assembly || !assembly.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    // Soft delete by setting is_active to false
    assembly.is_active = false;
    await assembly.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get assemblies by district
// @route   GET /api/assemblies/district/:districtId
// @access  Public
exports.getAssembliesByDistrict = async (req, res, next) => {
  try {
    // Verify district exists
    const district = await District.findById(req.params.districtId);
    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'District not found'
      });
    }

    let query = Assembly.find({ 
      district_id: req.params.districtId,
      is_active: true 
    })
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .sort({ name: 1 });

    // Filter by type if provided
    if (req.query.type) {
      query = query.where('type').equals(req.query.type);
    }

    // Filter by category if provided
    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
    }

    const assemblies = await query.exec();

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

    let query = Assembly.find({ 
      division_id: req.params.divisionId,
      is_active: true 
    })
      .populate('district_id', 'name')
      .populate('parliament_id', 'name')
      .sort({ name: 1 });

    // Filter by type if provided
    if (req.query.type) {
      query = query.where('type').equals(req.query.type);
    }

    // Filter by category if provided
    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
    }

    const assemblies = await query.exec();

    res.status(200).json({
      success: true,
      count: assemblies.length,
      data: assemblies
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

    let query = Assembly.find({ 
      parliament_id: req.params.parliamentId,
      is_active: true 
    })
      .populate('district_id', 'name')
      .populate('division_id', 'name')
      .sort({ name: 1 });

    // Filter by type if provided
    if (req.query.type) {
      query = query.where('type').equals(req.query.type);
    }

    // Filter by category if provided
    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
    }

    const assemblies = await query.exec();

    res.status(200).json({
      success: true,
      count: assemblies.length,
      data: assemblies
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get assemblies by type
// @route   GET /api/assemblies/type/:type
// @access  Public
exports.getAssembliesByType = async (req, res, next) => {
  try {
    const validTypes = ['Urban', 'Rural', 'Mixed'];
    if (!validTypes.includes(req.params.type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assembly type'
      });
    }

    let query = Assembly.find({ 
      type: req.params.type,
      is_active: true 
    })
      .populate('district_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .sort({ name: 1 });

    // Filter by category if provided
    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
    }

    const assemblies = await query.exec();

    res.status(200).json({
      success: true,
      count: assemblies.length,
      data: assemblies
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get assemblies by category
// @route   GET /api/assemblies/category/:category
// @access  Public
exports.getAssembliesByCategory = async (req, res, next) => {
  try {
    const validCategories = ['General', 'Reserved', 'Special'];
    if (!validCategories.includes(req.params.category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assembly category'
      });
    }

    let query = Assembly.find({ 
      category: req.params.category,
      is_active: true 
    })
      .populate('district_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .sort({ name: 1 });

    // Filter by type if provided
    if (req.query.type) {
      query = query.where('type').equals(req.query.type);
    }

    const assemblies = await query.exec();

    res.status(200).json({
      success: true,
      count: assemblies.length,
      data: assemblies
    });
  } catch (err) {
    next(err);
  }
};