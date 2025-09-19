const express = require('express');
const {
  getParliamentCandidates,
  getParliamentCandidate,
  createParliamentCandidate,
  updateParliamentCandidate,
  deleteParliamentCandidate,
  getParliamentCandidateStats
} = require('../controllers/parliamentCandidateController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Parliament Candidates
 *   description: Parliament Candidate management
 */

/**
 * @swagger
 * /api/parliament-candidates:
 *   get:
 *     summary: Get all Parliament Candidates
 *     tags: [Parliament Candidates]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for position result
 *       - in: query
 *         name: parliament_id
 *         schema:
 *           type: string
 *         description: Filter by parliament ID
 *       - in: query
 *         name: election_year_id
 *         schema:
 *           type: string
 *         description: Filter by election year ID
 *       - in: query
 *         name: party_id
 *         schema:
 *           type: string
 *         description: Filter by party ID
 *       - in: query
 *         name: position_result
 *         schema:
 *           type: string
 *           enum: [win, loss]
 *         description: Filter by result
 *       - in: query
 *         name: all
 *         schema:
 *           type: string
 *           enum: [true]
 *         description: Get all candidates (for CSV export)
 *     responses:
 *       200:
 *         description: List of Parliament Candidates
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
 *                     $ref: '#/components/schemas/ParliamentCandidate'
 */
router.get('/', getParliamentCandidates);

/**
 * @swagger
 * /api/parliament-candidates/stats/overview:
 *   get:
 *     summary: Get Parliament Candidate statistics
 *     tags: [Parliament Candidates]
 *     responses:
 *       200:
 *         description: Parliament Candidate statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCandidates:
 *                       type: integer
 *                     winningCandidates:
 *                       type: integer
 *                     losingCandidates:
 *                       type: integer
 *                     resultsByParty:
 *                       type: array
 */
router.get('/stats/overview', getParliamentCandidateStats);

/**
 * @swagger
 * /api/parliament-candidates/{id}:
 *   get:
 *     summary: Get single Parliament Candidate
 *     tags: [Parliament Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Parliament Candidate data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ParliamentCandidate'
 *       404:
 *         description: Parliament Candidate not found
 */
router.get('/:id', getParliamentCandidate);

/**
 * @swagger
 * /api/parliament-candidates:
 *   post:
 *     summary: Create new Parliament Candidate
 *     tags: [Parliament Candidates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParliamentCandidateInput'
 *     responses:
 *       201:
 *         description: Parliament Candidate created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin', 'admin'), createParliamentCandidate);

/**
 * @swagger
 * /api/parliament-candidates/{id}:
 *   put:
 *     summary: Update Parliament Candidate
 *     tags: [Parliament Candidates]
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
 *             $ref: '#/components/schemas/ParliamentCandidateInput'
 *     responses:
 *       200:
 *         description: Parliament Candidate updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Parliament Candidate not found
 */
router.put('/:id', protect, authorize('superAdmin', 'admin'), updateParliamentCandidate);

/**
 * @swagger
 * /api/parliament-candidates/{id}:
 *   delete:
 *     summary: Delete Parliament Candidate
 *     tags: [Parliament Candidates]
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
 *         description: Parliament Candidate deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Parliament Candidate not found
 */
router.delete('/:id', protect, authorize('superAdmin', 'admin'), deleteParliamentCandidate);

/**
 * @swagger
 * components:
 *   schemas:
 *     ParliamentCandidate:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier
 *         candidate_id:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *         parliament_id:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *         election_year_id:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             year:
 *               type: number
 *         party_id:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *         position_result:
 *           type: string
 *           enum: [win, loss]
 *         total_votes_parliament:
 *           type: number
 *         candidate_votes:
 *           type: number
 *         margin:
 *           type: number
 *         margin_percentage:
 *           type: number
 *           description: Margin as decimal fraction (e.g., 0.03 = 3%)
 *         vote_percentage:
 *           type: string
 *           description: Calculated vote percentage
 *         created_by:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             username:
 *               type: string
 *         updated_by:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             username:
 *               type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     ParliamentCandidateInput:
 *       type: object
 *       required:
 *         - candidate_id
 *         - parliament_id
 *         - election_year_id
 *         - party_id
 *         - position_result
 *         - total_votes_parliament
 *         - candidate_votes
 *       properties:
 *         candidate_id:
 *           type: string
 *           description: Reference to Candidate
 *           example: "507f1f77bcf86cd799439011"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *           example: "507f1f77bcf86cd799439012"
 *         election_year_id:
 *           type: string
 *           description: Reference to Election Year
 *           example: "507f1f77bcf86cd799439013"
 *         party_id:
 *           type: string
 *           description: Reference to Party
 *           example: "507f1f77bcf86cd799439014"
 *         position_result:
 *           type: string
 *           enum: [win, loss]
 *           description: Election result
 *           example: "win"
 *         total_votes_parliament:
 *           type: number
 *           description: Total votes in parliament constituency
 *           example: 150000
 *         candidate_votes:
 *           type: number
 *           description: Votes received by candidate
 *           example: 85000
 *         margin:
 *           type: number
 *           description: Victory/defeat margin
 *           example: 20000
 *         margin_percentage:
 *           type: number
 *           description: Margin as decimal fraction (e.g., 0.03 = 3%)
 *           example: 0.03
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;