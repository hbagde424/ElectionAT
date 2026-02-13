
const express = require('express');
const {
  getParliamentCandidates,
  getParliamentCandidate,
  createParliamentCandidate,
  updateParliamentCandidate,
  deleteParliamentCandidate,
  importParliamentCandidates,
  getParliamentCandidateStats,
  getParliamentCandidateStatsByParliament
} = require('../controllers/parliamentCandidateController');
const { protect, authorize } = require('../middlewares/auth');
const { getUserPermissionsAndHierarchy } = require('../middlewares/permissions');

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
router.get('/',  getUserPermissionsAndHierarchy, getParliamentCandidates);

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
 * /api/parliament-candidates/stats/parliament/{parliamentId}:
 *   get:
 *     summary: Get Parliament Candidate stats by Parliament ID
 *     tags: [Parliament Candidates]
 *     parameters:
 *       - in: path
 *         name: parliamentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Parliament ID
 *     responses:
 *       200:
 *         description: Parliament Candidate stats for specific parliament
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
 *                     electors:
 *                       type: number
 *                     male_electors:
 *                       type: number
 *                     female_electors:
 *                       type: number
 *                     last3YearWinner:
 *                       type: string
 *                     totalVotes:
 *                       type: number
 *       404:
 *         description: No data found for this parliament
 */
router.get('/stats/parliament/:parliamentId', getParliamentCandidateStatsByParliament);

// Debug endpoint to check what data exists
router.get('/debug/data', async (req, res) => {
  try {
    const ParliamentCandidate = require('../models/ParliamentCandidate');
    const Parliament = require('../models/Parliament');

    const parliaments = await Parliament.find().limit(5);
    const candidates = await ParliamentCandidate.find().populate('parliament_id', 'name parliament_no').limit(5);

    res.json({
      success: true,
      parliaments,
      candidates
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
router.get('/:id', protect, getUserPermissionsAndHierarchy, getParliamentCandidate);

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
 * /api/parliament-candidates/import:
 *   post:
 *     summary: Import Parliament Candidates from Excel
 *     tags: [Parliament Candidates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rows:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Import summary
 *       401:
 *         description: Unauthorized
 */
router.post('/import', protect, authorize('superAdmin'), importParliamentCandidates);

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

// Delete route
router.delete('/:id', protect, authorize('superAdmin', 'admin'), deleteParliamentCandidate);

/* Removed malformed/duplicate swagger block to avoid YAML parse errors */

module.exports = router;