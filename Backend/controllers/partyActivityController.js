const PartyActivity = require('../models/partyActivity');
const Party = require('../models/party');
const Division = require('../models/division');
const Parliament = require('../models/parliament');
const Assembly = require('../models/assembly');
const Block = require('../models/block');
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

    // Base query with population
    let query = PartyActivity.find()
      .populate('party_id', 'name symbol')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'name')
      .populate('updated_by', 'name')
      .sort({ activity_date: -1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { title: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } },
          { location: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Filter by party
    if (req.query.party) {
      query = query.where('party_id').equals(req.query.party);
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

    // Filter by activity type
    if (req.query.activity_type) {
      query = query.where('activity_type').equals(req.query.activity_type);
    }

    // Filter by status
    if (req.query.status) {
      query = query.where('status').equals(req.query.status);
    }

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query = query.where('activity_date').gte(new Date(req.query.startDate))
                   .where('activity_date').lte(new Date(req.query.endDate));
    } else if (req.query.startDate) {
      query = query.where('activity_date').gte(new Date(req.query.startDate));
    } else if (req.query.endDate) {
      query = query.where('activity_date').lte(new Date(req.query.endDate));
    }

    // Filter by media coverage
    if (req.query.media_coverage) {
      query = query.where('media_coverage').equals(req.query.media_coverage === 'true');
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
exports.getPartyActivity = async (req, res, next) => {
  try {
    const activity = await PartyActivity.findById(req.params.id)
      .populate('party_id', 'name symbol')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'name email')
      .populate('updated_by', 'name email');

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Party activity not found'
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

// @desc    Create party activity
// @route   POST /api/party-activities
// @access  Private
exports.createPartyActivity = async (req, res, next) => {
  try {
    // Verify all references exist
    const [
      party,
      division,
      parliament,
      assembly,
      block,
      booth
    ] = await Promise.all([
      Party.findById(req.body.party_id),
      req.body.division_id ? Division.findById(req.body.division_id) : Promise.resolve(null),
      Parliament.findById(req.body.parliament_id),
      req.body.assembly_id ? Assembly.findById(req.body.assembly_id) : Promise.resolve(null),
      req.body.block_id ? Block.findById(req.body.block_id) : Promise.resolve(null),
      req.body.booth_id ? Booth.findById(req.body.booth_id) : Promise.resolve(null)
    ]);

    if (!party) return res.status(400).json({ success: false, message: 'Party not found' });
    if (req.body.division_id && !division) {
      return res.status(400).json({ success: false, message: 'Division not found' });
    }
    if (!parliament) return res.status(400).json({ success: false, message: 'Parliament not found' });
    if (req.body.assembly_id && !assembly) {
      return res.status(400).json({ success: false, message: 'Assembly not found' });
    }
    if (req.body.block_id && !block) {
      return res.status(400).json({ success: false, message: 'Block not found' });
    }
    if (req.body.booth_id && !booth) {
      return res.status(400).json({ success: false, message: 'Booth not found' });
    }

    // Validate end date if provided
    if (req.body.end_date && new Date(req.body.end_date) < new Date(req.body.activity_date)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after activity date'
      });
    }

    // Set created_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const activityData = {
      ...req.body,
      created_by: req.user.id
    };

    const activity = await PartyActivity.create(activityData);

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
// @access  Private
exports.updatePartyActivity = async (req, res, next) => {
  try {
    let activity = await PartyActivity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Party activity not found'
      });
    }

    // Verify references if being updated
    const verificationPromises = [
      req.body.party_id ? Party.findById(req.body.party_id) : Promise.resolve(null),
      req.body.division_id ? Division.findById(req.body.division_id) : Promise.resolve(null),
      req.body.parliament_id ? Parliament.findById(req.body.parliament_id) : Promise.resolve(null),
      req.body.assembly_id ? Assembly.findById(req.body.assembly_id) : Promise.resolve(null),
      req.body.block_id ? Block.findById(req.body.block_id) : Promise.resolve(null),
      req.body.booth_id ? Booth.findById(req.body.booth_id) : Promise.resolve(null)
    ];

    const verificationResults = await Promise.all(verificationPromises);
    
    if (req.body.party_id && !verificationResults[0]) {
      return res.status(400).json({ success: false, message: 'Party not found' });
    }
    if (req.body.division_id && !verificationResults[1]) {
      return res.status(400).json({ success: false, message: 'Division not found' });
    }
    if (req.body.parliament_id && !verificationResults[2]) {
      return res.status(400).json({ success: false, message: 'Parliament not found' });
    }
    if (req.body.assembly_id && !verificationResults[3]) {
      return res.status(400).json({ success: false, message: 'Assembly not found' });
    }
    if (req.body.block_id && !verificationResults[4]) {
      return res.status(400).json({ success: false, message: 'Block not found' });
    }
    if (req.body.booth_id && !verificationResults[5]) {
      return res.status(400).json({ success: false, message: 'Booth not found' });
    }

    // Validate dates if being updated
    if (req.body.activity_date || req.body.end_date) {
      const activityDate = req.body.activity_date ? new Date(req.body.activity_date) : activity.activity_date;
      const endDate = req.body.end_date ? new Date(req.body.end_date) : activity.end_date;
      
      if (endDate && endDate < activityDate) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after activity date'
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

    activity = await PartyActivity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('party_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'name')
      .populate('updated_by', 'name');

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
// @access  Private (Admin only)
exports.deletePartyActivity = async (req, res, next) => {
  try {
    const activity = await PartyActivity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Party activity not found'
      });
    }

    await activity.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add media link to party activity
// @route   POST /api/party-activities/:id/media
// @access  Private
exports.addMediaLink = async (req, res, next) => {
  try {
    const activity = await PartyActivity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Party activity not found'
      });
    }

    if (!req.body.url) {
      return res.status(400).json({
        success: false,
        message: 'Media URL is required'
      });
    }

    // Validate URL format
    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
    if (!urlRegex.test(req.body.url)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid media URL format'
      });
    }

    activity.media_links.push(req.body.url);
    activity.media_coverage = true;

    // Set updated_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    activity.updated_by = req.user.id;
    await activity.save();

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get party activities by party
// @route   GET /api/party-activities/party/:partyId
// @access  Public
exports.getPartyActivitiesByParty = async (req, res, next) => {
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
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .sort({ activity_date: -1 })
      .populate('created_by', 'name');

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get party activities by parliament
// @route   GET /api/party-activities/parliament/:parliamentId
// @access  Public
exports.getPartyActivitiesByParliament = async (req, res, next) => {
  try {
    // Verify parliament exists
    const parliament = await Parliament.findById(req.params.parliamentId);
    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliament not found'
      });
    }

    const activities = await PartyActivity.find({ parliament_id: req.params.parliamentId })
      .populate('party_id', 'name symbol')
      .populate('division_id', 'name')
      .populate('assembly_id', 'name')
      .sort({ activity_date: -1 })
      .populate('created_by', 'name');

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get party activities by division
// @route   GET /api/party-activities/division/:divisionId
// @access  Public
exports.getPartyActivitiesByDivision = async (req, res, next) => {
  try {
    // Verify division exists
    const division = await Division.findById(req.params.divisionId);
    if (!division) {
      return res.status(404).json({
        success: false,
        message: 'Division not found'
      });
    }

    const activities = await PartyActivity.find({ division_id: req.params.divisionId })
      .populate('party_id', 'name symbol')
      .populate('parliament_id', 'name')
      .sort({ activity_date: -1 })
      .populate('created_by', 'name');

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get party activities by block
// @route   GET /api/party-activities/block/:blockId
// @access  Public
exports.getPartyActivitiesByBlock = async (req, res, next) => {
  try {
    // Verify block exists
    const block = await Block.findById(req.params.blockId);
    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    const activities = await PartyActivity.find({ block_id: req.params.blockId })
      .populate('party_id', 'name symbol')
      .populate('assembly_id', 'name')
      .sort({ activity_date: -1 })
      .populate('created_by', 'name');

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (err) {
    next(err);
  }
};