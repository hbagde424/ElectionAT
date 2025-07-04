const express = require('express');
const {
  getParliamentVotes,
  getParliamentVote,
  createParliamentVote,
  updateParliamentVote,
  deleteParliamentVote,
  getVotesByParliament,
  getVotesByCandidate,
  getVotesByState,
  getVotesByElectionYear
} = require('../controllers/parliamentVotesController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Parliament Votes
 *   description: Parliament vote management
 */

/**
 * @swagger
 * /api/parliament-votes:
 *   get:
 *     summary: Get all parliament votes
 *     tags: [Parliament Votes]
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
 *         description: List of parliament votes
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
 *                     $ref: '#/components/schemas/ParliamentVotes'
 */
router.get('/', getParliamentVotes);

/**
 * @swagger
 * /api/parliament-votes/{id}:
 *   get:
 *     summary: Get single parliament vote record
 *     tags: [Parliament Votes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Parliament vote data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ParliamentVotes'
 *       404:
 *         description: Vote record not found
 */
router.get('/:id', getParliamentVote);

/**
 * @swagger
 * /api/parliament-votes:
 *   post:
 *     summary: Create new parliament vote record
 *     tags: [Parliament Votes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParliamentVotes'
 *     responses:
 *       201:
 *         description: Vote record created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin'), createParliamentVote);

/**
 * @swagger
 * /api/parliament-votes/{id}:
 *   put:
 *     summary: Update parliament vote record
 *     tags: [Parliament Votes]
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
 *             $ref: '#/components/schemas/ParliamentVotes'
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
router.put('/:id', protect, authorize('superAdmin'), updateParliamentVote);

/**
 * @swagger
 * /api/parliament-votes/{id}:
 *   delete:
 *     summary: Delete parliament vote record
 *     tags: [Parliament Votes]
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
router.delete('/:id', protect, authorize('superAdmin'), deleteParliamentVote);

/**
 * @swagger
 * /api/parliament-votes/parliament/{parliamentId}:
 *   get:
 *     summary: Get votes by parliament
 *     tags: [Parliament Votes]
 *     parameters:
 *       - in: path
 *         name: parliamentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of votes for the parliament
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
 *                     $ref: '#/components/schemas/ParliamentVotes'
 *       404:
 *         description: Parliament not found
 */
router.get('/parliament/:parliamentId', getVotesByParliament);

/**
 * @swagger
 * /api/parliament-votes/candidate/{candidateId}:
 *   get:
 *     summary: Get votes by candidate
 *     tags: [Parliament Votes]
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
 *                     $ref: '#/components/schemas/ParliamentVotes'
 *       404:
 *         description: Candidate not found
 */
router.get('/candidate/:candidateId', getVotesByCandidate);

/**
 * @swagger
 * /api/parliament-votes/state/{stateId}:
 *   get:
 *     summary: Get votes by state
 *     tags: [Parliament Votes]
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
 *                     $ref: '#/components/schemas/ParliamentVotes'
 *       404:
 *         description: State not found
 */
router.get('/state/:stateId', getVotesByState);

/**
 * @swagger
 * /api/parliament-votes/year/{yearId}:
 *   get:
 *     summary: Get votes by election year
 *     tags: [Parliament Votes]
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
 *                     $ref: '#/components/schemas/ParliamentVotes'
 *       404:
 *         description: Election year not found
 */
router.get('/year/:yearId', getVotesByElectionYear);

/**
 * @swagger
 * components:
 *   schemas:
 *     ParliamentVotes:
 *       type: object
 *       required:
 *         - candidate_id
 *         - parliament_id
 *         - state_id
 *         - division_id
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
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *           example: "507f1f77bcf86cd799439012"
 *         state_id:
 *           type: string
 *           description: Reference to State
 *           example: "507f1f77bcf86cd799439016"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439015"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *           example: "507f1f77bcf86cd799439013"
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