const express = require('express');
const {
  getAssemblyVotes,
  getAssemblyVote,
  createAssemblyVote,
  updateAssemblyVote,
  deleteAssemblyVote,
  getVotesByAssembly,
  getVotesByCandidate,
  getVotesByState,
  getVotesByElectionYear
} = require('../controllers/assemblyVotesController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Assembly Votes
 *   description: Assembly vote management
 */

/**
 * @swagger
 * /api/assembly-votes:
 *   get:
 *     summary: Get all assembly votes
 *     tags: [Assembly Votes]
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
 *         name: assembly
 *         schema:
 *           type: string
 *         description: Assembly ID to filter by
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State ID to filter by
 *       - in: query
 *         name: parliament
 *         schema:
 *           type: string
 *         description: Parliament ID to filter by
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
 *         description: List of assembly votes
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
 *                     $ref: '#/components/schemas/AssemblyVotes'
 */
router.get('/', getAssemblyVotes);

/**
 * @swagger
 * /api/assembly-votes/{id}:
 *   get:
 *     summary: Get single assembly vote record
 *     tags: [Assembly Votes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assembly vote data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssemblyVotes'
 *       404:
 *         description: Vote record not found
 */
router.get('/:id', getAssemblyVote);

/**
 * @swagger
 * /api/assembly-votes:
 *   post:
 *     summary: Create new assembly vote record
 *     tags: [Assembly Votes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssemblyVotes'
 *     responses:
 *       201:
 *         description: Vote record created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin'), createAssemblyVote);

/**
 * @swagger
 * /api/assembly-votes/{id}:
 *   put:
 *     summary: Update assembly vote record
 *     tags: [Assembly Votes]
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
 *             $ref: '#/components/schemas/AssemblyVotes'
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
router.put('/:id', protect, authorize('superAdmin'), updateAssemblyVote);

/**
 * @swagger
 * /api/assembly-votes/{id}:
 *   delete:
 *     summary: Delete assembly vote record
 *     tags: [Assembly Votes]
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
router.delete('/:id', protect, authorize('superAdmin'), deleteAssemblyVote);

/**
 * @swagger
 * /api/assembly-votes/assembly/{assemblyId}:
 *   get:
 *     summary: Get votes by assembly
 *     tags: [Assembly Votes]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of votes for the assembly
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
 *                     $ref: '#/components/schemas/AssemblyVotes'
 *       404:
 *         description: Assembly not found
 */
router.get('/assembly/:assemblyId', getVotesByAssembly);

/**
 * @swagger
 * /api/assembly-votes/candidate/{candidateId}:
 *   get:
 *     summary: Get votes by candidate
 *     tags: [Assembly Votes]
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
 *                     $ref: '#/components/schemas/AssemblyVotes'
 *       404:
 *         description: Candidate not found
 */
router.get('/candidate/:candidateId', getVotesByCandidate);

/**
 * @swagger
 * /api/assembly-votes/state/{stateId}:
 *   get:
 *     summary: Get votes by state
 *     tags: [Assembly Votes]
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
 *                     $ref: '#/components/schemas/AssemblyVotes'
 *       404:
 *         description: State not found
 */
router.get('/state/:stateId', getVotesByState);

/**
 * @swagger
 * /api/assembly-votes/year/{yearId}:
 *   get:
 *     summary: Get votes by election year
 *     tags: [Assembly Votes]
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
 *                     $ref: '#/components/schemas/AssemblyVotes'
 *       404:
 *         description: Election year not found
 */
router.get('/year/:yearId', getVotesByElectionYear);

/**
 * @swagger
 * components:
 *   schemas:
 *     AssemblyVotes:
 *       type: object
 *       required:
 *         - candidate_id
 *         - assembly_id
 *         - state_id
 *         - parliament_id
 *         - division_id
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
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *           example: "507f1f77bcf86cd799439012"
 *         state_id:
 *           type: string
 *           description: Reference to State
 *           example: "507f1f77bcf86cd799439016"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *           example: "507f1f77bcf86cd799439013"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439015"
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