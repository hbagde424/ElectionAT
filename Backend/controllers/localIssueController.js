const LocalIssue = require('../models/LocalIssue');
const State = require('../models/state');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const Assembly = require('../models/Assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');
const User = require('../models/User');

// @desc    Get all local issues
// @route   GET /api/local-issues
// @access  Public
exports.getLocalIssues = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Base query
    let query = LocalIssue.find()
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
        $or: [
          { issue_name: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } },
          { department: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Filter by status
    if (req.query.status) {
      query = query.where('status').equals(req.query.status);
    }

    // Filter by priority
    if (req.query.priority) {
      query = query.where('priority').equals(req.query.priority);
    }

    // Filter by department
    if (req.query.department) {
      query = query.where('department').regex(new RegExp(`^${req.query.department}$`, 'i'));
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
    if (req.query.state) {
      const stateId = await handleIdOrName('state', State);
      if (stateId) {
        query = query.where('state_id').equals(stateId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Division
    if (req.query.division) {
      const divisionId = await handleIdOrName('division', Division);
      if (divisionId) {
        query = query.where('division_id').equals(divisionId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Parliament
    if (req.query.parliament) {
      const parliamentId = await handleIdOrName('parliament', Parliament);
      if (parliamentId) {
        query = query.where('parliament_id').equals(parliamentId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Assembly
    if (req.query.assembly) {
      const assemblyId = await handleIdOrName('assembly', Assembly);
      if (assemblyId) {
        query = query.where('assembly_id').equals(assemblyId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Block
    if (req.query.block) {
      const blockId = await handleIdOrName('block', Block);
      if (blockId) {
        query = query.where('block_id').equals(blockId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    // Booth
    if (req.query.booth) {
      const boothId = await handleIdOrName('booth', Booth);
      if (boothId) {
        query = query.where('booth_id').equals(boothId);
      } else {
        return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
      }
    }

    const localIssues = await query.skip(skip).limit(limit).exec();
    const total = await LocalIssue.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: localIssues.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: localIssues
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single local issue
// @route   GET /api/local-issues/:id
// @access  Public
exports.getLocalIssue = async (req, res, next) => {
  try {
    const localIssue = await LocalIssue.findById(req.params.id)
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username email')
      .populate('updated_by', 'username email');

    if (!localIssue) {
      return res.status(404).json({
        success: false,
        message: 'Local issue not found'
      });
    }

    res.status(200).json({
      success: true,
      data: localIssue
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create local issue
// @route   POST /api/local-issues
// @access  Private
exports.createLocalIssue = async (req, res, next) => {
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

    if (!state) return res.status(400).json({ success: false, message: 'State not found' });
    if (!division) return res.status(400).json({ success: false, message: 'Division not found' });
    if (!parliament) return res.status(400).json({ success: false, message: 'Parliament not found' });
    if (!assembly) return res.status(400).json({ success: false, message: 'Assembly not found' });
    if (!block) return res.status(400).json({ success: false, message: 'Block not found' });
    if (!booth) return res.status(400).json({ success: false, message: 'Booth not found' });

    // Verify division belongs to state
    if (division.state_id.toString() !== req.body.state_id) {
      return res.status(400).json({
        success: false,
        message: 'Division does not belong to selected state'
      });
    }

    // Set created_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const localIssueData = {
      ...req.body,
      created_by: req.user.id,
      description: req.body.description || '',
    };

    const localIssue = await LocalIssue.create(localIssueData);

    res.status(201).json({
      success: true,
      data: localIssue
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update local issue
// @route   PUT /api/local-issues/:id
// @access  Private
exports.updateLocalIssue = async (req, res, next) => {
  try {
    let localIssue = await LocalIssue.findById(req.params.id);

    if (!localIssue) {
      return res.status(404).json({
        success: false,
        message: 'Local issue not found'
      });
    }

    // Verify references if being updated
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

    // Verify division belongs to state if both are being updated
    if (req.body.state_id && req.body.division_id) {
      const division = await Division.findById(req.body.division_id);
      if (division.state_id.toString() !== req.body.state_id) {
        return res.status(400).json({
          success: false,
          message: 'Division does not belong to selected state'
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
    req.body.description = req.body.description || '';
    req.body.updated_at = new Date();

    localIssue = await LocalIssue.findByIdAndUpdate(req.params.id, req.body, {
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
      data: localIssue
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete local issue
// @route   DELETE /api/local-issues/:id
// @access  Private (Admin only)
exports.deleteLocalIssue = async (req, res, next) => {
  try {
    const localIssue = await LocalIssue.findById(req.params.id);

    if (!localIssue) {
      return res.status(404).json({
        success: false,
        message: 'Local issue not found'
      });
    }

    await localIssue.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get local issues by booth
// @route   GET /api/local-issues/booth/:boothId
// @access  Public
exports.getLocalIssuesByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const localIssues = await LocalIssue.find({ booth_id: req.params.boothId })
      .populate('state_id', 'name')
      .sort({ priority: -1, created_at: -1 })
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: localIssues.length,
      data: localIssues
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get local issues by status
// @route   GET /api/local-issues/status/:status
// @access  Public
exports.getLocalIssuesByStatus = async (req, res, next) => {
  try {
    const validStatuses = ['Reported', 'In Progress', 'Resolved', 'Rejected'];
    if (!validStatuses.includes(req.params.status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const localIssues = await LocalIssue.find({ status: req.params.status })
      .populate('state_id', 'name')
      .populate('booth_id', 'name booth_number')
      .sort({ priority: -1, created_at: -1 })
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: localIssues.length,
      data: localIssues
    });
  } catch (err) {
    next(err);
  }
};