const Gender = require('../models/gender');
const State = require('../models/state');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const Assembly = require('../models/Assembly');
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
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Basic query
    let query = Gender.find()
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ female: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { female: { $regex: req.query.search, $options: 'i' } },
          { male: { $regex: req.query.search, $options: 'i' } },
          { others: { $regex: req.query.search, $options: 'i' } },
        ]
      });
    }


    // Helper function for ObjectId or name lookup (normalize dashes to spaces)
    const handleIdOrName = async (param, model, nameField = 'name') => {
      if (!req.query[param]) return null;
      let value = req.query[param];
      value = value.replace(/-/g, ' ');
      const isObjectId = /^[a-f\d]{24}$/i.test(value);
      if (isObjectId) {
        return value;
      } else {
        const doc = await model.findOne({ [nameField]: { $regex: value, $options: 'i' } });
        return doc ? doc._id : null;
      }
    };

    // State
    if (req.query.state_id || req.query.state) {
      const stateId = await handleIdOrName('state_id', State) || await handleIdOrName('state', State);
      if (stateId) {
        query = query.where('state_id').equals(stateId);
      } else if (req.query.state_id || req.query.state) {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Division
    if (req.query.division_id || req.query.division) {
      const divisionId = await handleIdOrName('division_id', Division) || await handleIdOrName('division', Division);
      if (divisionId) {
        query = query.where('division_id').equals(divisionId);
      } else if (req.query.division_id || req.query.division) {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Parliament
    if (req.query.parliament_id || req.query.parliament) {
      const parliamentId = await handleIdOrName('parliament_id', Parliament) || await handleIdOrName('parliament', Parliament);
      if (parliamentId) {
        query = query.where('parliament_id').equals(parliamentId);
      } else if (req.query.parliament_id || req.query.parliament) {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Assembly
    if (req.query.assembly_id || req.query.assembly) {
      const assemblyId = await handleIdOrName('assembly_id', Assembly) || await handleIdOrName('assembly', Assembly);
      if (assemblyId) {
        query = query.where('assembly_id').equals(assemblyId);
      } else if (req.query.assembly_id || req.query.assembly) {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Block
    if (req.query.block_id || req.query.block) {
      const blockId = await handleIdOrName('block_id', Block) || await handleIdOrName('block', Block);
      if (blockId) {
        query = query.where('block_id').equals(blockId);
      } else if (req.query.block_id || req.query.block) {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Booth
    if (req.query.booth_id || req.query.booth) {
      const boothId = await handleIdOrName('booth_id', Booth) || await handleIdOrName('booth', Booth);
      if (boothId) {
        query = query.where('booth_id').equals(boothId);
      } else if (req.query.booth_id || req.query.booth) {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
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
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
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
      created_by: req.user.id,
      description: req.body.description || '',
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
    req.body.description = req.body.description || '';
    req.body.updated_at = new Date();

    gender = await Gender.findByIdAndUpdate(req.params.id, req.body, {
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
      .sort({ female: 1, male: 1, others: 1 })
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
      .sort({ female: 1, male: 1, others: 1 })
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