const Divisionpolygen = require('../models/Divisionpolygen');

/**
 * @swagger
 * components:
 *   schemas:
 *     DivisionPolygen:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "68287bc1bdaf89b0ec6afb5e"
 *         type:
 *           type: string
 *           example: "FeatureCollection"
 *         features:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: "Feature"
 *               geometry:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     example: "Polygon"
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: array
 *                       items:
 *                         type: array
 *                         items:
 *                           type: number
 *                         example: [75.123456, 22.654321]
 *               properties:
 *                 type: object
 *                 properties:
 *                   Name:
 *                     type: string
 *                     example: "MHOW"
 *                   District:
 *                     type: string
 *                     example: "INDORE"
 *                   Division:
 *                     type: string
 *                     example: "Burhanpur"
 *                   Parliament:
 *                     type: string
 *                     example: "DHAR"
 *                   VS_Code:
 *                     type: number
 *                     example: 209
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         _id: "68287bc1bdaf89b0ec6afb5e"
 *         type: "FeatureCollection"
 *         features:
 *           - type: "Feature"
 *             geometry:
 *               type: "Polygon"
 *               coordinates:
 *                 - [75.123456, 22.654321]
 *                 - [75.234567, 22.765432]
 *                 - [75.345678, 22.876543]
 *                 - [75.123456, 22.654321]
 *             properties:
 *               Name: "MHOW"
 *               District: "INDORE"
 *               Division: "Burhanpur"
 *               Parliament: "DHAR"
 *               VS_Code: 209
 *           - type: "Feature"
 *             geometry:
 *               type: "Polygon"
 *               coordinates:
 *                 - [75.987654, 22.123456]
 *                 - [75.876543, 22.234567]
 *                 - [75.765432, 22.345678]
 *                 - [75.987654, 22.123456]
 *             properties:
 *               Name: "SANWER"
 *               District: "INDORE"
 *               Division: "Burhanpur"
 *               Parliament: "INDORE"
 *               VS_Code: 211
 *         createdAt: "2023-05-15T10:00:00Z"
 *         updatedAt: "2023-05-15T10:00:00Z"
 */

// Create a new division polygon
exports.createDivisionPolygen = async (req, res) => {
  try {
    const polygon = new Divisionpolygen(req.body);
    await polygon.save();
    res.status(201).json(polygon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all division polygons with pagination
exports.getAllDivisionPolygens = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const polygons = await Divisionpolygen.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await Divisionpolygen.countDocuments();
    
    res.json({
      polygons,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get division polygon by ID
exports.getDivisionPolygenById = async (req, res) => {
  try {
    const polygon = await Divisionpolygen.findById(req.params.id);
    if (!polygon) {
      return res.status(404).json({ error: 'Division polygon not found' });
    }
    res.json(polygon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get division polygons by name
exports.getDivisionPolygensByName = async (req, res) => {
  try {
    const polygons = await Divisionpolygen.find({
      'features.properties.Name': new RegExp(req.params.name, 'i')
    });
    res.json(polygons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get division polygons by division
exports.getDivisionPolygensByDivision = async (req, res) => {
  try {
    const polygons = await Divisionpolygen.find({
      'features.properties.Division': new RegExp(req.params.division, 'i')
    });
    res.json(polygons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get division polygons by district
exports.getDivisionPolygensByDistrict = async (req, res) => {
  try {
    const polygons = await Divisionpolygen.find({
      'features.properties.District': new RegExp(req.params.district, 'i')
    });
    res.json(polygons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get division polygons containing a point
exports.getDivisionPolygensContainingPoint = async (req, res) => {
  try {
    const { lng, lat } = req.params;
    const polygons = await Divisionpolygen.find({
      'features.geometry': {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          }
        }
      }
    });
    res.json(polygons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update division polygon
exports.updateDivisionPolygen = async (req, res) => {
  try {
    const polygon = await Divisionpolygen.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!polygon) {
      return res.status(404).json({ error: 'Division polygon not found' });
    }
    res.json(polygon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete division polygon
exports.deleteDivisionPolygen = async (req, res) => {
  try {
    const polygon = await Divisionpolygen.findByIdAndDelete(req.params.id);
    if (!polygon) {
      return res.status(404).json({ error: 'Division polygon not found' });
    }
    res.json({ message: 'Division polygon deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};