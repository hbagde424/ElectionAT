const RegionIncharge = require('../models/regionIncharge');
const RegionCommittee = require('../models/RegionCommittee');

// @desc    Get all region incharges
// @route   GET /api/region-incharges
// @access  Public
exports.getRegionIncharges = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = RegionIncharge.find()
      .populate('committee_id', 'name region')
      .sort({ role: 1, name: 1 });

    // Filter by committee
    if (req.query.committee) {
      query = query.where('committee_id').equals(req.query.committee);
    }

    // Filter by role
    if (req.query.role) {
      query = query.where('role').equals(req.query.role);
    }

    // Filter by active status
    if (req.query.active !== undefined) {
      query = query.where('is_active').equals(req.query.active === 'true');
    }

    const incharges = await query.skip(skip).limit(limit).exec();
    const total = await RegionIncharge.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: incharges.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: incharges
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single region incharge
// @route   GET /api/region-incharges/:id
// @access  Public
exports.getRegionIncharge = async (req, res, next) => {
  try {
    const incharge = await RegionIncharge.findById(req.params.id)
      .populate('committee_id', 'name region');

    if (!incharge) {
      return res.status(404).json({
        success: false,
        message: 'Region incharge not found'
      });
    }

    res.status(200).json({
      success: true,
      data: incharge
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get incharges by committee
// @route   GET /api/region-incharges/committee/:committeeId
// @access  Public
exports.getInchargesByCommittee = async (req, res, next) => {
  try {
    // Verify committee exists
    const committee = await RegionCommittee.findById(req.params.committeeId);
    if (!committee) {
      return res.status(404).json({
        success: false,
        message: 'Committee not found'
      });
    }

    const incharges = await RegionIncharge.find({ committee_id: req.params.committeeId })
      .populate('committee_id', 'name region')
      .sort({ role: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: incharges.length,
      data: incharges
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get incharges by role
// @route   GET /api/region-incharges/role/:role
// @access  Public
exports.getInchargesByRole = async (req, res, next) => {
  try {
    const validRoles = ['incharge', 'coordinator', 'member'];
    if (!validRoles.includes(req.params.role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    const incharges = await RegionIncharge.find({ role: req.params.role })
      .populate('committee_id', 'name region')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: incharges.length,
      data: incharges
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create region incharge
// @route   POST /api/region-incharges
// @access  Private (Admin only)
exports.createRegionIncharge = async (req, res, next) => {
  try {
    // Verify committee exists
    const committee = await RegionCommittee.findById(req.body.committee_id);
    if (!committee) {
      return res.status(400).json({
        success: false,
        message: 'Committee not found'
      });
    }

    // Check if phone already exists
    const existingPhone = await RegionIncharge.findOne({ phone: req.body.phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already in use'
      });
    }

    // Check if email already exists (if provided)
    if (req.body.email) {
      const existingEmail = await RegionIncharge.findOne({ email: req.body.email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    const incharge = await RegionIncharge.create(req.body);

    res.status(201).json({
      success: true,
      data: incharge
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update region incharge
// @route   PUT /api/region-incharges/:id
// @access  Private (Admin only)
exports.updateRegionIncharge = async (req, res, next) => {
  try {
    let incharge = await RegionIncharge.findById(req.params.id);

    if (!incharge) {
      return res.status(404).json({
        success: false,
        message: 'Region incharge not found'
      });
    }

    // Verify committee exists if being updated
    if (req.body.committee_id) {
      const committee = await RegionCommittee.findById(req.body.committee_id);
      if (!committee) {
        return res.status(400).json({
          success: false,
          message: 'Committee not found'
        });
      }
    }

    // Check if new phone conflicts with existing records
    if (req.body.phone && req.body.phone !== incharge.phone) {
      const existingPhone = await RegionIncharge.findOne({ phone: req.body.phone });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already in use by another incharge'
        });
      }
    }

    // Check if new email conflicts with existing records
    if (req.body.email && req.body.email !== incharge.email) {
      const existingEmail = await RegionIncharge.findOne({ email: req.body.email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another incharge'
        });
      }
    }

    incharge = await RegionIncharge.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('committee_id', 'name region');

    res.status(200).json({
      success: true,
      data: incharge
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete region incharge
// @route   DELETE /api/region-incharges/:id
// @access  Private (Admin only)
exports.deleteRegionIncharge = async (req, res, next) => {
  try {
    const incharge = await RegionIncharge.findById(req.params.id);

    if (!incharge) {
      return res.status(404).json({
        success: false,
        message: 'Region incharge not found'
      });
    }

    await incharge.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};