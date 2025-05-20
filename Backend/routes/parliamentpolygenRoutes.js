const express = require('express');
const router = express.Router();
const parliamentpolygenController = require('../controllers/parliamentpolygenController');

/**
 * @swagger
 * tags:
 *   name: Parliament Polygons
 *   description: Parliament Constituency Polygon Data Management
 */

/**
 * @swagger
 * /api/parliament-polygons:
 *   get:
 *     summary: Get all parliament polygons
 *     tags: [Parliament Polygons]
 *     responses:
 *       200:
 *         description: List of all parliament polygons
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Parliamentpolygen'
 *             example:
 *               - _id: "68287bd6ce1ab28997328656"
 *                 type: "FeatureCollection"
 *                 features:
 *                   - type: "Feature"
 *                     geometry:
 *                       type: "Polygon"
 *                       coordinates:
 *                         - [79.48022985000006, 22.525768620000065]
 *                         - [80.45340369100006, 22.07537609700006]
 *                         - [80.45340369100006, 22.08392642000007]
 *                         - [80.45113663300003, 22.087553713000034]
 *                         - [80.44365534200006, 22.098889002000078]
 *                         - [80.44297522400007, 22.10364982400006]
 *                         - [80.44524228200004, 22.110904408000067]
 *                         - [80.44818945700007, 22.115211818000034]
 *                         - [80.45158118800003, 22.12072338200005]
 *                         - [80.31871700000005, 22.345860000000073]
 *                         - [80.31598700000006, 22.346291000000065]
 *                         - [80.31234700000005, 22.346250000000055]
 *                         - [80.30690900000008, 22.344971000000044]
 *                         - [80.29971400000005, 22.341721000000064]
 *                         - [80.29548600000004, 22.338911000000053]
 *                         - [80.28502700000007, 22.32908100000003]
 *                         - [80.27510800000005, 22.323481000000072]
 *                         - [80.16330000000005, 22.34513000000004]
 *                     properties:
 *                       Name: "PARASWADA"
 *                       District: "BALAGHAT"
 *                       Division: "Katni"
 *                       Parliament: "BALAGHAT"
 *                       VS_Code: 110
 *                 createdAt: "2023-05-15T10:00:00Z"
 *                 updatedAt: "2023-05-15T10:00:00Z"
 *       500:
 *         description: Server error
 */
router.get('/', parliamentpolygenController.getAllParliamentpolygens);

/**
 * @swagger
 * /api/parliament-polygons/{id}:
 *   get:
 *     summary: Get parliament polygon by ID
 *     tags: [Parliament Polygons]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         example: "68287bd6ce1ab28997328656"
 *     responses:
 *       200:
 *         description: Parliament polygon data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parliamentpolygen'
 *       404:
 *         description: Parliament polygon not found
 *       500:
 *         description: Server error
 */
router.get('/:id', parliamentpolygenController.getParliamentpolygenById);

/**
 * @swagger
 * /api/parliament-polygons/name/{name}:
 *   get:
 *     summary: Get parliament polygons by name
 *     tags: [Parliament Polygons]
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         example: "PARASWADA"
 *     responses:
 *       200:
 *         description: List of matching parliament polygons
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Parliamentpolygen'
 *       500:
 *         description: Server error
 */
router.get('/name/:name', parliamentpolygenController.getParliamentpolygensByName);

/**
 * @swagger
 * /api/parliament-polygons/district/{district}:
 *   get:
 *     summary: Get parliament polygons by district
 *     tags: [Parliament Polygons]
 *     parameters:
 *       - in: path
 *         name: district
 *         schema:
 *           type: string
 *         required: true
 *         example: "BALAGHAT"
 *     responses:
 *       200:
 *         description: List of parliament polygons in district
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Parliamentpolygen'
 *       500:
 *         description: Server error
 */
router.get('/district/:district', parliamentpolygenController.getParliamentpolygensByDistrict);

/**
 * @swagger
 * /api/parliament-polygons/vs-code/{vsCode}:
 *   get:
 *     summary: Get parliament polygons by VS Code
 *     tags: [Parliament Polygons]
 *     parameters:
 *       - in: path
 *         name: vsCode
 *         schema:
 *           type: number
 *         required: true
 *         example: 110
 *     responses:
 *       200:
 *         description: List of parliament polygons with matching VS Code
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Parliamentpolygen'
 *       500:
 *         description: Server error
 */
router.get('/vs-code/:vsCode', parliamentpolygenController.getParliamentpolygensByVS_Code);

module.exports = router;