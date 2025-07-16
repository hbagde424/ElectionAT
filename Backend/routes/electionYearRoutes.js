const express = require('express');
const {
  getElectionYears,
  getElectionYear,
  createElectionYear,
  updateElectionYear,
  deleteElectionYear
} = require('../controllers/electionYearController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: ElectionYears
 *   description: Election year management
 */

/**
 * @swagger
 * /api/election-years:
 *   get:
 *     summary: Get all election years
 *     tags: [ElectionYears]
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
 *         description: Search term for year or election type
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Assembly, Parliament]
 *         description: Filter by election type
 *     responses:
 *       200:
 *         description: List of election years
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
 *                     $ref: '#/components/schemas/ElectionYear'
 */
router.get('/', getElectionYears);

/**
 * @swagger
 * /api/election-years/{id}:
 *   get:
 *     summary: Get single election year
 *     tags: [ElectionYears]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Election year data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ElectionYear'
 *       404:
 *         description: Election year not found
 */
router.get('/:id', getElectionYear);

/**
 * @swagger
 * /api/election-years:
 *   post:
 *     summary: Create new election year
 *     tags: [ElectionYears]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ElectionYear'
 *     responses:
 *       201:
 *         description: Election year created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin'), createElectionYear);

/**
 * @swagger
 * /api/election-years/{id}:
 *   put:
 *     summary: Update election year
 *     tags: [ElectionYears]
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
 *             $ref: '#/components/schemas/ElectionYear'
 *     responses:
 *       200:
 *         description: Election year updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Election year not found
 */
router.put('/:id', protect, authorize('superAdmin'), updateElectionYear);

/**
 * @swagger
 * /api/election-years/{id}:
 *   delete:
 *     summary: Delete election year
 *     tags: [ElectionYears]
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
 *         description: Election year deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Election year not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteElectionYear);

/**
 * @swagger
 * components:
 *   schemas:
 *     ElectionYear:
 *       type: object
 *       required:
 *         - year
 *         - election_type
 *         - created_by
 *       properties:
 *         year:
 *           type: integer
 *           description: The election year (4 digits)
 *           example: 2024
 *         election_type:
 *           type: string
 *           enum: [Assembly, Parliament]
 *           description: Type of election
 *           example: "Assembly"
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