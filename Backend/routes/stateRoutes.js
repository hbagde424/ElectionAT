const express = require('express');
const {
  getStates,
  getStateById,
  createState,
  updateState,
  deleteState
} = require('../controllers/stateController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: States
 *   description: State management
 */

/**
 * @swagger
 * /api/states:
 *   get:
 *     summary: Get all states
 *     tags: [States]
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
 *         description: Search by state name
 *     responses:
 *       200:
 *         description: List of states
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
 *                     $ref: '#/components/schemas/State'
 */
router.get('/', getStates);

/**
 * @swagger
 * /api/states/{id}:
 *   get:
 *     summary: Get single state
 *     tags: [States]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: State data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/State'
 *       404:
 *         description: State not found
 */
router.get('/:id', getStateById);

/**
 * @swagger
 * /api/states:
 *   post:
 *     summary: Create new state
 *     tags: [States]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/State'
 *     responses:
 *       201:
 *         description: State created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
// router.post('/', createState);
router.post('/', protect, authorize('superAdmin'), createState);

/**
 * @swagger
 * /api/states/{id}:
 *   put:
 *     summary: Update state
 *     tags: [States]
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
 *             $ref: '#/components/schemas/State'
 *     responses:
 *       200:
 *         description: State updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: State not found
 */
router.put('/:id', protect, authorize('superAdmin'), updateState);

/**
 * @swagger
 * /api/states/{id}:
 *   delete:
 *     summary: Delete state
 *     tags: [States]
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
 *         description: State deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: State not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteState);

/**
 * @swagger
 * components:
 *   schemas:
 *     State:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the state
 *           example: "California"
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