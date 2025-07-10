const PartyActivity = require('../models/partyActivity');
const Party = require('../models/party');
const State = require('../models/state');
const Division = require('../models/division');
const Parliament = require('../models/parliament');
const Assembly = require('../models/assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');

// @desc    Get all party activities
// @route   GET /api/party-activities
// @access  Public
exports.getPartyActivities = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = PartyActivity.find()
      .populate('party_id', 'name')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username name')
      .populate('updated_by', 'username name')
      .sort({ activity_date: -1 });

    // Search
    if (req.query.search) {
      query = query.find({
        $or: [
          { title: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } },
          { location: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Filters
    if (req.query.party) query = query.where('party_id').equals(req.query.party);
    if (req.query.state) query = query.where('state_id').equals(req.query.state);
    if (req.query.activity_type) query = query.where('activity_type').equals(req.query.activity_type);
    if (req.query.status) query = query.where('status').equals(req.query.status);

    // Date range
    if (req.query.start_date && req.query.end_date) {
      query = query.where('activity_date').gte(new Date(req.query.start_date))
                   .lte(new Date(req.query.end_date));
    } else if (req.query.start_date) {
      query = query.where('activity_date').gte(new Date(req.query.start_date));
    } else if (req.query.end_date) {
      query = query.where('activity_date').lte(new Date(req.query.end_date));
    }

    // Geographical filters
    if (req.query.division) query = query.where('division_id').equals(req.query.division);
    if (req.query.parliament) query = query.where('parliament_id').equals(req.query.parliament);
    if (req.query.assembly) query = query.where('assembly_id').equals(req.query.assembly);
    if (req.query.block) query = query.where('block_id').equals(req.query.block);
    if (req.query.booth) query = query.where('booth_id').equals(req.query.booth);

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
      .populate('party_id', 'name')
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username name')
      .populate('updated_by', 'username name');

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
// @access  Private (Admin only)
exports.createPartyActivity = async (req, res, next) => {
  try {
    const [
      party,
      state,
      division,
      parliament,
      assembly,
      block,
      booth
    ] = await Promise.all([
      Party.findById(req.body.party_id),
      State.findById(req.body.state_id),
      req.body.division_id ? Division.findById(req.body.division_id) : Promise.resolve(null),
      Parliament.findById(req.body.parliament_id),
      req.body.assembly_id ? Assembly.findById(req.body.assembly_id) : Promise.resolve(null),
      req.body.block_id ? Block.findById(req.body.block_id) : Promise.resolve(null),
      req.body.booth_id ? Booth.findById(req.body.booth_id) : Promise.resolve(null)
    ]);

    if (!party) return res.status(400).json({ success: false, message: 'Party not found' });
    if (!state) return res.status(400).json({ success: false, message: 'State not found' });
    if (req.body.division_id && !division) return res.status(400).json({ success: false, message: 'Division not found' });
    if (!parliament) return res.status(400).json({ success: false, message: 'Parliament not found' });
    if (req.body.assembly_id && !assembly) return res.status(400).json({ success: false, message: 'Assembly not found' });
    if (req.body.block_id && !block) return res.status(400).json({ success: false, message: 'Block not found' });
    if (req.body.booth_id && !booth) return res.status(400).json({ success: false, message: 'Booth not found' });

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const activity = await PartyActivity.create({
      ...req.body,
      created_by: req.user.id
    });

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
// @access  Private (Admin only)
exports.updatePartyActivity = async (req, res, next) => {
  try {
    let activity = await PartyActivity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Party activity not found'
      });
    }

    // Verify references
    const verificationPromises = [];
    if (req.body.party_id) verificationPromises.push(Party.findById(req.body.party_id));
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
          message: 'Referenced document not found'
        });
      }
    }

    activity = await PartyActivity.findByIdAndUpdate(req.params.id, {
      ...req.body,
      updated_by: req.user.id
    }, {
      new: true,
      runValidators: true
    })
    .populate('party_id', 'name')
    .populate('state_id', 'name')
    .populate('division_id', 'name')
    .populate('parliament_id', 'name')
    .populate('assembly_id', 'name')
    .populate('block_id', 'name')
    .populate('booth_id', 'name booth_number')
    .populate('created_by', 'username name')
    .populate('updated_by', 'username name');

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

// @desc    Get party activities by party
// @route   GET /api/party-activities/party/:partyId
// @access  Public
exports.getPartyActivitiesByParty = async (req, res, next) => {
  try {
    const party = await Party.findById(req.params.partyId);
    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    const activities = await PartyActivity.find({ party_id: req.params.partyId })
      .sort({ activity_date: -1 })
      .populate('state_id', 'name')
      .populate('division_id', 'name')
      .populate('parliament_id', 'name')
      .populate('assembly_id', 'name')
      .populate('block_id', 'name')
      .populate('booth_id', 'name booth_number')
      .populate('created_by', 'username name');

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get upcoming party activities
// @route   GET /api/party-activities/upcoming
// @access  Public
exports.getUpcomingPartyActivities = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activities = await PartyActivity.find({ 
      activity_date: { $gte: today },
      status: 'scheduled'
    })
    .sort({ activity_date: 1 })
    .populate('party_id', 'name')
    .populate('state_id', 'name')
    .populate('division_id', 'name')
    .populate('parliament_id', 'name')
    .populate('assembly_id', 'name')
    .populate('block_id', 'name')
    .populate('booth_id', 'name booth_number')
    .limit(10);

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (err) {
    next(err);
  }
};