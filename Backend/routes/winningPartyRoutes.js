const express = require('express');
const {
  getWinningParties,
  getWinningParty,
  createWinningParty,
  updateWinningParty,
  deleteWinningParty,
  getWinningPartiesByAssembly,
  getWinningPartiesByParliament
} = require('../controllers/winningPartyController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Winning Parties
 *   description: Winning party history management
 */

/**
 * @swagger
 * /api/winning-parties:
 *   get:
 *     summary: Get all winning party records
 *     tags: [Winning Parties]
 *     responses:
 *       200:
 *         description: List of winning party records
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
 *                     $ref: '#/components/schemas/WinningParty'
 */
router.get('/', getWinningParties);

/**
 * @swagger
 * /api/winning-parties/{id}:
 *   get:
 *     summary: Get a single winning party record
 *     tags: [Winning Parties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Winning party record data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WinningParty'
 *       404:
 *         description: Record not found
 */
router.get('/:id', getWinningParty);

/**
 * @swagger
 * /api/winning-parties:
 *   post:
 *     summary: Create a new winning party record
 *     tags: [Winning Parties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WinningParty'
 *     responses:
 *       201:
 *         description: Record created successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/',  createWinningParty);

/**
 * @swagger
 * /api/winning-parties/{id}:
 *   put:
 *     summary: Update a winning party record
 *     tags: [Winning Parties]
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
 *             $ref: '#/components/schemas/WinningParty'
 *     responses:
 *       200:
 *         description: Record updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Record not found
 */
router.put('/:id', protect, updateWinningParty);

/**
 * @swagger
 * /api/winning-parties/{id}:
 *   delete:
 *     summary: Delete a winning party record
 *     tags: [Winning Parties]
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
 *         description: Record deleted successfully
 *       404:
 *         description: Record not found
 */
router.delete('/:id', protect, deleteWinningParty);

/**
 * @swagger
 * /api/winning-parties/assembly/{assemblyId}:
 *   get:
 *     summary: Get winning parties by assembly (last 4 years)
 *     tags: [Winning Parties]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of winning party records
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
 *                     $ref: '#/components/schemas/WinningParty'
 */
router.get('/assembly/:assemblyId', getWinningPartiesByAssembly);

/**
 * @swagger
 * /api/winning-parties/parliament/{parliamentId}:
 *   get:
 *     summary: Get winning parties by parliament (last 4 years)
 *     tags: [Winning Parties]
 *     parameters:
 *       - in: path
 *         name: parliamentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of winning party records
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
 *                     $ref: '#/components/schemas/WinningParty'
 */
router.get('/parliament/:parliamentId', getWinningPartiesByParliament);

/**
 * @swagger
 * components:
 *   schemas:
 *     WinningParty:
 *       type: object
 *       required:
 *         - candidate_id
 *         - assembly_id
 *         - parliament_id
 *         - party_id
 *         - year_id
 *         - votes
 *         - margin
 *       properties:
 *         candidate_id:
 *           type: string
 *           description: Reference to winning candidate
 *         assembly_id:
 *           type: string
 *           description: Reference to assembly constituency
 *         parliament_id:
 *           type: string
 *           description: Reference to parliament constituency
 *         party_id:
 *           type: string
 *           description: Reference to winning party
 *         year_id:
 *           type: string
 *           description: Reference to election year
 *         votes:
 *           type: integer
 *           description: Number of votes received
 *         margin:
 *           type: integer
 *           description: Victory margin
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       example:
 *         candidate_id: "507f1f77bcf86cd799439011"
 *         assembly_id: "507f1f77bcf86cd799439012"
 *         parliament_id: "507f1f77bcf86cd799439013"
 *         party_id: "507f1f77bcf86cd799439014"
 *         year_id: "507f1f77bcf86cd799439015"
 *         votes: 75000
 *         margin: 12500
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;