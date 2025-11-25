const PartyActivity = require('../models/partyActivity');
const Party = require('../models/party');
const State = require('../models/state');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const Assembly = require('../models/Assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');

// @desc    Get all party activities
// @route   GET /api/party-activities
// @access  Private (Requires authentication via serviceToken)
exports.getPartyActivities = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.all === 'true' ? 100000 : parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = PartyActivity.find()
      .populate('party_id', 'name')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('panchayat_id', 'panchayat_name')
      .populate('village_id', 'village_name')
      .populate('falliya_id', 'falliya_name')
      .populate('created_by', 'username name')
      .populate('updated_by', 'username name')
      .sort({ activity_date: -1 });

    // Search
    if (req.query.search) {
      query = query.find({
        $or: [
          { title: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } },
          { location: { $regex: req.query.search, $options: 'i' } }
        ]
      });
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

    // Party
    if (req.query.party) {
      const partyId = await handleIdOrName('party', Party);
      if (partyId) {
        query = query.where('party_id').equals(partyId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // State
    if (req.query.state || req.query.state_id || req.query.state_no) {
      // Support state by ID, name or numeric code (state_no)
      let stateId = null;
      if (req.query.state_no) {
        const sn = Number(String(req.query.state_no).trim());
        if (!isNaN(sn)) {
          const st = await State.findOne({ state_no: sn });
          if (st) stateId = st._id;
        }
      }
      stateId = stateId || await handleIdOrName('state', State) || await handleIdOrName('state_id', State);
      if (stateId) {
        query = query.where('state_id').equals(stateId);
      } else if (req.query.state || req.query.state_id || req.query.state_no) {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Division
    if (req.query.division || req.query.division_id || req.query.division_code) {
      let divisionId = null;
      if (req.query.division_code) {
        const dc = String(req.query.division_code).trim();
        if (dc) {
          const div = await Division.findOne({ division_code: { $regex: `^${dc}$`, $options: 'i' } });
          if (div) divisionId = div._id;
        }
      }
      divisionId = divisionId || await handleIdOrName('division', Division) || await handleIdOrName('division_id', Division);
      if (divisionId) {
        query = query.where('division_id').equals(divisionId);
      } else if (req.query.division || req.query.division_id || req.query.division_code) {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Parliament
    if (req.query.parliament || req.query.parliament_id || req.query.parliament_no) {
      let parliamentId = null;
      if (req.query.parliament_no) {
        const pn = Number(String(req.query.parliament_no).trim());
        if (!isNaN(pn)) {
          // prefer parliament within state if provided
          if (req.query.state || req.query.state_id || req.query.state_no) {
            let stateDoc = null;
            if (req.query.state_no) stateDoc = await State.findOne({ state_no: Number(String(req.query.state_no).trim()) });
            stateDoc = stateDoc || (await handleIdOrName('state', State)) || (await handleIdOrName('state_id', State));
            if (stateDoc) parliamentId = (await Parliament.findOne({ parliament_no: pn, state_id: stateDoc }))?._id || null;
          }
          if (!parliamentId) {
            const p = await Parliament.findOne({ parliament_no: pn });
            if (p) parliamentId = p._id;
          }
        }
      }
      parliamentId = parliamentId || await handleIdOrName('parliament', Parliament) || await handleIdOrName('parliament_id', Parliament);
      if (parliamentId) {
        query = query.where('parliament_id').equals(parliamentId);
      } else if (req.query.parliament || req.query.parliament_id || req.query.parliament_no) {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Assembly
    if (req.query.assembly || req.query.assembly_id || req.query.AC_NO || req.query.ac_no || req.query.acno) {
      let assemblyId = null;
      const ac = req.query.AC_NO || req.query.ac_no || req.query.acno;
      if (ac) {
        const av = String(ac).trim();
        // prefer assembly within parliament/state when available
        if (req.query.parliament || req.query.parliament_id || req.query.parliament_no) {
          const parliamentId = await (async () => {
            if (req.query.parliament_no) {
              const pn = Number(String(req.query.parliament_no).trim());
              if (!isNaN(pn)) {
                const p = await Parliament.findOne({ parliament_no: pn });
                return p ? p._id : null;
              }
            }
            return (await handleIdOrName('parliament', Parliament)) || (await handleIdOrName('parliament_id', Parliament));
          })();
          if (parliamentId) assemblyId = (await Assembly.findOne({ AC_NO: av, parliament_id: parliamentId }))?._id || null;
        }
        if (!assemblyId && (req.query.state || req.query.state_id || req.query.state_no)) {
          const stateDoc = req.query.state_no ? await State.findOne({ state_no: Number(String(req.query.state_no).trim()) }) : ((await handleIdOrName('state', State)) || (await handleIdOrName('state_id', State)));
          if (stateDoc) assemblyId = (await Assembly.findOne({ AC_NO: av, state_id: stateDoc }))?._id || null;
        }
        if (!assemblyId) {
          const a = await Assembly.findOne({ AC_NO: av });
          if (a) assemblyId = a._id;
        }
      }
      assemblyId = assemblyId || await handleIdOrName('assembly', Assembly) || await handleIdOrName('assembly_id', Assembly);
      if (assemblyId) {
        query = query.where('assembly_id').equals(assemblyId);
      } else if (req.query.assembly || req.query.assembly_id || req.query.AC_NO || req.query.ac_no || req.query.acno) {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Block
    if (req.query.block || req.query.block_id || req.query.block_no || req.query.block_number) {
      let blockId = null;
      const bn = req.query.block_no ?? req.query.block_number;
      if (bn) {
        const bnum = Number(String(bn).trim());
        if (!isNaN(bnum)) {
          const bdoc = await Block.findOne({ block_no: bnum });
          if (bdoc) blockId = bdoc._id;
        }
      }
      blockId = blockId || await handleIdOrName('block', Block) || await handleIdOrName('block_id', Block);
      if (blockId) {
        query = query.where('block_id').equals(blockId);
      } else if (req.query.block || req.query.block_id || req.query.block_no || req.query.block_number) {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Booth
    if (req.query.booth || req.query.booth_id || req.query.booth_number) {
      let boothId = null;
      if (req.query.booth_number) {
        const bn = String(req.query.booth_number).trim();
        if (bn) {
          const bdoc = await Booth.findOne({ booth_number: bn });
          if (bdoc) boothId = bdoc._id;
        }
      }
      boothId = boothId || await handleIdOrName('booth', Booth) || await handleIdOrName('booth_id', Booth);
      if (boothId) {
        query = query.where('booth_id').equals(boothId);
      } else if (req.query.booth || req.query.booth_id || req.query.booth_number) {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // If userHierarchy exists, restrict by user's scope (most specific first) unless superAdmin
    if (req.userHierarchy && req.user && req.user.role !== 'superAdmin') {
      const uh = req.userHierarchy;
      if (uh.booth) query = query.where('booth_id').equals(uh.booth._id);
      else if (uh.block) query = query.where('block_id').equals(uh.block._id);
      else if (uh.assembly) query = query.where('assembly_id').equals(uh.assembly._id);
      else if (uh.parliament) query = query.where('parliament_id').equals(uh.parliament._id);
      else if (uh.division) query = query.where('division_id').equals(uh.division._id);
      else if (uh.state) query = query.where('state_id').equals(uh.state._id);
    }

    // Activity Type
    if (req.query.activity_type) {
      query = query.where('activity_type').equals(req.query.activity_type);
    }

    // Status
    if (req.query.status) {
      query = query.where('status').equals(req.query.status);
    }

    // Year filter
    if (req.query.year) {
      const year = parseInt(req.query.year);
      if (!isNaN(year)) {
        query = query.where('year').equals(year);
      }
    }

    // Date range
    if (req.query.start_date && req.query.end_date) {
      query = query.where('activity_date').gte(new Date(req.query.start_date))
        .lte(new Date(req.query.end_date));
    } else if (req.query.start_date) {
      query = query.where('activity_date').gte(new Date(req.query.start_date));
    } else if (req.query.end_date) {
      query = query.where('activity_date').lte(new Date(req.query.end_date));
    }

    const activities = await query.skip(skip).limit(limit).exec();
    const total = await PartyActivity.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: activities.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: activities
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single party activity
// @route   GET /api/party-activities/:id
// @access  Public
exports.getPartyActivity = async (req, res, next) => {
  try {
    const activity = await PartyActivity.findById(req.params.id)
      .populate('party_id', 'name')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('panchayat_id', 'panchayat_name')
      .populate('village_id', 'village_name')
      .populate('falliya_id', 'falliya_name')
      .populate('created_by', 'username name')
      .populate('updated_by', 'username name');

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Party activity not found'
      });
    }

    // Enforce user hierarchy for single resource
    if (req.userHierarchy && req.user && req.user.role !== 'superAdmin') {
      const uh = req.userHierarchy;
      const outside = (
        (uh.booth && activity.booth_id?.toString() !== uh.booth._id.toString()) ||
        (uh.block && activity.block_id?.toString() !== uh.block._id.toString()) ||
        (uh.assembly && activity.assembly_id?.toString() !== uh.assembly._id.toString()) ||
        (uh.parliament && activity.parliament_id?.toString() !== uh.parliament._id.toString()) ||
        (uh.division && activity.division_id?.toString() !== uh.division._id.toString()) ||
        (uh.state && activity.state_id?.toString() !== uh.state._id.toString())
      );
      if (outside) {
        return res.status(403).json({ success: false, message: 'Access denied: geographic restriction' });
      }
    }

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create party activity
// @route   POST /api/party-activities
// @access  Private (Admin only)
exports.createPartyActivity = async (req, res, next) => {
  try {
    // Sanitize optional fields: treat empty string as undefined
    ['panchayat_id', 'village_id', 'falliya_id', 'year'].forEach((k) => {
      if (req.body && (req.body[k] === '' || req.body[k] === null)) delete req.body[k];
    });

    const [
      party,
      state,
      division,
      parliament,
      assembly,
      block,
      booth
    ] = await Promise.all([
      Party.findById(req.body.party_id),
      State.findById(req.body.state_id),
      req.body.division_id ? Division.findById(req.body.division_id) : Promise.resolve(null),
      Parliament.findById(req.body.parliament_id),
      req.body.assembly_id ? Assembly.findById(req.body.assembly_id) : Promise.resolve(null),
      req.body.block_id ? Block.findById(req.body.block_id) : Promise.resolve(null),
      req.body.booth_id ? Booth.findById(req.body.booth_id) : Promise.resolve(null)
    ]);

    if (!party) return res.status(400).json({ success: false, message: 'Party not found' });
    if (!state) return res.status(400).json({ success: false, message: 'State not found' });
    if (req.body.division_id && !division) return res.status(400).json({ success: false, message: 'Division not found' });
    if (!parliament) return res.status(400).json({ success: false, message: 'Parliament not found' });
    if (req.body.assembly_id && !assembly) return res.status(400).json({ success: false, message: 'Assembly not found' });
    if (req.body.block_id && !block) return res.status(400).json({ success: false, message: 'Block not found' });
    if (req.body.booth_id && !booth) return res.status(400).json({ success: false, message: 'Booth not found' });

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    // Handle media files if uploaded
    if (req.files && req.files.length > 0) {
      req.body.media = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        type: file.mimetype.startsWith('image/') ? 'photo' : 'video',
        caption: '',
        uploaded_at: new Date()
      }));
    } else if (req.body.media && typeof req.body.media === 'string') {
      try {
        req.body.media = JSON.parse(req.body.media);
      } catch (e) {
        req.body.media = [];
      }
    }

    // Handle media_links - parse and filter empty values
    if (req.body.media_links) {
      try {
        const links = typeof req.body.media_links === 'string' 
          ? JSON.parse(req.body.media_links) 
          : req.body.media_links;
        req.body.media_links = Array.isArray(links) 
          ? links.filter(link => link && link.trim() !== '') 
          : [];
      } catch (e) {
        req.body.media_links = [];
      }
    }

    const activity = await PartyActivity.create({
      ...req.body,
      created_by: req.user.id,
      description: req.body.description || '',
    });

    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update party activity
// @route   PUT /api/party-activities/:id
// @access  Private (Admin only)
exports.updatePartyActivity = async (req, res, next) => {
  try {
    // Sanitize optional fields - remove empty strings to prevent ObjectId casting errors
    ['panchayat_id', 'village_id', 'falliya_id', 'year'].forEach((k) => {
      if (req.body && (req.body[k] === '' || req.body[k] === null)) delete req.body[k];
    });

    let activity = await PartyActivity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Party activity not found'
      });
    }

    // Verify references
    const verificationPromises = [];
    if (req.body.party_id) verificationPromises.push(Party.findById(req.body.party_id));
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.block_id) verificationPromises.push(Block.findById(req.body.block_id));
    if (req.body.booth_id) verificationPromises.push(Booth.findById(req.body.booth_id));

    const verificationResults = await Promise.all(verificationPromises);

    for (const result of verificationResults) {
      if (!result) {
        return res.status(400).json({
          success: false,
          message: 'Referenced document not found'
        });
      }
    }

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
      if (activity.media && activity.media.length > 0) {
        req.body.media = [...activity.media, ...newMedia];
      } else {
        req.body.media = newMedia;
      }
    } else if (req.body.media && typeof req.body.media === 'string') {
      try {
        req.body.media = JSON.parse(req.body.media);
      } catch (e) {
        req.body.media = activity.media || [];
      }
    }

    // Handle media_links - parse and filter empty values
    if (req.body.media_links) {
      try {
        const links = typeof req.body.media_links === 'string' 
          ? JSON.parse(req.body.media_links) 
          : req.body.media_links;
        req.body.media_links = Array.isArray(links) 
          ? links.filter(link => link && link.trim() !== '') 
          : [];
      } catch (e) {
        req.body.media_links = activity.media_links || [];
      }
    }

    activity = await PartyActivity.findByIdAndUpdate(req.params.id, {
      ...req.body,
      updated_by: req.user.id,
      description: req.body.description || '',
    }, {
      new: true,
      runValidators: true
    })
      .populate('party_id', 'name')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('panchayat_id', 'panchayat_name')
      .populate('village_id', 'village_name')
      .populate('falliya_id', 'falliya_name')
      .populate('created_by', 'username name')
      .populate('updated_by', 'username name');

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete party activity
// @route   DELETE /api/party-activities/:id
// @access  Private (Admin only)
exports.deletePartyActivity = async (req, res, next) => {
  try {
    const activity = await PartyActivity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Party activity not found'
      });
    }

    await activity.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get party activities by party
// @route   GET /api/party-activities/party/:partyId
// @access  Public
exports.getPartyActivitiesByParty = async (req, res, next) => {
  try {
    const party = await Party.findById(req.params.partyId);
    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    const activities = await PartyActivity.find({ party_id: req.params.partyId })
      .sort({ activity_date: -1 })
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('panchayat_id', 'panchayat_name')
      .populate('village_id', 'village_name')
      .populate('falliya_id', 'falliya_name')
      .populate('created_by', 'username name');

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get upcoming party activities
// @route   GET /api/party-activities/upcoming
// @access  Public
exports.getUpcomingPartyActivities = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activities = await PartyActivity.find({
      activity_date: { $gte: today },
      status: 'scheduled'
    })
      .sort({ activity_date: 1 })
      .populate('party_id', 'name')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('panchayat_id', 'panchayat_name')
      .populate('village_id', 'village_name')
      .populate('falliya_id', 'falliya_name')
      .limit(10);

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Import party activities from Excel/CSV
// @route   POST /api/party-activities/import
// @access  Private (Admin only)
exports.importPartyActivities = async (req, res, next) => {
  try {
    const rows = req.body.rows || req.body.data;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No data provided. Expected array of rows.' });
    }

    const { resolveGeographicHierarchy, validateHierarchy } = require('./importHelpers');
    const results = { imported: 0, total: rows.length, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const geo = await resolveGeographicHierarchy(row);

        // Require full geographic hierarchy up to booth for accurate mapping
        const hierarchyErrors = validateHierarchy(geo, ['state', 'division', 'parliament', 'assembly', 'block', 'booth']);
        if (hierarchyErrors.length > 0) {
          results.errors.push({ row: i + 1, data: row, error: hierarchyErrors.join(', ') });
          continue;
        }

        // Resolve party (by id or name)
        let partyId = null;
        const Party = require('../models/party');
        if (row.party_id) partyId = row.party_id;
        else if (row.party) partyId = row.party;
        else if (row.party_name) {
          const p = await Party.findOne({ name: { $regex: `^${String(row.party_name).trim()}$`, $options: 'i' } });
          if (p) partyId = p._id;
        }
        if (!partyId) {
          results.errors.push({ row: i + 1, data: row, error: 'Party not found' });
          continue;
        }

        // Required fields: title, activity_date and activity_type (allow case/spacing variants)
        if (!row.title || !row.activity_date) {
          results.errors.push({ row: i + 1, data: row, error: 'title and activity_date are required' });
          continue;
        }

        // Normalize activity_type to allowed enum values
        const atRaw = row.activity_type || row.activityType || row.activity || '';
        let activityType = String(atRaw || '').trim().toLowerCase();
        if (activityType) {
          // common variants
          if (activityType.includes('door') && activityType.includes('door')) activityType = 'door_to_door';
          activityType = activityType.replace(/\s+/g, '_');
          if (activityType === 'press_conference' || activityType === 'pressconference' || activityType === 'press-conference') activityType = 'press_conference';
        }

        const allowedActivityTypes = ['rally', 'sabha', 'meeting', 'campaign', 'door_to_door', 'press_conference'];
        if (!activityType || !allowedActivityTypes.includes(activityType)) {
          results.errors.push({ row: i + 1, data: row, error: `Invalid or missing activity_type: ${atRaw}` });
          continue;
        }

        // Normalize status
        const stRaw = row.status || row.Status || '';
        let status = stRaw ? String(stRaw).trim().toLowerCase() : 'scheduled';
        if (status === 'canceled') status = 'cancelled';
        if (status === 'done') status = 'completed';
        const allowedStatuses = ['scheduled', 'completed', 'cancelled', 'postponed'];
        if (!allowedStatuses.includes(status)) {
          results.errors.push({ row: i + 1, data: row, error: `Invalid status: ${stRaw}` });
          continue;
        }

        // Parse activity_date and end_date
        const activityDate = new Date(row.activity_date);
        if (isNaN(activityDate.getTime())) {
          results.errors.push({ row: i + 1, data: row, error: `Invalid activity_date: ${row.activity_date}` });
          continue;
        }
        const endDate = row.end_date ? new Date(row.end_date) : null;
        if (endDate && isNaN(endDate.getTime())) {
          results.errors.push({ row: i + 1, data: row, error: `Invalid end_date: ${row.end_date}` });
          continue;
        }

        // Build activity payload
        const activityPayload = {
          title: row.title,
          activity_type: activityType,
          description: row.description || row.Description || '',
          activity_date: activityDate,
          end_date: endDate,
          location: row.location || '',
          status,
          attendance_count: row.attendance_count ? Number(row.attendance_count) : undefined,
          media_coverage: (String(row.media_coverage || '').toLowerCase() === 'yes') || row.media_coverage === true,
          media_links: row.media_links ? (Array.isArray(row.media_links) ? row.media_links : String(row.media_links).split(',').map(s => s.trim()).filter(Boolean)) : [],
          party_id: partyId,
          state_id: geo.state._id,
          division_id: geo.division._id,
          parliament_id: geo.parliament._id,
          assembly_id: geo.assembly._id,
          block_id: geo.block._id,
          booth_id: geo.booth._id,
          panchayat_id: geo.panchayat?._id || undefined,
          village_id: geo.village?._id || undefined,
          falliya_id: geo.falliya?._id || undefined,
          created_by: req.user ? req.user._id : undefined,
          year: row.year ? Number(row.year) : undefined
        };

        await PartyActivity.create(activityPayload);
        results.imported++;
      } catch (err) {
        results.errors.push({ row: i + 1, data: row, error: err.message || 'Failed to import activity' });
      }
    }

    res.status(200).json({ success: true, imported: results.imported, total: results.total, errors: results.errors });
  } catch (err) {
    next(err);
  }
};