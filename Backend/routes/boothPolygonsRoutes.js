const express = require('express');
const {
  getBoothPolygons,
  getBoothPolygon,
  getBoothPolygonsByAssembly,
  getBoothPolygonsByBlock,
  getBoothPolygonsByYear,
  getBoothPolygonsWithin,
  getBoothPolygonsByBlockNumber
} = require('../controllers/boothPolygonController');

const router = express.Router();
const { createSafeHandler } = require('../middlewares/paramSanitizer');

// Apply parameter validation to common parameters
router.param('id', (req, res, next, id) => {
  if (!id || !/^[a-zA-Z0-9-_]+$/.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  next();
});

router.param('blockName', (req, res, next, blockName) => {
  if (!blockName || typeof blockName !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Invalid block name'
    });
  }
  next();
});

router.param('acNo', (req, res, next, acNo) => {
  const parsedAcNo = parseInt(acNo, 10);
  if (isNaN(parsedAcNo)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid assembly number'
    });
  }
  req.params.acNo = parsedAcNo;
  next();
});

/**
 * @swagger
 * tags:
 *   name: Booth Polygons
 *   description: Booth polygon management
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
 *         name: block
 *         schema:
 *           type: string
 *         description: Block name to filter by
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
 *       - in: query
 *         name: division
 *         schema:
 *           type: integer
 *         description: Division code to filter by
 *       - in: query
 *         name: state
 *         schema:
 *           type: integer
 *         description: State code to filter by
 *       - in: query
 *         name: election_year
 *         schema:
 *           type: string
 *         description: Election year ID to filter by
 *     responses:
 *       200:
 *         description: GeoJSON FeatureCollection of booth polygons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: "FeatureCollection"
 *                 features:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BoothPolygonFeature'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
router.get('/', createSafeHandler(getBoothPolygons));

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
 *         description: GeoJSON Feature of booth polygon
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoothPolygonFeature'
 *       404:
 *         description: Booth polygon not found
 */
router.get('/:id', createSafeHandler(getBoothPolygon));

/**
 * @swagger
 * /api/booth-polygons/assembly/{acNo}:
 *   get:
 *     summary: Get booth polygons by assembly (AC)
 *     tags: [Booth Polygons]
 *     parameters:
 *       - in: path
 *         name: acNo
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: GeoJSON FeatureCollection of booth polygons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: "FeatureCollection"
 *                 features:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BoothPolygonFeature'
 */
router.get('/assembly/:acNo', createSafeHandler(getBoothPolygonsByAssembly));

/**
 * @swagger
 * /api/booth-polygons/block/{blockName}:
 *   get:
 *     summary: Get booth polygons by block name
 *     tags: [Booth Polygons]
 *     parameters:
 *       - in: path
 *         name: blockName
 *         required: true
 *         schema:
 *           type: string
 *         description: Block name (case-insensitive)
 *     responses:
 *       200:
 *         description: GeoJSON FeatureCollection of booth polygons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: "FeatureCollection"
 *                 features:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BoothPolygonFeature'
 *                 message:
 *                   type: string
 *                   description: Informational message when no features found
 *       400:
 *         description: Bad request when block name is empty
 */
router.get('/block/:blockName', createSafeHandler(getBoothPolygonsByBlock));

/**
 * @swagger
 * /api/booth-polygons/year/{yearId}:
 *   get:
 *     summary: Get booth polygons by election year
 *     tags: [Booth Polygons]
 *     parameters:
 *       - in: path
 *         name: yearId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: GeoJSON FeatureCollection of booth polygons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: "FeatureCollection"
 *                 features:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BoothPolygonFeature'
 *       404:
 *         description: Election year not found
 */
router.get('/year/:yearId', getBoothPolygonsByYear);

/**
 * @swagger
 * /api/booth-polygons/within:
 *   get:
 *     summary: Get booth polygons within a geographical area
 *     tags: [Booth Polygons]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude of center point
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude of center point
 *       - in: query
 *         name: radius
 *         required: true
 *         schema:
 *           type: number
 *         description: Radius in kilometers
 *     responses:
 *       200:
 *         description: GeoJSON FeatureCollection of booth polygons within the area
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: "FeatureCollection"
 *                 features:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BoothPolygonFeature'
 *       400:
 *         description: Missing required parameters
 */
router.get('/within', getBoothPolygonsWithin);


/**
 * @swagger
 * /api/booth-polygons/block-number/{blockNumber}:
 *   get:
 *     summary: Get booth polygons by block number
 *     tags: [Booth Polygons]
 *     parameters:
 *       - in: path
 *         name: blockNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: The block number to search for
 *     responses:
 *       200:
 *         description: GeoJSON FeatureCollection of booth polygons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: "FeatureCollection"
 *                 features:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BoothPolygonFeature'
 *                 message:
 *                   type: string
 *                   description: Informational message when no features found
 *       400:
 *         description: Bad request when block number is empty
 */
router.get('/block-number/:blockNumber', getBoothPolygonsByBlockNumber);

/**
 * @swagger
 * components:
 *   schemas:
 *     BoothPolygonFeature:
 *       type: object
 *       required:
 *         - type
 *         - geometry
 *         - properties
 *       properties:
 *         type:
 *           type: string
 *           example: "Feature"
 *         geometry:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               example: "Polygon"
 *             coordinates:
 *               type: array
 *               items:
 *                 type: array
 *                 items:
 *                   type: array
 *                   items:
 *                     type: number
 *         properties:
 *           type: object
 *           properties:
 *             BoothName:
 *               type: string
 *             BoothNo:
 *               type: string
 *             BlockName:
 *               type: string
 *             BlockNumber:
 *               type: string
 *             AC_NAME:
 *               type: string
 *             AC_NO:
 *               type: integer
 *             PC_NAME:
 *               type: string
 *             PC_NO:
 *               type: integer
 *             ST_NAME:
 *               type: string
 *             ST_CODE:
 *               type: integer
 *             DIVISION_NAME:
 *               type: string
 *             DIVISION_CODE:
 *               type: integer
 */

module.exports = router;