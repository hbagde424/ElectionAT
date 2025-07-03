const express = require('express');
const {
  getCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  getCandidatesByAssembly,
  getCandidatesByParliament
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
 *         description: Search term for candidate names
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
 *         name: year
 *         schema:
 *           type: string
 *         description: Election year ID to filter by
 *       - in: query
 *         name: caste
 *         schema:
 *           type: string
 *         description: Caste to filter by
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
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
 *     summary: Delete candidate
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
 *         description: Candidate deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Candidate not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteCandidate);

/**
 * @swagger
 * /api/candidates/assembly/{assemblyId}:
 *   get:
 *     summary: Get candidates by assembly
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of candidates for the assembly
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
 *         description: Assembly not found
 */
router.get('/assembly/:assemblyId', getCandidatesByAssembly);

/**
 * @swagger
 * /api/candidates/parliament/{parliamentId}:
 *   get:
 *     summary: Get candidates by parliament
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: parliamentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of candidates for the parliament
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
 *         description: Parliament not found
 */
router.get('/parliament/:parliamentId', getCandidatesByParliament);

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
 *         - election_year
 *         - caste
 *         - created_by
 *       properties:
 *         name:
 *           type: string
 *           description: Candidate name
 *           example: "John Doe"
 *         party_id:
 *           type: string
 *           description: Reference to Party
 *           example: "507f1f77bcf86cd799439011"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *           example: "507f1f77bcf86cd799439012"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *           example: "507f1f77bcf86cd799439013"
 *         election_year:
 *           type: string
 *           description: Reference to Election Year
 *           example: "507f1f77bcf86cd799439014"
 *         caste:
 *           type: string
 *           enum: [General, OBC, SC, ST, Other]
 *           description: Caste category
 *           example: "OBC"
 *         votes:
 *           type: number
 *           description: Number of votes received
 *           example: 15000
 *         criminal_cases:
 *           type: number
 *           description: Number of criminal cases
 *           example: 2
 *         assets:
 *           type: string
 *           description: Assets declaration
 *           example: "₹5 crore property, ₹2 crore investments"
 *         liabilities:
 *           type: string
 *           description: Liabilities declaration
 *           example: "₹50 lakh loan"
 *         education:
 *           type: string
 *           description: Educational qualification
 *           example: "MBA, Harvard University"
 *         photo:
 *           type: string
 *           description: URL to candidate photo
 *           example: "https://example.com/photos/john-doe.jpg"
 *         is_active:
 *           type: boolean
 *           description: Active status
 *           default: true
 *         created_by:
 *           type: string
 *           description: Reference to User who created
 *           example: "507f1f77bcf86cd799439022"
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated
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