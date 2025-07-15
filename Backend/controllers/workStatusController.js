const WorkStatus = require('../models/WorkStatus');
const State = require('../models/state');
const Division = require('../models/division');
const Parliament = require('../models/parliament');
const Assembly = require('../models/assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');

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

    // Filter by department
    if (req.query.department) {
      query = query.where('department').equals(req.query.department);
    }

    // Filter by approved_fund_from
    if (req.query.fund_source) {
      query = query.where('approved_fund_from').equals(req.query.fund_source);
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

    // Validate dates
    if (new Date(req.body.expected_end_date) < new Date(req.body.start_date)) {
      return res.status(400).json({
        success: false,
        message: 'Expected end date must be after start date'
      });
    }

    if (req.body.actual_end_date && new Date(req.body.actual_end_date) < new Date(req.body.start_date)) {
      return res.status(400).json({
        success: false,
        message: 'Actual end date must be after start date'
      });
    }

    // Validate spent amount
    if (req.body.spent_amount > req.body.total_budget) {
      return res.status(400).json({
        success: false,
        message: 'Spent amount cannot exceed total budget'
      });
    }

    const workStatusData = {
      ...req.body,
      created_by: req.user.id
    };

    const workStatus = await WorkStatus.create(workStatusData);

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
// @access  Private (Admin only)
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

    // Validate dates if being updated
    const startDate = req.body.start_date ? new Date(req.body.start_date) : workStatus.start_date;
    const expectedEndDate = req.body.expected_end_date ? new Date(req.body.expected_end_date) : workStatus.expected_end_date;
    
    if (expectedEndDate < startDate) {
      return res.status(400).json({
        success: false,
        message: 'Expected end date must be after start date'
      });
    }

    if (req.body.actual_end_date && new Date(req.body.actual_end_date) < startDate) {
      return res.status(400).json({
        success: false,
        message: 'Actual end date must be after start date'
      });
    }

    // Validate budget if being updated
    const totalBudget = req.body.total_budget || workStatus.total_budget;
    const spentAmount = req.body.spent_amount || workStatus.spent_amount;
    
    if (spentAmount > totalBudget) {
      return res.status(400).json({
        success: false,
        message: 'Spent amount cannot exceed total budget'
      });
    }

    // Set updated_by
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

    workStatus = await WorkStatus.findByIdAndUpdate(req.params.id, updateData, {
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