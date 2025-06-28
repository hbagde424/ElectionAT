const Booth = require('../models/booth');
const Block = require('../models/block');
const Assembly = require('../models/assembly');
const Parliament = require('../models/parliament');
const District = require('../models/district');
const Division = require('../models/division');
const State = require('../models/state');

// @desc    Get all booths
// @route   GET /api/booths
// @access  Public
exports.getBooths = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = Booth.find()
      .populate('block_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')  
      .populate('district_id', 'name') // Removed 'division_id' from here
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('created_by', 'name')
      .sort({ booth_number: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { booth_number: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Filter by block
    if (req.query.block) {
      query = query.where('block_id').equals(req.query.block);
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

    const booths = await query.skip(skip).limit(limit).exec();
    const total = await Booth.countDocuments(query.getFilter());

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
      .populate('block_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('district_id', 'name')
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('created_by', 'name');

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

// @desc    Create booth
// @route   POST /api/booths
// @access  Private (Admin only)
exports.createBooth = async (req, res, next) => {
  try {
    // Verify all references exist
    const [
      block,
      assembly,
      parliament,
      district,
      division,
      state
    ] = await Promise.all([
      Block.findById(req.body.block_id),
      Assembly.findById(req.body.assembly_id),
      Parliament.findById(req.body.parliament_id),
      District.findById(req.body.district_id),
      Division.findById(req.body.division_id),
      State.findById(req.body.state_id)
    ]);

    if (!block) {
      return res.status(400).json({ success: false, message: 'Block not found' });
    }
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

    const boothData = {
      ...req.body,
      created_by: req.user.id
    };

    const booth = await Booth.create(boothData);

    res.status(201).json({
      success: true,
      data: booth
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Booth with this number already exists'
      });
    }
    next(err);
  }
};

// @desc    Update booth
// @route   PUT /api/booths/:id
// @access  Private (Admin only)
exports.updateBooth = async (req, res, next) => {
  try {
    let booth = await Booth.findById(req.params.id);

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.block_id) verificationPromises.push(Block.findById(req.body.block_id));
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

    booth = await Booth.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('block_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('district_id', 'name')
      .populate('division_id', 'name')
      .populate('state_id', 'name');

    res.status(200).json({
      success: true,
      data: booth
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Booth with this number already exists'
      });
    }
    next(err);
  }
};

// @desc    Delete booth
// @route   DELETE /api/booths/:id
// @access  Private (Admin only)
exports.deleteBooth = async (req, res, next) => {
  try {
    const booth = await Booth.findById(req.params.id);

    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    await booth.deleteOne();

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
    // Verify assembly exists
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    const booths = await Booth.find({ assembly_id: req.params.assemblyId })
      .sort({ booth_number: 1 })
      .populate('block_id', 'name')
      .populate('created_by', 'name');

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
    // Verify block exists
    const block = await Block.findById(req.params.blockId);
    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    const booths = await Booth.find({ block_id: req.params.blockId })
      .sort({ booth_number: 1 })
      .populate('assembly_id', 'name')
      .populate('created_by', 'name');

    res.status(200).json({
      success: true,
      count: booths.length,
      data: booths
    });
  } catch (err) {
    next(err);
  }
};