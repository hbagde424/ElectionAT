const WorkStatus = require('../models/workStatus');
const Division = require('../models/division');
const Parliament = require('../models/parliament');
const Assembly = require('../models/assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');
const User = require('../models/User');

// @desc    Get all work statuses
// @route   GET /api/work-statuses
// @access  Public
exports.getWorkStatuses = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Base query with population
    let query = WorkStatus.find()
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

    // Filter by fund source
    if (req.query.fund_source) {
      query = query.where('approved_fund_from').equals(req.query.fund_source);
    }

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query = query.where('start_date').gte(new Date(req.query.startDate))
                   .where('expected_end_date').lte(new Date(req.query.endDate));
    } else if (req.query.startDate) {
      query = query.where('start_date').gte(new Date(req.query.startDate));
    } else if (req.query.endDate) {
      query = query.where('expected_end_date').lte(new Date(req.query.endDate));
    }

    // Filter by budget range
    if (req.query.minBudget && req.query.maxBudget) {
      query = query.where('total_budget').gte(parseInt(req.query.minBudget))
                   .where('total_budget').lte(parseInt(req.query.maxBudget));
    } else if (req.query.minBudget) {
      query = query.where('total_budget').gte(parseInt(req.query.minBudget));
    } else if (req.query.maxBudget) {
      query = query.where('total_budget').lte(parseInt(req.query.maxBudget));
    }

    // Filter by geographical hierarchy
    if (req.query.division) query = query.where('division_id').equals(req.query.division);
    if (req.query.parliament) query = query.where('parliament_id').equals(req.query.parliament);
    if (req.query.assembly) query = query.where('assembly_id').equals(req.query.assembly);
    if (req.query.block) query = query.where('block_id').equals(req.query.block);
    if (req.query.booth) query = query.where('booth_id').equals(req.query.booth);

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
// @route   GET /api/work-statuses/:id
// @access  Public
exports.getWorkStatus = async (req, res, next) => {
  try {
    const workStatus = await WorkStatus.findById(req.params.id)
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username email')
      .populate('updated_by', 'username email');

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
// @route   POST /api/work-statuses
// @access  Private
exports.createWorkStatus = async (req, res, next) => {
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

    // Validate dates
    if (new Date(req.body.expected_end_date) < new Date(req.body.start_date)) {
      return res.status(400).json({
        success: false,
        message: 'Expected end date must be after start date'
      });
    }

    // Set created_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
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
// @route   PUT /api/work-statuses/:id
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

    // Validate dates if being updated
    if (req.body.start_date || req.body.expected_end_date) {
      const startDate = req.body.start_date ? new Date(req.body.start_date) : workStatus.start_date;
      const endDate = req.body.expected_end_date ? new Date(req.body.expected_end_date) : workStatus.expected_end_date;
      
      if (endDate < startDate) {
        return res.status(400).json({
          success: false,
          message: 'Expected end date must be after start date'
        });
      }
    }

    // Validate actual end date if being updated
    if (req.body.actual_end_date) {
      const startDate = req.body.start_date ? new Date(req.body.start_date) : workStatus.start_date;
      if (new Date(req.body.actual_end_date) < startDate) {
        return res.status(400).json({
          success: false,
          message: 'Actual end date must be after start date'
        });
      }
    }

    // Validate spent amount if being updated
    if (req.body.spent_amount !== undefined) {
      const totalBudget = req.body.total_budget || workStatus.total_budget;
      if (req.body.spent_amount > totalBudget) {
        return res.status(400).json({
          success: false,
          message: 'Spent amount cannot exceed total budget'
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

    workStatus = await WorkStatus.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
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
// @route   DELETE /api/work-statuses/:id
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

// @desc    Add document to work status
// @route   POST /api/work-statuses/:id/documents
// @access  Private
exports.addDocument = async (req, res, next) => {
  try {
    const workStatus = await WorkStatus.findById(req.params.id);

    if (!workStatus) {
      return res.status(404).json({
        success: false,
        message: 'Work status not found'
      });
    }

    if (!req.body.name || !req.body.url) {
      return res.status(400).json({
        success: false,
        message: 'Document name and URL are required'
      });
    }

    // Validate URL format
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
    if (!urlRegex.test(req.body.url)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document URL format'
      });
    }

    workStatus.documents.push({
      name: req.body.name,
      url: req.body.url
    });

    // Set updated_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    workStatus.updated_by = req.user.id;
    await workStatus.save();

    res.status(200).json({
      success: true,
      data: workStatus
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get work statuses by booth
// @route   GET /api/work-statuses/booth/:boothId
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
      .sort({ status: 1, start_date: -1 })
      .populate('division_id', 'name')
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

// @desc    Get work statuses by status
// @route   GET /api/work-statuses/status/:status
// @access  Public
exports.getWorkStatusesByStatus = async (req, res, next) => {
  try {
    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Halted', 'Cancelled'];
    if (!validStatuses.includes(req.params.status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const workStatuses = await WorkStatus.find({ status: req.params.status })
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