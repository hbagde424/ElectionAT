const Visit = require('../models/visit');
const Booth = require('../models/booth');
const Block = require('../models/block');
const Assembly = require('../models/assembly');
const Parliament = require('../models/parliament');
const Division = require('../models/division');
const State = require('../models/state');
const User = require('../models/User');

// @desc    Get all visits
// @route   GET /api/visits
// @access  Public
exports.getVisits = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    // Basic query
    let query = Visit.find()
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ date: -1 });

    // Filter by work status
    if (req.query.work_status) {
      query = query.where('work_status').equals(req.query.work_status);
    }

    const visits = await query.skip(skip).limit(limit).exec();
    const total = await Visit.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: visits.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: visits
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single visit
// @route   GET /api/visits/:id
// @access  Public
exports.getVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    res.status(200).json({
      success: true,
      data: visit
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create visit
// @route   POST /api/visits
// @access  Private (Admin/SuperAdmin)
exports.createVisit = async (req, res, next) => {
  try {
    // Verify all references exist
    const [
      state,
      division,
      assembly,
      parliament,
      block,
      booth,
      user
    ] = await Promise.all([
      State.findById(req.body.state_id),
      Division.findById(req.body.division_id),
      Assembly.findById(req.body.assembly_id),
      Parliament.findById(req.body.parliament_id),
      Block.findById(req.body.block_id),
      Booth.findById(req.body.booth_id),
      User.findById(req.user.id)
    ]);

    if (!state) return res.status(400).json({ success: false, message: 'State not found' });
    if (!division) return res.status(400).json({ success: false, message: 'Division not found' });
    if (!assembly) return res.status(400).json({ success: false, message: 'Assembly not found' });
    if (!parliament) return res.status(400).json({ success: false, message: 'Parliament not found' });
    if (!block) return res.status(400).json({ success: false, message: 'Block not found' });
    if (!booth) return res.status(400).json({ success: false, message: 'Booth not found' });
    if (!user) return res.status(400).json({ success: false, message: 'User not found' });

    // Set default work_status if not provided
    if (!req.body.work_status) {
      req.body.work_status = 'announced';
    }

    const visitData = {
      ...req.body,
      created_by: req.user.id
    };

    const visit = await Visit.create(visitData);

    res.status(201).json({
      success: true,
      data: visit
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update visit
// @route   PUT /api/visits/:id
// @access  Private (Admin/SuperAdmin)
exports.updateVisit = async (req, res, next) => {
  try {
    let visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
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
    req.body.updated_by = req.user.id;
    req.body.updated_at = new Date();

    visit = await Visit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: visit
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete visit
// @route   DELETE /api/visits/:id
// @access  Private (Admin/SuperAdmin)
exports.deleteVisit = async (req, res, next) => {
  try {
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found'
      });
    }

    await visit.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get visits by booth
// @route   GET /api/visits/booth/:boothId
// @access  Public
exports.getVisitsByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const visits = await Visit.find({ booth_id: req.params.boothId })
      .sort({ date: -1 })
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      count: visits.length,
      data: visits
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get visits by work status
// @route   GET /api/visits/status/:status
// @access  Public
exports.getVisitsByStatus = async (req, res, next) => {
  try {
    const validStatuses = ['announced', 'approved', 'in progress', 'complete'];
    if (!validStatuses.includes(req.params.status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid work status'
      });
    }

    const visits = await Visit.find({ work_status: req.params.status })
      .sort({ date: -1 })
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: visits.length,
      data: visits
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get visits by date range
// @route   GET /api/visits/date-range
// @access  Public
exports.getVisitsByDateRange = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Both startDate and endDate query parameters are required'
      });
    }

    const visits = await Visit.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
    .sort({ date: -1 })
    .populate('booth_id', 'name booth_number')
    .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: visits.length,
      data: visits
    });
  } catch (err) {
    next(err);
  }
};