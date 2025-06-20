const BoothVolunteers = require('../models/boothVolunteers');
const Booth = require('../models/booth');
const Party = require('../models/party');
const Assembly = require('../models/assembly');
const Parliament = require('../models/parliament');
const Block = require('../models/block');

// @desc    Get all booth volunteers with geographic hierarchy
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
      .populate('booth_id', 'booth_number location name full_address')
      .populate('party_id', 'name abbreviation symbol founded_year abbreviation')
      .populate('assembly_id', 'name number type')
      .populate('parliament_id', 'name number')
      .populate('block_id', 'name code')
      .sort({ created_at: -1 });

    // Filter by booth
    if (req.query.booth) {
      query = query.where('booth_id').equals(req.query.booth);
    }

    // Filter by party
    if (req.query.party) {
      query = query.where('party_id').equals(req.query.party);
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

// @desc    Get single volunteer record with geographic hierarchy
// @route   GET /api/booth-volunteers/:id
// @access  Public
exports.getVolunteerById = async (req, res, next) => {
  try {
    const volunteer = await BoothVolunteers.findById(req.params.id)
      .populate('booth_id', 'booth_number location')
      .populate('party_id', 'name abbreviation symbol')
      .populate('assembly_id', 'name number')
      .populate('parliament_id', 'name number')
      .populate('block_id', 'name code');

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

// @desc    Create new volunteer record with geographic hierarchy
// @route   POST /api/booth-volunteers
// @access  Private (Admin/Editor)
exports.createVolunteer = async (req, res, next) => {
  try {
    // Verify all references exist
    const [booth, party, assembly, parliament, block] = await Promise.all([
      Booth.findById(req.body.booth_id),
      Party.findById(req.body.party_id),
      Assembly.findById(req.body.assembly_id),
      Parliament.findById(req.body.parliament_id),
      Block.findById(req.body.block_id)
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
    if (!assembly) {
      return res.status(400).json({
        success: false,
        message: 'Assembly constituency not found'
      });
    }
    if (!parliament) {
      return res.status(400).json({
        success: false,
        message: 'Parliamentary constituency not found'
      });
    }
    if (!block) {
      return res.status(400).json({
        success: false,
        message: 'Block not found'
      });
    }

    // Check consistency between booth and geographic references
    if (booth.assembly_id.toString() !== req.body.assembly_id ||
        booth.parliament_id.toString() !== req.body.parliament_id ||
        booth.block_id.toString() !== req.body.block_id) {
      return res.status(400).json({
        success: false,
        message: 'Geographic references do not match the booth location'
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

// @desc    Update volunteer record (geographic hierarchy maintained)
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

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.booth_id) verificationPromises.push(Booth.findById(req.body.booth_id));
    if (req.body.party_id) verificationPromises.push(Party.findById(req.body.party_id));
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    if (req.body.block_id) verificationPromises.push(Block.findById(req.body.block_id));

    const [booth, party, assembly, parliament, block] = await Promise.all(verificationPromises);

    if (booth && !booth) {
      return res.status(400).json({
        success: false,
        message: 'Booth not found'
      });
    }
    if (party && !party) {
      return res.status(400).json({
        success: false,
        message: 'Party not found'
      });
    }
    if (assembly && !assembly) {
      return res.status(400).json({
        success: false,
        message: 'Assembly constituency not found'
      });
    }
    if (parliament && !parliament) {
      return res.status(400).json({
        success: false,
        message: 'Parliamentary constituency not found'
      });
    }
    if (block && !block) {
      return res.status(400).json({
        success: false,
        message: 'Block not found'
      });
    }

    // Check geographic consistency if booth is being updated
    if (req.body.booth_id) {
      const updatedBooth = booth || await Booth.findById(req.body.booth_id);
      if (updatedBooth.assembly_id.toString() !== (req.body.assembly_id || volunteer.assembly_id.toString()) ||
          updatedBooth.parliament_id.toString() !== (req.body.parliament_id || volunteer.parliament_id.toString()) ||
          updatedBooth.block_id.toString() !== (req.body.block_id || volunteer.block_id.toString())) {
        return res.status(400).json({
          success: false,
          message: 'Geographic references do not match the updated booth location'
        });
      }
    }

    volunteer = await BoothVolunteers.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('booth_id party_id assembly_id parliament_id block_id');

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

// @desc    Get volunteers by booth ID with geographic hierarchy
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
      .populate('assembly_id', 'name number')
      .populate('parliament_id', 'name number')
      .populate('block_id', 'name code')
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

// @desc    Get volunteers by party ID with geographic hierarchy
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
      .populate('assembly_id', 'name number')
      .populate('parliament_id', 'name number')
      .populate('block_id', 'name code')
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

// @desc    Get volunteers by assembly constituency ID
// @route   GET /api/booth-volunteers/assembly/:assemblyId
// @access  Public
exports.getVolunteersByAssembly = async (req, res, next) => {
  try {
    // Verify assembly exists
    const assembly = await Assembly.findById(req.params.assemblyId);
    if (!assembly) {
      return res.status(404).json({
        success: false,
        message: 'Assembly constituency not found'
      });
    }

    const volunteers = await BoothVolunteers.find({ assembly_id: req.params.assemblyId })
      .populate('booth_id', 'booth_number location')
      .populate('party_id', 'name abbreviation symbol')
      .populate('parliament_id', 'name number')
      .populate('block_id', 'name code')
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

// @desc    Get volunteers by parliamentary constituency ID
// @route   GET /api/booth-volunteers/parliament/:parliamentId
// @access  Public
exports.getVolunteersByParliament = async (req, res, next) => {
  try {
    // Verify parliament exists
    const parliament = await Parliament.findById(req.params.parliamentId);
    if (!parliament) {
      return res.status(404).json({
        success: false,
        message: 'Parliamentary constituency not found'
      });
    }

    const volunteers = await BoothVolunteers.find({ parliament_id: req.params.parliamentId })
      .populate('booth_id', 'booth_number location')
      .populate('party_id', 'name abbreviation symbol')
      .populate('assembly_id', 'name number')
      .populate('block_id', 'name code')
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

// @desc    Get volunteers by block ID
// @route   GET /api/booth-volunteers/block/:blockId
// @access  Public
exports.getVolunteersByBlock = async (req, res, next) => {
  try {
    // Verify block exists
    const block = await Block.findById(req.params.blockId);
    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    const volunteers = await BoothVolunteers.find({ block_id: req.params.blockId })
      .populate('booth_id', 'booth_number location')
      .populate('party_id', 'name abbreviation symbol')
      .populate('assembly_id', 'name number')
      .populate('parliament_id', 'name number')
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

// @desc    Get volunteers by activity level with geographic hierarchy
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
    .populate('assembly_id', 'name number')
    .populate('parliament_id', 'name number')
    .populate('block_id', 'name code')
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