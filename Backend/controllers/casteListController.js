const CasteList = require('../models/CasteList');
const State = require('../models/state');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const Assembly = require('../models/Assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');
const User = require('../models/User');

// @desc    Get all caste lists
// @route   GET /api/caste-lists
// @access  Public
exports.getCasteLists = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Basic query
    let query = CasteList.find()
      .populate('state', 'name')
      .populate('division', 'name')
      .populate('parliament', 'name')
      .populate('assembly', 'name')
      .populate('block', 'name')
      .populate('booth', 'name booth_number')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ caste: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { caste: { $regex: req.query.search, $options: 'i' } },
          { category: { $regex: req.query.search, $options: 'i' } },
          { percentage: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Filter by category
    if (req.query.category) {
      query = query.where('category').equals(new RegExp('^' + req.query.category + '$', 'i'));
    }

    if (req.query.percentage) {
      query = query.where('percentage').equals(req.query.percentage);
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

    const casteLists = await query.skip(skip).limit(limit).exec();
    const total = await CasteList.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: casteLists.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: casteLists
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single caste list
// @route   GET /api/caste-lists/:id
// @access  Public
exports.getCasteList = async (req, res, next) => {
  try {
    const casteList = await CasteList.findById(req.params.id)
      .populate('state', 'name')
      .populate('division', 'name')
      .populate('parliament', 'name')
      .populate('assembly', 'name')
      .populate('block', 'name')
      .populate('booth', 'name booth_number')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!casteList) {
      return res.status(404).json({
        success: false,
        message: 'Caste list not found'
      });
    }

    res.status(200).json({
      success: true,
      data: casteList
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create caste list
// @route   POST /api/caste-lists
// @access  Private (Admin only)
exports.createCasteList = async (req, res, next) => {
  try {
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

    const casteListData = {
      ...req.body,
      created_by: req.user.id,
      description: req.body.description || '',
    };

    const casteList = await CasteList.create(casteListData);

    res.status(201).json({
      success: true,
      data: casteList
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Caste already exists for this booth'
      });
    }
    next(err);
  }
};

// @desc    Update caste list
// @route   PUT /api/caste-lists/:id
// @access  Private (Admin only)
exports.updateCasteList = async (req, res, next) => {
  try {
    let casteList = await CasteList.findById(req.params.id);

    if (!casteList) {
      return res.status(404).json({
        success: false,
        message: 'Caste list not found'
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

    const verificationResults = await Promise.all(verificationPromises);

    for (const result of verificationResults) {
      if (!result) {
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

    casteList = await CasteList.findByIdAndUpdate(req.params.id, req.body, {
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
      data: casteList
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Caste already exists for this booth'
      });
    }
    next(err);
  }
};

// @desc    Delete caste list
// @route   DELETE /api/caste-lists/:id
// @access  Private (Admin only)
exports.deleteCasteList = async (req, res, next) => {
  try {
    const casteList = await CasteList.findById(req.params.id);

    if (!casteList) {
      return res.status(404).json({
        success: false,
        message: 'Caste list not found'
      });
    }

    await casteList.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get caste lists by booth
// @route   GET /api/caste-lists/booth/:boothId
// @access  Public
exports.getCasteListsByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const casteLists = await CasteList.find({ booth_id: req.params.boothId })
      .sort({ category: 1, caste: 1, percentage: 1 })
      .populate('state', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: casteLists.length,
      data: casteLists
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get caste lists by state
// @route   GET /api/caste-lists/state/:stateId
// @access  Public
exports.getCasteListsByState = async (req, res, next) => {
  try {
    // Verify state exists
    const state = await State.findById(req.params.stateId);
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    const casteLists = await CasteList.find({ state_id: req.params.stateId })
      .sort({ category: 1, caste: 1, percentage: 1 })

      .populate('division', 'name')
      .populate('booth', 'name booth_number');

    res.status(200).json({
      success: true,
      count: casteLists.length,
      data: casteLists
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get caste lists by category
// @route   GET /api/caste-lists/category/:category
// @access  Public
exports.getCasteListsByCategory = async (req, res, next) => {
  try {
    const validCategories = ['SC', 'ST', 'OBC', 'General', 'Other'];
    if (!validCategories.includes(req.params.category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const casteLists = await CasteList.find({ category: req.params.category })
      .sort({ caste: 1 })
      .populate('state', 'name')
      .populate('booth', 'name booth_number');

    res.status(200).json({
      success: true,
      count: casteLists.length,
      data: casteLists
    });
  } catch (err) {
    next(err);
  }
};