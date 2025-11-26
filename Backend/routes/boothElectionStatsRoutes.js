const express = require('express');
const {
  getBoothStats,
  getBoothStatsById,
  getStatsByBooth,
  getStatsByYear,
  createBoothStats,
  updateBoothStats,
  deleteBoothStats
} = require('../controllers/boothElectionStatsController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: BoothElectionStats
 *   description: Booth-level election statistics management
 */

/**
 * @swagger
 * /api/booth-stats:
 *   get:
 *     summary: Get all booth election statistics
 *     tags: [BoothElectionStats]
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
 *         description: Filter by booth ID
 *       - in: query
 *         name: year
 *         schema:
 *           type: string
 *         description: Filter by election year ID
 *     responses:
 *       200:
 *         description: List of booth election statistics
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
 *                     $ref: '#/components/schemas/BoothElectionStats'
 */
router.get('/', getBoothStats);

/**
 * @swagger
 * /api/booth-stats/booth/{boothId}:
 *   get:
 *     summary: Get election stats by booth ID
 *     tags: [BoothElectionStats]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of election stats for the booth
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BoothElectionStats'
 */
router.get('/booth/:boothId', getStatsByBooth);

/**
 * @swagger
 * /api/booth-stats/year/{yearId}:
 *   get:
 *     summary: Get election stats by year ID
 *     tags: [BoothElectionStats]
 *     parameters:
 *       - in: path
 *         name: yearId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of election stats for the year
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BoothElectionStats'
 */
router.get('/year/:yearId', getStatsByYear);

/**
 * @swagger
 * /api/booth-stats/{id}:
 *   get:
 *     summary: Get single booth election stats record
 *     tags: [BoothElectionStats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booth election stats data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoothElectionStats'
 *       404:
 *         description: Record not found
 */
router.get('/:id', getBoothStatsById);

/**
 * @swagger
 * /api/booth-stats:
 *   post:
 *     summary: Create new booth election stats
 *     tags: [BoothElectionStats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BoothElectionStats'
 *     responses:
 *       201:
 *         description: Booth stats created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin', 'data-entry'), createBoothStats);

/**
 * @swagger
 * /api/booth-stats/{id}:
 *   put:
 *     summary: Update booth election stats
 *     tags: [BoothElectionStats]
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
 *             $ref: '#/components/schemas/BoothElectionStats'
 *     responses:
 *       200:
 *         description: Booth stats updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Record not found
 */
router.put('/:id', protect, authorize('superAdmin', 'data-entry'), updateBoothStats);

/**
 * @swagger
 * /api/booth-stats/{id}:
 *   delete:
 *     summary: Delete booth election stats
 *     tags: [BoothElectionStats]
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
 *         description: Booth stats deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Record not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteBoothStats);

/**
 * @swagger
 * components:
 *   schemas:
 *     BoothElectionStats:
 *       type: object
 *       required:
 *         - booth_id
 *         - year_id
 *       properties:
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *         year_id:
 *           type: string
 *           description: Reference to Election Year
 *         total_votes_polled:
 *           type: integer
 *           description: Total votes polled at the booth
 *         turnout_percentage:
 *           type: number
 *           description: Voter turnout percentage
 *         male_turnout:
 *           type: number
 *           description: Male voter turnout percentage
 *         female_turnout:
 *           type: number
 *           description: Female voter turnout percentage
 *         nota_votes:
 *           type: integer
 *           description: Number of NOTA votes
 *         rejected_votes:
 *           type: integer
 *           description: Number of rejected votes
 *         winning_candidate:
 *           type: string
 *           description: Name of winning candidate
 *         winning_party_id:
 *           type: string
 *           description: Reference to winning Party
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

module.exports = router;