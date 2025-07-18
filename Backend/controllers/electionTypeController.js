const ElectionType = require('../models/electionType');
const State = require('../models/state');
const Division = require('../models/division');
const Parliament = require('../models/parliament');
const Assembly = require('../models/assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');
const User = require('../models/User');

// @desc    Get all election types
// @route   GET /api/election-types
// @access  Public
exports.getElectionTypes = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    let query = ElectionType.find()
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ created_at: -1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({
        election_name: { $regex: req.query.search, $options: 'i' }
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

    const electionTypes = await query.skip(skip).limit(limit).exec();
    const total = await ElectionType.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: electionTypes.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: electionTypes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single election type
// @route   GET /api/election-types/:id
// @access  Public
exports.getElectionType = async (req, res, next) => {
  try {
    const electionType = await ElectionType.findById(req.params.id)
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!electionType) {
      return res.status(404).json({
        success: false,
        message: 'Election type not found'
      });
    }

    res.status(200).json({
      success: true,
      data: electionType
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create election type
// @route   POST /api/election-types
// @access  Private (Admin only)
exports.createElectionType = async (req, res, next) => {
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

    const electionTypeData = {
      ...req.body,
      created_by: req.user.id
    };

    const electionType = await ElectionType.create(electionTypeData);

    res.status(201).json({
      success: true,
      data: electionType
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update election type
// @route   PUT /api/election-types/:id
// @access  Private (Admin only)
exports.updateElectionType = async (req, res, next) => {
  try {
    let electionType = await ElectionType.findById(req.params.id);

    if (!electionType) {
      return res.status(404).json({
        success: false,
        message: 'Election type not found'
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

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const updateData = {
      ...req.body,
      updated_by: req.user.id
    };

    electionType = await ElectionType.findByIdAndUpdate(req.params.id, updateData, {
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
      data: electionType
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete election type
// @route   DELETE /api/election-types/:id
// @access  Private (Admin only)
exports.deleteElectionType = async (req, res, next) => {
  try {
    const electionType = await ElectionType.findById(req.params.id);

    if (!electionType) {
      return res.status(404).json({
        success: false,
        message: 'Election type not found'
      });
    }

    await electionType.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};