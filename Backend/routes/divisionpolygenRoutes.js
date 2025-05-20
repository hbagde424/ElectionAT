const express = require('express');
const router = express.Router();
const divisionPolygenController = require('../controllers/divisionPolygenController');

/**
 * @swagger
 * tags:
 *   name: Division Polygons
 *   description: Division Boundary Polygon Data Management
 */

/**
 * @swagger
 * /api/division-polygons:
 *   post:
 *     summary: Create a new division polygon
 *     tags: [Division Polygons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DivisionPolygen'
 *     responses:
 *       201:
 *         description: Division polygon created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DivisionPolygen'
 *       400:
 *         description: Invalid input
 */
router.post('/', divisionPolygenController.createDivisionPolygen);

/**
 * @swagger
 * /api/division-polygons:
 *   get:
 *     summary: Get all division polygons (paginated)
 *     tags: [Division Polygons]
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
 *         description: List of division polygons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 polygons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DivisionPolygen'
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/', divisionPolygenController.getAllDivisionPolygens);

/**
 * @swagger
 * /api/division-polygons/{id}:
 *   get:
 *     summary: Get division polygon by ID
 *     tags: [Division Polygons]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         example: "68287bc1bdaf89b0ec6afb5e"
 *     responses:
 *       200:
 *         description: Division polygon data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DivisionPolygen'
 *       404:
 *         description: Division polygon not found
 *       500:
 *         description: Server error
 */
router.get('/:id', divisionPolygenController.getDivisionPolygenById);

/**
 * @swagger
 * /api/division-polygons/name/{name}:
 *   get:
 *     summary: Get division polygons by name
 *     tags: [Division Polygons]
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         example: "MHOW"
 *     responses:
 *       200:
 *         description: List of matching division polygons
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DivisionPolygen'
 *       500:
 *         description: Server error
 */
router.get('/name/:name', divisionPolygenController.getDivisionPolygensByName);

/**
 * @swagger
 * /api/division-polygons/division/{division}:
 *   get:
 *     summary: Get division polygons by division
 *     tags: [Division Polygons]
 *     parameters:
 *       - in: path
 *         name: division
 *         schema:
 *           type: string
 *         required: true
 *         example: "Burhanpur"
 *     responses:
 *       200:
 *         description: List of division polygons in specified division
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DivisionPolygen'
 *       500:
 *         description: Server error
 */
router.get('/division/:division', divisionPolygenController.getDivisionPolygensByDivision);

/**
 * @swagger
 * /api/division-polygons/district/{district}:
 *   get:
 *     summary: Get division polygons by district
 *     tags: [Division Polygons]
 *     parameters:
 *       - in: path
 *         name: district
 *         schema:
 *           type: string
 *         required: true
 *         example: "INDORE"
 *     responses:
 *       200:
 *         description: List of division polygons in specified district
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DivisionPolygen'
 *       500:
 *         description: Server error
 */
router.get('/district/:district', divisionPolygenController.getDivisionPolygensByDistrict);

/**
 * @swagger
 * /api/division-polygons/contains/{lng}/{lat}:
 *   get:
 *     summary: Get division polygons containing a point
 *     tags: [Division Polygons]
 *     parameters:
 *       - in: path
 *         name: lng
 *         schema:
 *           type: number
 *         required: true
 *         example: 75.123456
 *       - in: path
 *         name: lat
 *         schema:
 *           type: number
 *         required: true
 *         example: 22.654321
 *     responses:
 *       200:
 *         description: List of division polygons containing the point
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DivisionPolygen'
 *       500:
 *         description: Server error
 */
router.get('/contains/:lng/:lat', divisionPolygenController.getDivisionPolygensContainingPoint);

/**
 * @swagger
 * /api/division-polygons/{id}:
 *   put:
 *     summary: Update a division polygon
 *     tags: [Division Polygons]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         example: "68287bc1bdaf89b0ec6afb5e"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DivisionPolygen'
 *     responses:
 *       200:
 *         description: Updated division polygon
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DivisionPolygen'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Division polygon not found
 */
router.put('/:id', divisionPolygenController.updateDivisionPolygen);

/**
 * @swagger
 * /api/division-polygons/{id}:
 *   delete:
 *     summary: Delete a division polygon
 *     tags: [Division Polygons]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         example: "68287bc1bdaf89b0ec6afb5e"
 *     responses:
 *       200:
 *         description: Division polygon deleted successfully
 *       404:
 *         description: Division polygon not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', divisionPolygenController.deleteDivisionPolygen);

module.exports = router;