const express = require('express');
const router = express.Router();
const districtPolygenController = require('../controllers/districtpolygenController');

/**
 * @swagger
 * tags:
 *   name: District Polygons
 *   description: District Boundary Polygon Data Management
 */

/**
 * @swagger
 * /api/district-polygons:
 *   post:
 *     summary: Create a new district polygon
 *     tags: [District Polygons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DistrictPolygen'
 *     responses:
 *       201:
 *         description: District polygon created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DistrictPolygen'
 *       400:
 *         description: Invalid input
 */
router.post('/', districtPolygenController.createDistrictPolygen);

/**
 * @swagger
 * /api/district-polygons:
 *   get:
 *     summary: Get all district polygons (paginated)
 *     tags: [District Polygons]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of district polygons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 polygons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DistrictPolygen'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/', districtPolygenController.getAllDistrictPolygens);

/**
 * @swagger
 * /api/district-polygons/{id}:
 *   get:
 *     summary: Get district polygon by ID
 *     tags: [District Polygons]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         example: "68287b8383dcc68f065b62a5"
 *     responses:
 *       200:
 *         description: District polygon data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DistrictPolygen'
 *       404:
 *         description: District polygon not found
 *       500:
 *         description: Server error
 */
router.get('/:id', districtPolygenController.getDistrictPolygenById);

/**
 * @swagger
 * /api/district-polygons/name/{name}:
 *   get:
 *     summary: Get district polygons by name
 *     tags: [District Polygons]
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         example: "AGAR"
 *     responses:
 *       200:
 *         description: List of matching district polygons
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DistrictPolygen'
 *       500:
 *         description: Server error
 */
router.get('/name/:name', districtPolygenController.getDistrictPolygensByName);

/**
 * @swagger
 * /api/district-polygons/district/{district}:
 *   get:
 *     summary: Get district polygons by district
 *     tags: [District Polygons]
 *     parameters:
 *       - in: path
 *         name: district
 *         schema:
 *           type: string
 *         required: true
 *         example: "AGAR MALWA"
 *     responses:
 *       200:
 *         description: List of district polygons in specified district
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DistrictPolygen'
 *       500:
 *         description: Server error
 */
router.get('/district/:district', districtPolygenController.getDistrictPolygensByDistrict);

/**
 * @swagger
 * /api/district-polygons/contains/{lng}/{lat}:
 *   get:
 *     summary: Get district polygons containing a point
 *     tags: [District Polygons]
 *     parameters:
 *       - in: path
 *         name: lng
 *         schema:
 *           type: number
 *         required: true
 *         example: 76.2268
 *       - in: path
 *         name: lat
 *         schema:
 *           type: number
 *         required: true
 *         example: 24.1043
 *     responses:
 *       200:
 *         description: List of district polygons containing the point
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DistrictPolygen'
 *       500:
 *         description: Server error
 */
router.get('/contains/:lng/:lat', districtPolygenController.getDistrictPolygensContainingPoint);

/**
 * @swagger
 * /api/district-polygons/{id}:
 *   put:
 *     summary: Update a district polygon
 *     tags: [District Polygons]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         example: "68287b8383dcc68f065b62a5"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DistrictPolygen'
 *     responses:
 *       200:
 *         description: Updated district polygon
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DistrictPolygen'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: District polygon not found
 */
router.put('/:id', districtPolygenController.updateDistrictPolygen);

/**
 * @swagger
 * /api/district-polygons/{id}:
 *   delete:
 *     summary: Delete a district polygon
 *     tags: [District Polygons]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         example: "68287b8383dcc68f065b62a5"
 *     responses:
 *       200:
 *         description: District polygon deleted successfully
 *       404:
 *         description: District polygon not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', districtPolygenController.deleteDistrictPolygen);

module.exports = router;