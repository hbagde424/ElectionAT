const express = require('express');
const {
  getWinningCandidates,
  getWinningCandidate,
  createWinningCandidate,
  updateWinningCandidate,
  deleteWinningCandidate,
  getWinningCandidatesByAssembly,
  getWinningCandidatesByParliament,
  getWinningCandidatesByYear
} = require('../controllers/winningCandidateController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: WinningCandidates
 *   description: Winning Candidate management
 */

/**
 * @swagger
 * /api/winning-candidates:
 *   get:
 *     summary: Get all winning candidates
 *     tags: [WinningCandidates]
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
 *         name: party
 *         schema:
 *           type: string
 *         description: Winning Party ID to filter by
 *       - in: query
 *         name: candidate
 *         schema:
 *           type: string
 *         description: Candidate ID to filter by
 *     responses:
 *       200:
 *         description: List of winning candidates
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
 *                     $ref: '#/components/schemas/WinningCandidate'
 */
router.get('/', getWinningCandidates);

/**
 * @swagger
 * /api/winning-candidates/{id}:
 *   get:
 *     summary: Get single winning candidate
 *     tags: [WinningCandidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Winning candidate data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WinningCandidate'
 *       404:
 *         description: Winning candidate not found
 */
router.get('/:id', getWinningCandidate);

/**
 * @swagger
 * /api/winning-candidates:
 *   post:
 *     summary: Create new winning candidate
 *     tags: [WinningCandidates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WinningCandidate'
 *     responses:
 *       201:
 *         description: Winning candidate created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin'), createWinningCandidate);

/**
 * @swagger
 * /api/winning-candidates/{id}:
 *   put:
 *     summary: Update winning candidate
 *     tags: [WinningCandidates]
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
 *             $ref: '#/components/schemas/WinningCandidate'
 *     responses:
 *       200:
 *         description: Winning candidate updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Winning candidate not found
 */
router.put('/:id', protect, authorize('superAdmin'), updateWinningCandidate);

/**
 * @swagger
 * /api/winning-candidates/{id}:
 *   delete:
 *     summary: Delete winning candidate
 *     tags: [WinningCandidates]
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
 *         description: Winning candidate deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Winning candidate not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteWinningCandidate);

/**
 * @swagger
 * /api/winning-candidates/assembly/{assemblyId}:
 *   get:
 *     summary: Get winning candidates by assembly
 *     tags: [WinningCandidates]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of winning candidates for the assembly
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
 *                     $ref: '#/components/schemas/WinningCandidate'
 *       404:
 *         description: Assembly not found
 */
router.get('/assembly/:assemblyId', getWinningCandidatesByAssembly);

/**
 * @swagger
 * /api/winning-candidates/parliament/{parliamentId}:
 *   get:
 *     summary: Get winning candidates by parliament
 *     tags: [WinningCandidates]
 *     parameters:
 *       - in: path
 *         name: parliamentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of winning candidates for the parliament
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
 *                     $ref: '#/components/schemas/WinningCandidate'
 *       404:
 *         description: Parliament not found
 */
router.get('/parliament/:parliamentId', getWinningCandidatesByParliament);

/**
 * @swagger
 * /api/winning-candidates/year/{yearId}:
 *   get:
 *     summary: Get winning candidates by election year
 *     tags: [WinningCandidates]
 *     parameters:
 *       - in: path
 *         name: yearId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of winning candidates for the election year
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
 *                     $ref: '#/components/schemas/WinningCandidate'
 *       404:
 *         description: Election year not found
 */
router.get('/year/:yearId', getWinningCandidatesByYear);

/**
 * @swagger
 * components:
 *   schemas:
 *     WinningCandidate:
 *       type: object
 *       required:
 *         - state_id
 *         - division_id
 *         - parliament_id
 *         - assembly_id
 *         - winning_party_id
 *         - candidate_id
 *         - total_electors
 *         - total_votes
 *         - voting_percentage
 *         - margin
 *         - margin_percentage
 *         - created_by
 *       properties:
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
 *         winning_party_id:
 *           type: string
 *           description: Reference to Winning Party
 *           example: "507f1f77bcf86cd799439018"
 *         candidate_id:
 *           type: string
 *           description: Reference to Candidate
 *           example: "507f1f77bcf86cd799439019"
 *         total_electors:
 *           type: number
 *           description: Total number of electors
 *           example: 15000
 *         total_votes:
 *           type: number
 *           description: Total votes received
 *           example: 10000
 *         voting_percentage:
 *           type: number
 *           description: Voting percentage
 *           example: 66.67
 *         margin:
 *           type: number
 *           description: Victory margin in votes
 *           example: 2500
 *         margin_percentage:
 *           type: number
 *           description: Victory margin percentage
 *           example: 16.67
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
 */

module.exports = router;