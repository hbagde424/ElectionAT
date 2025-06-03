const express = require('express');
const {
  getCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  toggleCandidateStatus,
  deleteCandidate,
  getCandidatesByassemblyAndYear
} = require('../controllers/candidateController');
const { protect } = require('../middlewares/auth');

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
 *     responses:
 *       200:
 *         description: List of all candidates
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
 */
router.get('/', getCandidates);

/**
 * @swagger
 * /api/candidates/{id}:
 *   get:
 *     summary: Get a single candidate
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
 *     summary: Create a new candidate
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
 */
router.post('/', createCandidate);

/**
 * @swagger
 * /api/candidates/{id}:
 *   put:
 *     summary: Update a candidate
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
 *       404:
 *         description: Candidate not found
 */
router.put('/:id', protect, updateCandidate);

/**
 * @swagger
 * /api/candidates/toggle-status/{id}:
 *   put:
 *     summary: Toggle candidate active status
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
 *         description: Candidate status updated
 *       404:
 *         description: Candidate not found
 */
router.put('/toggle-status/:id', protect, toggleCandidateStatus);

/**
 * @swagger
 * /api/candidates/{id}:
 *   delete:
 *     summary: Delete a candidate
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
 *       404:
 *         description: Candidate not found
 */
router.delete('/:id', protect, deleteCandidate);

/**
 * @swagger
 * /api/candidates/assembly/{assemblyId}/year/{yearId}:
 *   get:
 *     summary: Get candidates by assembly and year
 *     tags: [Candidates]
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Candidate'
 */
router.get('/assembly/:assemblyId/year/:yearId', getCandidatesByassemblyAndYear);

/**
 * @swagger
 * components:
 *   schemas:
 *     Candidate:
 *       type: object
 *       required:
 *         - name
 *         - party
 *         - assembly
 *         - assemblyModel
 *         - election_year
 *       properties:
 *         name:
 *           type: string
 *           description: Candidate's full name
 *         party:
 *           type: string
 *           description: Reference to Party
 *         assembly:
 *           type: string
 *           description: Reference to assembly
 *         assemblyModel:
 *           type: string
 *           enum: ['Division', 'Parliament', 'Block', 'Assembly']
 *           description: Type of assembly
 *         election_year:
 *           type: string
 *           description: Reference to Year
 *         votes:
 *           type: integer
 *           description: Number of votes received
 *           default: 0
 *         criminal_cases:
 *           type: integer
 *           description: Number of criminal cases
 *           default: 0
 *         assets:
 *           type: string
 *           description: Details of assets
 *         liabilities:
 *           type: string
 *           description: Details of liabilities
 *         education:
 *           type: string
 *           description: Educational qualifications
 *         photo:
 *           type: string
 *           description: URL to candidate's photo
 *         is_active:
 *           type: boolean
 *           description: Active status
 *           default: true
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       example:
 *         name: "John Doe"
 *         party: "507f1f77bcf86cd799439011"
 *         assembly: "607f1f77bcf86cd799439012"
 *         assemblyModel: "Assembly"
 *         election_year: "607f1f77bcf86cd799439013"
 *         votes: 15000
 *         criminal_cases: 2
 *         assets: "House, Car, Land"
 *         liabilities: "Bank loan"
 *         education: "MBA"
 *         photo: "https://example.com/photo.jpg"
 *         is_active: true
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;