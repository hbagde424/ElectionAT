const LocalDynamics = require('../models/localDynamics');

// @desc    Get all local dynamics records
// @route   GET /api/local-dynamics
// @access  Protected
exports.getLocalDynamics = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = LocalDynamics.find().populate('booth_id', 'name code');

    // Filter by booth
    if (req.query.booth) {
      query = query.where('booth_id').equals(req.query.booth);
    }

    const records = await query.skip(skip).limit(limit).exec();
    const total = await LocalDynamics.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: records.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: records
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get local dynamics by booth ID
// @route   GET /api/local-dynamics/booth/:boothId
// @access  Protected
exports.getLocalDynamicsByBooth = async (req, res, next) => {
  try {
    const record = await LocalDynamics.findOne({ booth_id: req.params.boothId })
      .populate('booth_id', 'name code');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'No local dynamics record found for this booth'
      });
    }

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new local dynamics record
// @route   POST /api/local-dynamics
// @access  Private (Admin, Field Agent)
exports.createLocalDynamics = async (req, res, next) => {
  try {
    // Check if record already exists for this booth
    const existingRecord = await LocalDynamics.findOne({ booth_id: req.body.booth_id });
    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Local dynamics record already exists for this booth'
      });
    }

    const record = await LocalDynamics.create(req.body);

    res.status(201).json({
      success: true,
      data: record
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update local dynamics record
// @route   PUT /api/local-dynamics/:id
// @access  Private (Admin, Field Agent)
exports.updateLocalDynamics = async (req, res, next) => {
  try {
    let record = await LocalDynamics.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    // Prevent changing booth_id
    if (req.body.booth_id && req.body.booth_id !== record.booth_id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change booth reference'
      });
    }

    record = await LocalDynamics.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete local dynamics record
// @route   DELETE /api/local-dynamics/:id
// @access  Private (Admin)
exports.deleteLocalDynamics = async (req, res, next) => {
  try {
    const record = await LocalDynamics.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Record not found'
      });
    }

    await record.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};