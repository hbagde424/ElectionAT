const express = require('express');
const {
  getVoterTurnouts,
  getVoterTurnout,
  createVoterTurnout,
  updateVoterTurnout,
  deleteVoterTurnout,
  getVoterTurnoutsByState,
  getVoterTurnoutsByYear
} = require('../controllers/voterTurnoutController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Voter Turnout
 *   description: Voter turnout statistics management
 */

/**
 * @swagger
 * /api/voter-turnout:
 *   get:
 *     summary: Get all voter turnout records
 *     tags: [Voter Turnout]
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
 *         name: state
 *         schema:
 *           type: string
 *         description: State ID to filter by
 *       - in: query
 *         name: year
 *         schema:
 *           type: string
 *         description: Year ID to filter by
 *     responses:
 *       200:
 *         description: List of voter turnout records
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
 *                     $ref: '#/components/schemas/VoterTurnout'
 */
router.get('/', getVoterTurnouts);

/**
 * @swagger
 * /api/voter-turnout/{id}:
 *   get:
 *     summary: Get single voter turnout record
 *     tags: [Voter Turnout]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Voter turnout data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VoterTurnout'
 *       404:
 *         description: Voter turnout record not found
 */
router.get('/:id', getVoterTurnout);

/**
 * @swagger
 * /api/voter-turnout:
 *   post:
 *     summary: Create new voter turnout record
 *     tags: [Voter Turnout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VoterTurnout'
 *     responses:
 *       201:
 *         description: Voter turnout record created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin'), createVoterTurnout);

/**
 * @swagger
 * /api/voter-turnout/{id}:
 *   put:
 *     summary: Update voter turnout record
 *     tags: [Voter Turnout]
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
 *             $ref: '#/components/schemas/VoterTurnout'
 *     responses:
 *       200:
 *         description: Voter turnout record updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Voter turnout record not found
 */
router.put('/:id', protect, authorize('superAdmin'), updateVoterTurnout);

/**
 * @swagger
 * /api/voter-turnout/{id}:
 *   delete:
 *     summary: Delete voter turnout record
 *     tags: [Voter Turnout]
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
 *         description: Voter turnout record deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Voter turnout record not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteVoterTurnout);

/**
 * @swagger
 * /api/voter-turnout/state/{stateId}:
 *   get:
 *     summary: Get voter turnout records by state
 *     tags: [Voter Turnout]
 *     parameters:
 *       - in: path
 *         name: stateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of voter turnout records for the state
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
 *                     $ref: '#/components/schemas/VoterTurnout'
 *       404:
 *         description: State not found
 */
router.get('/state/:stateId', getVoterTurnoutsByState);

/**
 * @swagger
 * /api/voter-turnout/year/{yearId}:
 *   get:
 *     summary: Get voter turnout records by year
 *     tags: [Voter Turnout]
 *     parameters:
 *       - in: path
 *         name: yearId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of voter turnout records for the year
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
 *                     $ref: '#/components/schemas/VoterTurnout'
 *       404:
 *         description: Election year not found
 */
router.get('/year/:yearId', getVoterTurnoutsByYear);

/**
 * @swagger
 * components:
 *   schemas:
 *     VoterTurnout:
 *       type: object
 *       required:
 *         - state_id
 *         - year_id
 *         - total_voter
 *         - total_votes
 *         - created_by
 *       properties:
 *         state_id:
 *           type: string
 *           description: Reference to State
 *           example: "507f1f77bcf86cd799439016"
 *         year_id:
 *           type: string
 *           description: Reference to Election Year
 *           example: "507f1f77bcf86cd799439017"
 *         total_voter:
 *           type: number
 *           description: Total number of eligible voters
 *           example: 100000
 *         total_votes:
 *           type: number
 *           description: Total number of votes cast
 *           example: 75000
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
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;