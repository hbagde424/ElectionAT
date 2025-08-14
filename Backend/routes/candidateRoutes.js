const express = require('express');
const {
  getCandidates,
  getCandidate,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  uploadPhoto,
  getCandidatesByCriminalCases,
  getCandidatesByCaste
} = require('../controllers/candidateController');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../config/candidateUpload');

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
 *         description: Search term for candidate names, caste, or education
 *       - in: query
 *         name: caste
 *         schema:
 *           type: string
 *         description: Caste to filter by
 *       - in: query
 *         name: criminal_cases
 *         schema:
 *           type: integer
 *         description: Number of criminal cases to filter by
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
router.post('/', protect, authorize('superAdmin', 'admin'), upload.single('photo'), createCandidate);

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
router.put('/:id', protect, authorize('superAdmin', 'admin'), upload.single('photo'), updateCandidate);

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
router.delete('/:id', protect, authorize('superAdmin', 'admin'), deleteCandidate);

/**
 * @swagger
 * /api/candidates/{id}/photo:
 *   post:
 *     summary: Upload candidate photo
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Photo uploaded successfully
 *       400:
 *         description: Invalid file or no file uploaded
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Candidate not found
 */
router.post('/:id/photo', protect, authorize('superAdmin', 'admin'), uploadPhoto);

/**
 * @swagger
 * /api/candidates/criminal-cases:
 *   get:
 *     summary: Get candidates grouped by criminal cases count
 *     tags: [Candidates]
 *     responses:
 *       200:
 *         description: List of candidates grouped by criminal cases
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
 *                       _id:
 *                         type: integer
 *                         description: Number of criminal cases
 *                       count:
 *                         type: integer
 *                         description: Number of candidates with this many cases
 *                       candidates:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Candidate'
 */
router.get('/criminal-cases', getCandidatesByCriminalCases);

/**
 * @swagger
 * /api/candidates/caste:
 *   get:
 *     summary: Get candidates grouped by caste
 *     tags: [Candidates]
 *     responses:
 *       200:
 *         description: List of candidates grouped by caste
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
 *                       _id:
 *                         type: string
 *                         description: Caste name
 *                       count:
 *                         type: integer
 *                         description: Number of candidates in this caste
 *                       candidates:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Candidate'
 */
router.get('/caste', getCandidatesByCaste);

/**
 * @swagger
 * components:
 *   schemas:
 *     Candidate:
 *       type: object
 *       required:
 *         - name
 *         - caste
 *         - created_by
 *       properties:
 *         name:
 *           type: string
 *           description: Candidate's full name
 *           example: "John Doe"
 *         caste:
 *           type: string
 *           enum: [General, OBC, SC, ST, Other]
 *           description: Candidate's caste category
 *           example: "OBC"
 *         criminal_cases:
 *           type: integer
 *           description: Number of criminal cases against the candidate
 *           example: 2
 *         assets:
 *           type: string
 *           description: Description of candidate's assets
 *           example: "House worth ₹50 lakh, agricultural land"
 *         description:
 *           type: string
 *           description: Candidate description (HTML allowed)
 *           example: "<p>Some description about the candidate.</p>"
 *         liabilities:
 *           type: string
 *           description: Description of candidate's liabilities
 *           example: "Bank loan of ₹10 lakh"
 *         education:
 *           type: string
 *           description: Candidate's educational qualification
 *           example: "MBA, Bachelor of Arts"
 *         photo:
 *           type: string
 *           description: URL or path to candidate's photo
 *           example: "/uploads/candidates/candidate-123456789.jpg"
 *         is_active:
 *           type: boolean
 *           description: Whether the candidate is active
 *           default: true
 *         created_by:
 *           type: string
 *           description: Reference to User who created
 *           example: "507f1f77bcf86cd799439022"
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated
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