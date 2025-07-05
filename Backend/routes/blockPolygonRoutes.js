const express = require('express');
const {
  getAllBlockPolygons,
  getPolygonsByBlock,
  getPolygonsByBooth,
  getPolygonByBoothId,
  createOrUpdateBlockPolygon
} = require('../controllers/blockPolygonController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Block Polygons
 *   description: Geographical polygon data management
 */

/**
 * @swagger
 * /api/block-polygons:
 *   get:
 *     summary: Get all block polygons
 *     tags: [Block Polygons]
 *     responses:
 *       200:
 *         description: List of all block polygons
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
 *                     $ref: '#/components/schemas/BlockPolygon'
 */
router.get('/', getAllBlockPolygons);

/**
 * @swagger
 * /api/block-polygons/block/{blockName}:
 *   get:
 *     summary: Get polygons by block name
 *     tags: [Block Polygons]
 *     parameters:
 *       - in: path
 *         name: blockName
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Block polygons data
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
 *                     $ref: '#/components/schemas/BlockPolygon'
 *       404:
 *         description: Block not found
 */
router.get('/block/:blockName', getPolygonsByBlock);

/**
 * @swagger
 * /api/block-polygons/booth/{boothNumber}:
 *   get:
 *     summary: Get polygons by booth number
 *     tags: [Block Polygons]
 *     parameters:
 *       - in: path
 *         name: boothNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booth polygons data
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
 *                     $ref: '#/components/schemas/BlockPolygon'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothNumber', getPolygonsByBooth);

/**
 * @swagger
 * /api/block-polygons/booth-id/{boothId}:
 *   get:
 *     summary: Get polygon by booth ID
 *     tags: [Block Polygons]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booth polygon data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlockPolygon'
 *       404:
 *         description: Booth not found
 */
router.get('/booth-id/:boothId', getPolygonByBoothId);

/**
 * @swagger
 * /api/block-polygons:
 *   post:
 *     summary: Create or update block polygon
 *     tags: [Block Polygons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BlockPolygon'
 *     responses:
 *       200:
 *         description: Polygon created/updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('admin', 'superAdmin'), createOrUpdateBlockPolygon);

/**
 * @swagger
 * components:
 *   schemas:
 *     BlockPolygon:
 *       type: object
 *       properties:
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
 *                         minItems: 2
 *                         maxItems: 2
 *                         example: [76.653716, 23.196632]
 *               properties:
 *                 type: object
 *                 properties:
 *                   Name:
 *                     type: string
 *                     example: "ASHTA"
 *                   District:
 *                     type: string
 *                     example: "SEHORE"
 *                   Division:
 *                     type: string
 *                     example: "Vidisha"
 *                   Parliament:
 *                     type: string
 *                     example: "DEWAS"
 *                   VS_Code:
 *                     type: number
 *                     example: 157
 *                   booth_number:
 *                     type: string
 *                     example: "B-42"
 *                   booth_id:
 *                     type: string
 *                     example: "507f1f77bcf86cd799439011"
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;