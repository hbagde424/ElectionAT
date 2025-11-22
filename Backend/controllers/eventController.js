const Event = require('../models/Event');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const Assembly = require('../models/Assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');
const State = require('../models/state');

// @desc    Get all events
// @route   GET /api/events
// @access  Private (Requires authentication via serviceToken)
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
      // Extract IDs from populated objects or direct ID values
      const boothId = h.booth?._id || h.booth;
      const blockId = h.block?._id || h.block;
      const assemblyId = h.assembly?._id || h.assembly;
      const parliamentId = h.parliament?._id || h.parliament;
      const divisionId = h.division?._id || h.division;
      const stateId = h.state?._id || h.state;

      if (boothId) query = query.where('booth_id').equals(boothId);
      else if (blockId) query = query.where('block_id').equals(blockId);
      else if (assemblyId) query = query.where('assembly_id').equals(assemblyId);
      else if (parliamentId) query = query.where('parliament_id').equals(parliamentId);
      else if (divisionId) query = query.where('division_id').equals(divisionId);
      else if (stateId) query = query.where('state_id').equals(stateId);
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
// @access  Private (Requires authentication via serviceToken)
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
      // Extract IDs from populated objects or direct ID values
      const boothId = h.booth?._id || h.booth;
      const blockId = h.block?._id || h.block;
      const assemblyId = h.assembly?._id || h.assembly;
      const parliamentId = h.parliament?._id || h.parliament;
      const divisionId = h.division?._id || h.division;
      const stateId = h.state?._id || h.state;

      const outOfScope = (boothId && event.booth_id && event.booth_id.toString() !== boothId.toString()) ||
        (blockId && event.block_id && event.block_id.toString() !== blockId.toString()) ||
        (assemblyId && event.assembly_id && event.assembly_id.toString() !== assemblyId.toString()) ||
        (parliamentId && event.parliament_id && event.parliament_id.toString() !== parliamentId.toString()) ||
        (divisionId && event.division_id && event.division_id.toString() !== divisionId.toString()) ||
        (stateId && event.state_id && event.state_id.toString() !== stateId.toString());

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

    // Handle media files if uploaded
    if (req.files && req.files.length > 0) {
      req.body.media = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        type: file.mimetype.startsWith('image/') ? 'photo' : 'video',
        caption: '', // Caption will be added from frontend if needed
        uploaded_at: new Date()
      }));
    } else if (req.body.media && typeof req.body.media === 'string') {
      // Handle existing media data if editing
      try {
        req.body.media = JSON.parse(req.body.media);
      } catch (e) {
        req.body.media = [];
      }
    }

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

    // Handle media files if uploaded
    if (req.files && req.files.length > 0) {
      const newMedia = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        type: file.mimetype.startsWith('image/') ? 'photo' : 'video',
        caption: '',
        uploaded_at: new Date()
      }));

      // Merge with existing media if any
      if (event.media && event.media.length > 0) {
        req.body.media = [...event.media, ...newMedia];
      } else {
        req.body.media = newMedia;
      }
    } else if (req.body.media && typeof req.body.media === 'string') {
      try {
        req.body.media = JSON.parse(req.body.media);
      } catch (e) {
        // Keep existing media if parsing fails
        req.body.media = event.media || [];
      }
    }

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
      // Extract IDs from populated objects or direct ID values
      const boothId = h.booth?._id || h.booth;
      const blockId = h.block?._id || h.block;
      const assemblyId = h.assembly?._id || h.assembly;
      const parliamentId = h.parliament?._id || h.parliament;
      const divisionId = h.division?._id || h.division;
      const stateId = h.state?._id || h.state;

      if (boothId && boothId.toString() !== req.params.boothId) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
      if (blockId) {
        // Note: booth variable not defined here; fetch booth for validation
        const boothDoc = await Booth.findById(req.params.boothId);
        if (boothDoc && boothDoc.block_id && blockId.toString() !== boothDoc.block_id.toString()) {
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
      // Extract IDs from populated objects or direct ID values
      const boothId = h.booth?._id || h.booth;
      const blockId = h.block?._id || h.block;
      const assemblyId = h.assembly?._id || h.assembly;
      const parliamentId = h.parliament?._id || h.parliament;
      const divisionId = h.division?._id || h.division;
      const stateId = h.state?._id || h.state;

      if (boothId) baseFilter.booth_id = boothId;
      else if (blockId) baseFilter.block_id = blockId;
      else if (assemblyId) baseFilter.assembly_id = assemblyId;
      else if (parliamentId) baseFilter.parliament_id = parliamentId;
      else if (divisionId) baseFilter.division_id = divisionId;
      else if (stateId) baseFilter.state_id = stateId;

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

// @desc    Bulk import events (client sends parsed rows)
// @route   POST /api/events/import
// @access  Private (Admin only)
exports.importEvents = async (req, res, next) => {
  const { resolveGeographicHierarchy, validateHierarchy, toKey, toLower } = require('./importHelpers');
  
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : null;
    if (!rows) {
      return res.status(400).json({ success: false, message: 'rows array is required in body' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const summary = { total: rows.length, created: 0, skipped: 0, errors: [] };
    const created = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] || {};
      try {
        const name = toKey(r.name);
        const type = toLower(r.type);
        const status = toLower(r.status) || 'incomplete';
        const description = toKey(r.description || '');
        const location = toKey(r.location);
        const start_date = r.start_date ? new Date(r.start_date) : null;
        const end_date = r.end_date ? new Date(r.end_date) : null;
        const year = r.year ? parseInt(r.year) : null;

        if (!name || !type || !location || !start_date || !end_date) {
          throw new Error('name, type, location, start_date, end_date are required');
        }
        if (!['event', 'campaign', 'activity'].includes(type)) {
          throw new Error('type must be event, campaign, or activity');
        }
        if (!['done', 'incomplete', 'cancelled', 'postponed'].includes(status)) {
          throw new Error('status must be done, incomplete, cancelled, or postponed');
        }

        const geo = await resolveGeographicHierarchy(r);
        const errors = validateHierarchy(geo, ['state', 'division', 'parliament', 'assembly', 'block', 'booth']);
        if (errors.length > 0) {
          throw new Error(errors.join(', '));
        }

        const eventData = {
          name,
          type,
          status,
          description,
          start_date,
          end_date,
          location,
          state_id: geo.state._id,
          division_id: geo.division._id,
          parliament_id: geo.parliament._id,
          assembly_id: geo.assembly._id,
          block_id: geo.block._id,
          booth_id: geo.booth._id,
          created_by: req.user.id,
          updated_by: req.user.id
        };

        // Optional fields
        if (year && year >= 2020 && year <= 2030) {
          eventData.year = year;
        }
        if (geo.panchayat) {
          eventData.panchayat_id = geo.panchayat._id;
        }
        if (geo.village) {
          eventData.village_id = geo.village._id;
        }
        if (geo.falliya) {
          eventData.falliya_id = geo.falliya._id;
        }

        const event = await Event.create(eventData);
        created.push(event._id);
        summary.created += 1;
      } catch (err) {
        summary.skipped += 1;
        summary.errors.push({ row: i + 1, message: err?.message || String(err) });
      }
    }

    return res.status(200).json({ success: true, ...summary, ids: created });
  } catch (err) {
    next(err);
  }
};