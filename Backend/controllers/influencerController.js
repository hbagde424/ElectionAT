const Influencer = require('../models/influencer');
const State = require('../models/state');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const Assembly = require('../models/Assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');
const Party = require('../models/party');

// @desc    Get all influencers
// @route   GET /api/influencers
// @access  Private (Requires authentication via serviceToken)
exports.getInfluencers = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Basic query
    let query = Influencer.find()
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('panchayat_id', 'panchayat_name')
      .populate('village_id', 'village_name')
      .populate('falliya_id', 'falliya_name')
      .populate('party_id', 'name abbreviation symbol')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ name: 1 });

    // Apply optional user hierarchy filtering if middleware provided and user is not superAdmin
    try {
      if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
        const h = req.userHierarchy;
        if (h.booth_id) {
          query = query.where('booth_id').equals(h.booth_id);
        } else if (h.block_id) {
          query = query.where('block_id').equals(h.block_id);
        } else if (h.assembly_id) {
          query = query.where('assembly_id').equals(h.assembly_id);
        } else if (h.parliament_id) {
          query = query.where('parliament_id').equals(h.parliament_id);
        } else if (h.division_id) {
          query = query.where('division_id').equals(h.division_id);
        } else if (h.state_id) {
          query = query.where('state_id').equals(h.state_id);
        }
      }
    } catch (e) {
      // ignore malformed hierarchy
    }

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { contact_number: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } }
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

    // State
    if (req.query.state) {
      const stateId = await handleIdOrName('state', State);
      if (stateId) {
        query = query.where('state_id').equals(stateId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Division
    if (req.query.division) {
      const divisionId = await handleIdOrName('division', Division);
      if (divisionId) {
        query = query.where('division_id').equals(divisionId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Parliament
    if (req.query.parliament) {
      const parliamentId = await handleIdOrName('parliament', Parliament);
      if (parliamentId) {
        query = query.where('parliament_id').equals(parliamentId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Assembly
    if (req.query.assembly) {
      const assemblyId = await handleIdOrName('assembly', Assembly);
      if (assemblyId) {
        query = query.where('assembly_id').equals(assemblyId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Block
    if (req.query.block) {
      const blockId = await handleIdOrName('block', Block);
      if (blockId) {
        query = query.where('block_id').equals(blockId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Booth
    if (req.query.booth) {
      const boothId = await handleIdOrName('booth', Booth);
      if (boothId) {
        query = query.where('booth_id').equals(boothId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Panchayat
    if (req.query.panchayat) {
      const panchayatId = await handleIdOrName('panchayat', require('../models/Panchayat'), 'panchayat_name');
      if (panchayatId) {
        query = query.where('panchayat_id').equals(panchayatId);
      }
    }

    // Village
    if (req.query.village) {
      const villageId = await handleIdOrName('village', require('../models/Village'), 'village_name');
      if (villageId) {
        query = query.where('village_id').equals(villageId);
      }
    }

    // Falliya
    if (req.query.falliya) {
      const falliyaId = await handleIdOrName('falliya', require('../models/Falliya'), 'falliya_name');
      if (falliyaId) {
        query = query.where('falliya_id').equals(falliyaId);
      }
    }

    // Year filter
    if (req.query.year) {
      query = query.where('year').equals(parseInt(req.query.year));
    }

    const influencers = await query.skip(skip).limit(limit).exec();
    const total = await Influencer.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: influencers.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: influencers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single influencer
// @route   GET /api/influencers/:id
// @access  Private (Requires authentication via serviceToken)
exports.getInfluencer = async (req, res, next) => {
  try {
    const influencer = await Influencer.findById(req.params.id)
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('panchayat_id', 'panchayat_name')
      .populate('village_id', 'village_name')
      .populate('falliya_id', 'falliya_name')
      .populate('party_id', 'name abbreviation symbol')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer not found'
      });
    }

    // Enforce single-resource scope for non-superAdmin users
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      const outOfScope = (h.booth_id && influencer.booth_id && influencer.booth_id.toString() !== h.booth_id)
        || (h.block_id && influencer.block_id && influencer.block_id.toString() !== h.block_id)
        || (h.assembly_id && influencer.assembly_id && influencer.assembly_id.toString() !== h.assembly_id)
        || (h.parliament_id && influencer.parliament_id && influencer.parliament_id.toString() !== h.parliament_id)
        || (h.division_id && influencer.division_id && influencer.division_id.toString() !== h.division_id)
        || (h.state_id && influencer.state_id && influencer.state_id.toString() !== h.state_id);
      if (outOfScope) return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    res.status(200).json({
      success: true,
      data: influencer
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create influencer
// @route   POST /api/influencers
// @access  Private (Admin only)
exports.createInfluencer = async (req, res, next) => {
  try {
    // Sanitize optional fields: treat empty string as undefined
    ['panchayat_id', 'village_id', 'falliya_id', 'year'].forEach((k) => {
      if (req.body && (req.body[k] === '' || req.body[k] === null)) delete req.body[k];
    });

    // Verify all references exist
    const verificationPromises = [
      State.findById(req.body.state_id),
      Division.findById(req.body.division_id),
      Parliament.findById(req.body.parliament_id),
      Assembly.findById(req.body.assembly_id),
      Block.findById(req.body.block_id),
      Booth.findById(req.body.booth_id)
    ];

    // Add party verification if party_id is provided
    if (req.body.party_id) {
      verificationPromises.push(Party.findById(req.body.party_id));
    }

    const [
      state,
      division,
      parliament,
      assembly,
      block,
      booth,
      party
    ] = await Promise.all(verificationPromises);

    if (!state) {
      return res.status(400).json({ success: false, message: 'State not found' });
    }
    if (!division) {
      return res.status(400).json({ success: false, message: 'Division not found' });
    }
    if (!parliament) {
      return res.status(400).json({ success: false, message: 'Parliament not found' });
    }
    if (!assembly) {
      return res.status(400).json({ success: false, message: 'Assembly not found' });
    }
    if (!block) {
      return res.status(400).json({ success: false, message: 'Block not found' });
    }
    if (!booth) {
      return res.status(400).json({ success: false, message: 'Booth not found' });
    }
    
    // Validate party if provided
    if (req.body.party_id && !party) {
      return res.status(400).json({ success: false, message: 'Party not found' });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const influencerData = {
      ...req.body,
      created_by: req.user.id,
      description: req.body.description || '',
      updated_by: req.user.id
    };

    const influencer = await Influencer.create(influencerData);

    res.status(201).json({
      success: true,
      data: influencer
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Influencer with this contact number or email already exists'
      });
    }
    next(err);
  }
};

// @desc    Update influencer
// @route   PUT /api/influencers/:id
// @access  Private (Admin only)
exports.updateInfluencer = async (req, res, next) => {
  try {
    // Sanitize optional fields: treat empty string as undefined
    ['panchayat_id', 'village_id', 'falliya_id', 'year'].forEach((k) => {
      if (req.body && (req.body[k] === '' || req.body[k] === null)) delete req.body[k];
    });

    let influencer = await Influencer.findById(req.params.id);

    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer not found'
      });
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.block_id) verificationPromises.push(Block.findById(req.body.block_id));
    if (req.body.booth_id) verificationPromises.push(Booth.findById(req.body.booth_id));
    if (req.body.party_id) verificationPromises.push(Party.findById(req.body.party_id));

    const verificationResults = await Promise.all(verificationPromises);

    for (const result of verificationResults) {
      if (!result) {
        return res.status(400).json({
          success: false,
          message: `${result.modelName} not found`
        });
      }
    }

    // Set updated_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }
    req.body.updated_by = req.user.id;
    req.body.description = req.body.description || '';
    req.body.updated_at = new Date();

    influencer = await Influencer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('party_id', 'name abbreviation symbol')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: influencer
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Influencer with this contact number or email already exists'
      });
    }
    next(err);
  }
};

// @desc    Delete influencer
// @route   DELETE /api/influencers/:id
// @access  Private (Admin only)
exports.deleteInfluencer = async (req, res, next) => {
  try {
    const influencer = await Influencer.findById(req.params.id);

    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer not found'
      });
    }

    await Influencer.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get influencers by booth
// @route   GET /api/influencers/booth/:boothId
// @access  Public
exports.getInfluencersByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const influencers = await Influencer.find({ booth_id: req.params.boothId })
      .sort({ name: 1 })
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('party_id', 'name abbreviation symbol')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: influencers.length,
      data: influencers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get influencers by assembly
// @route   GET /api/influencers/assembly/:assemblyId
// @access  Public
exports.getInfluencersByAssembly = async (req, res, next) => {
  try {
    // Verify assembly exists
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    const influencers = await Influencer.find({ assembly_id: req.params.assemblyId })
      .sort({ name: 1 })
      .populate('booth_id', 'name booth_number')
      .populate('party_id', 'name abbreviation symbol')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: influencers.length,
      data: influencers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk import influencers (client sends parsed rows)
// @route   POST /api/influencers/import
// @access  Private (Admin only)
exports.importInfluencers = async (req, res, next) => {
  const { resolveGeographicHierarchy, validateHierarchy, toKey } = require('./importHelpers');
  
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
        const contact_number = toKey(r.contact_number);
        const email = toKey(r.email || '');
        const full_address = toKey(r.full_address);
        const category = r.category || 'Other';
        const caste = r.caste || 'Not Specified';
        const status = r.status || 'Active';

        if (!name || !contact_number || !full_address) {
          throw new Error('name, contact_number, full_address are required');
        }

        const validCategories = ['Political Leader', 'Community Leader', 'Religious Leader', 'Business Leader', 'Social Activist', 'Media Person', 'Celebrity', 'Youth Leader', 'Women Leader', 'Other'];
        if (!validCategories.includes(category)) {
          throw new Error('Invalid category');
        }

        const validCastes = ['General', 'OBC', 'SC', 'ST', 'Minority', 'Other', 'Not Specified'];
        if (!validCastes.includes(caste)) {
          throw new Error('Invalid caste');
        }

        if (!['Active', 'Inactive'].includes(status)) {
          throw new Error('status must be Active or Inactive');
        }

        const geo = await resolveGeographicHierarchy(r);
        const errors = validateHierarchy(geo, ['state', 'division', 'parliament', 'assembly', 'block', 'booth']);
        if (errors.length > 0) {
          throw new Error(errors.join(', '));
        }

        const influencerData = {
          name,
          contact_number,
          email,
          full_address,
          category,
          caste,
          status,
          state_id: geo.state._id,
          division_id: geo.division._id,
          parliament_id: geo.parliament._id,
          assembly_id: geo.assembly._id,
          block_id: geo.block._id,
          booth_id: geo.booth._id,
          created_by: req.user.id,
          updated_by: req.user.id
        };

        const influencer = await Influencer.create(influencerData);
        created.push(influencer._id);
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