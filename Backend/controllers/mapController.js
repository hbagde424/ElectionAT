const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const District = require('../models/District');
const Assembly = require('../models/Assembly');
const { generatePolygons } = require('../utils/generatePolygons');

// @desc    Get polygons based on user role
// @route   GET /api/map/polygons
// @access  Private
exports.getPolygons = async (req, res, next) => {
  try {
    const user = req.user;
    let polygons = [];

    switch (user.role) {
      case 'master':
        // Get all divisions
        const divisions = await Division.find();
        polygons = generatePolygons(divisions, 'division');
        break;

      case 'division':
        // Get all parliaments in this division
        const parliaments = await Parliament.find({ division: user.regionId });
        polygons = generatePolygons(parliaments, 'parliament');
        break;

      case 'parliament':
        // Get all districts in this parliament
        const districts = await District.find({ parliament: user.regionId });
        polygons = generatePolygons(districts, 'district');
        break;

      case 'district':
        // Get all assemblies in this district
        const assemblies = await Assembly.find({ district: user.regionId });
        polygons = generatePolygons(assemblies, 'assembly');
        break;

      case 'assembly':
        // Get this assembly only
        const assembly = await Assembly.findById(user.regionId);
        polygons = generatePolygons([assembly], 'assembly');
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    res.status(200).json({
      success: true,
      count: polygons.length,
      data: polygons,
    });
  } catch (err) {
    next(err);
  }
};