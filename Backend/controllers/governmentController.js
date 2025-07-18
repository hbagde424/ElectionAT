const Government = require('../models/government');
const State = require('../models/state');
const Division = require('../models/division');
const Parliament = require('../models/parliament');
const Assembly = require('../models/assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');

// @desc    Get all government projects
// @route   GET /api/governments
// @access  Public
exports.getGovernments = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Basic query
    let query = Government.find()
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ name: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Filter by type
    if (req.query.type) {
      query = query.where('type').equals(req.query.type);
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

    const governments = await query.skip(skip).limit(limit).exec();
    const total = await Government.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: governments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: governments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single government project
// @route   GET /api/governments/:id
// @access  Public
exports.getGovernment = async (req, res, next) => {
  try {
    const government = await Government.findById(req.params.id)
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!government) {
      return res.status(404).json({
        success: false,
        message: 'Government project not found'
      });
    }

    res.status(200).json({
      success: true,
      data: government
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create government project
// @route   POST /api/governments
// @access  Private (Admin only)
exports.createGovernment = async (req, res, next) => {
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
      req.body.booth_id ? Booth.findById(req.body.booth_id) : Promise.resolve(null)
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
    if (req.body.booth_id && !booth) {
      return res.status(400).json({ success: false, message: 'Booth not found' });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const governmentData = {
      ...req.body,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    const government = await Government.create(governmentData);

    res.status(201).json({
      success: true,
      data: government
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update government project
// @route   PUT /api/governments/:id
// @access  Private (Admin only)
exports.updateGovernment = async (req, res, next) => {
  try {
    let government = await Government.findById(req.params.id);

    if (!government) {
      return res.status(404).json({
        success: false,
        message: 'Government project not found'
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
    req.body.updated_at = new Date();

    government = await Government.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: government
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete government project
// @route   DELETE /api/governments/:id
// @access  Private (Admin only)
exports.deleteGovernment = async (req, res, next) => {
  try {
    const government = await Government.findById(req.params.id);

    if (!government) {
      return res.status(404).json({
        success: false,
        message: 'Government project not found'
      });
    }

    await government.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get government projects by state
// @route   GET /api/governments/state/:stateId
// @access  Public
exports.getGovernmentsByState = async (req, res, next) => {
  try {
    const state = await State.findById(req.params.stateId);
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    const governments = await Government.find({ state_id: req.params.stateId })
      .sort({ name: 1 })
      .populate('division_id', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: governments.length,
      data: governments
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get government projects by assembly
// @route   GET /api/governments/assembly/:assemblyId
// @access  Public
exports.getGovernmentsByAssembly = async (req, res, next) => {
  try {
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    const governments = await Government.find({ assembly_id: req.params.assemblyId })
      .sort({ name: 1 })
      .populate('block_id', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: governments.length,
      data: governments
    });
  } catch (err) {
    next(err);
  }
};