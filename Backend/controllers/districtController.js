const District = require('../models/district');

// @desc    Get all districts
// @route   GET /api/districts
// @access  Public
exports.getDistricts = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = District.find()
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .sort({ name: 1 });

    // Filter by division
    if (req.query.division) {
      query = query.where('division_id').equals(req.query.division);
    }

    // Search by name
    if (req.query.search) {
      query = query.where('name').regex(new RegExp(req.query.search, 'i'));
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

// @desc    Get districts by division
// @route   GET /api/districts/division/:divisionId
// @access  Public
exports.getDistrictsByDivision = async (req, res, next) => {
  try {
    const districts = await District.find({ division_id: req.params.divisionId })
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: districts.length,
      data: districts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single district
// @route   GET /api/districts/:id
// @access  Public
exports.getDistrictById = async (req, res, next) => {
  try {
    const district = await District.findById(req.params.id)
      .populate('division_id', 'name')
      .populate('parliament_id', 'name');

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

// @desc    Create new district
// @route   POST /api/districts
// @access  Private (Admin)
exports.createDistrict = async (req, res, next) => {
  try {
    // Check if district already exists in the same division
    const existingDistrict = await District.findOne({
      name: req.body.name,
      division_id: req.body.division_id
    });

    if (existingDistrict) {
      return res.status(400).json({
        success: false,
        message: 'District with this name already exists in the division'
      });
    }

    const district = await District.create(req.body);

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
// @access  Private (Admin)
exports.updateDistrict = async (req, res, next) => {
  try {
    let district = await District.findById(req.params.id);

    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'District not found'
      });
    }

    // Check if new name already exists in the same division
    if (req.body.name && req.body.name !== district.name) {
      const existingDistrict = await District.findOne({
        name: req.body.name,
        division_id: req.body.division_id || district.division_id
      });

      if (existingDistrict) {
        return res.status(400).json({
          success: false,
          message: 'District with this name already exists in the division'
        });
      }
    }

    district = await District.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('division_id', 'name')
      .populate('parliament_id', 'name');

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
// @access  Private (Admin)
exports.deleteDistrict = async (req, res, next) => {
  try {
    const district = await District.findById(req.params.id);

    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'District not found'
      });
    }

    await district.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};