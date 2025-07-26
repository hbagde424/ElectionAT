const BoothPolygon = require('../models/boothPolygon');
const Booth = require('../models/booth');
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
      .populate('properties.booth_id', 'name booth_number')
      .populate('properties.election_year', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    // Search functionality
    if (req.query.search) {
      query = query.find({
        $or: [
          { 'properties.BoothName': { $regex: req.query.search, $options: 'i' } },
          { 'properties.BoothNo': { $regex: req.query.search, $options: 'i' } }
        ]
      });
    }

    // Filter by booth
    if (req.query.booth) {
      query = query.where('properties.booth_id').equals(req.query.booth);
    }

    // Filter by election year
    if (req.query.election_year) {
      query = query.where('properties.election_year').equals(req.query.election_year);
    }

    // Filter by assembly (AC_NO)
    if (req.query.assembly) {
      query = query.where('properties.AC_NO').equals(parseInt(req.query.assembly));
    }

    // Filter by parliament (PC_NO)
    if (req.query.parliament) {
      query = query.where('properties.PC_NO').equals(parseInt(req.query.parliament));
    }

    const polygons = await query.skip(skip).limit(limit).exec();
    const total = await BoothPolygon.countDocuments(query.getFilter());

    res.status(200).json({
      success: true,
      count: polygons.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: polygons
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
    const polygon = await BoothPolygon.findById(req.params.id)
      .populate('properties.booth_id', 'name booth_number')
      .populate('properties.election_year', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!polygon) {
      return res.status(404).json({
        success: false,
        message: 'Booth polygon not found'
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

// @desc    Create booth polygon
// @route   POST /api/booth-polygons
// @access  Private (Admin only)
exports.createBoothPolygon = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.body.properties.booth_id);
    if (!booth) {
      return res.status(400).json({ success: false, message: 'Booth not found' });
    }

    // Verify election year exists
    const electionYear = await ElectionYear.findById(req.body.properties.election_year);
    if (!electionYear) {
      return res.status(400).json({ success: false, message: 'Election year not found' });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const polygonData = {
      ...req.body,
      created_by: req.user.id
    };

    const polygon = await BoothPolygon.create(polygonData);

    res.status(201).json({
      success: true,
      data: polygon
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update booth polygon
// @route   PUT /api/booth-polygons/:id
// @access  Private (Admin only)
exports.updateBoothPolygon = async (req, res, next) => {
  try {
    let polygon = await BoothPolygon.findById(req.params.id);

    if (!polygon) {
      return res.status(404).json({
        success: false,
        message: 'Booth polygon not found'
      });
    }

    // Verify booth exists if being updated
    if (req.body.properties && req.body.properties.booth_id) {
      const booth = await Booth.findById(req.body.properties.booth_id);
      if (!booth) {
        return res.status(400).json({ success: false, message: 'Booth not found' });
      }
    }

    // Verify election year exists if being updated
    if (req.body.properties && req.body.properties.election_year) {
      const electionYear = await ElectionYear.findById(req.body.properties.election_year);
      if (!electionYear) {
        return res.status(400).json({ success: false, message: 'Election year not found' });
      }
    }

    // Set updated_by to current user
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }
    
    req.body.updated_by = req.user.id;
    req.body.updated_at = new Date();

    polygon = await BoothPolygon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('properties.booth_id', 'name booth_number')
      .populate('properties.election_year', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: polygon
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete booth polygon
// @route   DELETE /api/booth-polygons/:id
// @access  Private (Admin only)
exports.deleteBoothPolygon = async (req, res, next) => {
  try {
    const polygon = await BoothPolygon.findById(req.params.id);

    if (!polygon) {
      return res.status(404).json({
        success: false,
        message: 'Booth polygon not found'
      });
    }

    await polygon.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get booth polygons by booth ID
// @route   GET /api/booth-polygons/booth/:boothId
// @access  Public
exports.getPolygonsByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const polygons = await BoothPolygon.find({ 'properties.booth_id': req.params.boothId })
      .populate('properties.election_year', 'year')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: polygons.length,
      data: polygons
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get booth polygons within a geographical area
// @route   POST /api/booth-polygons/within
// @access  Public
exports.getPolygonsWithin = async (req, res, next) => {
  try {
    const { geometry } = req.body;

    if (!geometry || !geometry.coordinates || !geometry.type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid GeoJSON geometry (Polygon or MultiPolygon)'
      });
    }

    const polygons = await BoothPolygon.find({
      geometry: {
        $geoWithin: {
          $geometry: geometry
        }
      }
    })
      .populate('properties.booth_id', 'name booth_number')
      .populate('properties.election_year', 'year');

    res.status(200).json({
      success: true,
      count: polygons.length,
      data: polygons
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get booths by BlockNumber
// @route   GET /api/booths/block-number/:blockNumber
// @access  Public
exports.getBoothsByBlockNumber = async (req, res, next) => {
  try {
    const blockNumber = req.params.blockNumber;

    // First find all booth polygons with this BlockNumber
    const boothPolygons = await BoothPolygon.find({ 'properties.BlockNumber': blockNumber })
      .select('properties.booth_id')
      .populate('properties.booth_id');

    // Extract unique booth IDs
    const boothIds = [...new Set(boothPolygons.map(poly => poly.properties.booth_id._id))];

    if (boothIds.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No booths found for this BlockNumber'
      });
    }

    // Get full booth details
    const booths = await Booth.find({ _id: { $in: boothIds } })
      .populate('block_id', 'name')
      .populate('assembly_id', 'name')
      .populate('parliament_id', 'name')
      .populate('division_id', 'name')
      .populate('state_id', 'name')
      .populate('election_year', 'year')
      .populate('created_by', 'username')
      .populate('updated_by', 'username')
      .sort({ booth_number: 1 });

    res.status(200).json({
      success: true,
      count: booths.length,
      data: booths
    });
  } catch (err) {
    next(err);
  }
};