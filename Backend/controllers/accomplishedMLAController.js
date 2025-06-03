const AccomplishedMLA = require('../models/AccomplishedMLA');
const Assembly = require('../models/assembly');
const Party = require('../models/party');

// @desc    Get all MLAs
// @route   GET /api/accomplished-mlas
// @access  Public
exports.getAccomplishedMLAs = async (req, res, next) => {
  try {
    const mlas = await AccomplishedMLA.find()
      .populate('assembly_id', 'name')
      .populate('party_id', 'name abbreviation symbol')
      .sort({ term_start: -1 });

    res.status(200).json({
      success: true,
      count: mlas.length,
      data: mlas
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single MLA
// @route   GET /api/accomplished-mlas/:id
// @access  Public
exports.getAccomplishedMLA = async (req, res, next) => {
  try {
    const mla = await AccomplishedMLA.findById(req.params.id)
      .populate('assembly_id', 'name')
      .populate('party_id', 'name abbreviation symbol');

    if (!mla) {
      return res.status(404).json({
        success: false,
        message: 'MLA not found'
      });
    }

    res.status(200).json({
      success: true,
      data: mla
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create MLA
// @route   POST /api/accomplished-mlas
// @access  Private
exports.createAccomplishedMLA = async (req, res, next) => {
  try {
    const { assembly_id, party_id } = req.body;

    // Check if assembly exists
    const assembly = await Assembly.findById(assembly_id);
    if (!assembly) {
      return res.status(400).json({
        success: false,
        message: 'Assembly not found'
      });
    }

    // Check if party exists
    const party = await Party.findById(party_id);
    if (!party) {
      return res.status(400).json({
        success: false,
        message: 'Party not found'
      });
    }

    const mla = await AccomplishedMLA.create(req.body);

    res.status(201).json({
      success: true,
      data: mla
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update MLA
// @route   PUT /api/accomplished-mlas/:id
// @access  Private
exports.updateAccomplishedMLA = async (req, res, next) => {
  try {
    let mla = await AccomplishedMLA.findById(req.params.id);

    if (!mla) {
      return res.status(404).json({
        success: false,
        message: 'MLA not found'
      });
    }

    // Prevent changing assembly or party
    if (req.body.assembly_id || req.body.party_id) {
      return res.status(400).json({
        success: false,
        message: 'Assembly and party cannot be changed'
      });
    }

    mla = await AccomplishedMLA.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('assembly_id', 'name')
      .populate('party_id', 'name abbreviation symbol');

    res.status(200).json({
      success: true,
      data: mla
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete MLA
// @route   DELETE /api/accomplished-mlas/:id
// @access  Private
exports.deleteAccomplishedMLA = async (req, res, next) => {
  try {
    const mla = await AccomplishedMLA.findById(req.params.id);

    if (!mla) {
      return res.status(404).json({
        success: false,
        message: 'MLA not found'
      });
    }

    await mla.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current MLAs
// @route   GET /api/accomplished-mlas/current
// @access  Public
exports.getCurrentMLAs = async (req, res, next) => {
  try {
    const mlas = await AccomplishedMLA.find({ is_current: true })
      .populate('assembly_id', 'name')
      .populate('party_id', 'name abbreviation symbol');

    res.status(200).json({
      success: true,
      count: mlas.length,
      data: mlas
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get MLAs by assembly
// @route   GET /api/accomplished-mlas/assembly/:assemblyId
// @access  Public
exports.getMLAsByAssembly = async (req, res, next) => {
  try {
    const mlas = await AccomplishedMLA.find({ assembly_id: req.params.assemblyId })
      .populate('party_id', 'name abbreviation symbol')
      .sort({ term_start: -1 });

    res.status(200).json({
      success: true,
      count: mlas.length,
      data: mlas
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get MLAs by party
// @route   GET /api/accomplished-mlas/party/:partyId
// @access  Public
exports.getMLAsByParty = async (req, res, next) => {
  try {
    const mlas = await AccomplishedMLA.find({ party_id: req.params.partyId })
      .populate('assembly_id', 'name')
      .sort({ term_start: -1 });

    res.status(200).json({
      success: true,
      count: mlas.length,
      data: mlas
    });
  } catch (err) {
    next(err);
  }
};