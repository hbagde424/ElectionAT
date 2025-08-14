const express = require('express');
const {
  getWinningParties,
  getWinningParty,
  createWinningParty,
  updateWinningParty,
  deleteWinningParty,
  getWinningPartiesByParty,
  getWinningPartiesByYear,
  getWinningPartiesByBooth,
  getWinningPartysForGraph
} = require('../controllers/winningPartyController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: WinningParties
 *   description: Winning party management
 */

/**
 * @swagger
 * /api/winning-parties:
 *   get:
 *     summary: Get all winning party records
 *     tags: [WinningParties]
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
 *         name: candidate
 *         schema:
 *           type: string
 *         description: Candidate ID to filter by
 *       - in: query
 *         name: party
 *         schema:
 *           type: string
 *         description: Party ID to filter by
 *       - in: query
 *         name: assembly
 *         schema:
 *           type: string
 *         description: Assembly ID to filter by
 *       - in: query
 *         name: parliament
 *         schema:
 *           type: string
 *         description: Parliament ID to filter by
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State ID to filter by
 *       - in: query
 *         name: division
 *         schema:
 *           type: string
 *         description: Division ID to filter by
 *       - in: query
 *         name: block
 *         schema:
 *           type: string
 *         description: Block ID to filter by
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
 *         name: min_votes
 *         schema:
 *           type: number
 *         description: Minimum votes to filter by
 *       - in: query
 *         name: min_margin
 *         schema:
 *           type: number
 *         description: Minimum margin to filter by
 *     responses:
 *       200:
 *         description: List of winning party records
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
 *                     $ref: '#/components/schemas/WinningParty'
 */
router.get('/', getWinningParties);

/**
 * @swagger
 * /api/winning-parties/graph:
 *   get:
 *     summary: Get winning party data grouped by year and party for graph
 *     tags: [WinningParties]
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by election year (e.g., 2019)
 *     responses:
 *       200:
 *         description: Graph-ready data grouped by year and party
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
 *                 data:
 *                   type: object
 *                   example:
 *                     2019:
 *                       BJP: 40
 *                       INC: 25
 *                     2024:
 *                       BJP: 30
 *                       INC: 30
 */

router.get('/graph', getWinningPartysForGraph);

/**
 * @swagger
 * /api/winning-parties/{id}:
 *   get:
 *     summary: Get single winning party record
 *     tags: [WinningParties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Winning party data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WinningParty'
 *       404:
 *         description: Winning party record not found
 */
router.get('/:id', getWinningParty);

/**
 * @swagger
 * /api/winning-parties:
 *   post:
 *     summary: Create new winning party record
 *     tags: [WinningParties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WinningParty'
 *     responses:
 *       201:
 *         description: Winning party record created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('admin', 'superAdmin'), createWinningParty);

/**
 * @swagger
 * /api/winning-parties/{id}:
 *   put:
 *     summary: Update winning party record
 *     tags: [WinningParties]
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
 *             $ref: '#/components/schemas/WinningParty'
 *     responses:
 *       200:
 *         description: Winning party record updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Winning party record not found
 */
router.put('/:id', protect, authorize('admin', 'superAdmin'), updateWinningParty);

/**
 * @swagger
 * /api/winning-parties/{id}:
 *   delete:
 *     summary: Delete winning party record
 *     tags: [WinningParties]
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
 *         description: Winning party record deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Winning party record not found
 */
router.delete('/:id', protect, authorize('admin', 'superAdmin'), deleteWinningParty);

/**
 * @swagger
 * /api/winning-parties/party/{partyId}:
 *   get:
 *     summary: Get winning party records by party
 *     tags: [WinningParties]
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of winning records for the party
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
 *                     $ref: '#/components/schemas/WinningParty'
 *       404:
 *         description: Party not found
 */
router.get('/party/:partyId', getWinningPartiesByParty);

/**
 * @swagger
 * /api/winning-parties/year/{yearId}:
 *   get:
 *     summary: Get winning party records by election year
 *     tags: [WinningParties]
 *     parameters:
 *       - in: path
 *         name: yearId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of winning records for the election year
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
 *                     $ref: '#/components/schemas/WinningParty'
 *       404:
 *         description: Election year not found
 */
router.get('/year/:yearId', getWinningPartiesByYear);

/**
 * @swagger
 * /api/winning-parties/booth/{boothId}:
 *   get:
 *     summary: Get winning party records by booth
 *     tags: [WinningParties]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of winning records for the booth
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
 *                     $ref: '#/components/schemas/WinningParty'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', getWinningPartiesByBooth);

/**
 * @swagger
 * components:
 *   schemas:
 *     WinningParty:
 *       type: object
 *       required:
 *         - candidate_id
 *         - assembly_id
 *         - state_id
 *         - division_id
 *         - block_id
 *         - booth_id
 *         - party_id
 *         - election_year
 *         - votes
 *         - margin
 *         - created_by
 *       properties:
 *         candidate_id:
 *           type: string
 *           description: Reference to winning Candidate
 *           example: "507f1f77bcf86cd799439011"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly constituency
 *           example: "507f1f77bcf86cd799439012"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament constituency
 *           example: "507f1f77bcf86cd799439013"
 *         state_id:
 *           type: string
 *           description: Reference to State
 *           example: "507f1f77bcf86cd799439014"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439015"
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *           example: "507f1f77bcf86cd799439016"
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439017"
 *         party_id:
 *           type: string
 *           description: Reference to Party
 *           example: "507f1f77bcf86cd799439018"
 *         election_year:
 *           type: string
 *           description: Reference to Election Year
 *           example: "507f1f77bcf86cd799439019"
 *         votes:
 *           type: number
 *           description: Number of votes received
 *           example: 12500
 *         margin:
 *           type: number
 *           description: Victory margin
 *           example: 2500
 *         description:
 *           type: string
 *           description: Candidate description (HTML allowed)
 *           example: "<p>Some description about the candidate.</p>"
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