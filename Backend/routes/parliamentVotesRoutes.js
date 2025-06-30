const express = require('express');
const {
  getParliamentVotes,
  getParliamentVote,
  createParliamentVote,
  updateParliamentVote,
  deleteParliamentVote,
  getVotesByParliament,
  getVotesByAssembly,
  getVotesByBlock,
  getVotesByBooth,
  getVotesByCandidate,
  getAggregatedVotesByCandidate,
  getElectionResultsByParliament
} = require('../controllers/parliamentVotesController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Parliament Votes
 *   description: Parliament constituency votes management
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
 *         name: candidate
 *         schema:
 *           type: string
 *         description: Candidate ID to filter by
 *       - in: query
 *         name: election_year
 *         schema:
 *           type: string
 *         description: Election year ID to filter by
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort by field (prefix with - for descending)
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Comma separated list of fields to return
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
 *         description: Parliament vote record not found
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
 *         description: Parliament vote record created successfully
 *       400:
 *         description: Invalid input data or duplicate record
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
 *         description: Parliament vote record updated successfully
 *       400:
 *         description: Invalid input data or duplicate record
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Parliament vote record not found
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
 *         description: Parliament vote record deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Parliament vote record not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteParliamentVote);

/**
 * @swagger
 * /api/parliament-votes/parliament/{parliamentId}:
 *   get:
 *     summary: Get votes by parliament constituency
 *     tags: [Parliament Votes]
 *     parameters:
 *       - in: path
 *         name: parliamentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of votes for the parliament constituency
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
 *         description: Parliament constituency not found
 */
router.get('/parliament/:parliamentId', getVotesByParliament);

/**
 * @swagger
 * /api/parliament-votes/assembly/{assemblyId}:
 *   get:
 *     summary: Get votes by assembly constituency
 *     tags: [Parliament Votes]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of votes for the assembly constituency
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
 *         description: Assembly constituency not found
 */
router.get('/assembly/:assemblyId', getVotesByAssembly);

/**
 * @swagger
 * /api/parliament-votes/block/{blockId}:
 *   get:
 *     summary: Get votes by block
 *     tags: [Parliament Votes]
 *     parameters:
 *       - in: path
 *         name: blockId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of votes for the block
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
 *         description: Block not found
 */
router.get('/block/:blockId', getVotesByBlock);

/**
 * @swagger
 * /api/parliament-votes/booth/{boothId}:
 *   get:
 *     summary: Get votes by booth
 *     tags: [Parliament Votes]
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
 *                     $ref: '#/components/schemas/ParliamentVotes'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', getVotesByBooth);

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
 * /api/parliament-votes/candidate/{candidateId}/aggregated:
 *   get:
 *     summary: Get aggregated votes by parliament for a candidate
 *     tags: [Parliament Votes]
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Aggregated vote totals by parliament for the candidate
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
 *                     type: object
 *                     properties:
 *                       parliament_id:
 *                         type: string
 *                       parliament_name:
 *                         type: string
 *                       parliament_code:
 *                         type: string
 *                       total_votes:
 *                         type: number
 *                       assembly_count:
 *                         type: number
 *       404:
 *         description: Candidate not found
 */
router.get('/candidate/:candidateId/aggregated', getAggregatedVotesByCandidate);

/**
 * @swagger
 * /api/parliament-votes/results/parliament/{parliamentId}/year/{yearId}:
 *   get:
 *     summary: Get election results by parliament constituency
 *     tags: [Parliament Votes]
 *     parameters:
 *       - in: path
 *         name: parliamentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: yearId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Election results for the parliament constituency
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 total_votes:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       candidate_id:
 *                         type: string
 *                       candidate_name:
 *                         type: string
 *                       candidate_party:
 *                         type: string
 *                       total_votes:
 *                         type: number
 *                       booth_count:
 *                         type: number
 *                       vote_percentage:
 *                         type: number
 *       404:
 *         description: Parliament constituency or election year not found
 */
router.get('/results/parliament/:parliamentId/year/:yearId', getElectionResultsByParliament);

/**
 * @swagger
 * components:
 *   schemas:
 *     ParliamentVotes:
 *       type: object
 *       required:
 *         - candidate_id
 *         - parliament_id
 *         - assembly_id
 *         - block_id
 *         - booth_id
 *         - total_votes
 *         - election_year_id
 *       properties:
 *         candidate_id:
 *           type: string
 *           description: Reference to Candidate
 *           example: "507f1f77bcf86cd799439011"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament Constituency
 *           example: "507f1f77bcf86cd799439012"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly Constituency
 *           example: "507f1f77bcf86cd799439013"
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *           example: "507f1f77bcf86cd799439014"
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439015"
 *         total_votes:
 *           type: number
 *           description: Total votes received
 *           example: 1500
 *         election_year_id:
 *           type: string
 *           description: Reference to Election Year
 *           example: "507f1f77bcf86cd799439016"
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