const Coding = require('../models/coding');
const State = require('../models/state');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const Assembly = require('../models/Assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');
const User = require('../models/User');

// @desc    Get all coding entries
// @route   GET /api/codings
// @access  Public
exports.getCodings = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    // Basic query
    let query = Coding.find()
      .populate('state', 'name')
      .populate('division', 'name')
      .populate('parliament', 'name')
      .populate('assembly', 'name')
      .populate('block', 'name')
      .populate('booth', 'name booth_number')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ name: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { mobile: { $regex: req.query.search, $options: 'i' } },
          { coding_types: { $regex: req.query.search, $options: 'i' } },
        ]
      });
    }

    // Filter by single coding type
    if (req.query.coding_type) {
      query = query.where('coding_types').equals(req.query.coding_type);
    }

    // Filter by multiple coding types
    if (req.query.coding_types) {
      const types = req.query.coding_types.split(',');
      query = query.where('coding_types').all(types);
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

    // Apply user hierarchy restriction when an authenticated user is present
    // Precedence: booth -> block -> assembly -> parliament -> division -> state
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

    const codings = await query.skip(skip).limit(limit).exec();
    const total = await Coding.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: codings.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: codings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single coding entry
// @route   GET /api/codings/:id
// @access  Public
exports.getCoding = async (req, res, next) => {
  try {
    const coding = await Coding.findById(req.params.id)
      .populate('state', 'name')
      .populate('division', 'name')
      .populate('parliament', 'name')
      .populate('assembly', 'name')
      .populate('block', 'name')
      .populate('booth', 'name booth_number')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!coding) {
      return res.status(404).json({
        success: false,
        message: 'Coding entry not found'
      });
    }

    // Enforce user hierarchy: only allow access if coding is within user's scope
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      const outOfScope = (h.booth_id && coding.booth_id && coding.booth_id.toString() !== h.booth_id.toString()) ||
        (h.block_id && coding.block_id && coding.block_id.toString() !== h.block_id.toString()) ||
        (h.assembly_id && coding.assembly_id && coding.assembly_id.toString() !== h.assembly_id.toString()) ||
        (h.parliament_id && coding.parliament_id && coding.parliament_id.toString() !== h.parliament_id.toString()) ||
        (h.division_id && coding.division_id && coding.division_id.toString() !== h.division_id.toString()) ||
        (h.state_id && coding.state_id && coding.state_id.toString() !== h.state_id.toString());

      if (outOfScope) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
    }

    res.status(200).json({
      success: true,
      data: coding
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create coding entry
// @route   POST /api/codings
// @access  Private (Admin only)
exports.createCoding = async (req, res, next) => {
  try {
    // Validate coding types
    const validTypes = ['BC', 'PP', 'IP', 'FH', 'SMM', 'MS', 'FP', 'ER', 'AK', 'FM', 'वरिष्ठ', 'युवा', 'वोटर प्रभारी'];

    if (!req.body.coding_types || !Array.isArray(req.body.coding_types)) {
      return res.status(400).json({
        success: false,
        message: 'coding_types must be an array'
      });
    }

    for (const type of req.body.coding_types) {
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid coding type: ${type}`
        });
      }
    }

    // Verify all references exist
    const [
      state,
      division,
      parliament,
      assembly,
      block,
      booth
    ] = await Promise.all([
      State.findById(req.body.state_id),
      Division.findById(req.body.division_id),
      Parliament.findById(req.body.parliament_id),
      Assembly.findById(req.body.assembly_id),
      Block.findById(req.body.block_id),
      Booth.findById(req.body.booth_id)
    ]);

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

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const codingData = {
      ...req.body,
      created_by: req.user.id,
      description: req.body.description || '',
    };

    const coding = await Coding.create(codingData);

    res.status(201).json({
      success: true,
      data: coding
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Coding entry already exists with these details'
      });
    }
    next(err);
  }
};

// @desc    Update coding entry
// @route   PUT /api/codings/:id
// @access  Private (Admin only)
exports.updateCoding = async (req, res, next) => {
  try {
    let coding = await Coding.findById(req.params.id);

    if (!coding) {
      return res.status(404).json({
        success: false,
        message: 'Coding entry not found'
      });
    }

    // Validate coding types if being updated
    if (req.body.coding_types) {
      const validTypes = ['BC', 'PP', 'IP', 'FH', 'SMM', 'MS', 'FP', 'ER', 'AK', 'FM', 'वरिष्ठ', 'युवा', 'वोटर प्रभारी'];

      if (!Array.isArray(req.body.coding_types)) {
        return res.status(400).json({
          success: false,
          message: 'coding_types must be an array'
        });
      }

      for (const type of req.body.coding_types) {
        if (!validTypes.includes(type)) {
          return res.status(400).json({
            success: false,
            message: `Invalid coding type: ${type}`
          });
        }
      }
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.block_id) verificationPromises.push(Block.findById(req.body.block_id));
    if (req.body.booth_id) verificationPromises.push(Booth.findById(req.body.booth_id));

    const verificationResults = await Promise.all(verificationPromises);

    for (const result of verificationResults) {
      if (result === null) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reference ID provided'
        });
      }
    }

    // Add updated_by info
    req.body.updated_by = req.user.id;
    req.body.description = req.body.description || '';
    req.body.updated_at = new Date();

    coding = await Coding.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('state', 'name')
      .populate('division', 'name')
      .populate('parliament', 'name')
      .populate('assembly', 'name')
      .populate('block', 'name')
      .populate('booth', 'name booth_number')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: coding
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Coding entry already exists with these details'
      });
    }
    next(err);
  }
};

// @desc    Delete coding entry
// @route   DELETE /api/codings/:id
// @access  Private (Admin only)
exports.deleteCoding = async (req, res, next) => {
  try {
    const coding = await Coding.findById(req.params.id);

    if (!coding) {
      return res.status(404).json({
        success: false,
        message: 'Coding entry not found'
      });
    }

    await coding.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get coding entries by booth
// @route   GET /api/codings/booth/:boothId
// @access  Public
exports.getCodingsByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    // If user is present and not superAdmin, ensure booth is within user's scope
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      if (h.booth_id && h.booth_id.toString() !== req.params.boothId) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
      if (h.block_id && h.block_id.toString() !== booth.block_id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
      if (h.assembly_id && h.assembly_id.toString() !== booth.assembly_id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
      if (h.parliament_id && h.parliament_id.toString() !== booth.parliament_id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
      if (h.division_id && h.division_id.toString() !== booth.division_id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
      if (h.state_id && h.state_id.toString() !== booth.state_id.toString()) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
    }

    const codings = await Coding.find({ booth_id: req.params.boothId })
      .sort({ name: 1 })
      .populate('state', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: codings.length,
      data: codings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get coding entries by state
// @route   GET /api/codings/state/:stateId
// @access  Public
exports.getCodingsByState = async (req, res, next) => {
  try {
    // Verify state exists
    const state = await State.findById(req.params.stateId);
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    // Enforce user hierarchy for state-scoped listing
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      // If user's scope is narrower than the requested state and doesn't match, forbid
      if (h.state_id && h.state_id.toString() !== req.params.stateId) {
        return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
      }
      if (h.division_id) {
        // user limited to a division inside some state - ensure division belongs to this state
        const division = await Division.findById(h.division_id);
        if (!division || division.state_id.toString() !== req.params.stateId) {
          return res.status(403).json({ success: false, message: 'Forbidden: resource outside your geographic scope' });
        }
      }
    }

    const codings = await Coding.find({ state_id: req.params.stateId })
      .sort({ name: 1 })
      .populate('division', 'name')
      .populate('booth', 'name booth_number');

    res.status(200).json({
      success: true,
      count: codings.length,
      data: codings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get coding entries by single coding type
// @route   GET /api/codings/type/:type
// @access  Public
exports.getCodingsByType = async (req, res, next) => {
  try {
    const validTypes = ['BC', 'PP', 'IP', 'FH', 'SMM', 'MS', 'FP', 'ER', 'AK', 'FM', 'वरिष्ठ', 'युवा', 'वोटर प्रभारी'];

    if (!validTypes.includes(req.params.type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coding type'
      });
    }

    // Apply hierarchy restrictions when applicable
    const baseFilter = { coding_types: req.params.type };
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      if (h.booth_id) baseFilter.booth_id = h.booth_id;
      else if (h.block_id) baseFilter.block_id = h.block_id;
      else if (h.assembly_id) baseFilter.assembly_id = h.assembly_id;
      else if (h.parliament_id) baseFilter.parliament_id = h.parliament_id;
      else if (h.division_id) baseFilter.division_id = h.division_id;
      else if (h.state_id) baseFilter.state_id = h.state_id;
    }

    const codings = await Coding.find(baseFilter)
      .sort({ name: 1 })
      .populate('state', 'name')
      .populate('booth', 'name booth_number');

    res.status(200).json({
      success: true,
      count: codings.length,
      data: codings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get coding entries by multiple coding types
// @route   GET /api/codings/types/:types
// @access  Public
exports.getCodingsByTypes = async (req, res, next) => {
  try {
    const validTypes = ['BC', 'PP', 'IP', 'FH', 'SMM', 'MS', 'FP', 'ER', 'AK', 'FM', 'वरिष्ठ', 'युवा', 'वोटर प्रभारी'];
    const types = req.params.types.split(',');

    // Validate all types
    for (const type of types) {
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid coding type: ${type}`
        });
      }
    }

    const baseFilter = { coding_types: { $all: types } };
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      if (h.booth_id) baseFilter.booth_id = h.booth_id;
      else if (h.block_id) baseFilter.block_id = h.block_id;
      else if (h.assembly_id) baseFilter.assembly_id = h.assembly_id;
      else if (h.parliament_id) baseFilter.parliament_id = h.parliament_id;
      else if (h.division_id) baseFilter.division_id = h.division_id;
      else if (h.state_id) baseFilter.state_id = h.state_id;
    }

    const codings = await Coding.find(baseFilter)
      .sort({ name: 1 })
      .populate('state', 'name')
      .populate('booth', 'name booth_number');

    res.status(200).json({
      success: true,
      count: codings.length,
      data: codings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get coding entries that have any of the specified coding types
// @route   GET /api/codings/types/any/:types
// @access  Public
exports.getCodingsByAnyTypes = async (req, res, next) => {
  try {
    const validTypes = ['BC', 'PP', 'IP', 'FH', 'SMM', 'MS', 'FP', 'ER', 'AK', 'FM', 'वरिष्ठ', 'युवा', 'वोटर प्रभारी'];
    const types = req.params.types.split(',');

    // Validate all types
    for (const type of types) {
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid coding type: ${type}`
        });
      }
    }

    const baseFilter = { coding_types: { $in: types } };
    if (req.user && req.user.role !== 'superAdmin' && req.userHierarchy) {
      const h = req.userHierarchy;
      if (h.booth_id) baseFilter.booth_id = h.booth_id;
      else if (h.block_id) baseFilter.block_id = h.block_id;
      else if (h.assembly_id) baseFilter.assembly_id = h.assembly_id;
      else if (h.parliament_id) baseFilter.parliament_id = h.parliament_id;
      else if (h.division_id) baseFilter.division_id = h.division_id;
      else if (h.state_id) baseFilter.state_id = h.state_id;
    }

    const codings = await Coding.find(baseFilter)
      .sort({ name: 1 })
      .populate('state', 'name')
      .populate('booth', 'name booth_number');

    res.status(200).json({
      success: true,
      count: codings.length,
      data: codings
    });
  } catch (err) {
    next(err);
  }
};