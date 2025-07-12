const express = require('express');
const {
  getParliaments,
  getParliament,
  createParliament,
  updateParliament,
  deleteParliament,
  getParliamentsByCategory,
  getParliamentsByRegionalType
} = require('../controllers/parliamentController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Parliaments
 *   description: Parliament constituency management
 */

/**
 * @swagger
 * /api/parliaments:
 *   get:
 *     summary: Get all parliaments
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for parliament names
 *       - in: query
 *         name: state_id
 *         schema:
 *           type: string
 *         description: State ID to filter by
 *       - in: query
 *         name: division_id
 *         schema:
 *           type: string
 *         description: Division ID to filter by
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [reserved, special, general]
 *         description: Category to filter by
 *       - in: query
 *         name: regional_type
 *         schema:
 *           type: string
 *           enum: [urban, rural, mixed]
 *         description: Regional type to filter by
 *     responses:
 *       200:
 *         description: List of parliaments
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
 *     summary: Get single parliament
 *     tags: [Parliaments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Parliament data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parliament'
 *       404:
 *         description: Parliament not found
 */
router.get('/:id', getParliament);

/**
 * @swagger
 * /api/parliaments:
 *   post:
 *     summary: Create new parliament
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
router.post('/', protect, authorize('superAdmin'), createParliament);

/**
 * @swagger
 * /api/parliaments/{id}:
 *   put:
 *     summary: Update parliament
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
router.put('/:id', protect, authorize('superAdmin'), updateParliament);

/**
 * @swagger
 * /api/parliaments/{id}:
 *   delete:
 *     summary: Delete parliament
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
router.delete('/:id', protect, authorize('superAdmin'), deleteParliament);

/**
 * @swagger
 * /api/parliaments/category/{category}:
 *   get:
 *     summary: Get parliaments by category
 *     tags: [Parliaments]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [reserved, special, general]
 *     responses:
 *       200:
 *         description: List of parliaments in the specified category
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
 */
router.get('/category/:category', getParliamentsByCategory);

/**
 * @swagger
 * /api/parliaments/regional/{type}:
 *   get:
 *     summary: Get parliaments by regional type
 *     tags: [Parliaments]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [urban, rural, mixed]
 *     responses:
 *       200:
 *         description: List of parliaments of the specified regional type
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
 */
router.get('/regional/:type', getParliamentsByRegionalType);

/**
 * @swagger
 * components:
 *   schemas:
 *     Parliament:
 *       type: object
 *       required:
 *         - name
 *         - division_id
 *         - state_id
 *         - category
 *         - regional_type
 *         - created_by
 *         - updated_by
 *       properties:
 *         name:
 *           type: string
 *           description: Parliament constituency name
 *           example: "Bangalore South"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439011"
 *         state_id:
 *           type: string
 *           description: Reference to State
 *           example: "507f1f77bcf86cd799439012"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly (optional)
 *           example: "507f1f77bcf86cd799439013"
 *         category:
 *           type: string
 *           enum: [reserved, special, general]
 *           description: Parliament category
 *           example: "general"
 *         regional_type:
 *           type: string
 *           enum: [urban, rural, mixed]
 *           description: Regional classification
 *           example: "urban"
 *         created_by:
 *           type: string
 *           description: Reference to User who created this record
 *           example: "507f1f77bcf86cd799439014"
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated this record
 *           example: "507f1f77bcf86cd799439015"
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