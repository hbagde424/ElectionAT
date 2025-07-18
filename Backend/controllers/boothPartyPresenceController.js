const BoothPartyPresence = require('../models/boothPartyPresence');
const Booth = require('../models/booth');
const Party = require('../models/party');

// @desc    Get all party presence records
// @route   GET /api/party-presence
// @access  Public
exports.getPartyPresences = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Basic query
    let query = BoothPartyPresence.find()
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

    // Filter by committee presence
    if (req.query.hasCommittee) {
      query = query.where('has_booth_committee').equals(req.query.hasCommittee);
    }

    const presences = await query.skip(skip).limit(limit).exec();
    const total = await BoothPartyPresence.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: presences.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: presences
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single party presence record
// @route   GET /api/party-presence/:id
// @access  Public
exports.getPartyPresenceById = async (req, res, next) => {
  try {
    const presence = await BoothPartyPresence.findById(req.params.id)
      .populate('booth_id', 'booth_number location')
      .populate('party_id', 'name abbreviation symbol');

    if (!presence) {
      return res.status(404).json({
        success: false,
        message: 'Party presence record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: presence
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create party presence record
// @route   POST /api/party-presence
// @access  Private (Admin/Editor)
exports.createPartyPresence = async (req, res, next) => {
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

    // Check if record already exists for this booth and party
    const existingRecord = await BoothPartyPresence.findOne({
      booth_id: req.body.booth_id,
      party_id: req.body.party_id
    });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Party presence record already exists for this party at the given booth'
      });
    }

    const presence = await BoothPartyPresence.create(req.body);

    res.status(201).json({
      success: true,
      data: presence
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update party presence record
// @route   PUT /api/party-presence/:id
// @access  Private (Admin/Editor)
exports.updatePartyPresence = async (req, res, next) => {
  try {
    let presence = await BoothPartyPresence.findById(req.params.id);

    if (!presence) {
      return res.status(404).json({
        success: false,
        message: 'Party presence record not found'
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

    presence = await BoothPartyPresence.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('booth_id party_id');

    res.status(200).json({
      success: true,
      data: presence
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete party presence record
// @route   DELETE /api/party-presence/:id
// @access  Private (Admin)
exports.deletePartyPresence = async (req, res, next) => {
  try {
    const presence = await BoothPartyPresence.findById(req.params.id);

    if (!presence) {
      return res.status(404).json({
        success: false,
        message: 'Party presence record not found'
      });
    }

    await presence.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get party presence records by booth ID
// @route   GET /api/party-presence/booth/:boothId
// @access  Public
exports.getPresencesByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const presences = await BoothPartyPresence.find({ booth_id: req.params.boothId })
      .populate('party_id', 'name abbreviation symbol')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: presences.length,
      data: presences
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get party presence records by party ID
// @route   GET /api/party-presence/party/:partyId
// @access  Public
exports.getPresencesByParty = async (req, res, next) => {
  try {
    // Verify party exists
    const party = await Party.findById(req.params.partyId);
    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    const presences = await BoothPartyPresence.find({ party_id: req.params.partyId })
      .populate('booth_id', 'booth_number location')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: presences.length,
      data: presences
    });
  } catch (err) {
    next(err);
  }
}; 