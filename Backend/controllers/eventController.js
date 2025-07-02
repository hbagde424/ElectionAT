const Event = require('../models/Event');
const Division = require('../models/division');
const Parliament = require('../models/parliament');
const Assembly = require('../models/assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = Event.find()
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'booth_number')
      .populate('created_by', 'name')
      .populate('updated_by', 'name')
      .sort({ start_date: -1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({ $text: { $search: req.query.search } });
    }

    // Filter by type
    if (req.query.type) {
      query = query.where('type').equals(req.query.type);
    }

    // Filter by status
    if (req.query.status) {
      query = query.where('status').equals(req.query.status);
    }

    // Filter by division
    if (req.query.division_id) {
      query = query.where('division_id').equals(req.query.division_id);
    }

    // Filter by parliament
    if (req.query.parliament_id) {
      query = query.where('parliament_id').equals(req.query.parliament_id);
    }

    // Filter by assembly
    if (req.query.assembly_id) {
      query = query.where('assembly_id').equals(req.query.assembly_id);
    }

    // Filter by block
    if (req.query.block_id) {
      query = query.where('block_id').equals(req.query.block_id);
    }

    // Filter by booth
    if (req.query.booth_id) {
      query = query.where('booth_id').equals(req.query.booth_id);
    }

    // Filter by date range
    if (req.query.startDate) {
      const startDate = new Date(req.query.startDate);
      query = query.where('start_date').gte(startDate);
    }
    if (req.query.endDate) {
      const endDate = new Date(req.query.endDate);
      query = query.where('end_date').lte(endDate);
    }

    const events = await query.skip(skip).limit(limit).exec();
    const total = await Event.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: events
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'booth_number')
      .populate('created_by', 'name')
      .populate('updated_by', 'name');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create event
// @route   POST /api/events
// @access  Private (Admin/Organizer)
exports.createEvent = async (req, res, next) => {
  try {
    // Verify all references exist
    const [
      division, parliament, assembly, block, booth
    ] = await Promise.all([
      Division.findById(req.body.division_id),
      Parliament.findById(req.body.parliament_id),
      Assembly.findById(req.body.assembly_id),
      Block.findById(req.body.block_id),
      Booth.findById(req.body.booth_id)
    ]);

    if (!division || !parliament || !assembly || !block || !booth) {
      return res.status(400).json({
        success: false,
        message: 'One or more references are invalid'
      });
    }

    // Add created_by from authenticated user
    req.body.created_by = req.user.id;

    // Validate date range
    if (new Date(req.body.start_date) > new Date(req.body.end_date)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    const event = await Event.create(req.body);

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Admin/Organizer)
exports.updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Verify all references exist if being updated
    if (req.body.division_id || req.body.parliament_id || req.body.assembly_id || 
        req.body.block_id || req.body.booth_id) {
      const [
        division, parliament, assembly, block, booth
      ] = await Promise.all([
        req.body.division_id ? Division.findById(req.body.division_id) : Promise.resolve(true),
        req.body.parliament_id ? Parliament.findById(req.body.parliament_id) : Promise.resolve(true),
        req.body.assembly_id ? Assembly.findById(req.body.assembly_id) : Promise.resolve(true),
        req.body.block_id ? Block.findById(req.body.block_id) : Promise.resolve(true),
        req.body.booth_id ? Booth.findById(req.body.booth_id) : Promise.resolve(true)
      ]);

      if (division === null || parliament === null || assembly === null || 
          block === null || booth === null) {
        return res.status(400).json({
          success: false,
          message: 'One or more references are invalid'
        });
      }
    }

    // Validate date range if being updated
    if (req.body.start_date || req.body.end_date) {
      const startDate = req.body.start_date ? new Date(req.body.start_date) : event.start_date;
      const endDate = req.body.end_date ? new Date(req.body.end_date) : event.end_date;
      
      if (startDate > endDate) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }

    // Add updated_by from authenticated user
    req.body.updated_by = req.user.id;

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    .populate('division_id', 'name')
    .populate('parliament_id', 'name')
    .populate('assembly_id', 'name')
    .populate('block_id', 'name')
    .populate('booth_id', 'booth_number')
    .populate('created_by', 'name')
    .populate('updated_by', 'name');

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin)
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    await event.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get events by booth
// @route   GET /api/events/booth/:boothId
// @access  Public
exports.getEventsByBooth = async (req, res, next) => {
  try {
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const events = await Event.find({ booth_id: req.params.boothId })
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'booth_number')
      .sort({ start_date: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get events by type
// @route   GET /api/events/type/:type
// @access  Public
exports.getEventsByType = async (req, res, next) => {
  try {
    const validTypes = ['event', 'campaign', 'activity'];
    if (!validTypes.includes(req.params.type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event type'
      });
    }

    const events = await Event.find({ type: req.params.type })
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'booth_number')
      .sort({ start_date: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (err) {
    next(err);
  }
};