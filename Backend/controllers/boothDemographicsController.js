const BoothDemographics = require('../models/boothDemographics');
const Booth = require('../models/booth');
const Assembly = require('../models/assembly');
const Parliament = require('../models/parliament');

// @desc    Get all booth demographics
// @route   GET /api/booth-demographics
// @access  Public
exports.getBoothDemographics = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = BoothDemographics.find()
      .populate('booth_id', 'booth_number name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('block_id', 'name');

    // Filter by assembly
    if (req.query.assembly) {
      query = query.where('assembly_id').equals(req.query.assembly);
    }

    // Filter by parliament
    if (req.query.parliament) {
      query = query.where('parliament_id').equals(req.query.parliament);
    }

    const demographics = await query.skip(skip).limit(limit).exec();
    const total = await BoothDemographics.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: demographics.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: demographics
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get demographics by booth
// @route   GET /api/booth-demographics/booth/:boothId
// @access  Public
exports.getDemographicsByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const demographics = await BoothDemographics.findOne({ booth_id: req.params.boothId })
      .populate('booth_id', 'booth_number name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('block_id', 'name');

    if (!demographics) {
      return res.status(404).json({
        success: false,
        message: 'Demographics data not found for this booth'
      });
    }

    res.status(200).json({
      success: true,
      data: demographics
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get demographics by assembly
// @route   GET /api/booth-demographics/assembly/:assemblyId
// @access  Public
exports.getDemographicsByAssembly = async (req, res, next) => {
  try {
    // Verify assembly exists
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    const demographics = await BoothDemographics.find({ assembly_id: req.params.assemblyId })
      .populate('booth_id', 'booth_number name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('block_id', 'name');

    res.status(200).json({
      success: true,
      count: demographics.length,
      data: demographics
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get demographics by parliament
// @route   GET /api/booth-demographics/parliament/:parliamentId
// @access  Public
exports.getDemographicsByParliament = async (req, res, next) => {
  try {
    // Verify parliament exists
    const parliament = await Parliament.findById(req.params.parliamentId);
    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    const demographics = await BoothDemographics.find({ parliament_id: req.params.parliamentId })
      .populate('booth_id', 'booth_number name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('block_id', 'name');

    res.status(200).json({
      success: true,
      count: demographics.length,
      data: demographics
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create booth demographics
// @route   POST /api/booth-demographics
// @access  Private (Admin only)
exports.createBoothDemographics = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.body.booth_id);
    if (!booth) {
      return res.status(400).json({
        success: false,
        message: 'Booth not found'
      });
    }

    // Check if demographics already exists for this booth
    const existingDemographics = await BoothDemographics.findOne({ booth_id: req.body.booth_id });
    if (existingDemographics) {
      return res.status(400).json({
        success: false,
        message: 'Demographics already exists for this booth'
      });
    }

    const demographics = await BoothDemographics.create(req.body);

    res.status(201).json({
      success: true,
      data: demographics
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update booth demographics
// @route   PUT /api/booth-demographics/:id
// @access  Private (Admin only)
exports.updateBoothDemographics = async (req, res, next) => {
  try {
    let demographics = await BoothDemographics.findById(req.params.id);

    if (!demographics) {
      return res.status(404).json({
        success: false,
        message: 'Demographics not found'
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
    }

    demographics = await BoothDemographics.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('booth_id', 'booth_number name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('block_id', 'name');

    res.status(200).json({
      success: true,
      data: demographics
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete booth demographics
// @route   DELETE /api/booth-demographics/:id
// @access  Private (Admin only)
exports.deleteBoothDemographics = async (req, res, next) => {
  try {
    const demographics = await BoothDemographics.findById(req.params.id);

    if (!demographics) {
      return res.status(404).json({
        success: false,
        message: 'Demographics not found'
      });
    }

    await demographics.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};