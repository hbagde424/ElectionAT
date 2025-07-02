const CasteList = require('../models/CasteList');
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
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'booth_number name')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email')
      .sort({ caste: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({ $text: { $search: req.query.search } });
    }

    // Filter by category
    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
    }

    // Filter by political divisions
    if (req.query.division) query = query.where('division_id').equals(req.query.division);
    if (req.query.parliament) query = query.where('parliament_id').equals(req.query.parliament);
    if (req.query.assembly) query = query.where('assembly_id').equals(req.query.assembly);
    if (req.query.block) query = query.where('block_id').equals(req.query.block);
    if (req.query.booth) query = query.where('booth_id').equals(req.query.booth);

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

// @desc    Get single caste list entry
// @route   GET /api/caste-lists/:id
// @access  Public
exports.getCasteList = async (req, res, next) => {
  try {
    const casteEntry = await CasteList.findById(req.params.id)
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'booth_number name')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email');

    if (!casteEntry) {
      return res.status(404).json({
        success: false,
        message: 'Caste list entry not found'
      });
    }

    res.status(200).json({
      success: true,
      data: casteEntry
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create caste list entry
// @route   POST /api/caste-lists
// @access  Private
exports.createCasteList = async (req, res, next) => {
  try {
    // Validate required fields
    const requiredFields = [
      'caste', 'division_id', 'parliament_id', 
      'assembly_id', 'block_id', 'booth_id', 'created_by'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Verify all references exist
    const [
      division, parliament, assembly, block, booth, creator
    ] = await Promise.all([
      Division.findById(req.body.division_id),
      Parliament.findById(req.body.parliament_id),
      Assembly.findById(req.body.assembly_id),
      Block.findById(req.body.block_id),
      Booth.findById(req.body.booth_id),
      User.findById(req.body.created_by)
    ]);

    // Create detailed error response
    if (!division || !parliament || !assembly || !block || !booth || !creator) {
      return res.status(400).json({
        success: false,
        message: 'One or more references are invalid',
        details: {
          division: !!division,
          parliament: !!parliament,
          assembly: !!assembly,
          block: !!block,
          booth: !!booth,
          creator: !!creator
        }
      });
    }

    // Check if caste already exists in the same booth
    const existingCaste = await CasteList.findOne({
      caste: req.body.caste,
      booth_id: req.body.booth_id
    });

    if (existingCaste) {
      return res.status(409).json({  // 409 Conflict is more appropriate
        success: false,
        message: 'This caste already exists for the specified booth',
        data: {
          existingEntry: {
            _id: existingCaste._id,
            createdAt: existingCaste.createdAt
          }
        }
      });
    }

    // Create new caste entry
    const casteEntry = await CasteList.create(req.body);

    res.status(201).json({
      success: true,
      data: casteEntry,
      message: 'Caste entry created successfully'
    });

  } catch (err) {
    // Handle specific MongoDB errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        error: err.message
      });
    }
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate entry detected',
        error: err.message
      });
    }
    
    // Pass other errors to the error handler middleware
    next(err);
  }
};

// @desc    Update caste list entry
// @route   PUT /api/caste-lists/:id
// @access  Private
exports.updateCasteList = async (req, res, next) => {
  try {
    let casteEntry = await CasteList.findById(req.params.id);

    if (!casteEntry) {
      return res.status(404).json({
        success: false,
        message: 'Caste list entry not found'
      });
    }

    // Verify all references exist if being updated
    const referenceChecks = [];
    if (req.body.division_id) referenceChecks.push(Division.findById(req.body.division_id));
    if (req.body.parliament_id) referenceChecks.push(Parliament.findById(req.body.parliament_id));
    if (req.body.assembly_id) referenceChecks.push(Assembly.findById(req.body.assembly_id));
    if (req.body.block_id) referenceChecks.push(Block.findById(req.body.block_id));
    if (req.body.booth_id) referenceChecks.push(Booth.findById(req.body.booth_id));
    if (req.body.updated_by) referenceChecks.push(User.findById(req.body.updated_by));

    const results = await Promise.all(referenceChecks);
    if (results.some(result => !result)) {
      return res.status(400).json({
        success: false,
        message: 'One or more references are invalid'
      });
    }

    // Check if caste already exists in the same booth (for another entry)
    if (req.body.caste || req.body.booth_id) {
      const caste = req.body.caste || casteEntry.caste;
      const boothId = req.body.booth_id || casteEntry.booth_id;

      const existingCaste = await CasteList.findOne({
        _id: { $ne: req.params.id },
        caste: caste,
        booth_id: boothId
      });

      if (existingCaste) {
        return res.status(400).json({
          success: false,
          message: 'This caste already exists for the specified booth'
        });
      }
    }

    casteEntry = await CasteList.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'booth_number name')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email');

    res.status(200).json({
      success: true,
      data: casteEntry
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete caste list entry
// @route   DELETE /api/caste-lists/:id
// @access  Private (Admin only)
exports.deleteCasteList = async (req, res, next) => {
  try {
    const casteEntry = await CasteList.findById(req.params.id);

    if (!casteEntry) {
      return res.status(404).json({
        success: false,
        message: 'Caste list entry not found'
      });
    }

    await casteEntry.remove();

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
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('created_by', 'name email')
      .sort({ category: 1, caste: 1 });

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
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'booth_number name')
      .sort({ caste: 1 });

    res.status(200).json({
      success: true,
      count: casteLists.length,
      data: casteLists
    });
  } catch (err) {
    next(err);
  }
};