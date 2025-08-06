const express = require('express');
const {
  getIndiaPolygon,
  createIndiaPolygon,
  updateIndiaPolygon,
  deleteIndiaPolygon
} = require('../controllers/indiaPolygonController');

const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: IndiaPolygon
 *   description: API to manage India's base map polygon
 */

router.get('/', getIndiaPolygon);

/**
 * @swagger
 * /api/india-polygon:
 *   post:
 *     summary: Create India polygon
 *     tags: [IndiaPolygon]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IndiaPolygon'
 *     responses:
 *       201:
 *         description: Polygon created successfully
 */
router.post('/', protect, authorize('superAdmin'), createIndiaPolygon);

/**
 * @swagger
 * /api/india-polygon/{id}:
 *   put:
 *     summary: Update India polygon
 *     tags: [IndiaPolygon]
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
 *             $ref: '#/components/schemas/IndiaPolygon'
 *     responses:
 *       200:
 *         description: Polygon updated successfully
 */
router.put('/:id', protect, authorize('superAdmin'), updateIndiaPolygon);

/**
 * @swagger
 * /api/india-polygon/{id}:
 *   delete:
 *     summary: Delete India polygon
 *     tags: [IndiaPolygon]
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
 *         description: Polygon deleted successfully
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteIndiaPolygon);

module.exports = router;
