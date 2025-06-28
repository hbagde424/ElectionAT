const express = require('express');
const {
  getRegionCommittees,
  getRegionCommittee,
  createRegionCommittee,
  updateRegionCommittee,
  deleteRegionCommittee
} = require('../controllers/regionCommitteeController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Region Committees
 *   description: Regional committee management
 */

/**
 * @swagger
 * /api/region-committees:
 *   get:
 *     summary: Get all region committees
 *     tags: [Region Committees]
 *     parameters:
 *       - in: query
 *         name: region_type
 *         schema:
 *           type: string
 *           enum: [Division, Parliament, Assembly, Block]
 *         description: Filter by region type
 *       - in: query
 *         name: region_id
 *         schema:
 *           type: string
 *         description: Filter by specific region ID
 *     responses:
 *       200:
 *         description: List of region committees
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
 *                     $ref: '#/components/schemas/RegionCommittee'
 */
router.get('/', getRegionCommittees);

/**
 * @swagger
 * /api/region-committees/{id}:
 *   get:
 *     summary: Get single region committee
 *     tags: [Region Committees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Region committee data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegionCommittee'
 *       404:
 *         description: Committee not found
 */
router.get('/:id', getRegionCommittee);

/**
 * @swagger
 * /api/region-committees:
 *   post:
 *     summary: Create new region committee
 *     tags: [Region Committees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegionCommittee'
 *     responses:
 *       201:
 *         description: Committee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegionCommittee'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin', 'SuperAdmin'), createRegionCommittee);

/**
 * @swagger
 * /api/region-committees/{id}:
 *   put:
 *     summary: Update region committee
 *     tags: [Region Committees]
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
 *             $ref: '#/components/schemas/RegionCommittee'
 *     responses:
 *       200:
 *         description: Committee updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegionCommittee'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Committee not found
 */
router.put('/:id', protect, authorize('superAdmin', 'SuperAdmin'), updateRegionCommittee);

/**
 * @swagger
 * /api/region-committees/{id}:
 *   delete:
 *     summary: Delete region committee
 *     tags: [Region Committees]
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
 *         description: Committee deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Committee not found
 */
router.delete('/:id', protect, authorize('superAdmin', 'SuperAdmin'), deleteRegionCommittee);

/**
 * @swagger
 * components:
 *   schemas:
 *     RegionCommittee:
 *       type: object
 *       required:
 *         - region_type
 *         - region_ids
 *       properties:
 *         region_type:
 *           type: string
 *           enum: [Division, Parliament, Assembly, Block]
 *           description: Type of region
 *           example: "Division"
 *         region_ids:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of region IDs
 *           example: ["507f1f77bcf86cd799439011"]
 *         committee_name:
 *           type: string
 *           description: Name of the committee
 *           example: "Central Election Committee"
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