const ActiveParty = require('../models/ActiveParty');
const Booth = require('../models/booth');
const Party = require('../models/party');

// @desc    Get all active party records
// @route   GET /api/active-parties
// @access  Public
exports.getActiveParties = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Basic query
    let query = ActiveParty.find()
      .populate('booth_id', 'booth_number name')
      .populate('party_id', 'name abbreviation')
      .sort({ last_updated: -1 });

    // Filter by booth
    if (req.query.booth) {
      query = query.where('booth_id').equals(req.query.booth);
    }

    // Filter by party
    if (req.query.party) {
      query = query.where('party_id').equals(req.query.party);
    }

    // Filter by status
    if (req.query.status) {
      query = query.where('Active_status').equals(req.query.status === 'true');
    }

    const activeParties = await query.skip(skip).limit(limit).exec();
    const total = await ActiveParty.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: activeParties.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: activeParties
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single active party record
// @route   GET /api/active-parties/:id
// @access  Public
exports.getActiveParty = async (req, res, next) => {
  try {
    const activeParty = await ActiveParty.findById(req.params.id)
      .populate('booth_id', 'booth_number name')
      .populate('party_id', 'name abbreviation');

    if (!activeParty) {
      return res.status(404).json({
        success: false,
        message: 'Active party record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: activeParty
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create active party record
// @route   POST /api/active-parties
// @access  Private (Admin only)
exports.createActiveParty = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.body.booth_id);
    if (!booth) {
      return res.status(400).json({
        success: false,
        message: 'Booth not found'
      });
    }

    // Verify party exists
    const party = await Party.findById(req.body.party_id);
    if (!party) {
      return res.status(400).json({
        success: false,
        message: 'Party not found'
      });
    }

    // Check if record already exists for this booth and party
    const existingRecord = await ActiveParty.findOne({
      booth_id: req.body.booth_id,
      party_id: req.body.party_id
    });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Record already exists for this booth and party'
      });
    }

    const activeParty = await ActiveParty.create(req.body);

    res.status(201).json({
      success: true,
      data: activeParty
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update active party record
// @route   PUT /api/active-parties/:id
// @access  Private (Admin only)
exports.updateActiveParty = async (req, res, next) => {
  try {
    let activeParty = await ActiveParty.findById(req.params.id);

    if (!activeParty) {
      return res.status(404).json({
        success: false,
        message: 'Active party record not found'
      });
    }

    // Prevent changing booth_id or party_id after creation
    if (req.body.booth_id && req.body.booth_id !== activeParty.booth_id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Booth cannot be changed'
      });
    }

    if (req.body.party_id && req.body.party_id !== activeParty.party_id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Party cannot be changed'
      });
    }

    activeParty = await ActiveParty.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('booth_id', 'booth_number name')
      .populate('party_id', 'name abbreviation');

    res.status(200).json({
      success: true,
      data: activeParty
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete active party record
// @route   DELETE /api/active-parties/:id
// @access  Private (Admin only)
exports.deleteActiveParty = async (req, res, next) => {
  try {
    const activeParty = await ActiveParty.findById(req.params.id);

    if (!activeParty) {
      return res.status(404).json({
        success: false,
        message: 'Active party record not found'
      });
    }

    await activeParty.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get active parties by booth
// @route   GET /api/active-parties/booth/:boothId
// @access  Public
exports.getActivePartiesByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const activeParties = await ActiveParty.find({ booth_id: req.params.boothId })
      .populate('party_id', 'name abbreviation')
      .sort({ Active_status: -1, last_updated: -1 });

    res.status(200).json({
      success: true,
      count: activeParties.length,
      data: activeParties
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle party active status
// @route   PATCH /api/active-parties/:id/toggle
// @access  Private (Admin only)
exports.toggleActiveStatus = async (req, res, next) => {
  try {
    let activeParty = await ActiveParty.findById(req.params.id);

    if (!activeParty) {
      return res.status(404).json({
        success: false,
        message: 'Active party record not found'
      });
    }

    // Toggle the status
    activeParty.Active_status = !activeParty.Active_status;
    await activeParty.save();

    res.status(200).json({
      success: true,
      data: activeParty
    });
  } catch (err) {
    next(err);
  }
};