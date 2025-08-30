const WorkStatus = require('../models/WorkStatus');
const State = require('../models/state');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const Assembly = require('../models/Assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');

// @desc    Get all work statuses
// @route   GET /api/work-status
// @access  Public
exports.getWorkStatuses = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Basic query
    let query = WorkStatus.find()
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ start_date: -1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { work_name: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } },
          { falia: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Filter by status
    if (req.query.status) {
      query = query.where('status').equals(req.query.status);
    }

    // Filter by work_type
    if (req.query.workType || req.query.work_type) {
      query = query.where('work_type').equals(req.query.workType || req.query.work_type);
    }

    // Filter by department
    if (req.query.department) {
      query = query.where('department').equals(req.query.department);
    }

    // Filter by approved_fund_from
    if (req.query.fund_source) {
      query = query.where('approved_fund_from').equals(req.query.fund_source);
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

    // Date range filters
    if (req.query.start_date_from) {
      query = query.where('start_date').gte(new Date(req.query.start_date_from));
    }
    if (req.query.start_date_to) {
      query = query.where('start_date').lte(new Date(req.query.start_date_to));
    }
    if (req.query.end_date_from) {
      query = query.where('expected_end_date').gte(new Date(req.query.end_date_from));
    }
    if (req.query.end_date_to) {
      query = query.where('expected_end_date').lte(new Date(req.query.end_date_to));
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
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

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
// @access  Private (Admin only)
exports.createWorkStatus = async (req, res, next) => {
  try {
    // ✅ Validate date order first
    if (req.body.expected_end_date && new Date(req.body.expected_end_date) < new Date(req.body.start_date)) {
      return res.status(400).json({ success: false, message: 'Expected end date must be after start date' });
    }
    if (req.body.actual_end_date && new Date(req.body.actual_end_date) < new Date(req.body.start_date)) {
      return res.status(400).json({ success: false, message: 'Actual end date must be after start date' });
    }

    // ✅ Validate budget
    if (req.body.spent_amount > req.body.total_budget) {
      return res.status(400).json({ success: false, message: 'Spent amount cannot exceed total budget' });
    }

    const workStatus = await WorkStatus.create({
      ...req.body,
      created_by: req.user.id,
      description: req.body.description || ''
    });

    res.status(201).json({ success: true, data: workStatus });
  } catch (err) {
    next(err);
  }
};

// @desc    Update work status
// @route   PUT /api/work-status/:id
// @access  Private (Admin only)
exports.updateWorkStatus = async (req, res, next) => {
  try {
    let workStatus = await WorkStatus.findById(req.params.id);
    if (!workStatus) {
      return res.status(404).json({ success: false, message: 'Work status not found' });
    }

    const startDate = req.body.start_date ? new Date(req.body.start_date) : workStatus.start_date;
    const expectedEndDate = req.body.expected_end_date ? new Date(req.body.expected_end_date) : workStatus.expected_end_date;

    if (expectedEndDate < startDate) {
      return res.status(400).json({ success: false, message: 'Expected end date must be after start date' });
    }
    if (req.body.actual_end_date && new Date(req.body.actual_end_date) < startDate) {
      return res.status(400).json({ success: false, message: 'Actual end date must be after start date' });
    }

    const totalBudget = req.body.total_budget || workStatus.total_budget;
    const spentAmount = req.body.spent_amount || workStatus.spent_amount;
    if (spentAmount > totalBudget) {
      return res.status(400).json({ success: false, message: 'Spent amount cannot exceed total budget' });
    }

    workStatus = await WorkStatus.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_by: req.user.id, updated_at: new Date() },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: workStatus });
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

    await workStatus.deleteOne();

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
      .sort({ start_date: -1 })
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: workStatuses.length,
      data: workStatuses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get work statuses by block
// @route   GET /api/work-status/block/:blockId
// @access  Public
exports.getWorkStatusesByBlock = async (req, res, next) => {
  try {
    // Verify block exists
    const block = await Block.findById(req.params.blockId);
    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    const workStatuses = await WorkStatus.find({ block_id: req.params.blockId })
      .sort({ start_date: -1 })
      .populate('booth_id', 'name booth_number')
      .populate('assembly_id', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: workStatuses.length,
      data: workStatuses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get work statuses by assembly
// @route   GET /api/work-status/assembly/:assemblyId
// @access  Public
exports.getWorkStatusesByAssembly = async (req, res, next) => {
  try {
    // Verify assembly exists
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    const workStatuses = await WorkStatus.find({ assembly_id: req.params.assemblyId })
      .sort({ start_date: -1 })
      .populate('booth_id', 'name booth_number')
      .populate('block_id', 'name')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: workStatuses.length,
      data: workStatuses
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get work status statistics
// @route   GET /api/work-status/statistics
// @access  Public
exports.getWorkStatusStatistics = async (req, res, next) => {
  try {
    const statistics = await WorkStatus.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBudget: { $sum: '$total_budget' },
          totalSpent: { $sum: '$spent_amount' }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          totalBudget: 1,
          totalSpent: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (err) {
    next(err);
  }
};