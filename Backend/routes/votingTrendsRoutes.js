const express = require('express');
const {
  getVotingTrends,
  getVotingTrendById,
  createVotingTrend,
  updateVotingTrend,
  deleteVotingTrend,
  getTrendsByBooth,
  getTrendsByAssembly,
  getTrendsByParliament,
  getTrendsByBlock,
  getTrendsByDivision,
  getTrendsByParty,
  getTrendsByYear
} = require('../controllers/votingTrendsController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Voting Trends
 *   description: Voting trends and historical data management
 */

/**
 * @swagger
 * /api/voting-trends:
 *   get:
 *     summary: Get all voting trends
 *     tags: [Voting Trends]
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
 *         name: assembly
 *         schema:
 *           type: string
 *         description: Filter by assembly constituency ID
 *       - in: query
 *         name: parliament
 *         schema:
 *           type: string
 *         description: Filter by parliamentary constituency ID
 *       - in: query
 *         name: block
 *         schema:
 *           type: string
 *         description: Filter by block ID
 *       - in: query
 *         name: division
 *         schema:
 *           type: string
 *         description: Filter by division ID
 *       - in: query
 *         name: party
 *         schema:
 *           type: string
 *         description: Filter by leading party ID
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by election year
 *       - in: query
 *         name: minTurnout
 *         schema:
 *           type: number
 *         description: Minimum turnout percentage
 *       - in: query
 *         name: maxTurnout
 *         schema:
 *           type: number
 *         description: Maximum turnout percentage
 *     responses:
 *       200:
 *         description: List of voting trends with geographic hierarchy
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
 *                     $ref: '#/components/schemas/VotingTrend'
 */
router.get('/', getVotingTrends);

/**
 * @swagger
 * /api/voting-trends/{id}:
 *   get:
 *     summary: Get single voting trend record
 *     tags: [Voting Trends]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Voting trend data with geographic references
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VotingTrend'
 *       404:
 *         description: Voting trend not found
 */
router.get('/:id', getVotingTrendById);

/**
 * @swagger
 * /api/voting-trends:
 *   post:
 *     summary: Create new voting trend record
 *     tags: [Voting Trends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VotingTrend'
 *     responses:
 *       201:
 *         description: Voting trend created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('admin', 'editor'), createVotingTrend);

/**
 * @swagger
 * /api/voting-trends/{id}:
 *   put:
 *     summary: Update voting trend record
 *     tags: [Voting Trends]
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
 *             $ref: '#/components/schemas/VotingTrend'
 *     responses:
 *       200:
 *         description: Voting trend updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Voting trend not found
 */
router.put('/:id', protect, authorize('admin', 'editor'), updateVotingTrend);

/**
 * @swagger
 * /api/voting-trends/{id}:
 *   delete:
 *     summary: Delete voting trend record
 *     tags: [Voting Trends]
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
 *         description: Voting trend deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Voting trend not found
 */
router.delete('/:id', protect, authorize('admin'), deleteVotingTrend);

/**
 * @swagger
 * /api/voting-trends/booth/{boothId}:
 *   get:
 *     summary: Get voting trends by booth ID
 *     tags: [Voting Trends]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of voting trends for the booth
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
 *                     $ref: '#/components/schemas/VotingTrend'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', getTrendsByBooth);

/**
 * @swagger
 * /api/voting-trends/assembly/{assemblyId}:
 *   get:
 *     summary: Get voting trends by assembly constituency ID
 *     tags: [Voting Trends]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of voting trends for the assembly constituency
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
 *                     $ref: '#/components/schemas/VotingTrend'
 *       404:
 *         description: Assembly constituency not found
 */
router.get('/assembly/:assemblyId', getTrendsByAssembly);

/**
 * @swagger
 * /api/voting-trends/parliament/{parliamentId}:
 *   get:
 *     summary: Get voting trends by parliamentary constituency ID
 *     tags: [Voting Trends]
 *     parameters:
 *       - in: path
 *         name: parliamentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of voting trends for the parliamentary constituency
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
 *                     $ref: '#/components/schemas/VotingTrend'
 *       404:
 *         description: Parliamentary constituency not found
 */
router.get('/parliament/:parliamentId', getTrendsByParliament);

/**
 * @swagger
 * /api/voting-trends/block/{blockId}:
 *   get:
 *     summary: Get voting trends by block ID
 *     tags: [Voting Trends]
 *     parameters:
 *       - in: path
 *         name: blockId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of voting trends for the block
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
 *                     $ref: '#/components/schemas/VotingTrend'
 *       404:
 *         description: Block not found
 */
router.get('/block/:blockId', getTrendsByBlock);

/**
 * @swagger
 * /api/voting-trends/division/{divisionId}:
 *   get:
 *     summary: Get voting trends by division ID
 *     tags: [Voting Trends]
 *     parameters:
 *       - in: path
 *         name: divisionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of voting trends for the division
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
 *                     $ref: '#/components/schemas/VotingTrend'
 *       404:
 *         description: Division not found
 */
router.get('/division/:divisionId', getTrendsByDivision);

/**
 * @swagger
 * /api/voting-trends/party/{partyId}:
 *   get:
 *     summary: Get voting trends by party ID
 *     tags: [Voting Trends]
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of voting trends where the party was leading
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
 *                     $ref: '#/components/schemas/VotingTrend'
 *       404:
 *         description: Party not found
 */
router.get('/party/:partyId', getTrendsByParty);

/**
 * @swagger
 * /api/voting-trends/year/{year}:
 *   get:
 *     summary: Get voting trends by election year
 *     tags: [Voting Trends]
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of voting trends for the election year
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
 *                     $ref: '#/components/schemas/VotingTrend'
 */
router.get('/year/:year', getTrendsByYear);

/**
 * @swagger
 * components:
 *   schemas:
 *     VotingTrend:
 *       type: object
 *       required:
 *         - booth_id
 *         - assembly_id
 *         - parliament_id
 *         - block_id
 *         - division_id
 *         - election_year
 *       properties:
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439011"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly Constituency
 *           example: "507f1f77bcf86cd799439012"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliamentary Constituency
 *           example: "507f1f77bcf86cd799439013"
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *           example: "507f1f77bcf86cd799439014"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439015"
 *         election_year:
 *           type: integer
 *           description: Election year
 *           example: 2023
 *         turnout_percent:
 *           type: number
 *           description: Voter turnout percentage
 *           example: 65.5
 *         leading_party_id:
 *           type: string
 *           description: Reference to Party that won/led in this booth
 *           example: "507f1f77bcf86cd799439016"
 *         victory_margin:
 *           type: number
 *           description: Victory margin in votes
 *           example: 1250
 *         party_vote_shares:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               party_id:
 *                 type: string
 *                 description: Reference to Party
 *               vote_share:
 *                 type: number
 *                 description: Percentage of votes received by the party
 *           description: Vote shares by party
 *           example: [{"party_id": "507f1f77bcf86cd799439016", "vote_share": 42.5}]
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