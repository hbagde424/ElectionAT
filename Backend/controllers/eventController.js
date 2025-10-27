const Event = require('../models/Event');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const Assembly = require('../models/Assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');
const State = require('../models/state');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Basic query
    let query = Event.find()
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('state_id', 'name')
      .populate('booth_id', 'booth_number name')
      .populate('panchayat_id', 'panchayat_name')
      .populate('village_id', 'village_name')
      .populate('falliya_id', 'falliya_name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
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


    // Helper function for ObjectId or name lookup (normalize dashes to spaces)
    const handleIdOrName = async (param, model, nameField = 'name') => {
      if (!req.query[param]) return null;
      let value = req.query[param];
      value = value.replace(/-/g, ' ');
      const isObjectId = /^[a-f\d]{24}$/i.test(value);
      if (isObjectId) {
        return value;
      } else {
        const doc = await model.findOne({ [nameField]: { $regex: value, $options: 'i' } });
        return doc ? doc._id : null;
      }
    };

    // State
    if (req.query.state_id || req.query.state) {
      const stateId = await handleIdOrName('state_id', State) || await handleIdOrName('state', State);
      if (stateId) {
        query = query.where('state_id').equals(stateId);
      } else if (req.query.state_id || req.query.state) {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Division
    if (req.query.division_id || req.query.division) {
      const divisionId = await handleIdOrName('division_id', Division) || await handleIdOrName('division', Division);
      if (divisionId) {
        query = query.where('division_id').equals(divisionId);
      } else if (req.query.division_id || req.query.division) {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Parliament
    if (req.query.parliament_id || req.query.parliament) {
      const parliamentId = await handleIdOrName('parliament_id', Parliament) || await handleIdOrName('parliament', Parliament);
      if (parliamentId) {
        query = query.where('parliament_id').equals(parliamentId);
      } else if (req.query.parliament_id || req.query.parliament) {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Assembly
    if (req.query.assembly_id || req.query.assembly) {
      const assemblyId = await handleIdOrName('assembly_id', Assembly) || await handleIdOrName('assembly', Assembly);
      if (assemblyId) {
        query = query.where('assembly_id').equals(assemblyId);
      } else if (req.query.assembly_id || req.query.assembly) {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Block
    if (req.query.block_id || req.query.block) {
      const blockId = await handleIdOrName('block_id', Block) || await handleIdOrName('block', Block);
      if (blockId) {
        query = query.where('block_id').equals(blockId);
      } else if (req.query.block_id || req.query.block) {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Booth
    if (req.query.booth_id || req.query.booth) {
      const boothId = await handleIdOrName('booth_id', Booth) || await handleIdOrName('booth', Booth);
      if (boothId) {
        query = query.where('booth_id').equals(boothId);
      } else if (req.query.booth_id || req.query.booth) {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Panchayat
    if (req.query.panchayat_id || req.query.panchayat) {
      const panchayatId = await handleIdOrName('panchayat_id', require('../models/Panchayat'), 'panchayat_name') || await handleIdOrName('panchayat', require('../models/Panchayat'), 'panchayat_name');
      if (panchayatId) {
        query = query.where('panchayat_id').equals(panchayatId);
      }
    }

    // Village
    if (req.query.village_id || req.query.village) {
      const villageId = await handleIdOrName('village_id', require('../models/Village'), 'village_name') || await handleIdOrName('village', require('../models/Village'), 'village_name');
      if (villageId) {
        query = query.where('village_id').equals(villageId);
      }
    }

    // Falliya
    if (req.query.falliya_id || req.query.falliya) {
      const falliyaId = await handleIdOrName('falliya_id', require('../models/Falliya'), 'falliya_name') || await handleIdOrName('falliya', require('../models/Falliya'), 'falliya_name');
      if (falliyaId) {
        query = query.where('falliya_id').equals(falliyaId);
      }
    }

    // Year filter
    if (req.query.year) {
      query = query.where('year').equals(parseInt(req.query.year));
    }

    // Apply user hierarchy restriction when an authenticated user is present
    // Precedence: booth -> block -> assembly -> parliament -> division -> state
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      if (h.booth_id) query = query.where('booth_id').equals(h.booth_id);
      else if (h.block_id) query = query.where('block_id').equals(h.block_id);
      else if (h.assembly_id) query = query.where('assembly_id').equals(h.assembly_id);
      else if (h.parliament_id) query = query.where('parliament_id').equals(h.parliament_id);
      else if (h.division_id) query = query.where('division_id').equals(h.division_id);
      else if (h.state_id) query = query.where('state_id').equals(h.state_id);
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
      .populate('booth_id', 'booth_number name')
      .populate('panchayat_id', 'panchayat_name')
      .populate('village_id', 'village_name')
      .populate('falliya_id', 'falliya_name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Enforce user hierarchy: only allow access if event is within user's scope
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      const outOfScope = (h.booth_id && event.booth_id && event.booth_id.toString() !== h.booth_id.toString()) ||
        (h.block_id && event.block_id && event.block_id.toString() !== h.block_id.toString()) ||
        (h.assembly_id && event.assembly_id && event.assembly_id.toString() !== h.assembly_id.toString()) ||
        (h.parliament_id && event.parliament_id && event.parliament_id.toString() !== h.parliament_id.toString()) ||
        (h.division_id && event.division_id && event.division_id.toString() !== h.division_id.toString()) ||
        (h.state_id && event.state_id && event.state_id.toString() !== h.state_id.toString());

      if (outOfScope) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
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
    // Sanitize optional fields: treat empty string as undefined
    ['panchayat_id', 'village_id', 'falliya_id', 'year'].forEach((k) => {
      if (req.body && (req.body[k] === '' || req.body[k] === null)) delete req.body[k];
    });

    // Verify all references exist
    const [
      state, division, parliament, assembly, block, booth
    ] = await Promise.all([
      State.findById(req.body.state_id),
      Division.findById(req.body.division_id),
      Parliament.findById(req.body.parliament_id),
      Assembly.findById(req.body.assembly_id),
      Block.findById(req.body.block_id),
      Booth.findById(req.body.booth_id)
    ]);

    if (!state || !division || !parliament || !assembly || !block || !booth) {
      return res.status(400).json({
        success: false,
        message: 'One or more references are invalid'
      });
    }

    // Add created_by from authenticated user
    req.body.created_by = req.user.id;
    req.body.description = req.body.description || '';

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
    // Sanitize optional fields: treat empty string as undefined
    ['panchayat_id', 'village_id', 'falliya_id', 'year'].forEach((k) => {
      if (req.body && (req.body[k] === '' || req.body[k] === null)) delete req.body[k];
    });

    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Verify all references exist if being updated
    if (req.body.state_id || req.body.division_id || req.body.parliament_id ||
      req.body.assembly_id || req.body.block_id || req.body.booth_id) {
      const [
        state, division, parliament, assembly, block, booth
      ] = await Promise.all([
        req.body.state_id ? State.findById(req.body.state_id) : Promise.resolve(true),
        req.body.division_id ? Division.findById(req.body.division_id) : Promise.resolve(true),
        req.body.parliament_id ? Parliament.findById(req.body.parliament_id) : Promise.resolve(true),
        req.body.assembly_id ? Assembly.findById(req.body.assembly_id) : Promise.resolve(true),
        req.body.block_id ? Block.findById(req.body.block_id) : Promise.resolve(true),
        req.body.booth_id ? Booth.findById(req.body.booth_id) : Promise.resolve(true)
      ]);

      if (state === null || division === null || parliament === null ||
        assembly === null || block === null || booth === null) {
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
    req.body.description = req.body.description || '';
    req.body.updated_at = new Date();

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'booth_number name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

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

  // Use model-level deletion to avoid issues when `event` is not a full mongoose document
  await Event.findByIdAndDelete(req.params.id);

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
      .populate('booth_id', 'booth_number name')
      .sort({ start_date: -1 });
    // If user present and not superAdmin, ensure booth is within their scope
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      if (h.booth_id && h.booth_id.toString() !== req.params.boothId) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
      if (h.block_id && h.block_id.toString() !== (booth.block_id?.toString())) {
        // Note: booth variable not defined here; fetch booth for validation
        const boothDoc = await Booth.findById(req.params.boothId);
        if (boothDoc && boothDoc.block_id && h.block_id.toString() !== boothDoc.block_id.toString()) {
          return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
        }
      }
    }

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
      .populate('booth_id', 'booth_number name')
      .sort({ start_date: -1 });
    // Apply hierarchy filter when applicable
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      const baseFilter = { type: req.params.type };
      if (h.booth_id) baseFilter.booth_id = h.booth_id;
      else if (h.block_id) baseFilter.block_id = h.block_id;
      else if (h.assembly_id) baseFilter.assembly_id = h.assembly_id;
      else if (h.parliament_id) baseFilter.parliament_id = h.parliament_id;
      else if (h.division_id) baseFilter.division_id = h.division_id;
      else if (h.state_id) baseFilter.state_id = h.state_id;

      const eventsScoped = await Event.find(baseFilter)
        .populate('division_id', 'name')
        .populate('parliament_id', 'name')
        .populate('assembly_id', 'name')
        .populate('block_id', 'name')
        .populate('booth_id', 'booth_number name')
        .sort({ start_date: -1 });

      return res.status(200).json({ success: true, count: eventsScoped.length, data: eventsScoped });
    }

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (err) {
    next(err);
  }
};