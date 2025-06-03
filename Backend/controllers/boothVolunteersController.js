const BoothVolunteers = require('../models/boothVolunteers');
const Booth = require('../models/booth');
const Party = require('../models/party');

// @desc    Get all booth volunteers
// @route   GET /api/booth-volunteers
// @access  Public
exports.getVolunteers = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = BoothVolunteers.find()
      .populate('booth_id', 'booth_number location')
      .populate('party_id', 'name abbreviation symbol')
      .sort({ created_at: -1 });

    // Filter by booth
    if (req.query.booth) {
      query = query.where('booth_id').equals(req.query.booth);
    }

    // Filter by party
    if (req.query.party) {
      query = query.where('party_id').equals(req.query.party);
    }

    // Filter by activity level
    if (req.query.activity) {
      query = query.where('activity_level').equals(req.query.activity);
    }

    // Search by name
    if (req.query.search) {
      query = query.where('name').regex(new RegExp(req.query.search, 'i'));
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

// @desc    Get single volunteer record
// @route   GET /api/booth-volunteers/:id
// @access  Public
exports.getVolunteerById = async (req, res, next) => {
  try {
    const volunteer = await BoothVolunteers.findById(req.params.id)
      .populate('booth_id', 'booth_number location')
      .populate('party_id', 'name abbreviation symbol');

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
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

// @desc    Create new volunteer record
// @route   POST /api/booth-volunteers
// @access  Private (Admin/Editor)
exports.createVolunteer = async (req, res, next) => {
  try {
    // Verify booth and party exist
    const [booth, party] = await Promise.all([
      Booth.findById(req.body.booth_id),
      Party.findById(req.body.party_id)
    ]);

    if (!booth) {
      return res.status(400).json({
        success: false,
        message: 'Booth not found'
      });
    }

    if (!party) {
      return res.status(400).json({
        success: false,
        message: 'Party not found'
      });
    }

    const volunteer = await BoothVolunteers.create(req.body);

    res.status(201).json({
      success: true,
      data: volunteer
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update volunteer record
// @route   PUT /api/booth-volunteers/:id
// @access  Private (Admin/Editor)
exports.updateVolunteer = async (req, res, next) => {
  try {
    let volunteer = await BoothVolunteers.findById(req.params.id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
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

    volunteer = await BoothVolunteers.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('booth_id party_id');

    res.status(200).json({
      success: true,
      data: volunteer
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete volunteer record
// @route   DELETE /api/booth-volunteers/:id
// @access  Private (Admin)
exports.deleteVolunteer = async (req, res, next) => {
  try {
    const volunteer = await BoothVolunteers.findById(req.params.id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }

    await volunteer.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get volunteers by booth ID
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
      .populate('party_id', 'name abbreviation symbol')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: volunteers.length,
      data: volunteers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get volunteers by party ID
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
      .populate('booth_id', 'booth_number location')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: volunteers.length,
      data: volunteers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get volunteers by activity level
// @route   GET /api/booth-volunteers/activity/:activityLevel
// @access  Public
exports.getVolunteersByActivityLevel = async (req, res, next) => {
  try {
    const validLevels = ['High', 'Medium', 'Low'];
    if (!validLevels.includes(req.params.activityLevel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity level'
      });
    }

    const volunteers = await BoothVolunteers.find({ 
      activity_level: req.params.activityLevel 
    })
    .populate('booth_id', 'booth_number location')
    .populate('party_id', 'name abbreviation symbol')
    .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: volunteers.length,
      data: volunteers
    });
  } catch (err) {
    next(err);
  }
};