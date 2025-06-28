const Block = require('../models/block');
const Assembly = require('../models/assembly');
const Parliament = require('../models/parliament');
const District = require('../models/district');
const Division = require('../models/division');
const State = require('../models/state');

// @desc    Get all blocks
// @route   GET /api/blocks
// @access  Public
exports.getBlocks = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = Block.find()
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('district_id', 'name')
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('created_by', 'name')
      .populate('updated_by', 'name')
      .sort({ name: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({ $text: { $search: req.query.search } });
    }

    // Filter by category
    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
    }

    // Filter by assembly
    if (req.query.assembly) {
      query = query.where('assembly_id').equals(req.query.assembly);
    }

    // Filter by parliament
    if (req.query.parliament) {
      query = query.where('parliament_id').equals(req.query.parliament);
    }

    // Filter by district
    if (req.query.district) {
      query = query.where('district_id').equals(req.query.district);
    }

    // Filter by division
    if (req.query.division) {
      query = query.where('division_id').equals(req.query.division);
    }

    // Filter by state
    if (req.query.state) {
      query = query.where('state_id').equals(req.query.state);
    }

    // Filter by active status
    if (req.query.is_active !== undefined) {
      query = query.where('is_active').equals(req.query.is_active === 'true');
    }

    const blocks = await query.skip(skip).limit(limit).exec();
    const total = await Block.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: blocks.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: blocks
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single block
// @route   GET /api/blocks/:id
// @access  Public
exports.getBlock = async (req, res, next) => {
  try {
    const block = await Block.findById(req.params.id)
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('district_id', 'name')
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('created_by', 'name')
      .populate('updated_by', 'name');

    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    res.status(200).json({
      success: true,
      data: block
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create block
// @route   POST /api/blocks
// @access  Private (Admin only)
exports.createBlock = async (req, res, next) => {
  try {
    // Verify all references exist
    const [
      assembly,
      parliament,
      district,
      division,
      state
    ] = await Promise.all([
      Assembly.findById(req.body.assembly_id),
      Parliament.findById(req.body.parliament_id),
      District.findById(req.body.district_id),
      Division.findById(req.body.division_id),
      State.findById(req.body.state_id)
    ]);

    if (!assembly) {
      return res.status(400).json({ success: false, message: 'Assembly not found' });
    }
    if (!parliament) {
      return res.status(400).json({ success: false, message: 'Parliament not found' });
    }
    if (!district) {
      return res.status(400).json({ success: false, message: 'District not found' });
    }
    if (!division) {
      return res.status(400).json({ success: false, message: 'Division not found' });
    }
    if (!state) {
      return res.status(400).json({ success: false, message: 'State not found' });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const blockData = {
      ...req.body,
      created_by: req.user.id
    };

    const block = await Block.create(blockData);

    res.status(201).json({
      success: true,
      data: block
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Block with this name already exists'
      });
    }
    next(err);
  }
};

// @desc    Update block
// @route   PUT /api/blocks/:id
// @access  Private (Admin only)
exports.updateBlock = async (req, res, next) => {
  try {
    let block = await Block.findById(req.params.id);

    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    if (req.body.district_id) verificationPromises.push(District.findById(req.body.district_id));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));

    const verificationResults = await Promise.all(verificationPromises);
    
    for (const result of verificationResults) {
      if (!result) {
        return res.status(400).json({
          success: false,
          message: `${result.modelName} not found`
        });
      }
    }

    // Set updated_by
    const updateData = {
      ...req.body,
      updated_by: req.user.id
    };

    block = await Block.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('district_id', 'name')
      .populate('division_id', 'name')
      .populate('state_id', 'name');

    res.status(200).json({
      success: true,
      data: block
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Block with this name already exists'
      });
    }
    next(err);
  }
};

// @desc    Delete block
// @route   DELETE /api/blocks/:id
// @access  Private (Admin only)
exports.deleteBlock = async (req, res, next) => {
  try {
    const block = await Block.findById(req.params.id);

    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    await block.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get blocks by assembly
// @route   GET /api/blocks/assembly/:assemblyId
// @access  Public
exports.getBlocksByAssembly = async (req, res, next) => {
  try {
    // Verify assembly exists
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    const blocks = await Block.find({ assembly_id: req.params.assemblyId })
      .sort({ name: 1 })
      .populate('parliament_id', 'name')
      .populate('created_by', 'name');

    res.status(200).json({
      success: true,
      count: blocks.length,
      data: blocks
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get blocks by parliament
// @route   GET /api/blocks/parliament/:parliamentId
// @access  Public
exports.getBlocksByParliament = async (req, res, next) => {
  try {
    // Verify parliament exists
    const parliament = await Parliament.findById(req.params.parliamentId);
    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    const blocks = await Block.find({ parliament_id: req.params.parliamentId })
      .sort({ name: 1 })
      .populate('assembly_id', 'name')
      .populate('created_by', 'name');

    res.status(200).json({
      success: true,
      count: blocks.length,
      data: blocks
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle block active status
// @route   PATCH /api/blocks/:id/toggle-active
// @access  Private (Admin only)
exports.toggleBlockActive = async (req, res, next) => {
  try {
    let block = await Block.findById(req.params.id);

    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    block.is_active = !block.is_active;
    block.updated_by = req.user.id;
    block.updated_at = Date.now();

    await block.save();

    res.status(200).json({
      success: true,
      data: block
    });
  } catch (err) {
    next(err);
  }
};