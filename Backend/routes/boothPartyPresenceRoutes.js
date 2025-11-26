const express = require('express');
const {
  getPartyPresences,
  getPartyPresenceById,
  createPartyPresence,
  updatePartyPresence,
  deletePartyPresence,
  getPresencesByBooth,
  getPresencesByParty
} = require('../controllers/boothPartyPresenceController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Booth Party Presence
 *   description: Party presence and organization at booth level
 */

/**
 * @swagger
 * /api/party-presence:
 *   get:
 *     summary: Get all party presence records
 *     tags: [Booth Party Presence]
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
 *         description: Filter by booth ID
 *       - in: query
 *         name: party
 *         schema:
 *           type: string
 *         description: Filter by party ID
 *       - in: query
 *         name: hasCommittee
 *         schema:
 *           type: string
 *           enum: [Yes, No]
 *         description: Filter by booth committee presence
 *     responses:
 *       200:
 *         description: List of party presence records
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
 *                     $ref: '#/components/schemas/BoothPartyPresence'
 */
router.get('/', getPartyPresences);

/**
 * @swagger
 * /api/party-presence/{id}:
 *   get:
 *     summary: Get single party presence record
 *     tags: [Booth Party Presence]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Party presence data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoothPartyPresence'
 *       404:
 *         description: Record not found
 */
router.get('/:id', getPartyPresenceById);

/**
 * @swagger
 * /api/party-presence:
 *   post:
 *     summary: Create new party presence record
 *     tags: [Booth Party Presence]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BoothPartyPresence'
 *     responses:
 *       201:
 *         description: Record created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin', 'editor'), createPartyPresence);

/**
 * @swagger
 * /api/party-presence/{id}:
 *   put:
 *     summary: Update party presence record
 *     tags: [Booth Party Presence]
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
 *             $ref: '#/components/schemas/BoothPartyPresence'
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
router.put('/:id', protect, authorize('superAdmin', 'editor'), updatePartyPresence);

/**
 * @swagger
 * /api/party-presence/{id}:
 *   delete:
 *     summary: Delete party presence record
 *     tags: [Booth Party Presence]
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
router.delete('/:id', protect, authorize('superAdmin'), deletePartyPresence);

/**
 * @swagger
 * /api/party-presence/booth/{boothId}:
 *   get:
 *     summary: Get party presence records by booth ID
 *     tags: [Booth Party Presence]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of party presence records for the booth
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
 *                     $ref: '#/components/schemas/BoothPartyPresence'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', getPresencesByBooth);

/**
 * @swagger
 * /api/party-presence/party/{partyId}:
 *   get:
 *     summary: Get party presence records by party ID
 *     tags: [Booth Party Presence]
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of party presence records for the party
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
 *                     $ref: '#/components/schemas/BoothPartyPresence'
 *       404:
 *         description: Party not found
 */
router.get('/party/:partyId', getPresencesByParty);

/**
 * @swagger
 * components:
 *   schemas:
 *     BoothPartyPresence:
 *       type: object
 *       required:
 *         - booth_id
 *         - party_id
 *       properties:
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439011"
 *         party_id:
 *           type: string
 *           description: Reference to Party
 *           example: "507f1f77bcf86cd799439012"
 *         local_unit_head_name:
 *           type: string
 *           description: Name of the local unit head
 *           example: "John Doe"
 *         head_phone:
 *           type: string
 *           description: Phone number of the local unit head
 *           example: "+1234567890"
 *         registered_members:
 *           type: integer
 *           description: Number of registered party members at this booth
 *           example: 25
 *         has_booth_committee:
 *           type: string
 *           enum: [Yes, No]
 *           description: Whether the party has a booth committee
 *           example: "Yes"
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