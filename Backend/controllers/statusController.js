const Status = require('../models/status');
const User = require('../models/User');

// @desc    Get all statuses
// @route   GET /api/statuses
// @access  Public
exports.getStatuses = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Base query
    let query = Status.find()
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ name: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Filter by active status
    if (req.query.active) {
      const isActive = req.query.active === 'true';
      query = query.where('is_active').equals(isActive);
    }

    // Filter by system status
    if (req.query.system) {
      const isSystem = req.query.system === 'true';
      query = query.where('is_system').equals(isSystem);
    }

    const statuses = await query.skip(skip).limit(limit).exec();
    const total = await Status.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: statuses.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: statuses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single status
// @route   GET /api/statuses/:id
// @access  Public
exports.getStatus = async (req, res, next) => {
  try {
    const status = await Status.findById(req.params.id)
      .populate('created_by', 'username email')
      .populate('updated_by', 'username email');

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Status not found'
      });
    }

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create status
// @route   POST /api/statuses
// @access  Private (Admin only)
exports.createStatus = async (req, res, next) => {
  try {
    // Set created_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const statusData = {
      ...req.body,
      created_by: req.user.id
    };

    const status = await Status.create(statusData);

    res.status(201).json({
      success: true,
      data: status
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Status with this name already exists'
      });
    }
    next(err);
  }
};

// @desc    Update status
// @route   PUT /api/statuses/:id
// @access  Private (Admin only)
exports.updateStatus = async (req, res, next) => {
  try {
    let status = await Status.findById(req.params.id);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Status not found'
      });
    }

    // Prevent modifying system status properties
    if (status.is_system) {
      req.body.is_system = true; // Ensure this can't be changed
    }

    // Set updated_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    req.body.updated_by = req.user.id;

    status = await Status.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Status with this name already exists'
      });
    }
    next(err);
  }
};

// @desc    Delete status
// @route   DELETE /api/statuses/:id
// @access  Private (Admin only)
exports.deleteStatus = async (req, res, next) => {
  try {
    const status = await Status.findById(req.params.id);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Status not found'
      });
    }

    if (status.is_system) {
      return res.status(400).json({
        success: false,
        message: 'System statuses cannot be deleted'
      });
    }

    await status.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle status active state
// @route   PATCH /api/statuses/:id/toggle-active
// @access  Private (Admin only)
exports.toggleStatusActive = async (req, res, next) => {
  try {
    let status = await Status.findById(req.params.id);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Status not found'
      });
    }

    // Prevent modifying system status properties
    if (status.is_system) {
      return res.status(400).json({
        success: false,
        message: 'System statuses cannot be deactivated'
      });
    }

    // Set updated_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    status.is_active = !status.is_active;
    status.updated_by = req.user.id;
    status.updated_at = Date.now();

    await status.save();

    res.status(200).json({
      success: true,
      data: status
    });
  } catch (err) {
    next(err);
  }
};