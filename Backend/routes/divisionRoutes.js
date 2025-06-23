const express = require('express');
const {
  getDivisions,
  getDivision,
  createDivision,
  updateDivision,
  deleteDivision,
  getDivisionsByState
} = require('../controllers/divisionController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Divisions
 *   description: Division management
 */

/**
 * @swagger
 * /api/divisions:
 *   get:
 *     summary: Get all divisions
 *     tags: [Divisions]
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
 *         name: state
 *         schema:
 *           type: string
 *         description: State ID to filter by
 *     responses:
 *       200:
 *         description: List of divisions
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
 *                     $ref: '#/components/schemas/Division'
 */
router.get('/', getDivisions);

/**
 * @swagger
 * /api/divisions/{id}:
 *   get:
 *     summary: Get single division
 *     tags: [Divisions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Division data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Division'
 *       404:
 *         description: Division not found
 */
router.get('/:id', getDivision);

/**
 * @swagger
 * /api/divisions:
 *   post:
 *     summary: Create new division
 *     tags: [Divisions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Division'
 *     responses:
 *       201:
 *         description: Division created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
// router.post('/', createDivision);
// router.post('/', protect, createDivision);
router.post('/', protect, authorize('superAdmin'), createDivision);

/**
 * @swagger
 * /api/divisions/{id}:
 *   put:
 *     summary: Update division
 *     tags: [Divisions]
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
 *             $ref: '#/components/schemas/Division'
 *     responses:
 *       200:
 *         description: Division updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Division not found
 */
router.put('/:id', protect, authorize('superAdmin'), updateDivision);

/**
 * @swagger
 * /api/divisions/{id}:
 *   delete:
 *     summary: Delete division
 *     tags: [Divisions]
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
 *         description: Division deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Division not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteDivision);

/**
 * @swagger
 * /api/divisions/state/{stateId}:
 *   get:
 *     summary: Get divisions by state
 *     tags: [Divisions]
 *     parameters:
 *       - in: path
 *         name: stateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of divisions for the state
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
 *                     $ref: '#/components/schemas/Division'
 *       404:
 *         description: State not found
 */
router.get('/state/:stateId', getDivisionsByState);

/**
 * @swagger
 * components:
 *   schemas:
 *     Division:
 *       type: object
 *       required:
 *         - name
 *         - state_id
 *         - created_by
 *       properties:
 *         name:
 *           type: string
 *           description: Division name
 *           example: "Northern Division"
 *         state_id:
 *           type: string
 *           description: Reference to State
 *           example: "507f1f77bcf86cd799439011"
 *         created_by:
 *           type: string
 *           description: Reference to User who created
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