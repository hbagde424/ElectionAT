const BoothPolygon = require('../models/boothPolygon');
const Booth = require('../models/booth');
const Assembly = require('../models/Assembly');
const Block = require('../models/block');
const ElectionYear = require('../models/electionYear');

// @desc    Get all booth polygons
// @route   GET /api/booth-polygons
// @access  Public
exports.getBoothPolygons = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    // Basic query
    let query = BoothPolygon.find()
      .sort({ 'properties.BoothNo': 1 });

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { 'properties.BoothName': { $regex: req.query.search, $options: 'i' } },
          { 'properties.BoothNo': { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Filter by block
    if (req.query.block) {
      query = query.where('properties.BlockName').equals(req.query.block);
    }

    // Filter by assembly (AC)
    if (req.query.assembly) {
      query = query.where('properties.AC_NO').equals(parseInt(req.query.assembly));
    }

    // Filter by parliament (PC)
    if (req.query.parliament) {
      query = query.where('properties.PC_NO').equals(parseInt(req.query.parliament));
    }

    // Filter by state
    if (req.query.state) {
      query = query.where('properties.ST_CODE').equals(parseInt(req.query.state));
    }

    // Filter by division
    if (req.query.division) {
      query = query.where('properties.DIVISION_CODE').equals(parseInt(req.query.division));
    }

    // Filter by election year
    if (req.query.election_year) {
      query = query.where('election_year').equals(req.query.election_year);
    }

    const polygons = await query.skip(skip).limit(limit).exec();
    const total = await BoothPolygon.countDocuments(query.getFilter());

    res.status(200).json({
      type: "FeatureCollection",
      features: polygons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single booth polygon
// @route   GET /api/booth-polygons/:id
// @access  Public
exports.getBoothPolygon = async (req, res, next) => {
  try {
    const polygon = await BoothPolygon.findById(req.params.id);

    if (!polygon) {
      return res.status(404).json({
        success: false,
        message: 'Booth polygon not found'
      });
    }

    res.status(200).json({
      type: "Feature",
      ...polygon.toObject()
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get booth polygons by assembly (AC)
// @route   GET /api/booth-polygons/assembly/:acNo
// @access  Public
exports.getBoothPolygonsByAssembly = async (req, res, next) => {
  try {
    const acNo = parseInt(req.params.acNo);
    
    const polygons = await BoothPolygon.find({ 'features.properties.AC_NO': acNo })
      .sort({ 'properties.BoothNo': 1 });

    res.status(200).json({
      type: "FeatureCollection",
      features: polygons
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get booth polygons by block
// @route   GET /api/booth-polygons/block/:blockName
// @access  Public
exports.getBoothPolygonsByBlock = async (req, res, next) => {
  try {
    const blockName = req.params.blockName.trim();
    
    if (!blockName) {
      return res.status(400).json({
        type: "FeatureCollection",
        features: [],
        error: "Block name parameter is required"
      });
    }

    // Case-insensitive search with regex
    const polygons = await BoothPolygon.find({ 
      'properties.BlockName': { 
        $regex: new RegExp(blockName, 'i') 
      }
    }).sort({ 'properties.BoothNo': 1 });

    if (polygons.length === 0) {
      return res.status(200).json({
        type: "FeatureCollection",
        features: [],
        message: `No booth polygons found for block '${blockName}'`
      });
    }

    res.status(200).json({
      type: "FeatureCollection",
      features: polygons
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get booth polygons by election year
// @route   GET /api/booth-polygons/year/:yearId
// @access  Public
exports.getBoothPolygonsByYear = async (req, res, next) => {
  try {
    // Verify election year exists
    const year = await ElectionYear.findById(req.params.yearId);
    if (!year) {
      return res.status(404).json({
        success: false,
        message: 'Election year not found'
      });
    }

    const polygons = await BoothPolygon.find({ election_year: req.params.yearId })
      .sort({ 'properties.BoothNo': 1 });

    res.status(200).json({
      type: "FeatureCollection",
      features: polygons
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get booth polygons within a geographical area
// @route   GET /api/booth-polygons/within
// @access  Public
exports.getBoothPolygonsWithin = async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query;
    
    if (!lat || !lng || !radius) {
      return res.status(400).json({
        success: false,
        message: 'Please provide lat, lng and radius parameters'
      });
    }

    const polygons = await BoothPolygon.find({
      geometry: {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(lng), parseFloat(lat)],
            parseFloat(radius) / 6378.1 // Convert km to radians
          ]
        }
      }
    });

    res.status(200).json({
      type: "FeatureCollection",
      features: polygons
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get booth polygons by block number
// @route   GET /api/booth-polygons/block-number/:blockNumber
// @access  Public
exports.getBoothPolygonsByBlockNumber = async (req, res, next) => {
  try {
    const blockNumber = req.params.blockNumber.trim();
    
    if (!blockNumber) {
      return res.status(400).json({
        success: false,
        message: "Block number parameter is required"
      });
    }

    // Find all documents that contain features matching the blockNumber
    const polygons = await BoothPolygon.aggregate([
      { $unwind: "$features" },
      { 
        $match: { 
          "features.properties.BlockNumber": blockNumber 
        } 
      },
      {
        $group: {
          _id: null,
          features: { $push: "$features" }
        }
      },
      {
        $project: {
          _id: 0,
          type: { $literal: "FeatureCollection" },
          features: 1
        }
      }
    ]);

    if (polygons.length === 0 || polygons[0].features.length === 0) {
      return res.status(200).json({
        success: true,
        type: "FeatureCollection",
        features: [],
        message: `No booth polygons found for block number '${blockNumber}'`
      });
    }

    res.status(200).json({
      success: true,
      type: "FeatureCollection",
      features: polygons[0].features
    });
  } catch (err) {
    next(err);
  }
};