const BoothVolunteers = require('../models/boothVolunteers');
const Booth = require('../models/booth');
const Party = require('../models/party');
const State = require('../models/state');
const Division = require('../models/division');
const Assembly = require('../models/assembly');
const Parliament = require('../models/parliament');
const Block = require('../models/block');
const User = require('../models/User');

// @desc    Get all booth volunteers
// @route   GET /api/booth-volunteers
// @access  Public
exports.getBoothVolunteers = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = BoothVolunteers.find()
      .populate('booth', 'name booth_number')
      .populate('party', 'name symbol')
      .populate('state', 'name')
      .populate('division', 'name')
      .populate('assembly', 'name')
      .populate('parliament', 'name')
      .populate('block', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ name: 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { name: { $regex: req.query.search, $options: 'i' } },
          { phone: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Filter by booth
    if (req.query.booth) {
      query = query.where('booth_id').equals(req.query.booth);
    }

    // Filter by party
    if (req.query.party) {
      query = query.where('party_id').equals(req.query.party);
    }

    // Filter by state
    if (req.query.state) {
      query = query.where('state_id').equals(req.query.state);
    }

    // Filter by division
    if (req.query.division) {
      query = query.where('division_id').equals(req.query.division);
    }

    // Filter by assembly
    if (req.query.assembly) {
      query = query.where('assembly_id').equals(req.query.assembly);
    }

    // Filter by parliament
    if (req.query.parliament) {
      query = query.where('parliament_id').equals(req.query.parliament);
    }

    // Filter by block
    if (req.query.block) {
      query = query.where('block_id').equals(req.query.block);
    }

    // Filter by activity level
    if (req.query.activity) {
      query = query.where('activity_level').equals(req.query.activity);
    }

    const volunteers = await query.skip(skip).limit(limit).exec();
    const total = await BoothVolunteers.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: volunteers.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: volunteers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single booth volunteer
// @route   GET /api/booth-volunteers/:id
// @access  Public
exports.getBoothVolunteer = async (req, res, next) => {
  try {
    const volunteer = await BoothVolunteers.findById(req.params.id)
      .populate('booth', 'name booth_number')
      .populate('party', 'name symbol')
      .populate('state', 'name')
      .populate('division', 'name')
      .populate('assembly', 'name')
      .populate('parliament', 'name')
      .populate('block', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Booth volunteer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: volunteer
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create booth volunteer
// @route   POST /api/booth-volunteers
// @access  Private (Admin/Coordinator)
exports.createBoothVolunteer = async (req, res, next) => {
  try {
    // Verify all references exist
    const [
      booth,
      party,
      state,
      division,
      assembly,
      parliament,
      block
    ] = await Promise.all([
      Booth.findById(req.body.booth_id),
      Party.findById(req.body.party_id),
      State.findById(req.body.state_id),
      Division.findById(req.body.division_id),
      Assembly.findById(req.body.assembly_id),
      Parliament.findById(req.body.parliament_id),
      Block.findById(req.body.block_id)
    ]);

    if (!booth) {
      return res.status(400).json({ success: false, message: 'Booth not found' });
    }
    if (!party) {
      return res.status(400).json({ success: false, message: 'Party not found' });
    }
    if (!state) {
      return res.status(400).json({ success: false, message: 'State not found' });
    }
    if (!division) {
      return res.status(400).json({ success: false, message: 'Division not found' });
    }
    if (!assembly) {
      return res.status(400).json({ success: false, message: 'Assembly not found' });
    }
    if (!parliament) {
      return res.status(400).json({ success: false, message: 'Parliament not found' });
    }
    if (!block) {
      return res.status(400).json({ success: false, message: 'Block not found' });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const volunteerData = {
      ...req.body,
      created_by: req.user.id
    };

    const volunteer = await BoothVolunteers.create(volunteerData);

    res.status(201).json({
      success: true,
      data: volunteer
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Volunteer with this phone number already exists for this booth'
      });
    }
    next(err);
  }
};

// @desc    Update booth volunteer
// @route   PUT /api/booth-volunteers/:id
// @access  Private (Admin/Coordinator)
exports.updateBoothVolunteer = async (req, res, next) => {
  try {
    let volunteer = await BoothVolunteers.findById(req.params.id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Booth volunteer not found'
      });
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.booth_id) verificationPromises.push(Booth.findById(req.body.booth_id));
    if (req.body.party_id) verificationPromises.push(Party.findById(req.body.party_id));
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    if (req.body.block_id) verificationPromises.push(Block.findById(req.body.block_id));

    const verificationResults = await Promise.all(verificationPromises);
    
    for (const result of verificationResults) {
      if (!result) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reference ID provided'
        });
      }
    }

    // Add updated_by info
    req.body.updated_by = req.user.id;

    volunteer = await BoothVolunteers.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('booth', 'name booth_number')
      .populate('party', 'name symbol')
      .populate('state', 'name')
      .populate('division', 'name')
      .populate('assembly', 'name')
      .populate('parliament', 'name')
      .populate('block', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: volunteer
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Volunteer with this phone number already exists for this booth'
      });
    }
    next(err);
  }
};

// @desc    Delete booth volunteer
// @route   DELETE /api/booth-volunteers/:id
// @access  Private (Admin only)
exports.deleteBoothVolunteer = async (req, res, next) => {
  try {
    const volunteer = await BoothVolunteers.findById(req.params.id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Booth volunteer not found'
      });
    }

    await volunteer.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get volunteers by booth
// @route   GET /api/booth-volunteers/booth/:boothId
// @access  Public
exports.getVolunteersByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const volunteers = await BoothVolunteers.find({ booth_id: req.params.boothId })
      .sort({ name: 1 })
      .populate('party', 'name symbol')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: volunteers.length,
      data: volunteers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get volunteers by party
// @route   GET /api/booth-volunteers/party/:partyId
// @access  Public
exports.getVolunteersByParty = async (req, res, next) => {
  try {
    // Verify party exists
    const party = await Party.findById(req.params.partyId);
    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    const volunteers = await BoothVolunteers.find({ party_id: req.params.partyId })
      .sort({ name: 1 })
      .populate('booth', 'name booth_number')
      .populate('state', 'name');

    res.status(200).json({
      success: true,
      count: volunteers.length,
      data: volunteers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get volunteers by state
// @route   GET /api/booth-volunteers/state/:stateId
// @access  Public
exports.getVolunteersByState = async (req, res, next) => {
  try {
    // Verify state exists
    const state = await State.findById(req.params.stateId);
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    const volunteers = await BoothVolunteers.find({ state_id: req.params.stateId })
      .sort({ name: 1 })
      .populate('booth', 'name booth_number')
      .populate('party', 'name symbol');

    res.status(200).json({
      success: true,
      count: volunteers.length,
      data: volunteers
    });
  } catch (err) {
    next(err);
  }
};