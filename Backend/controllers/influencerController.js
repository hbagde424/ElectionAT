const Influencer = require('../models/influencer');
const State = require('../models/state');
const Division = require('../models/division');
const Parliament = require('../models/parliament');
const Assembly = require('../models/assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');

// @desc    Get all influencers
// @route   GET /api/influencers
// @access  Public
exports.getInfluencers = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Basic query
    let query = Influencer.find()
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
          { name: { $regex: req.query.search, $options: 'i' } },
          { contact_number: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } }
        ]
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

    const influencers = await query.skip(skip).limit(limit).exec();
    const total = await Influencer.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: influencers.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: influencers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single influencer
// @route   GET /api/influencers/:id
// @access  Public
exports.getInfluencer = async (req, res, next) => {
  try {
    const influencer = await Influencer.findById(req.params.id)
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: influencer
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create influencer
// @route   POST /api/influencers
// @access  Private (Admin only)
exports.createInfluencer = async (req, res, next) => {
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

    const influencerData = {
      ...req.body,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    const influencer = await Influencer.create(influencerData);

    res.status(201).json({
      success: true,
      data: influencer
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Influencer with this contact number or email already exists'
      });
    }
    next(err);
  }
};

// @desc    Update influencer
// @route   PUT /api/influencers/:id
// @access  Private (Admin only)
exports.updateInfluencer = async (req, res, next) => {
  try {
    let influencer = await Influencer.findById(req.params.id);

    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer not found'
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

    influencer = await Influencer.findByIdAndUpdate(req.params.id, req.body, {
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
      data: influencer
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Influencer with this contact number or email already exists'
      });
    }
    next(err);
  }
};

// @desc    Delete influencer
// @route   DELETE /api/influencers/:id
// @access  Private (Admin only)
exports.deleteInfluencer = async (req, res, next) => {
  try {
    const influencer = await Influencer.findById(req.params.id);

    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: 'Influencer not found'
      });
    }

    await influencer.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get influencers by booth
// @route   GET /api/influencers/booth/:boothId
// @access  Public
exports.getInfluencersByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const influencers = await Influencer.find({ booth_id: req.params.boothId })
      .sort({ name: 1 })
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: influencers.length,
      data: influencers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get influencers by assembly
// @route   GET /api/influencers/assembly/:assemblyId
// @access  Public
exports.getInfluencersByAssembly = async (req, res, next) => {
  try {
    // Verify assembly exists
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    const influencers = await Influencer.find({ assembly_id: req.params.assemblyId })
      .sort({ name: 1 })
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: influencers.length,
      data: influencers
    });
  } catch (err) {
    next(err);
  }
};