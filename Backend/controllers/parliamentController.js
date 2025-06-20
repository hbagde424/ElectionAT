const Parliament = require('../models/parliament');
const Division = require('../models/division');

// @desc    Get all parliamentary constituencies
// @route   GET /api/parliaments
// @access  Public
exports.getParliaments = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = Parliament.find()
      .populate('division_id', 'name code')
      .sort({ name: 1 });

    // Filter by division
    if (req.query.division) {
      query = query.where('division_id').equals(req.query.division);
    }

    // Search by name
    if (req.query.search) {
      query = query.where('name').regex(new RegExp(req.query.search, 'i'));
    }

    const parliaments = await query.skip(skip).limit(limit).exec();
    const total = await Parliament.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: parliaments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: parliaments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single parliamentary constituency
// @route   GET /api/parliaments/:id
// @access  Public
exports.getParliamentById = async (req, res, next) => {
  try {
    const parliament = await Parliament.findById(req.params.id)
      .populate('division_id', 'name code');

    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliamentary constituency not found'
      });
    }

    res.status(200).json({
      success: true,
      data: parliament
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new parliamentary constituency
// @route   POST /api/parliaments
// @access  Private (Admin)
exports.createParliament = async (req, res, next) => {
  try {
    // Verify division exists
    const division = await Division.findById(req.body.division_id);
    if (!division) {
      return res.status(400).json({
        success: false,
        message: 'Division not found'
      });
    }

    // Check if parliament with same name already exists in this division
    const existingParliament = await Parliament.findOne({
      name: req.body.name,
      division_id: req.body.division_id
    });
    if (existingParliament) {
      return res.status(400).json({
        success: false,
        message: 'Parliamentary constituency with this name already exists in the division'
      });
    }

    const parliament = await Parliament.create(req.body);

    res.status(201).json({
      success: true,
      data: parliament
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update parliamentary constituency
// @route   PUT /api/parliaments/:id
// @access  Private (Admin)
exports.updateParliament = async (req, res, next) => {
  try {
    let parliament = await Parliament.findById(req.params.id);

    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliamentary constituency not found'
      });
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

    // Check if new name already exists in the division
    if (req.body.name && (req.body.name !== parliament.name || 
                         (req.body.division_id && req.body.division_id !== parliament.division_id.toString()))) {
      const divisionId = req.body.division_id || parliament.division_id;
      const existingParliament = await Parliament.findOne({
        name: req.body.name,
        division_id: divisionId
      });
      if (existingParliament && existingParliament._id.toString() !== req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Parliamentary constituency with this name already exists in the division'
        });
      }
    }

    parliament = await Parliament.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('division_id');

    res.status(200).json({
      success: true,
      data: parliament
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete parliamentary constituency
// @route   DELETE /api/parliaments/:id
// @access  Private (Admin)
exports.deleteParliament = async (req, res, next) => {
  try {
    const parliament = await Parliament.findById(req.params.id);

    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliamentary constituency not found'
      });
    }

    await parliament.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get parliaments by division ID
// @route   GET /api/parliaments/division/:divisionId
// @access  Public
exports.getParliamentsByDivision = async (req, res, next) => {
  try {
    // Verify division exists
    const division = await Division.findById(req.params.divisionId);
    if (!division) {
      return res.status(404).json({
        success: false,
        message: 'Division not found'
      });
    }

    const parliaments = await Parliament.find({ division_id: req.params.divisionId })
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: parliaments.length,
      data: parliaments
    });
  } catch (err) {
    next(err);
  }
};