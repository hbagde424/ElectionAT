const BoothDemographics = require('../models/boothDemographics');
const Booth = require('../models/booth');
const State = require('../models/state');
const Division = require('../models/division');
const Assembly = require('../models/assembly');
const Parliament = require('../models/parliament');
const Block = require('../models/block');

// @desc    Get all booth demographics
// @route   GET /api/booth-demographics
// @access  Public
exports.getBoothDemographics = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = BoothDemographics.find()
      .populate('booth_id', 'name booth_number')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('block_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    // Search functionality
    if (req.query.search) {
      query = query.populate({
        path: 'booth_id',
        match: {
          $or: [
            { name: { $regex: req.query.search, $options: 'i' } },
            { booth_number: { $regex: req.query.search, $options: 'i' } }
          ]
        }
      });
    }

    // Filter by state
    if (req.query.state) {
      query = query.where('state_id').equals(req.query.state);
    }

    // Filter by division
    if (req.query.division) {
      query = query.where('division_id').equals(req.query.division);
    }

    // Filter by assembly
    if (req.query.assembly) {
      query = query.where('assembly_id').equals(req.query.assembly);
    }

    // Filter by parliament
    if (req.query.parliament) {
      query = query.where('parliament_id').equals(req.query.parliament);
    }

    // Filter by block
    if (req.query.block) {
      query = query.where('block_id').equals(req.query.block);
    }

    const demographics = await query.skip(skip).limit(limit).exec();
    const total = await BoothDemographics.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: demographics.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: demographics
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single booth demographics
// @route   GET /api/booth-demographics/:id
// @access  Public
exports.getBoothDemographic = async (req, res, next) => {
  try {
    const demographic = await BoothDemographics.findById(req.params.id)
      .populate('booth_id', 'name booth_number')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('block_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!demographic) {
      return res.status(404).json({
        success: false,
        message: 'Booth demographics not found'
      });
    }

    res.status(200).json({
      success: true,
      data: demographic
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create booth demographics
// @route   POST /api/booth-demographics
// @access  Private (Admin only)
exports.createBoothDemographics = async (req, res, next) => {
  try {
    // Verify all references exist
    const [
      booth,
      state,
      division,
      assembly,
      parliament,
      block
    ] = await Promise.all([
      Booth.findById(req.body.booth_id),
      State.findById(req.body.state_id),
      Division.findById(req.body.division_id),
      Assembly.findById(req.body.assembly_id),
      Parliament.findById(req.body.parliament_id),
      Block.findById(req.body.block_id)
    ]);

    if (!booth) {
      return res.status(400).json({ success: false, message: 'Booth not found' });
    }
    if (!state) {
      return res.status(400).json({ success: false, message: 'State not found' });
    }
    if (!division) {
      return res.status(400).json({ success: false, message: 'Division not found' });
    }
    if (!assembly) {
      return res.status(400).json({ success: false, message: 'Assembly not found' });
    }
    if (!parliament) {
      return res.status(400).json({ success: false, message: 'Parliament not found' });
    }
    if (!block) {
      return res.status(400).json({ success: false, message: 'Block not found' });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const demographicData = {
      ...req.body,
      created_by: req.user.id
    };

    const demographic = await BoothDemographics.create(demographicData);

    res.status(201).json({
      success: true,
      data: demographic
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Demographics for this booth already exists'
      });
    }
    next(err);
  }
};

// @desc    Update booth demographics
// @route   PUT /api/booth-demographics/:id
// @access  Private (Admin only)
exports.updateBoothDemographics = async (req, res, next) => {
  try {
    let demographic = await BoothDemographics.findById(req.params.id);

    if (!demographic) {
      return res.status(404).json({
        success: false,
        message: 'Booth demographics not found'
      });
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.booth_id) verificationPromises.push(Booth.findById(req.body.booth_id));
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    if (req.body.block_id) verificationPromises.push(Block.findById(req.body.block_id));

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
    if (req.user && req.user.id) {
      req.body.updated_by = req.user.id;
    }

    demographic = await BoothDemographics.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('booth_id', 'name booth_number')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('block_id', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: demographic
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete booth demographics
// @route   DELETE /api/booth-demographics/:id
// @access  Private (Admin only)
exports.deleteBoothDemographics = async (req, res, next) => {
  try {
    const demographic = await BoothDemographics.findById(req.params.id);

    if (!demographic) {
      return res.status(404).json({
        success: false,
        message: 'Booth demographics not found'
      });
    }

    await demographic.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get demographics by booth
// @route   GET /api/booth-demographics/booth/:boothId
// @access  Public
exports.getDemographicsByBooth = async (req, res, next) => {
  try {
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const demographic = await BoothDemographics.findOne({ booth_id: req.params.boothId })
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('block_id', 'name');

    if (!demographic) {
      return res.status(404).json({
        success: false,
        message: 'Demographics not found for this booth'
      });
    }

    res.status(200).json({
      success: true,
      data: demographic
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get demographics by assembly
// @route   GET /api/booth-demographics/assembly/:assemblyId
// @access  Public
exports.getDemographicsByAssembly = async (req, res, next) => {
  try {
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    const demographics = await BoothDemographics.find({ assembly_id: req.params.assemblyId })
      .populate('booth_id', 'name booth_number')
      .populate('state_id', 'name')
      .populate('division_id', 'name');

    res.status(200).json({
      success: true,
      count: demographics.length,
      data: demographics
    });
  } catch (err) {
    next(err);
  }
};