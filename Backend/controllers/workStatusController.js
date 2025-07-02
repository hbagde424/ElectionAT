const WorkStatus = require('../models/WorkStatus');
const Division = require('../models/division');
const Parliament = require('../models/parliament');
const Assembly = require('../models/assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');
const User = require('../models/User');

// @desc    Get all work statuses
// @route   GET /api/work-status
// @access  Public
exports.getWorkStatuses = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = WorkStatus.find()
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'booth_number name')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email')
      .sort({ updated_at: -1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({ $text: { $search: req.query.search } });
    }

    // Filter by status
    if (req.query.status) {
      query = query.where('status').equals(req.query.status);
    }

    // Filter by department
    if (req.query.department) {
      query = query.where('department').equals(req.query.department);
    }

    // Filter by booth
    if (req.query.booth) {
      query = query.where('booth_id').equals(req.query.booth);
    }

    // Filter by assembly
    if (req.query.assembly) {
      query = query.where('assembly_id').equals(req.query.assembly);
    }

    // Filter by creator
    if (req.query.creator) {
      query = query.where('created_by').equals(req.query.creator);
    }

    const workStatuses = await query.skip(skip).limit(limit).exec();
    const total = await WorkStatus.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: workStatuses.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: workStatuses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single work status
// @route   GET /api/work-status/:id
// @access  Public
exports.getWorkStatus = async (req, res, next) => {
  try {
    const workStatus = await WorkStatus.findById(req.params.id)
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'booth_number name')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email');

    if (!workStatus) {
      return res.status(404).json({
        success: false,
        message: 'Work status not found'
      });
    }

    res.status(200).json({
      success: true,
      data: workStatus
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create work status
// @route   POST /api/work-status
// @access  Private
exports.createWorkStatus = async (req, res, next) => {
  try {
    // Verify all references except created_by
    const [
      division, parliament, assembly, block, booth
    ] = await Promise.all([
      Division.findById(req.body.division_id),
      Parliament.findById(req.body.parliament_id),
      Assembly.findById(req.body.assembly_id),
      Block.findById(req.body.block_id),
      Booth.findById(req.body.booth_id)
    ]);

    if (!division || !parliament || !assembly || !block || !booth) {
      return res.status(400).json({
        success: false,
        message: 'One or more references are invalid'
      });
    }

    // Create with authenticated user as creator
    const workStatus = await WorkStatus.create({
      ...req.body,
      created_by: req.user._id // From your auth middleware
    });

    res.status(201).json({
      success: true,
      data: workStatus
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update work status
// @route   PUT /api/work-status/:id
// @access  Private
exports.updateWorkStatus = async (req, res, next) => {
  try {
    let workStatus = await WorkStatus.findById(req.params.id);

    if (!workStatus) {
      return res.status(404).json({
        success: false,
        message: 'Work status not found'
      });
    }

    // Verify all references exist if being updated
    const referenceChecks = [];
    if (req.body.division_id) referenceChecks.push(Division.findById(req.body.division_id));
    if (req.body.parliament_id) referenceChecks.push(Parliament.findById(req.body.parliament_id));
    if (req.body.assembly_id) referenceChecks.push(Assembly.findById(req.body.assembly_id));
    if (req.body.block_id) referenceChecks.push(Block.findById(req.body.block_id));
    if (req.body.booth_id) referenceChecks.push(Booth.findById(req.body.booth_id));
    if (req.body.updated_by) referenceChecks.push(User.findById(req.body.updated_by));

    const results = await Promise.all(referenceChecks);
    if (results.some(result => !result)) {
      return res.status(400).json({
        success: false,
        message: 'One or more references are invalid'
      });
    }

    workStatus = await WorkStatus.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'booth_number name')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email');

    res.status(200).json({
      success: true,
      data: workStatus
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete work status
// @route   DELETE /api/work-status/:id
// @access  Private (Admin only)
exports.deleteWorkStatus = async (req, res, next) => {
  try {
    const workStatus = await WorkStatus.findById(req.params.id);

    if (!workStatus) {
      return res.status(404).json({
        success: false,
        message: 'Work status not found'
      });
    }

    await workStatus.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get work statuses by booth
// @route   GET /api/work-status/booth/:boothId
// @access  Public
exports.getWorkStatusesByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const workStatuses = await WorkStatus.find({ booth_id: req.params.boothId })
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'booth_number name')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email')
      .sort({ updated_at: -1 });

    res.status(200).json({
      success: true,
      count: workStatuses.length,
      data: workStatuses
    });
  } catch (err) {
    next(err);
  }
};