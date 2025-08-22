const BoothVolunteers = require('../models/boothVolunteers');
const Booth = require('../models/booth');
const Party = require('../models/party');
const State = require('../models/state');
const Division = require('../models/Division');
const Assembly = require('../models/Assembly');
const Parliament = require('../models/Parliament');
const Block = require('../models/block');
const User = require('../models/User');

// @desc    Get all booth volunteers
// @route   GET /api/booth-volunteers
// @access  Public
exports.getBoothVolunteers = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
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

    // Validate hierarchy if IDs are provided
    if (req.query.booth_id) {
      const booth = await Booth.findById(req.query.booth_id);
      if (!booth) {
        return res.status(404).json({
          success: false,
          error: 'Booth not found'
        });
      }
      // Set all parent IDs based on the booth's hierarchy
      req.query.block_id = booth.block_id;
      req.query.assembly_id = booth.assembly_id;
      req.query.parliament_id = booth.parliament_id;
      req.query.division_id = booth.division_id;
      req.query.state_id = booth.state_id;
    } else if (req.query.block_id) {
      const block = await Block.findById(req.query.block_id);
      if (!block) {
        return res.status(404).json({
          success: false,
          error: 'Block not found'
        });
      }
      // Set parent IDs based on block's hierarchy
      req.query.assembly_id = block.assembly_id;
      req.query.parliament_id = block.parliament_id;
      req.query.division_id = block.division_id;
      req.query.state_id = block.state_id;
    } else if (req.query.assembly_id) {
      const assembly = await Assembly.findById(req.query.assembly_id);
      if (!assembly) {
        return res.status(404).json({
          success: false,
          error: 'Assembly not found'
        });
      }
      // Set parent IDs based on assembly's hierarchy
      req.query.parliament_id = assembly.parliament_id;
      req.query.division_id = assembly.division_id;
      req.query.state_id = assembly.state_id;
    } else if (req.query.parliament_id) {
      const parliament = await Parliament.findById(req.query.parliament_id);
      if (!parliament) {
        return res.status(404).json({
          success: false,
          error: 'Parliament not found'
        });
      }
      // Set parent IDs based on parliament's hierarchy
      req.query.division_id = parliament.division_id;
      req.query.state_id = parliament.state_id;
    } else if (req.query.division_id) {
      const division = await Division.findById(req.query.division_id);
      if (!division) {
        return res.status(404).json({
          success: false,
          error: 'Division not found'
        });
      }
      // Set state_id based on division's hierarchy
      req.query.state_id = division.state_id;
    }

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
    if (req.query.booth_id) {
      query = query.where('booth_id').equals(req.query.booth_id);
    }

    // Filter by party
    if (req.query.party_id) {
      query = query.where('party_id').equals(req.query.party_id);
    }

    // Filter by state
    if (req.query.state_id) {
      query = query.where('state_id').equals(req.query.state_id);
    }

    // Filter by division
    if (req.query.division_id) {
      query = query.where('division_id').equals(req.query.division_id);
    }

    // Filter by assembly
    if (req.query.assembly_id) {
      query = query.where('assembly_id').equals(req.query.assembly_id);
    }

    // Filter by parliament
    if (req.query.parliament_id) {
      query = query.where('parliament_id').equals(req.query.parliament_id);
    }

    // Filter by block
    if (req.query.block_id) {
      query = query.where('block_id').equals(req.query.block_id);
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
    req.body.updated_at = new Date();

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