const express = require('express');
const {
  getParliaments,
  getParliamentById,
  createParliament,
  updateParliament,
  deleteParliament,
  getParliamentsByDivision
} = require('../controllers/parliamentController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Parliaments
 *   description: Parliamentary constituency management
 */

/**
 * @swagger
 * /api/parliaments:
 *   get:
 *     summary: Get all parliamentary constituencies
 *     tags: [Parliaments]
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
 *         name: division
 *         schema:
 *           type: string
 *         description: Filter by division ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by parliament name
 *     responses:
 *       200:
 *         description: List of parliamentary constituencies
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
 *                     $ref: '#/components/schemas/Parliament'
 */
router.get('/', getParliaments);

/**
 * @swagger
 * /api/parliaments/{id}:
 *   get:
 *     summary: Get single parliamentary constituency
 *     tags: [Parliaments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Parliamentary constituency data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parliament'
 *       404:
 *         description: Parliament not found
 */
router.get('/:id', getParliamentById);

/**
 * @swagger
 * /api/parliaments:
 *   post:
 *     summary: Create new parliamentary constituency
 *     tags: [Parliaments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Parliament'
 *     responses:
 *       201:
 *         description: Parliament created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/',  createParliament);
// router.post('/', protect, authorize('admin'), createParliament);

/**
 * @swagger
 * /api/parliaments/{id}:
 *   put:
 *     summary: Update parliamentary constituency
 *     tags: [Parliaments]
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
 *             $ref: '#/components/schemas/Parliament'
 *     responses:
 *       200:
 *         description: Parliament updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Parliament not found
 */
router.put('/:id', protect, authorize('admin'), updateParliament);

/**
 * @swagger
 * /api/parliaments/{id}:
 *   delete:
 *     summary: Delete parliamentary constituency
 *     tags: [Parliaments]
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
 *         description: Parliament deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Parliament not found
 */
router.delete('/:id', protect, authorize('admin'), deleteParliament);

/**
 * @swagger
 * /api/parliaments/division/{divisionId}:
 *   get:
 *     summary: Get parliaments by division ID
 *     tags: [Parliaments]
 *     parameters:
 *       - in: path
 *         name: divisionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of parliamentary constituencies for the division
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
 *                     $ref: '#/components/schemas/Parliament'
 *       404:
 *         description: Division not found
 */
router.get('/division/:divisionId', getParliamentsByDivision);

/**
 * @swagger
 * components:
 *   schemas:
 *     Parliament:
 *       type: object
 *       required:
 *         - name
 *         - division_id
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the parliamentary constituency
 *           example: "Bangalore North"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439011"
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