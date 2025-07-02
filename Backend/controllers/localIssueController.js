const LocalIssue = require('../models/LocalIssue');
const Division = require('../models/division');
const Parliament = require('../models/parliament');
const Assembly = require('../models/assembly');
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
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Base query
    let query = LocalIssue.find()
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'name')
      .populate('updated_by', 'name')
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
      query = query.where('department').equals(req.query.department);
    }

    // Filter by geographical hierarchy
    if (req.query.division) query = query.where('division_id').equals(req.query.division);
    if (req.query.parliament) query = query.where('parliament_id').equals(req.query.parliament);
    if (req.query.assembly) query = query.where('assembly_id').equals(req.query.assembly);
    if (req.query.block) query = query.where('block_id').equals(req.query.block);
    if (req.query.booth) query = query.where('booth_id').equals(req.query.booth);

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
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email');

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
      division,
      parliament,
      assembly,
      block,
      booth
    ] = await Promise.all([
      Division.findById(req.body.division_id),
      Parliament.findById(req.body.parliament_id),
      Assembly.findById(req.body.assembly_id),
      Block.findById(req.body.block_id),
      Booth.findById(req.body.booth_id)
    ]);

    if (!division) return res.status(400).json({ success: false, message: 'Division not found' });
    if (!parliament) return res.status(400).json({ success: false, message: 'Parliament not found' });
    if (!assembly) return res.status(400).json({ success: false, message: 'Assembly not found' });
    if (!block) return res.status(400).json({ success: false, message: 'Block not found' });
    if (!booth) return res.status(400).json({ success: false, message: 'Booth not found' });

    // Set created_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const localIssueData = {
      ...req.body,
      created_by: req.user.id
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

    // Set updated_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    req.body.updated_by = req.user.id;

    localIssue = await LocalIssue.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'name')
      .populate('updated_by', 'name');

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
      .sort({ priority: -1, created_at: -1 })
      .populate('created_by', 'name');

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
      .sort({ priority: -1, created_at: -1 })
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'name');

    res.status(200).json({
      success: true,
      count: localIssues.length,
      data: localIssues
    });
  } catch (err) {
    next(err);
  }
};