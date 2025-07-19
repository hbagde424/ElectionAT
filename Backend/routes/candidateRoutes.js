const express = require('express');
const {
  getCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  getCandidatesByParty,
  getCandidatesByYear
} = require('../controllers/candidateController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Candidates
 *   description: Candidate management
 */

/**
 * @swagger
 * /api/candidates:
 *   get:
 *     summary: Get all candidates
 *     tags: [Candidates]
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
 *         description: Search term for candidate names or caste
 *       - in: query
 *         name: party
 *         schema:
 *           type: string
 *         description: Party ID to filter by
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
 *         name: election_year
 *         schema:
 *           type: string
 *         description: Election year ID to filter by
 *       - in: query
 *         name: caste
 *         schema:
 *           type: string
 *         description: Caste to filter by (General, OBC, SC, ST, Other)
 *     responses:
 *       200:
 *         description: List of candidates
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
 *                     $ref: '#/components/schemas/Candidate'
 */
router.get('/', getCandidates);

/**
 * @swagger
 * /api/candidates/{id}:
 *   get:
 *     summary: Get single candidate
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Candidate data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Candidate'
 *       404:
 *         description: Candidate not found
 */
router.get('/:id', getCandidate);

/**
 * @swagger
 * /api/candidates:
 *   post:
 *     summary: Create new candidate
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Candidate'
 *     responses:
 *       201:
 *         description: Candidate created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('admin', 'superAdmin'), createCandidate);

/**
 * @swagger
 * /api/candidates/{id}:
 *   put:
 *     summary: Update candidate
 *     tags: [Candidates]
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
 *             $ref: '#/components/schemas/Candidate'
 *     responses:
 *       200:
 *         description: Candidate updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Candidate not found
 */
router.put('/:id', protect, authorize('admin', 'superAdmin'), updateCandidate);

/**
 * @swagger
 * /api/candidates/{id}:
 *   delete:
 *     summary: Delete candidate (soft delete)
 *     tags: [Candidates]
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
 *         description: Candidate deactivated
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Candidate not found
 */
router.delete('/:id', protect, authorize('admin', 'superAdmin'), deleteCandidate);

/**
 * @swagger
 * /api/candidates/party/{partyId}:
 *   get:
 *     summary: Get candidates by party
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of candidates for the party
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
 *                     $ref: '#/components/schemas/Candidate'
 *       404:
 *         description: Party not found
 */
router.get('/party/:partyId', getCandidatesByParty);

/**
 * @swagger
 * /api/candidates/year/{yearId}:
 *   get:
 *     summary: Get candidates by election year
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: yearId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of candidates for the election year
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
 *                     $ref: '#/components/schemas/Candidate'
 *       404:
 *         description: Election year not found
 */
router.get('/year/:yearId', getCandidatesByYear);

/**
 * @swagger
 * components:
 *   schemas:
 *     Candidate:
 *       type: object
 *       required:
 *         - name
 *         - party_id
 *         - assembly_id
 *         - parliament_id
 *         - state_id
 *         - division_id
 *         - election_year
 *         - caste
 *         - created_by
 *       properties:
 *         name:
 *           type: string
 *           description: Candidate's full name
 *           example: "John Doe"
 *         party_id:
 *           type: string
 *           description: Reference to Party
 *           example: "507f1f77bcf86cd799439011"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly constituency
 *           example: "507f1f77bcf86cd799439012"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament constituency
 *           example: "507f1f77bcf86cd799439013"
 *         state_id:
 *           type: string
 *           description: Reference to State
 *           example: "507f1f77bcf86cd799439014"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439015"
 *         election_year:
 *           type: string
 *           description: Reference to Election Year
 *           example: "507f1f77bcf86cd799439016"
 *         caste:
 *           type: string
 *           enum: [General, OBC, SC, ST, Other]
 *           description: Caste category
 *           example: "OBC"
 *         criminal_cases:
 *           type: number
 *           description: Number of criminal cases against the candidate
 *           example: 2
 *         assets:
 *           type: string
 *           description: Description of assets
 *           example: "House worth ₹50 lakh, agricultural land"
 *         liabilities:
 *           type: string
 *           description: Description of liabilities
 *           example: "Bank loan of ₹10 lakh"
 *         education:
 *           type: string
 *           description: Educational qualification
 *           example: "Post Graduate"
 *         photo:
 *           type: string
 *           description: URL to candidate's photo
 *           example: "https://example.com/photos/john-doe.jpg"
 *         is_active:
 *           type: boolean
 *           description: Whether the candidate is active
 *           default: true
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