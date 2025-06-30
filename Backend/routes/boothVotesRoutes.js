const express = require('express');
const {
  getBoothVotes,
  getBoothVote,
  createBoothVote,
  updateBoothVote,
  deleteBoothVote,
  getVotesByBooth,
  getVotesByCandidate
} = require('../controllers/boothVotesController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Booth Votes
 *   description: Booth votes management
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
 *         description: Booth vote record not found
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
 *         description: Booth vote record created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin'), createBoothVote);

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
 *         description: Booth vote record updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Booth vote record not found
 */
router.put('/:id', protect, authorize('superAdmin'), updateBoothVote);

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
 *         description: Booth vote record deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Booth vote record not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteBoothVote);

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
 * components:
 *   schemas:
 *     BoothVotes:
 *       type: object
 *       required:
 *         - candidate_id
 *         - booth_id
 *         - total_votes
 *         - election_year_id
 *       properties:
 *         candidate_id:
 *           type: string
 *           description: Reference to Candidate
 *           example: "507f1f77bcf86cd799439011"
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439012"
 *         total_votes:
 *           type: number
 *           description: Total votes received
 *           example: 1500
 *         election_year_id:
 *           type: string
 *           description: Reference to Election Year
 *           example: "507f1f77bcf86cd799439013"
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