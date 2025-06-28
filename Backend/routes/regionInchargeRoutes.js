const express = require('express');
const {
  getRegionIncharges,
  getRegionIncharge,
  createRegionIncharge,
  updateRegionIncharge,
  deleteRegionIncharge,
  getInchargesByCommittee,
  getInchargesByRole
} = require('../controllers/regionInchargeController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Region Incharges
 *   description: Region committee incharge management
 */

/**
 * @swagger
 * /api/region-incharges:
 *   get:
 *     summary: Get all region incharges
 *     tags: [Region Incharges]
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
 *         name: committee
 *         schema:
 *           type: string
 *         description: Committee ID to filter by
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [incharge, coordinator, member]
 *         description: Role to filter by
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of region incharges
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
 *                     $ref: '#/components/schemas/RegionIncharge'
 */
router.get('/', getRegionIncharges);

/**
 * @swagger
 * /api/region-incharges/{id}:
 *   get:
 *     summary: Get single region incharge
 *     tags: [Region Incharges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Region incharge data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegionIncharge'
 *       404:
 *         description: Region incharge not found
 */
router.get('/:id', getRegionIncharge);

/**
 * @swagger
 * /api/region-incharges/committee/{committeeId}:
 *   get:
 *     summary: Get incharges by committee
 *     tags: [Region Incharges]
 *     parameters:
 *       - in: path
 *         name: committeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of incharges for the committee
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
 *                     $ref: '#/components/schemas/RegionIncharge'
 *       404:
 *         description: Committee not found
 */
router.get('/committee/:committeeId', getInchargesByCommittee);

/**
 * @swagger
 * /api/region-incharges/role/{role}:
 *   get:
 *     summary: Get incharges by role
 *     tags: [Region Incharges]
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [incharge, coordinator, member]
 *     responses:
 *       200:
 *         description: List of incharges with the specified role
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
 *                     $ref: '#/components/schemas/RegionIncharge'
 */
router.get('/role/:role', getInchargesByRole);

/**
 * @swagger
 * /api/region-incharges:
 *   post:
 *     summary: Create new region incharge
 *     tags: [Region Incharges]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegionIncharge'
 *     responses:
 *       201:
 *         description: Region incharge created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin'), createRegionIncharge);

/**
 * @swagger
 * /api/region-incharges/{id}:
 *   put:
 *     summary: Update region incharge
 *     tags: [Region Incharges]
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
 *             $ref: '#/components/schemas/RegionIncharge'
 *     responses:
 *       200:
 *         description: Region incharge updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Region incharge not found
 */
router.put('/:id', protect, authorize('superAdmin'), updateRegionIncharge);

/**
 * @swagger
 * /api/region-incharges/{id}:
 *   delete:
 *     summary: Delete region incharge
 *     tags: [Region Incharges]
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
 *         description: Region incharge deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Region incharge not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteRegionIncharge);

/**
 * @swagger
 * components:
 *   schemas:
 *     RegionIncharge:
 *       type: object
 *       required:
 *         - committee_id
 *         - name
 *         - phone
 *         - designation
 *         - role
 *       properties:
 *         committee_id:
 *           type: string
 *           description: Reference to RegionCommittee
 *           example: "507f1f77bcf86cd799439011"
 *         name:
 *           type: string
 *           description: Full name of the incharge
 *           example: "John Doe"
 *         phone:
 *           type: string
 *           description: 10-digit phone number
 *           example: "9876543210"
 *         email:
 *           type: string
 *           description: Email address
 *           example: "john.doe@example.com"
 *         designation:
 *           type: string
 *           description: Official designation
 *           example: "District Coordinator"
 *         role:
 *           type: string
 *           enum: [incharge, coordinator, member]
 *           description: Role in the committee
 *           example: "coordinator"
 *         is_active:
 *           type: boolean
 *           description: Active status
 *           default: true
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