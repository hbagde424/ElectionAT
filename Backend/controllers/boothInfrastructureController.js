const BoothInfrastructure = require('../models/boothInfrastructure');
const Booth = require('../models/booth');

// @desc    Get all booth infrastructure records
// @route   GET /api/booth-infrastructure
// @access  Public
exports.getAllBoothInfrastructures = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = BoothInfrastructure.find()
      .populate('booth_id', 'booth_number location')
      .sort({ created_at: -1 });

    // Filter by premises type
    if (req.query.premisesType) {
      query = query.where('premises_type').equals(req.query.premisesType);
    }

    // Filter by categorization
    if (req.query.categorization) {
      query = query.where('categorization').equals(req.query.categorization);
    }

    const infrastructures = await query.skip(skip).limit(limit).exec();
    const total = await BoothInfrastructure.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: infrastructures.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: infrastructures
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single booth infrastructure record
// @route   GET /api/booth-infrastructure/:id
// @access  Public
exports.getBoothInfrastructure = async (req, res, next) => {
  try {
    const infrastructure = await BoothInfrastructure.findById(req.params.id)
      .populate('booth_id', 'booth_number location');

    if (!infrastructure) {
      return res.status(404).json({
        success: false,
        message: 'Booth infrastructure record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: infrastructure
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create booth infrastructure record
// @route   POST /api/booth-infrastructure
// @access  Private (Admin/Editor)
exports.createBoothInfrastructure = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.body.booth_id);
    if (!booth) {
      return res.status(400).json({
        success: false,
        message: 'Booth not found'
      });
    }

    // Check if record already exists for this booth
    const existingRecord = await BoothInfrastructure.findOne({ booth_id: req.body.booth_id });
    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Infrastructure record already exists for this booth'
      });
    }

    const infrastructure = await BoothInfrastructure.create(req.body);

    res.status(201).json({
      success: true,
      data: infrastructure
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update booth infrastructure record
// @route   PUT /api/booth-infrastructure/:id
// @access  Private (Admin/Editor)
exports.updateBoothInfrastructure = async (req, res, next) => {
  try {
    let infrastructure = await BoothInfrastructure.findById(req.params.id);

    if (!infrastructure) {
      return res.status(404).json({
        success: false,
        message: 'Booth infrastructure record not found'
      });
    }

    // Verify booth exists if being updated
    if (req.body.booth_id) {
      const booth = await Booth.findById(req.body.booth_id);
      if (!booth) {
        return res.status(400).json({
          success: false,
          message: 'Booth not found'
        });
      }

      // Check if new booth_id already has a record
      const existingRecord = await BoothInfrastructure.findOne({ 
        booth_id: req.body.booth_id,
        _id: { $ne: req.params.id } // Exclude current record
      });
      if (existingRecord) {
        return res.status(400).json({
          success: false,
          message: 'Infrastructure record already exists for the new booth'
        });
      }
    }

    infrastructure = await BoothInfrastructure.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('booth_id');

    res.status(200).json({
      success: true,
      data: infrastructure
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete booth infrastructure record
// @route   DELETE /api/booth-infrastructure/:id
// @access  Private (Admin)
exports.deleteBoothInfrastructure = async (req, res, next) => {
  try {
    const infrastructure = await BoothInfrastructure.findById(req.params.id);

    if (!infrastructure) {
      return res.status(404).json({
        success: false,
        message: 'Booth infrastructure record not found'
      });
    }

    await infrastructure.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get infrastructure records by premises type
// @route   GET /api/booth-infrastructure/premises/:premisesType
// @access  Public
exports.getInfrastructureByPremisesType = async (req, res, next) => {
  try {
    const validTypes = ['School', 'Community Hall', 'Government Building', 'Other'];
    if (!validTypes.includes(req.params.premisesType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid premises type'
      });
    }

    const infrastructures = await BoothInfrastructure.find({ 
      premises_type: req.params.premisesType 
    })
    .populate('booth_id', 'booth_number location')
    .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: infrastructures.length,
      data: infrastructures
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get infrastructure records by categorization
// @route   GET /api/booth-infrastructure/category/:categorization
// @access  Public
exports.getInfrastructureByCategorization = async (req, res, next) => {
  try {
    const validCategories = ['Normal', 'Sensitive', 'Hyper-sensitive'];
    if (!validCategories.includes(req.params.categorization)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid categorization'
      });
    }

    const infrastructures = await BoothInfrastructure.find({ 
      categorization: req.params.categorization 
    })
    .populate('booth_id', 'booth_number location')
    .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: infrastructures.length,
      data: infrastructures
    });
  } catch (err) {
    next(err);
  }
};