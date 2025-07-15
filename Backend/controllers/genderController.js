const Gender = require('../models/gender');
const State = require('../models/state');
const Division = require('../models/division');
const Parliament = require('../models/parliament');
const Assembly = require('../models/assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');
const User = require('../models/User');

// @desc    Get all gender entries
// @route   GET /api/genders
// @access  Public
exports.getGenders = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = Gender.find()
      .populate('state', 'name')
      .populate('division', 'name')
      .populate('parliament', 'name')
      .populate('assembly', 'name')
      .populate('block', 'name')
      .populate('booth', 'name booth_number')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ female: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { female: { $regex: req.query.search, $options: 'i' } },
          { male: { $regex: req.query.search, $options: 'i' } }
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

    const genders = await query.skip(skip).limit(limit).exec();
    const total = await Gender.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: genders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: genders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single gender entry
// @route   GET /api/genders/:id
// @access  Public
exports.getGender = async (req, res, next) => {
  try {
    const gender = await Gender.findById(req.params.id)
      .populate('state', 'name')
      .populate('division', 'name')
      .populate('parliament', 'name')
      .populate('assembly', 'name')
      .populate('block', 'name')
      .populate('booth', 'name booth_number')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!gender) {
      return res.status(404).json({
        success: false,
        message: 'Gender entry not found'
      });
    }

    res.status(200).json({
      success: true,
      data: gender
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create gender entry
// @route   POST /api/genders
// @access  Private (Admin only)
exports.createGender = async (req, res, next) => {
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

    const genderData = {
      ...req.body,
      created_by: req.user.id
    };

    const gender = await Gender.create(genderData);

    res.status(201).json({
      success: true,
      data: gender
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Gender entry already exists for this booth'
      });
    }
    next(err);
  }
};

// @desc    Update gender entry
// @route   PUT /api/genders/:id
// @access  Private (Admin only)
exports.updateGender = async (req, res, next) => {
  try {
    let gender = await Gender.findById(req.params.id);

    if (!gender) {
      return res.status(404).json({
        success: false,
        message: 'Gender entry not found'
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

    gender = await Gender.findByIdAndUpdate(req.params.id, req.body, {
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
      data: gender
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Gender entry already exists for this booth'
      });
    }
    next(err);
  }
};

// @desc    Delete gender entry
// @route   DELETE /api/genders/:id
// @access  Private (Admin only)
exports.deleteGender = async (req, res, next) => {
  try {
    const gender = await Gender.findById(req.params.id);

    if (!gender) {
      return res.status(404).json({
        success: false,
        message: 'Gender entry not found'
      });
    }

    await gender.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get gender entries by booth
// @route   GET /api/genders/booth/:boothId
// @access  Public
exports.getGendersByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const genders = await Gender.find({ booth_id: req.params.boothId })
      .sort({ female: 1, male: 1 })
      .populate('state', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: genders.length,
      data: genders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get gender entries by state
// @route   GET /api/genders/state/:stateId
// @access  Public
exports.getGendersByState = async (req, res, next) => {
  try {
    // Verify state exists
    const state = await State.findById(req.params.stateId);
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    const genders = await Gender.find({ state_id: req.params.stateId })
      .sort({ female: 1, male: 1 })
      .populate('division', 'name')
      .populate('booth', 'name booth_number');

    res.status(200).json({
      success: true,
      count: genders.length,
      data: genders
    });
  } catch (err) {
    next(err);
  }
};