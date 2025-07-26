const express = require('express');
const {
  getBoothPolygons,
  getBoothPolygon,
  createBoothPolygon,
  updateBoothPolygon,
  deleteBoothPolygon,
  getPolygonsByBooth,
  getPolygonsWithin,
  getBoothsByBlockNumber
} = require('../controllers/boothPolygonController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Booth Polygons
 *   description: Booth polygon (geospatial) management
 */

/**
 * @swagger
 * /api/booth-polygons:
 *   get:
 *     summary: Get all booth polygons
 *     tags: [Booth Polygons]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for booth names or numbers
 *       - in: query
 *         name: booth
 *         schema:
 *           type: string
 *         description: Booth ID to filter by
 *       - in: query
 *         name: election_year
 *         schema:
 *           type: string
 *         description: Election year ID to filter by
 *       - in: query
 *         name: assembly
 *         schema:
 *           type: integer
 *         description: Assembly number (AC_NO) to filter by
 *       - in: query
 *         name: parliament
 *         schema:
 *           type: integer
 *         description: Parliament number (PC_NO) to filter by
 *     responses:
 *       200:
 *         description: List of booth polygons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BoothPolygon'
 */
router.get('/', getBoothPolygons);

/**
 * @swagger
 * /api/booth-polygons/{id}:
 *   get:
 *     summary: Get single booth polygon
 *     tags: [Booth Polygons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booth polygon data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoothPolygon'
 *       404:
 *         description: Booth polygon not found
 */
router.get('/:id', getBoothPolygon);

/**
 * @swagger
 * /api/booth-polygons:
 *   post:
 *     summary: Create new booth polygon
 *     tags: [Booth Polygons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BoothPolygon'
 *     responses:
 *       201:
 *         description: Booth polygon created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin'), createBoothPolygon);

/**
 * @swagger
 * /api/booth-polygons/{id}:
 *   put:
 *     summary: Update booth polygon
 *     tags: [Booth Polygons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BoothPolygon'
 *     responses:
 *       200:
 *         description: Booth polygon updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Booth polygon not found
 */
router.put('/:id', protect, authorize('superAdmin'), updateBoothPolygon);

/**
 * @swagger
 * /api/booth-polygons/{id}:
 *   delete:
 *     summary: Delete booth polygon
 *     tags: [Booth Polygons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booth polygon deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Booth polygon not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteBoothPolygon);

/**
 * @swagger
 * /api/booth-polygons/booth/{boothId}:
 *   get:
 *     summary: Get booth polygons by booth ID
 *     tags: [Booth Polygons]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of booth polygons for the specified booth
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BoothPolygon'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', getPolygonsByBooth);

/**
 * @swagger
 * /api/booth-polygons/within:
 *   post:
 *     summary: Get booth polygons within a geographical area
 *     tags: [Booth Polygons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               geometry:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [Polygon, MultiPolygon]
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: array
 *                       items:
 *                         type: array
 *                         items:
 *                           type: number
 *     responses:
 *       200:
 *         description: List of booth polygons within the specified area
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BoothPolygon'
 *       400:
 *         description: Invalid geometry provided
 */
router.post('/within', getPolygonsWithin);

/**
 * @swagger
 * /api/booths/block-number/{blockNumber}:
 *   get:
 *     summary: Get booths by BlockNumber
 *     tags: [Booths]
 *     parameters:
 *       - in: path
 *         name: blockNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: The BlockNumber to filter by
 *     responses:
 *       200:
 *         description: List of booths for the specified BlockNumber
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booth'
 *       404:
 *         description: No booths found for this BlockNumber
 */
router.get('/block-number/:blockNumber', getBoothsByBlockNumber);

/**
 * @swagger
 * components:
 *   schemas:
 *     BoothPolygon:
 *       type: object
 *       required:
 *         - type
 *         - geometry
 *         - properties
 *         - created_by
 *       properties:
 *         type:
 *           type: string
 *           enum: [Feature]
 *           description: GeoJSON type
 *           example: "Feature"
 *         geometry:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [Polygon]
 *               description: GeoJSON geometry type
 *               example: "Polygon"
 *             coordinates:
 *               type: array
 *               items:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: number
 *               description: Array of coordinate arrays
 *               example: [[[long, lat], [long, lat], [long, lat], [long, lat]]]
 *         properties:
 *           type: object
 *           properties:
 *             booth_id:
 *               type: string
 *               description: Reference to Booth
 *               example: "507f1f77bcf86cd799439011"
 *             BoothName:
 *               type: string
 *               description: Booth name
 *               example: "Kherwa"
 *             BoothNo:
 *               type: string
 *               description: Booth number
 *               example: "188"
 *             BlockName:
 *               type: string
 *               description: Block name
 *               example: "Bagh"
 *             BlockNumber:
 *               type: string
 *               description: Block number
 *               example: "1"
 *             AC_NAME:
 *               type: string
 *               description: Assembly constituency name
 *               example: "Gandhwani (ST)"
 *             AC_NO:
 *               type: integer
 *               description: Assembly constituency number
 *               example: 197
 *             PC_NAME:
 *               type: string
 *               description: Parliament constituency name
 *               example: "DHAR (ST)"
 *             PC_NO:
 *               type: integer
 *               description: Parliament constituency number
 *               example: 25
 *             ST_NAME:
 *               type: string
 *               description: State name
 *               example: "MADHYA PRADESH"
 *             ST_CODE:
 *               type: integer
 *               description: State code
 *               example: 23
 *             DIVISION_NAME:
 *               type: string
 *               description: Division name
 *               example: "Indore"
 *             DIVISION_CODE:
 *               type: integer
 *               description: Division code
 *               example: 4
 *             election_year:
 *               type: string
 *               description: Reference to Election Year
 *               example: "507f1f77bcf86cd799439017"
 *         created_by:
 *           type: string
 *           description: Reference to User who created
 *           example: "507f1f77bcf86cd799439022"
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated
 *           example: "507f1f77bcf86cd799439023"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;