const express = require('express');
const {
  getVoteShares,
  getVoteShareById,
  createVoteShare,
  updateVoteShare,
  deleteVoteShare,
  getVoteSharesByStat,
  getVoteSharesByParty
} = require('../controllers/boothPartyVoteShareController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Booth Party Vote Shares
 *   description: Booth-level party vote share statistics management
 */

/**
 * @swagger
 * /api/vote-shares:
 *   get:
 *     summary: Get all booth party vote shares
 *     tags: [Booth Party Vote Shares]
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
 *         name: statId
 *         schema:
 *           type: string
 *         description: Filter by election stat ID
 *       - in: query
 *         name: partyId
 *         schema:
 *           type: string
 *         description: Filter by party ID
 *     responses:
 *       200:
 *         description: List of vote shares
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
 *                     $ref: '#/components/schemas/BoothPartyVoteShare'
 */
router.get('/', getVoteShares);

/**
 * @swagger
 * /api/vote-shares/{id}:
 *   get:
 *     summary: Get single vote share record
 *     tags: [Booth Party Vote Shares]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vote share data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoothPartyVoteShare'
 *       404:
 *         description: Record not found
 */
router.get('/:id', getVoteShareById);

/**
 * @swagger
 * /api/vote-shares:
 *   post:
 *     summary: Create new vote share record
 *     tags: [Booth Party Vote Shares]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BoothPartyVoteShare'
 *     responses:
 *       201:
 *         description: Record created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin', 'editor'), createVoteShare);

/**
 * @swagger
 * /api/vote-shares/{id}:
 *   put:
 *     summary: Update vote share record
 *     tags: [Booth Party Vote Shares]
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
 *             $ref: '#/components/schemas/BoothPartyVoteShare'
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
router.put('/:id', protect, authorize('superAdmin', 'editor'), updateVoteShare);

/**
 * @swagger
 * /api/vote-shares/{id}:
 *   delete:
 *     summary: Delete vote share record
 *     tags: [Booth Party Vote Shares]
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
router.delete('/:id', protect, authorize('superAdmin'), deleteVoteShare);

/**
 * @swagger
 * /api/vote-shares/stat/{statId}:
 *   get:
 *     summary: Get vote shares by election stat ID
 *     tags: [Booth Party Vote Shares]
 *     parameters:
 *       - in: path
 *         name: statId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of vote shares for the election stat
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
 *                     $ref: '#/components/schemas/BoothPartyVoteShare'
 *       404:
 *         description: Election stat not found
 */
router.get('/stat/:statId', getVoteSharesByStat);

/**
 * @swagger
 * /api/vote-shares/party/{partyId}:
 *   get:
 *     summary: Get vote shares by party ID
 *     tags: [Booth Party Vote Shares]
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of vote shares for the party
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
 *                     $ref: '#/components/schemas/BoothPartyVoteShare'
 *       404:
 *         description: Party not found
 */
router.get('/party/:partyId', getVoteSharesByParty);

/**
 * @swagger
 * components:
 *   schemas:
 *     BoothPartyVoteShare:
 *       type: object
 *       required:
 *         - stat_id
 *         - party_id
 *         - votes
 *         - vote_percent
 *       properties:
 *         stat_id:
 *           type: string
 *           description: Reference to BoothElectionStats
 *           example: "507f1f77bcf86cd799439011"
 *         party_id:
 *           type: string
 *           description: Reference to Party
 *           example: "507f1f77bcf86cd799439012"
 *         votes:
 *           type: number
 *           description: Number of votes received
 *           example: 1250
 *         vote_percent:
 *           type: number
 *           description: Percentage of total votes
 *           example: 42.5
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