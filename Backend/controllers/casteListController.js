const CasteList = require('../models/CasteList');
const State = require('../models/state');
const Division = require('../models/division');
const Parliament = require('../models/parliament');
const Assembly = require('../models/assembly');
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
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = CasteList.find()
      .populate('state', 'name')
      .populate('division', 'name')
      .populate('parliament', 'name')
      .populate('assembly', 'name')
      .populate('block', 'name')
      .populate('booth', 'name booth_number')
      .populate('created_by', 'name')
      .populate('updated_by', 'name')
      .sort({ caste: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { caste: { $regex: req.query.search, $options: 'i' } },
          { category: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Filter by category
    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
    }

    // Filter by state
    if (req.query.state) {
      query = query.where('state_id').equals(req.query.state);
    }

    // Filter by division
    if (req.query.division) {
      query = query.where('division_id').equals(req.query.division);
    }

    // Filter by parliament
    if (req.query.parliament) {
      query = query.where('parliament_id').equals(req.query.parliament);
    }

    // Filter by assembly
    if (req.query.assembly) {
      query = query.where('assembly_id').equals(req.query.assembly);
    }

    // Filter by block
    if (req.query.block) {
      query = query.where('block_id').equals(req.query.block);
    }

    // Filter by booth
    if (req.query.booth) {
      query = query.where('booth_id').equals(req.query.booth);
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
      .populate('created_by', 'name')
      .populate('updated_by', 'name');

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
      created_by: req.user.id
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
      .populate('created_by', 'name')
      .populate('updated_by', 'name');

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
      .sort({ category: 1, caste: 1 })
      .populate('state', 'name')
      .populate('created_by', 'name');

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
      .sort({ category: 1, caste: 1 })
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