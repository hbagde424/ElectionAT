const PartyActivity = require('../models/partyActivity');
const Party = require('../models/party');
const Assembly = require('../models/assembly');
const Booth = require('../models/booth');
const User = require('../models/User');

// @desc    Get all party activities
// @route   GET /api/party-activities
// @access  Public
exports.getPartyActivities = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = PartyActivity.find()
      .populate('party_id', 'name abbreviation symbol')
      .populate('assembly_id', 'name number')
      .populate('booth_id', 'booth_number location')
      .populate('created_by', 'name email')
      .sort({ activity_date: -1 });

    // Filter by party
    if (req.query.party) {
      query = query.where('party_id').equals(req.query.party);
    }

    // Filter by assembly
    if (req.query.assembly) {
      query = query.where('assembly_id').equals(req.query.assembly);
    }

    // Filter by booth
    if (req.query.booth) {
      query = query.where('booth_id').equals(req.query.booth);
    }

    // Filter by activity type
    if (req.query.type) {
      query = query.where('activity_type').equals(req.query.type);
    }

    // Filter by status
    if (req.query.status) {
      query = query.where('status').equals(req.query.status);
    }

    // Filter by date range
    if (req.query.startDate) {
      const startDate = new Date(req.query.startDate);
      query = query.where('activity_date').gte(startDate);
    }
    if (req.query.endDate) {
      const endDate = new Date(req.query.endDate);
      query = query.where('activity_date').lte(endDate);
    }

    // Filter by media coverage
    if (req.query.mediaCoverage) {
      query = query.where('media_coverage').equals(req.query.mediaCoverage === 'true');
    }

    const activities = await query.skip(skip).limit(limit).exec();
    const total = await PartyActivity.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: activities.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: activities
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single party activity
// @route   GET /api/party-activities/:id
// @access  Public
exports.getPartyActivityById = async (req, res, next) => {
  try {
    const activity = await PartyActivity.findById(req.params.id)
      .populate('party_id', 'name abbreviation symbol')
      .populate('assembly_id', 'name number')
      .populate('booth_id', 'booth_number location')
      .populate('created_by', 'name email');

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new party activity
// @route   POST /api/party-activities
// @access  Private (Admin/Editor)
exports.createPartyActivity = async (req, res, next) => {
  try {
    // Verify party exists
    const party = await Party.findById(req.body.party_id);
    if (!party) {
      return res.status(400).json({
        success: false,
        message: 'Party not found'
      });
    }

    // Verify assembly exists if provided
    if (req.body.assembly_id) {
      const assembly = await Assembly.findById(req.body.assembly_id);
      if (!assembly) {
        return res.status(400).json({
          success: false,
          message: 'Assembly not found'
        });
      }
    }

    // Verify booth exists if provided
    if (req.body.booth_id) {
      const booth = await Booth.findById(req.body.booth_id);
      if (!booth) {
        return res.status(400).json({
          success: false,
          message: 'Booth not found'
        });
      }
    }

    // Verify creator exists
    const creator = await User.findById(req.body.created_by);
    if (!creator) {
      return res.status(400).json({
        success: false,
        message: 'Creator user not found'
      });
    }

    const activity = await PartyActivity.create(req.body);

    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update party activity
// @route   PUT /api/party-activities/:id
// @access  Private (Admin/Editor)
exports.updatePartyActivity = async (req, res, next) => {
  try {
    let activity = await PartyActivity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Verify party exists if being updated
    if (req.body.party_id) {
      const party = await Party.findById(req.body.party_id);
      if (!party) {
        return res.status(400).json({
          success: false,
          message: 'Party not found'
        });
      }
    }

    // Verify assembly exists if being updated
    if (req.body.assembly_id) {
      const assembly = await Assembly.findById(req.body.assembly_id);
      if (!assembly) {
        return res.status(400).json({
          success: false,
          message: 'Assembly not found'
        });
      }
    }

    // Verify booth exists if being updated
    if (req.body.booth_id) {
      const booth = await Booth.findById(req.body.booth_id);
      if (!booth) {
        return res.status(400).json({
          success: false,
          message: 'Booth not found'
        });
      }
    }

    // Verify creator exists if being updated
    if (req.body.created_by) {
      const creator = await User.findById(req.body.created_by);
      if (!creator) {
        return res.status(400).json({
          success: false,
          message: 'Creator user not found'
        });
      }
    }

    activity = await PartyActivity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('party_id assembly_id booth_id created_by');

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete party activity
// @route   DELETE /api/party-activities/:id
// @access  Private (Admin)
exports.deletePartyActivity = async (req, res, next) => {
  try {
    const activity = await PartyActivity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    await activity.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get activities by party ID
// @route   GET /api/party-activities/party/:partyId
// @access  Public
exports.getActivitiesByParty = async (req, res, next) => {
  try {
    // Verify party exists
    const party = await Party.findById(req.params.partyId);
    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    const activities = await PartyActivity.find({ party_id: req.params.partyId })
      .populate('assembly_id', 'name number')
      .populate('booth_id', 'booth_number location')
      .populate('created_by', 'name email')
      .sort({ activity_date: -1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get activities by assembly ID
// @route   GET /api/party-activities/assembly/:assemblyId
// @access  Public
exports.getActivitiesByAssembly = async (req, res, next) => {
  try {
    // Verify assembly exists
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    const activities = await PartyActivity.find({ assembly_id: req.params.assemblyId })
      .populate('party_id', 'name abbreviation symbol')
      .populate('booth_id', 'booth_number location')
      .populate('created_by', 'name email')
      .sort({ activity_date: -1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get activities by booth ID
// @route   GET /api/party-activities/booth/:boothId
// @access  Public
exports.getActivitiesByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const activities = await PartyActivity.find({ booth_id: req.params.boothId })
      .populate('party_id', 'name abbreviation symbol')
      .populate('assembly_id', 'name number')
      .populate('created_by', 'name email')
      .sort({ activity_date: -1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get activities by type
// @route   GET /api/party-activities/type/:activityType
// @access  Public
exports.getActivitiesByType = async (req, res, next) => {
  try {
    const validTypes = ['rally', 'sabha', 'meeting', 'campaign', 'door_to_door', 'press_conference'];
    if (!validTypes.includes(req.params.activityType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity type'
      });
    }

    const activities = await PartyActivity.find({ activity_type: req.params.activityType })
      .populate('party_id', 'name abbreviation symbol')
      .populate('assembly_id', 'name number')
      .populate('booth_id', 'booth_number location')
      .populate('created_by', 'name email')
      .sort({ activity_date: -1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get activities by status
// @route   GET /api/party-activities/status/:status
// @access  Public
exports.getActivitiesByStatus = async (req, res, next) => {
  try {
    const validStatuses = ['scheduled', 'completed', 'cancelled', 'postponed'];
    if (!validStatuses.includes(req.params.status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const activities = await PartyActivity.find({ status: req.params.status })
      .populate('party_id', 'name abbreviation symbol')
      .populate('assembly_id', 'name number')
      .populate('booth_id', 'booth_number location')
      .populate('created_by', 'name email')
      .sort({ activity_date: -1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (err) {
    next(err);
  }
};