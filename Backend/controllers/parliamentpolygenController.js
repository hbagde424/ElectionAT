const Parliamentpolygen = require('../models/Parliamentpolygen');

/**
 * @swagger
 * components:
 *   schemas:
 *     Parliamentpolygen:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "68287bd6ce1ab28997328656"
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
 *                         example: [79.48022985000006, 22.525768620000065]
 *               properties:
 *                 type: object
 *                 properties:
 *                   Name:
 *                     type: string
 *                     example: "PARASWADA"
 *                   District:
 *                     type: string
 *                     example: "BALAGHAT"
 *                   Division:
 *                     type: string
 *                     example: "Katni"
 *                   Parliament:
 *                     type: string
 *                     example: "BALAGHAT"
 *                   VS_Code:
 *                     type: number
 *                     example: 110
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         _id: "68287bd6ce1ab28997328656"
 *         type: "FeatureCollection"
 *         features:
 *           - type: "Feature"
 *             geometry:
 *               type: "Polygon"
 *               coordinates:
 *                 - [79.48022985000006, 22.525768620000065]
 *                 - [80.45340369100006, 22.07537609700006]
 *                 - [80.45340369100006, 22.08392642000007]
 *                 - [80.45113663300003, 22.087553713000034]
 *                 - [80.44365534200006, 22.098889002000078]
 *                 - [80.44297522400007, 22.10364982400006]
 *                 - [80.44524228200004, 22.110904408000067]
 *                 - [80.44818945700007, 22.115211818000034]
 *                 - [80.45158118800003, 22.12072338200005]
 *                 - [80.31871700000005, 22.345860000000073]
 *                 - [80.31598700000006, 22.346291000000065]
 *                 - [80.31234700000005, 22.346250000000055]
 *                 - [80.30690900000008, 22.344971000000044]
 *                 - [80.29971400000005, 22.341721000000064]
 *                 - [80.29548600000004, 22.338911000000053]
 *                 - [80.28502700000007, 22.32908100000003]
 *                 - [80.27510800000005, 22.323481000000072]
 *                 - [80.16330000000005, 22.34513000000004]
 *             properties:
 *               Name: "PARASWADA"
 *               District: "BALAGHAT"
 *               Division: "Katni"
 *               Parliament: "BALAGHAT"
 *               VS_Code: 110
 *         createdAt: "2023-05-15T10:00:00Z"
 *         updatedAt: "2023-05-15T10:00:00Z"
 */

exports.getAllParliamentpolygens = async (req, res) => {
  try {
    const polygons = await Parliamentpolygen.find();
    res.json(polygons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getParliamentpolygenById = async (req, res) => {
  try {
    const polygon = await Parliamentpolygen.findById(req.params.id);
    if (!polygon) {
      return res.status(404).json({ error: 'Parliament polygon not found' });
    }
    res.json(polygon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getParliamentpolygensByName = async (req, res) => {
  try {
    const polygons = await Parliamentpolygen.find({
      'features.properties.Name': req.params.name
    });
    res.json(polygons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getParliamentpolygensByDistrict = async (req, res) => {
  try {
    const polygons = await Parliamentpolygen.find({
      'features.properties.District': req.params.district
    });
    res.json(polygons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getParliamentpolygensByVS_Code = async (req, res) => {
  try {
    const polygons = await Parliamentpolygen.find({
      'features.properties.VS_Code': req.params.vsCode
    });
    res.json(polygons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};