const express = require('express');
const {
  getParliaments,
  getParliament,
  createParliament,
  updateParliament,
  deleteParliament,
  getParliamentsByState,
  getParliamentsByDivision
} = require('../controllers/parliamentController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Parliaments
 *   description: Parliament management
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
 *         name: category
 *         schema:
 *           type: string
 *           enum: [reserved, special, general]
 *         description: Filter by category
 *       - in: query
 *         name: regional_type
 *         schema:
 *           type: string
 *           enum: [urban, rural, mixed]
 *         description: Filter by regional type
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State ID to filter by
 *       - in: query
 *         name: division
 *         schema:
 *           type: string
 *         description: Division ID to filter by
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
 * /api/parliaments/state/{stateId}:
 *   get:
 *     summary: Get parliaments by state
 *     tags: [Parliaments]
 *     parameters:
 *       - in: path
 *         name: stateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of parliaments for the state
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
 *         description: State not found
 */
router.get('/state/:stateId', getParliamentsByState);

/**
 * @swagger
 * /api/parliaments/division/{divisionId}:
 *   get:
 *     summary: Get parliaments by division
 *     tags: [Parliaments]
 *     parameters:
 *       - in: path
 *         name: divisionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of parliaments for the division
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
 *         - state_id
 *         - category
 *         - regional_type
 *         - created_by
 *       properties:
 *         name:
 *           type: string
 *           description: Parliament name
 *           example: "5th Parliament District"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439011"
 *         state_id:
 *           type: string
 *           description: Reference to State
 *           example: "507f1f77bcf86cd799439012"
 *         category:
 *           type: string
 *           enum: [reserved, special, general]
 *           description: Category of parliament
 *           example: "general"
 *         regional_type:
 *           type: string
 *           enum: [urban, rural, mixed]
 *           description: Regional type of parliament
 *           example: "urban"
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
 */

module.exports = router;