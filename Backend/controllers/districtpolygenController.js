const Districtpolygen = require('../models/Districtpolygen');

/**
 * @swagger
 * components:
 *   schemas:
 *     DistrictPolygen:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "68287b8383dcc68f065b62a5"
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
 *                         example: [76.22683287400008, 24.104352125000048]
 *               properties:
 *                 type: object
 *                 properties:
 *                   Name:
 *                     type: string
 *                     example: "AGAR"
 *                   District:
 *                     type: string
 *                     example: "AGAR MALWA"
 *                   Division:
 *                     type: string
 *                     example: "Neemuch"
 *                   Parliament:
 *                     type: string
 *                     example: "DEWAS"
 *                   VS_Code:
 *                     type: number
 *                     example: 166
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         _id: "68287b8383dcc68f065b62a5"
 *         type: "FeatureCollection"
 *         features:
 *           - type: "Feature"
 *             geometry:
 *               type: "Polygon"
 *               coordinates:
 *                 - [76.22683287400008, 24.104352125000048]
 *                 - [76.22397752000006, 24.109348993000026]
 *                 - [76.22302573600007, 24.113869968000074]
 *                 - [75.98624377100003, 23.93272078900003]
 *                 - [76.22683287400008, 24.104352125000048]
 *             properties:
 *               Name: "AGAR"
 *               District: "AGAR MALWA"
 *               Division: "Neemuch"
 *               Parliament: "DEWAS"
 *               VS_Code: 166
 *         createdAt: "2023-05-15T10:00:00Z"
 *         updatedAt: "2023-05-15T10:00:00Z"
 */

// Create a new district polygon
exports.createDistrictPolygen = async (req, res) => {
  try {
    const polygon = new Districtpolygen(req.body);
    await polygon.save();
    res.status(201).json(polygon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all district polygons
exports.getAllDistrictPolygens = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const polygons = await Districtpolygen.find()
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const count = await Districtpolygen.countDocuments();
    
    res.json({
      polygons,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get district polygon by ID
exports.getDistrictPolygenById = async (req, res) => {
  try {
    const polygon = await Districtpolygen.findById(req.params.id);
    if (!polygon) {
      return res.status(404).json({ error: 'District polygon not found' });
    }
    res.json(polygon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get district polygons by name
exports.getDistrictPolygensByName = async (req, res) => {
  try {
    const polygons = await Districtpolygen.find({
      'features.properties.Name': new RegExp(req.params.name, 'i')
    });
    res.json(polygons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get district polygons by district
exports.getDistrictPolygensByDistrict = async (req, res) => {
  try {
    const polygons = await Districtpolygen.find({
      'features.properties.District': new RegExp(req.params.district, 'i')
    });
    res.json(polygons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get district polygons containing a point
exports.getDistrictPolygensContainingPoint = async (req, res) => {
  try {
    const { lng, lat } = req.params;
    const polygons = await Districtpolygen.find({
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

// Update district polygon
exports.updateDistrictPolygen = async (req, res) => {
  try {
    const polygon = await Districtpolygen.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!polygon) {
      return res.status(404).json({ error: 'District polygon not found' });
    }
    res.json(polygon);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};



// Delete district polygon
exports.deleteDistrictPolygen = async (req, res) => {
  try {
    const polygon = await Districtpolygen.findByIdAndDelete(req.params.id);
    if (!polygon) {
      return res.status(404).json({ error: 'District polygon not found' });
    }
    res.json({ message: 'District polygon deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};