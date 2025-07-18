const Year = require('../models/Year');

// @desc    Get all years
// @route   GET /api/years
// @access  Public
exports.getYears = async (req, res, next) => {
  try {
    const years = await Year.find().sort({ year: -1 });
    res.status(200).json({
      success: true,
      count: years.length,
      data: years
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current year
// @route   GET /api/years/current
// @access  Public
exports.getCurrentYear = async (req, res, next) => {
  try {
    const year = await Year.findOne({ is_current: true });
    res.status(200).json({
      success: true,
      data: year
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new year
// @route   POST /api/years
// @access  Private
exports.createYear = async (req, res, next) => {
  try {
    const { year, is_current } = req.body;

    // Check if year already exists
    const existingYear = await Year.findOne({ year });
    if (existingYear) {
      return res.status(400).json({
        success: false,
        message: 'Year already exists'
      });
    }

    const newYear = await Year.create({ year, is_current });

    res.status(201).json({
      success: true,
      data: newYear
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a year
// @route   PUT /api/years/:id
// @access  Private
exports.updateYear = async (req, res, next) => {
  try {
    let year = await Year.findById(req.params.id);

    if (!year) {
      return res.status(404).json({
        success: false,
        message: 'Year not found'
      });
    }

    // Prevent year value change
    if (req.body.year && req.body.year !== year.year) {
      return res.status(400).json({
        success: false,
        message: 'Year value cannot be changed'
      });
    }

    year = await Year.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: year
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Set current year
// @route   PUT /api/years/set-current/:id
// @access  Private
exports.setCurrentYear = async (req, res, next) => {
  try {
    const year = await Year.findById(req.params.id);

    if (!year) {
      return res.status(404).json({
        success: false,
        message: 'Year not found'
      });
    }

    // This will trigger the pre-save hook to update all other years
    year.is_current = true;
    await year.save();

    res.status(200).json({
      success: true,
      data: year
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a year
// @route   DELETE /api/years/:id
// @access  Private
exports.deleteYear = async (req, res, next) => {
  try {
    const year = await Year.findById(req.params.id);

    if (!year) {
      return res.status(404).json({
        success: false,
        message: 'Year not found'
      });
    }

    // Prevent deletion of current year
    if (year.is_current) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the current year'
      });
    }

    await year.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};