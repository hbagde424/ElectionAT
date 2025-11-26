const EventType = require('../models/eventType');
const User = require('../models/User');

// @desc    Get all event types
// @route   GET /api/event-types
// @access  Public
exports.getEventTypes = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Base query
    let query = EventType.find()
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

    const eventTypes = await query.skip(skip).limit(limit).exec();
    const total = await EventType.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: eventTypes.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: eventTypes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single event type
// @route   GET /api/event-types/:id
// @access  Public
exports.getEventType = async (req, res, next) => {
  try {
    const eventType = await EventType.findById(req.params.id)
      .populate('created_by', 'username email')
      .populate('updated_by', 'username email');

    if (!eventType) {
      return res.status(404).json({
        success: false,
        message: 'Event type not found'
      });
    }

    res.status(200).json({
      success: true,
      data: eventType
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create event type
// @route   POST /api/event-types
// @access  Private (Admin only)
exports.createEventType = async (req, res, next) => {
  try {
    // Set created_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const eventTypeData = {
      ...req.body,
      created_by: req.user.id
    };

    const eventType = await EventType.create(eventTypeData);

    res.status(201).json({
      success: true,
      data: eventType
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Event type with this name already exists'
      });
    }
    next(err);
  }
};

// @desc    Update event type
// @route   PUT /api/event-types/:id
// @access  Private (Admin only)
exports.updateEventType = async (req, res, next) => {
  try {
    let eventType = await EventType.findById(req.params.id);

    if (!eventType) {
      return res.status(404).json({
        success: false,
        message: 'Event type not found'
      });
    }

    // Set updated_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    req.body.updated_by = req.user.id;

    eventType = await EventType.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: eventType
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Event type with this name already exists'
      });
    }
    next(err);
  }
};

// @desc    Delete event type
// @route   DELETE /api/event-types/:id
// @access  Private (Admin only)
exports.deleteEventType = async (req, res, next) => {
  try {
    const eventType = await EventType.findById(req.params.id);

    if (!eventType) {
      return res.status(404).json({
        success: false,
        message: 'Event type not found'
      });
    }

    await eventType.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle event type status
// @route   PATCH /api/event-types/:id/toggle-status
// @access  Private (Admin only)
exports.toggleEventTypeStatus = async (req, res, next) => {
  try {
    let eventType = await EventType.findById(req.params.id);

    if (!eventType) {
      return res.status(404).json({
        success: false,
        message: 'Event type not found'
      });
    }

    // Set updated_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    eventType.is_active = !eventType.is_active;
    eventType.updated_by = req.user.id;
    eventType.updated_at = Date.now();

    await eventType.save();

    res.status(200).json({
      success: true,
      data: eventType
    });
  } catch (err) {
    next(err);
  }
};