const express = require('express');
const {
  getAssemblyVotes,
  getAssemblyVote,
  createAssemblyVote,
  updateAssemblyVote,
  deleteAssemblyVote,
  getVotesByAssembly,
  getVotesByBlock,
  getVotesByBooth,
  getVotesByCandidate,
  getAggregatedVotesByCandidate,
  getElectionResultsByAssembly
} = require('../controllers/assemblyVotesController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Assembly Votes
 *   description: Assembly constituency votes management
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
 *         description: Assembly vote record not found
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
 *         description: Assembly vote record created successfully
 *       400:
 *         description: Invalid input data or duplicate record
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
 *         description: Assembly vote record updated successfully
 *       400:
 *         description: Invalid input data or duplicate record
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Assembly vote record not found
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
 *         description: Assembly vote record deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Assembly vote record not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteAssemblyVote);

/**
 * @swagger
 * /api/assembly-votes/assembly/{assemblyId}:
 *   get:
 *     summary: Get votes by assembly constituency
 *     tags: [Assembly Votes]
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
 *                     $ref: '#/components/schemas/AssemblyVotes'
 *       404:
 *         description: Assembly constituency not found
 */
router.get('/assembly/:assemblyId', getVotesByAssembly);

/**
 * @swagger
 * /api/assembly-votes/block/{blockId}:
 *   get:
 *     summary: Get votes by block
 *     tags: [Assembly Votes]
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
 *                     $ref: '#/components/schemas/AssemblyVotes'
 *       404:
 *         description: Block not found
 */
router.get('/block/:blockId', getVotesByBlock);

/**
 * @swagger
 * /api/assembly-votes/booth/{boothId}:
 *   get:
 *     summary: Get votes by booth
 *     tags: [Assembly Votes]
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
 *                     $ref: '#/components/schemas/AssemblyVotes'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', getVotesByBooth);

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
 * /api/assembly-votes/candidate/{candidateId}/aggregated:
 *   get:
 *     summary: Get aggregated votes by assembly for a candidate
 *     tags: [Assembly Votes]
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Aggregated vote totals by assembly for the candidate
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
 *                       assembly_id:
 *                         type: string
 *                       assembly_name:
 *                         type: string
 *                       assembly_code:
 *                         type: string
 *                       total_votes:
 *                         type: number
 *                       block_count:
 *                         type: number
 *       404:
 *         description: Candidate not found
 */
router.get('/candidate/:candidateId/aggregated', getAggregatedVotesByCandidate);

/**
 * @swagger
 * /api/assembly-votes/results/assembly/{assemblyId}/year/{yearId}:
 *   get:
 *     summary: Get election results by assembly constituency
 *     tags: [Assembly Votes]
 *     parameters:
 *       - in: path
 *         name: assemblyId
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
 *         description: Election results for the assembly constituency
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
 *         description: Assembly constituency or election year not found
 */
router.get('/results/assembly/:assemblyId/year/:yearId', getElectionResultsByAssembly);

/**
 * @swagger
 * components:
 *   schemas:
 *     AssemblyVotes:
 *       type: object
 *       required:
 *         - candidate_id
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
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly Constituency
 *           example: "507f1f77bcf86cd799439012"
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *           example: "507f1f77bcf86cd799439013"
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439014"
 *         total_votes:
 *           type: number
 *           description: Total votes received
 *           example: 1500
 *         election_year_id:
 *           type: string
 *           description: Reference to Election Year
 *           example: "507f1f77bcf86cd799439015"
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