const express = require('express');
const {
  getParties,
  getParty,
  createParty,
  updateParty,
  deleteParty
} = require('../controllers/partyController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Parties
 *   description: Political party management
 */

/**
 * @swagger
 * /api/parties:
 *   get:
 *     summary: Get all parties
 *     tags: [Parties]
 *     responses:
 *       200:
 *         description: List of all political parties
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
 *                     $ref: '#/components/schemas/Party'
 */
router.get('/', getParties);

/**
 * @swagger
 * /api/parties/{id}:
 *   get:
 *     summary: Get a single party
 *     tags: [Parties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Party data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Party'
 *       404:
 *         description: Party not found
 */
router.get('/:id', getParty);

/**
 * @swagger
 * /api/parties:
 *   post:
 *     summary: Create a new party
 *     tags: [Parties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Party'
 *     responses:
 *       201:
 *         description: Party created successfully
 *       400:
 *         description: Party already exists
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('admin', 'superAdmin'), createParty);

/**
 * @swagger
 * /api/parties/{id}:
 *   put:
 *     summary: Update a party
 *     tags: [Parties]
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
 *             $ref: '#/components/schemas/Party'
 *     responses:
 *       200:
 *         description: Party updated successfully
 *       400:
 *         description: Party with this name already exists
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Party not found
 */
router.put('/:id', protect, authorize('admin', 'superAdmin'), updateParty);

/**
 * @swagger
 * /api/parties/{id}:
 *   delete:
 *     summary: Delete a party
 *     tags: [Parties]
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
 *         description: Party deleted successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Party not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteParty);

/**
 * @swagger
 * components:
 *   schemas:
 *     Party:
 *       type: object
 *       required:
 *         - name
 *         - abbreviation
 *         - created_by
 *       properties:
 *         name:
 *           type: string
 *           description: Full name of the political party
 *         abbreviation:
 *           type: string
 *           description: Short form of the party name
 *         symbol:
 *           type: string
 *           description: Party symbol or logo
 *         founded_year:
 *           type: integer
 *           description: Year the party was founded
 *         created_by:
 *           type: string
 *           description: Reference to User who created this record
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated this record
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Date when the party was added to the system
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Date when the party was last updated
 *       example:
 *         name: "Indian National Congress"
 *         abbreviation: "INC"
 *         symbol: "Hand"
 *         founded_year: 1885
 *         created_by: "507f1f77bcf86cd799439011"
 *         updated_by: "507f1f77bcf86cd799439012"
 *         created_at: "2023-01-01T00:00:00.000Z"
 *         updated_at: "2023-01-01T00:00:00.000Z"
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;