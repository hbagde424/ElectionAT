const Block = require('../models/block');
const Assembly = require('../models/assembly');
const User = require('../models/User');

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
    let query = Block.find({ is_active: true })
      .populate('assembly_id', 'name')
      .populate('created_by', 'name')
      .populate('updated_by', 'name')
      .sort({ name: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({ $text: { $search: req.query.search } });
    }

    // Filter by assembly
    if (req.query.assembly) {
      query = query.where('assembly_id').equals(req.query.assembly);
    }

    // Filter by category
    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
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
      .populate('created_by', 'name')
      .populate('updated_by', 'name');

    if (!block || !block.is_active) {
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
// @access  Private (Admin/Editor)
exports.createBlock = async (req, res, next) => {
  try {
    // Verify assembly exists
    const assembly = await Assembly.findById(req.body.assembly_id);
    if (!assembly || !assembly.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Assembly not found or inactive'
      });
    }

    // Verify creator user exists
    const creator = await User.findById(req.body.created_by);
    if (!creator || !creator.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Creator user not found or inactive'
      });
    }

    // Check for duplicate block name in the same assembly
    const existingBlock = await Block.findOne({ 
      name: req.body.name,
      assembly_id: req.body.assembly_id 
    });
    
    if (existingBlock) {
      return res.status(400).json({
        success: false,
        message: 'Block with this name already exists in the specified assembly'
      });
    }

    // Set created_by to current user if not provided
    if (!req.body.created_by) {
      req.body.created_by = req.user.id;
    }

    const block = await Block.create(req.body);

    res.status(201).json({
      success: true,
      data: block
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update block
// @route   PUT /api/blocks/:id
// @access  Private (Admin/Editor)
exports.updateBlock = async (req, res, next) => {
  try {
    let block = await Block.findById(req.params.id);

    if (!block || !block.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    // Verify assembly exists if being updated
    if (req.body.assembly_id) {
      const assembly = await Assembly.findById(req.body.assembly_id);
      if (!assembly || !assembly.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Assembly not found or inactive'
        });
      }
    }

    // Check for duplicate block name in the same assembly if name is being updated
    if (req.body.name && req.body.name !== block.name) {
      const existingBlock = await Block.findOne({ 
        name: req.body.name,
        assembly_id: req.body.assembly_id || block.assembly_id
      });
      
      if (existingBlock) {
        return res.status(400).json({
          success: false,
          message: 'Block with this name already exists in the specified assembly'
        });
      }
    }

    // Set updated_by to current user
    req.body.updated_by = req.user.id;

    block = await Block.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('assembly_id', 'name')
      .populate('created_by', 'name')
      .populate('updated_by', 'name');

    res.status(200).json({
      success: true,
      data: block
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete block
// @route   DELETE /api/blocks/:id
// @access  Private (Admin only)
exports.deleteBlock = async (req, res, next) => {
  try {
    const block = await Block.findById(req.params.id);

    if (!block || !block.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    // Soft delete by setting is_active to false
    block.is_active = false;
    block.updated_by = req.user.id;
    await block.save();

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
    if (!assembly || !assembly.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found or inactive'
      });
    }

    let query = Block.find({ 
      assembly_id: req.params.assemblyId,
      is_active: true 
    })
      .populate('created_by', 'name')
      .populate('updated_by', 'name')
      .sort({ name: 1 });

    // Filter by category if provided
    if (req.query.category) {
      query = query.where('category').equals(req.query.category);
    }

    const blocks = await query.exec();

    res.status(200).json({
      success: true,
      count: blocks.length,
      data: blocks
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get blocks by category
// @route   GET /api/blocks/category/:category
// @access  Public
exports.getBlocksByCategory = async (req, res, next) => {
  try {
    const validCategories = ['Urban', 'Rural', 'Semi-Urban', 'Tribal'];
    if (!validCategories.includes(req.params.category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid block category'
      });
    }

    let query = Block.find({ 
      category: req.params.category,
      is_active: true 
    })
      .populate('assembly_id', 'name')
      .populate('created_by', 'name')
      .populate('updated_by', 'name')
      .sort({ name: 1 });

    // Filter by assembly if provided
    if (req.query.assembly) {
      query = query.where('assembly_id').equals(req.query.assembly);
    }

    const blocks = await query.exec();

    res.status(200).json({
      success: true,
      count: blocks.length,
      data: blocks
    });
  } catch (err) {
    next(err);
  }
};