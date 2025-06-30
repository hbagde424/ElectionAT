const express = require('express');
const {
  getBlockVotes,
  getBlockVote,
  createBlockVote,
  updateBlockVote,
  deleteBlockVote,
  getVotesByBlock,
  getVotesByBooth,
  getVotesByCandidate,
  getAggregatedVotesByCandidate
} = require('../controllers/blockVotesController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Block Votes
 *   description: Block votes management
 */

/**
 * @swagger
 * /api/block-votes:
 *   get:
 *     summary: Get all block votes
 *     tags: [Block Votes]
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
 *     responses:
 *       200:
 *         description: List of block votes
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
 *                     $ref: '#/components/schemas/BlockVotes'
 */
router.get('/', getBlockVotes);

/**
 * @swagger
 * /api/block-votes/{id}:
 *   get:
 *     summary: Get single block vote record
 *     tags: [Block Votes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Block vote data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlockVotes'
 *       404:
 *         description: Block vote record not found
 */
router.get('/:id', getBlockVote);

/**
 * @swagger
 * /api/block-votes:
 *   post:
 *     summary: Create new block vote record
 *     tags: [Block Votes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BlockVotes'
 *     responses:
 *       201:
 *         description: Block vote record created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin'), createBlockVote);

/**
 * @swagger
 * /api/block-votes/{id}:
 *   put:
 *     summary: Update block vote record
 *     tags: [Block Votes]
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
 *             $ref: '#/components/schemas/BlockVotes'
 *     responses:
 *       200:
 *         description: Block vote record updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Block vote record not found
 */
router.put('/:id', protect, authorize('superAdmin'), updateBlockVote);

/**
 * @swagger
 * /api/block-votes/{id}:
 *   delete:
 *     summary: Delete block vote record
 *     tags: [Block Votes]
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
 *         description: Block vote record deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Block vote record not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteBlockVote);

/**
 * @swagger
 * /api/block-votes/block/{blockId}:
 *   get:
 *     summary: Get votes by block
 *     tags: [Block Votes]
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
 *                     $ref: '#/components/schemas/BlockVotes'
 *       404:
 *         description: Block not found
 */
router.get('/block/:blockId', getVotesByBlock);

/**
 * @swagger
 * /api/block-votes/booth/{boothId}:
 *   get:
 *     summary: Get votes by booth
 *     tags: [Block Votes]
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
 *                     $ref: '#/components/schemas/BlockVotes'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', getVotesByBooth);

/**
 * @swagger
 * /api/block-votes/candidate/{candidateId}:
 *   get:
 *     summary: Get votes by candidate
 *     tags: [Block Votes]
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
 *                     $ref: '#/components/schemas/BlockVotes'
 *       404:
 *         description: Candidate not found
 */
router.get('/candidate/:candidateId', getVotesByCandidate);

/**
 * @swagger
 * /api/block-votes/candidate/{candidateId}/aggregated:
 *   get:
 *     summary: Get aggregated votes by block for a candidate
 *     tags: [Block Votes]
 *     parameters:
 *       - in: path
 *         name: candidateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Aggregated vote totals by block for the candidate
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
 *                       block_id:
 *                         type: string
 *                       block_name:
 *                         type: string
 *                       block_code:
 *                         type: string
 *                       total_votes:
 *                         type: number
 *                       booth_count:
 *                         type: number
 *       404:
 *         description: Candidate not found
 */
router.get('/candidate/:candidateId/aggregated', getAggregatedVotesByCandidate);

/**
 * @swagger
 * components:
 *   schemas:
 *     BlockVotes:
 *       type: object
 *       required:
 *         - candidate_id
 *         - block_id
 *         - booth_id
 *         - total_votes
 *         - election_year_id
 *       properties:
 *         candidate_id:
 *           type: string
 *           description: Reference to Candidate
 *           example: "507f1f77bcf86cd799439011"
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *           example: "507f1f77bcf86cd799439012"
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439013"
 *         total_votes:
 *           type: number
 *           description: Total votes received
 *           example: 1500
 *         election_year_id:
 *           type: string
 *           description: Reference to Election Year
 *           example: "507f1f77bcf86cd799439014"
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