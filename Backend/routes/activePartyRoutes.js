const express = require('express');
const {
  getActiveParties,
  getActiveParty,
  createActiveParty,
  updateActiveParty,
  deleteActiveParty,
  getActivePartiesByBooth,
  toggleActiveStatus
} = require('../controllers/activePartyController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Active Parties
 *   description: Active political parties management at booth level
 */

/**
 * @swagger
 * /api/active-parties:
 *   get:
 *     summary: Get all active party records
 *     tags: [Active Parties]
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
 *         name: booth
 *         schema:
 *           type: string
 *         description: Booth ID to filter by
 *       - in: query
 *         name: party
 *         schema:
 *           type: string
 *         description: Party ID to filter by
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of active party records
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
 *                     $ref: '#/components/schemas/ActiveParty'
 */
router.get('/', getActiveParties);

/**
 * @swagger
 * /api/active-parties/{id}:
 *   get:
 *     summary: Get single active party record
 *     tags: [Active Parties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Active party record data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ActiveParty'
 *       404:
 *         description: Record not found
 */
router.get('/:id', getActiveParty);

/**
 * @swagger
 * /api/active-parties:
 *   post:
 *     summary: Create new active party record
 *     tags: [Active Parties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActiveParty'
 *     responses:
 *       201:
 *         description: Record created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/',  createActiveParty);
// router.post('/', protect, authorize('assembly'), createActiveParty);

/**
 * @swagger
 * /api/active-parties/{id}:
 *   put:
 *     summary: Update active party record
 *     tags: [Active Parties]
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
 *             $ref: '#/components/schemas/ActiveParty'
 *     responses:
 *       200:
 *         description: Record updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Record not found
 */
router.put('/:id', protect, authorize('master'), updateActiveParty);

/**
 * @swagger
 * /api/active-parties/{id}:
 *   delete:
 *     summary: Delete active party record
 *     tags: [Active Parties]
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
 *         description: Record deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Record not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteActiveParty);

/**
 * @swagger
 * /api/active-parties/booth/{boothId}:
 *   get:
 *     summary: Get active parties by booth
 *     tags: [Active Parties]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of active parties for the booth
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
 *                     $ref: '#/components/schemas/ActiveParty'
 *       404:
 *         description: Booth not found
 */

router.get('/booth/:boothId', getActivePartiesByBooth);

/**
 * @swagger
 * /api/active-parties/{id}/toggle:
 *   patch:
 *     summary: Toggle party active status
 *     tags: [Active Parties]
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
 *         description: Status toggled successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Record not found
 */
router.patch('/:id/toggle', protect, authorize('superAdmin'), toggleActiveStatus);

/**
 * @swagger
 * components:
 *   schemas:
 *     ActiveParty:
 *       type: object
 *       required:
 *         - booth_id
 *         - party_id
 *         - Active_status
 *         - last_Active_status
 *       properties:
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439011"
 *         party_id:
 *           type: string
 *           description: Reference to Party
 *           example: "507f1f77bcf86cd799439012"
 *         Active_status:
 *           type: boolean
 *           description: Current active status
 *           example: true
 *         last_Active_status:
 *           type: boolean
 *           description: Previous active status
 *           example: false
 *         last_updated:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;