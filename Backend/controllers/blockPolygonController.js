const BlockPolygon = require('../models/blockPolygonModel');
// const Booth = require('../models/boothModel');

// @desc    Get all block polygons
// @route   GET /api/block-polygons
// @access  Public
exports.getAllBlockPolygons = async (req, res, next) => {
  try {
    const polygons = await BlockPolygon.find();
    res.status(200).json({
      success: true,
      count: polygons.length,
      data: polygons
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get block polygons by block name
// @route   GET /api/block-polygons/block/:blockName
// @access  Public
exports.getPolygonsByBlock = async (req, res, next) => {
  try {
    const blockName = req.params.blockName;
    const polygons = await BlockPolygon.find({
      "features.properties.Name": blockName
    });

    if (!polygons || polygons.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No polygons found for block ${blockName}`
      });
    }

    res.status(200).json({
      success: true,
      count: polygons.length,
      data: polygons
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get polygons by booth number
// @route   GET /api/block-polygons/booth/:boothNumber
// @access  Public
exports.getPolygonsByBooth = async (req, res, next) => {
  try {
    const boothNumber = req.params.boothNumber;
    const polygons = await BlockPolygon.find({
      "features.properties.booth_number": boothNumber
    });

    if (!polygons || polygons.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No polygons found for booth ${boothNumber}`
      });
    }

    res.status(200).json({
      success: true,
      count: polygons.length,
      data: polygons
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single booth polygon by booth ID
// @route   GET /api/block-polygons/booth-id/:boothId
// @access  Public
exports.getPolygonByBoothId = async (req, res, next) => {
  try {
    const boothId = req.params.boothId;
    
    // First verify the booth exists
    const booth = await Booth.findById(boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const polygon = await BlockPolygon.findOne({
      "features.properties.booth_id": boothId
    });

    if (!polygon) {
      return res.status(404).json({
        success: false,
        message: `No polygon found for booth ID ${boothId}`
      });
    }

    res.status(200).json({
      success: true,
      data: polygon
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create or update block polygon
// @route   POST /api/block-polygons
// @access  Private (Admin only)
exports.createOrUpdateBlockPolygon = async (req, res, next) => {
  try {
    const { features } = req.body;

    // Validate required fields
    if (!features || !Array.isArray(features)) {
      return res.status(400).json({
        success: false,
        message: 'Features array is required'
      });
    }

    // Check if we're updating an existing polygon
    let polygon;
    if (req.body._id) {
      polygon = await BlockPolygon.findByIdAndUpdate(
        req.body._id,
        req.body,
        { new: true, runValidators: true }
      );
    } else {
      polygon = await BlockPolygon.create(req.body);
    }

    res.status(200).json({
      success: true,
      data: polygon
    });
  } catch (err) {
    next(err);
  }
};