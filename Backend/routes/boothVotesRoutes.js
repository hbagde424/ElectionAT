const express = require('express');
const {
  getBoothVotes,
  getBoothVote,
  createBoothVote,
  updateBoothVote,
  deleteBoothVote,
  getVotesByBooth,
  getVotesByCandidate,
  getVotesByState,
  getVotesByElectionYear
} = require('../controllers/boothVotesController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Booth Votes
 *   description: Booth vote management
 */

/**
 * @swagger
 * /api/booth-votes:
 *   get:
 *     summary: Get all booth votes
 *     tags: [Booth Votes]
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
 *         name: parliament
 *         schema:
 *           type: string
 *         description: Parliament ID to filter by
 *       - in: query
 *         name: assembly
 *         schema:
 *           type: string
 *         description: Assembly ID to filter by
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
 *         name: year
 *         schema:
 *           type: string
 *         description: Election year ID to filter by
 *       - in: query
 *         name: minVotes
 *         schema:
 *           type: integer
 *         description: Minimum votes threshold
 *       - in: query
 *         name: maxVotes
 *         schema:
 *           type: integer
 *         description: Maximum votes threshold
 *     responses:
 *       200:
 *         description: List of booth votes
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
 *                     $ref: '#/components/schemas/BoothVotes'
 */
router.get('/', getBoothVotes);

/**
 * @swagger
 * /api/booth-votes/{id}:
 *   get:
 *     summary: Get single booth vote record
 *     tags: [Booth Votes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booth vote data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoothVotes'
 *       404:
 *         description: Vote record not found
 */
router.get('/:id', getBoothVote);

/**
 * @swagger
 * /api/booth-votes:
 *   post:
 *     summary: Create new booth vote record
 *     tags: [Booth Votes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BoothVotes'
 *     responses:
 *       201:
 *         description: Vote record created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('admin'), createBoothVote);

/**
 * @swagger
 * /api/booth-votes/{id}:
 *   put:
 *     summary: Update booth vote record
 *     tags: [Booth Votes]
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
 *             $ref: '#/components/schemas/BoothVotes'
 *     responses:
 *       200:
 *         description: Vote record updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Vote record not found
 */
router.put('/:id', protect, authorize('admin'), updateBoothVote);

/**
 * @swagger
 * /api/booth-votes/{id}:
 *   delete:
 *     summary: Delete booth vote record
 *     tags: [Booth Votes]
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
 *         description: Vote record deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Vote record not found
 */
router.delete('/:id', protect, authorize('admin'), deleteBoothVote);

/**
 * @swagger
 * /api/booth-votes/booth/{boothId}:
 *   get:
 *     summary: Get votes by booth
 *     tags: [Booth Votes]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of votes for the booth
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
 *                     $ref: '#/components/schemas/BoothVotes'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', getVotesByBooth);

/**
 * @swagger
 * /api/booth-votes/candidate/{candidateId}:
 *   get:
 *     summary: Get votes by candidate
 *     tags: [Booth Votes]
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of votes for the candidate
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
 *                     $ref: '#/components/schemas/BoothVotes'
 *       404:
 *         description: Candidate not found
 */
router.get('/candidate/:candidateId', getVotesByCandidate);

/**
 * @swagger
 * /api/booth-votes/state/{stateId}:
 *   get:
 *     summary: Get votes by state
 *     tags: [Booth Votes]
 *     parameters:
 *       - in: path
 *         name: stateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of votes in the state
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
 *                     $ref: '#/components/schemas/BoothVotes'
 *       404:
 *         description: State not found
 */
router.get('/state/:stateId', getVotesByState);

/**
 * @swagger
 * /api/booth-votes/year/{yearId}:
 *   get:
 *     summary: Get votes by election year
 *     tags: [Booth Votes]
 *     parameters:
 *       - in: path
 *         name: yearId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of votes for the election year
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
 *                     $ref: '#/components/schemas/BoothVotes'
 *       404:
 *         description: Election year not found
 */
router.get('/year/:yearId', getVotesByElectionYear);

/**
 * @swagger
 * components:
 *   schemas:
 *     BoothVotes:
 *       type: object
 *       required:
 *         - candidate_id
 *         - state_id
 *         - division_id
 *         - parliament_id
 *         - assembly_id
 *         - block_id
 *         - booth_id
 *         - total_votes
 *         - election_year_id
 *         - created_by
 *       properties:
 *         candidate_id:
 *           type: string
 *           description: Reference to Candidate
 *           example: "507f1f77bcf86cd799439011"
 *         state_id:
 *           type: string
 *           description: Reference to State
 *           example: "507f1f77bcf86cd799439016"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439015"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *           example: "507f1f77bcf86cd799439013"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *           example: "507f1f77bcf86cd799439012"
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *           example: "507f1f77bcf86cd799439011"
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439010"
 *         total_votes:
 *           type: integer
 *           description: Total votes received
 *           example: 1250
 *         election_year_id:
 *           type: string
 *           description: Reference to Election Year
 *           example: "507f1f77bcf86cd799439020"
 *         created_by:
 *           type: string
 *           description: Reference to User who created the record
 *           example: "507f1f77bcf86cd799439022"
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated the record
 *           example: "507f1f77bcf86cd799439023"
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