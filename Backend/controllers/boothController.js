const Booth = require('../models/booth');
const Block = require('../models/block');
const Assembly = require('../models/assembly');
const Parliament = require('../models/parliament');

// @desc    Get all booths
// @route   GET /api/booths
// @access  Public
exports.getBooths = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    if (req.query.booth_number) {
      query.booth_number = req.query.booth_number;
    }
    
    if (req.query.assembly_id) {
      query.assembly_id = req.query.assembly_id;
    }

    const booths = await Booth.find(query)
      .skip(skip)
      .limit(limit)
      .populate('block_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name');

    const total = await Booth.countDocuments(query);

    res.status(200).json({
      success: true,
      count: booths.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: booths
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single booth
// @route   GET /api/booths/:id
// @access  Public
exports.getBooth = async (req, res, next) => {
  try {
    const booth = await Booth.findById(req.params.id)
      .populate('block_id')
      .populate('assembly_id')
      .populate('parliament_id');

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    res.status(200).json({
      success: true,
      data: booth
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new booth
// @route   POST /api/booths
// @access  Private/Admin
exports.createBooth = async (req, res, next) => {
  try {
    // Verify references exist
    const [block, assembly, parliament] = await Promise.all([
      Block.findById(req.body.block_id),
      Assembly.findById(req.body.assembly_id),
      Parliament.findById(req.body.parliament_id)
    ]);

    if (!block || !assembly || !parliament) {
      return res.status(400).json({
        success: false,
        message: 'Invalid block, assembly or parliament reference'
      });
    }

    const booth = await Booth.create(req.body);

    res.status(201).json({
      success: true,
      data: booth
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update booth
// @route   PUT /api/booths/:id
// @access  Private/Admin
exports.updateBooth = async (req, res, next) => {
  try {
    let booth = await Booth.findById(req.params.id);

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    // Verify references if being updated
    if (req.body.block_id || req.body.assembly_id || req.body.parliament_id) {
      const [block, assembly, parliament] = await Promise.all([
        req.body.block_id ? Block.findById(req.body.block_id) : Promise.resolve(true),
        req.body.assembly_id ? Assembly.findById(req.body.assembly_id) : Promise.resolve(true),
        req.body.parliament_id ? Parliament.findById(req.body.parliament_id) : Promise.resolve(true)
      ]);

      if (req.body.block_id && !block) {
        return res.status(400).json({ success: false, message: 'Block not found' });
      }
      if (req.body.assembly_id && !assembly) {
        return res.status(400).json({ success: false, message: 'Assembly not found' });
      }
      if (req.body.parliament_id && !parliament) {
        return res.status(400).json({ success: false, message: 'Parliament not found' });
      }
    }

    booth = await Booth.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('block_id assembly_id parliament_id');

    res.status(200).json({
      success: true,
      data: booth
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete booth
// @route   DELETE /api/booths/:id
// @access  Private/Admin
exports.deleteBooth = async (req, res, next) => {
  try {
    const booth = await Booth.findById(req.params.id);

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    await booth.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get booths by assembly
// @route   GET /api/booths/assembly/:assemblyId
// @access  Public
exports.getBoothsByAssembly = async (req, res, next) => {
  try {
    const assembly = await Assembly.findById(req.params.assemblyId);
    
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    const booths = await Booth.find({ assembly_id: req.params.assemblyId })
      .populate('block_id', 'name')
      .populate('parliament_id', 'name');

    res.status(200).json({
      success: true,
      count: booths.length,
      data: booths
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get booths by parliament
// @route   GET /api/booths/parliament/:parliamentId
// @access  Public
exports.getBoothsByParliament = async (req, res, next) => {
  try {
    const parliament = await Parliament.findById(req.params.parliamentId);
    
    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    const booths = await Booth.find({ parliament_id: req.params.parliamentId })
      .populate('block_id', 'name')
      .populate('assembly_id', 'name');

    res.status(200).json({
      success: true,
      count: booths.length,
      data: booths
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get booths by block
// @route   GET /api/booths/block/:blockId
// @access  Public
exports.getBoothsByBlock = async (req, res, next) => {
  try {
    const block = await Block.findById(req.params.blockId);
    
    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    const booths = await Booth.find({ block_id: req.params.blockId })
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name');

    res.status(200).json({
      success: true,
      count: booths.length,
      data: booths
    });
  } catch (err) {
    next(err);
  }
};