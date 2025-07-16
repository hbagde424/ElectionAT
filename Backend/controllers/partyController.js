const Party = require('../models/party');

// @desc    Get all parties
// @route   GET /api/parties
// @access  Public
exports.getParties = async (req, res, next) => {
  try {
    const parties = await Party.find()
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ name: 1 });
      
    res.status(200).json({
      success: true,
      count: parties.length,
      data: parties
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single party
// @route   GET /api/parties/:id
// @access  Public
exports.getParty = async (req, res, next) => {
  try {
    const party = await Party.findById(req.params.id)
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    res.status(200).json({
      success: true,
      data: party
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new party
// @route   POST /api/parties
// @access  Private
exports.createParty = async (req, res, next) => {
  try {
    const { name, abbreviation, symbol, founded_year } = req.body;

    // Check if party already exists
    const existingParty = await Party.findOne({ name });
    if (existingParty) {
      return res.status(400).json({
        success: false,
        message: 'Party with this name already exists'
      });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const party = await Party.create({
      name,
      abbreviation,
      symbol,
      founded_year,
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      data: party
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update party
// @route   PUT /api/parties/:id
// @access  Private
exports.updateParty = async (req, res, next) => {
  try {
    let party = await Party.findById(req.params.id);

    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    // Check if name is being updated and if it already exists
    if (req.body.name && req.body.name !== party.name) {
      const existingParty = await Party.findOne({ name: req.body.name });
      if (existingParty) {
        return res.status(400).json({
          success: false,
          message: 'Party with this name already exists'
        });
      }
    }

    // Set updated_by from authenticated user
    req.body.updated_by = req.user.id;

    // Set user in locals for pre-save hook
    party._locals = { user: req.user };

    party = await Party.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: party
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete party
// @route   DELETE /api/parties/:id
// @access  Private
exports.deleteParty = async (req, res, next) => {
  try {
    const party = await Party.findById(req.params.id);

    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    await party.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};