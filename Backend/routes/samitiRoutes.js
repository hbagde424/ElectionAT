const express = require('express');
const {
  getSamitis,
  getSamiti,
  createSamiti,
  updateSamiti,
  deleteSamiti
} = require('../controllers/samitiController');
const { protect, authorize } = require('../middlewares/auth');
const { getUserPermissionsAndHierarchy } = require('../middlewares/permissions');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Samitis
 *   description: Samiti management
 */

/**
 * @swagger
 * /api/samitis:
 *   get:
 *     summary: Get all samitis
 *     tags: [Samitis]
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
 *         description: Search term for samiti name, village, or falia
 *       - in: query
 *         name: state_id
 *         schema:
 *           type: string
 *         description: Filter by state ID
 *       - in: query
 *         name: division_id
 *         schema:
 *           type: string
 *         description: Filter by division ID
 *       - in: query
 *         name: parliament_id
 *         schema:
 *           type: string
 *         description: Filter by parliament ID
 *       - in: query
 *         name: assembly_id
 *         schema:
 *           type: string
 *         description: Filter by assembly ID
 *       - in: query
 *         name: block_id
 *         schema:
 *           type: string
 *         description: Filter by block ID
 *       - in: query
 *         name: booth_id
 *         schema:
 *           type: string
 *         description: Filter by booth ID
 *       - in: query
 *         name: village
 *         schema:
 *           type: string
 *         description: Filter by village
 *       - in: query
 *         name: falia
 *         schema:
 *           type: string
 *         description: Filter by falia
 *     responses:
 *       200:
 *         description: List of samitis
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
 *                     $ref: '#/components/schemas/Samiti'
 */
router.get('/', getUserPermissionsAndHierarchy, getSamitis);

/**
 * @swagger
 * /api/samitis/{id}:
 *   get:
 *     summary: Get single samiti
 *     tags: [Samitis]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Samiti data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Samiti'
 *       404:
 *         description: Samiti not found
 */
router.get('/:id', getUserPermissionsAndHierarchy, getSamiti);

/**
 * @swagger
 * /api/samitis:
 *   post:
 *     summary: Create new samiti
 *     tags: [Samitis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Samiti'
 *     responses:
 *       201:
 *         description: Samiti created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin', 'admin'), createSamiti);

/**
 * @swagger
 * /api/samitis/{id}:
 *   put:
 *     summary: Update samiti
 *     tags: [Samitis]
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
 *             $ref: '#/components/schemas/Samiti'
 *     responses:
 *       200:
 *         description: Samiti updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Samiti not found
 */
router.put('/:id', protect, authorize('superAdmin', 'admin'), updateSamiti);

/**
 * @swagger
 * /api/samitis/{id}:
 *   delete:
 *     summary: Delete samiti
 *     tags: [Samitis]
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
 *         description: Samiti deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Samiti not found
 */
router.delete('/:id', protect, authorize('superAdmin', 'admin'), deleteSamiti);

/**
 * @swagger
 * components:
 *   schemas:
 *     Samiti:
 *       type: object
 *       required:
 *         - samiti_name
 *         - village
 *         - falia
 *         - count
 *         - state_id
 *         - division_id
 *         - parliament_id
 *         - assembly_id
 *         - block_id
 *         - booth_id
 *       properties:
 *         samiti_name:
 *           type: string
 *           description: Name of the samiti
 *           example: "Gram Panchayat Samiti"
 *         village:
 *           type: string
 *           description: Village name
 *           example: "Khargone"
 *         falia:
 *           type: string
 *           description: Falia name
 *           example: "Main Falia"
 *         count:
 *           type: number
 *           description: Count value
 *           example: 150
 *         state_id:
 *           type: string
 *           description: Reference to State
 *           example: "507f1f77bcf86cd799439011"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439012"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *           example: "507f1f77bcf86cd799439013"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *           example: "507f1f77bcf86cd799439014"
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *           example: "507f1f77bcf86cd799439015"
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439016"
 *         created_by:
 *           type: string
 *           description: Reference to User who created
 *           example: "507f1f77bcf86cd799439022"
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