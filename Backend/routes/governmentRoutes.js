const express = require('express');
const {
  getGovernments,
  getGovernment,
  createGovernment,
  updateGovernment,
  deleteGovernment,
  getGovernmentsByState,
  getGovernmentsByAssembly
} = require('../controllers/governmentController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Governments
 *   description: Government project management
 */

/**
 * @swagger
 * /api/governments:
 *   get:
 *     summary: Get all government projects
 *     tags: [Governments]
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
 *         description: Search term for project names
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [new, old]
 *         description: Filter by project type
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
 *       - in: query
 *         name: parliament
 *         schema:
 *           type: string
 *         description: Parliament ID to filter by
 *       - in: query
 *         name: assembly
 *         schema:
 *           type: string
 *         description: Assembly ID to filter by
 *       - in: query
 *         name: block
 *         schema:
 *           type: string
 *         description: Block ID to filter by
 *       - in: query
 *         name: booth
 *         schema:
 *           type: string
 *         description: Booth ID to filter by
 *     responses:
 *       200:
 *         description: List of government projects
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
 *                     $ref: '#/components/schemas/Government'
 */
router.get('/', getGovernments);

/**
 * @swagger
 * /api/governments/{id}:
 *   get:
 *     summary: Get single government project
 *     tags: [Governments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Government project data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Government'
 *       404:
 *         description: Government project not found
 */
router.get('/:id', getGovernment);

/**
 * @swagger
 * /api/governments:
 *   post:
 *     summary: Create new government project
 *     tags: [Governments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Government'
 *     responses:
 *       201:
 *         description: Government project created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin'), createGovernment);

/**
 * @swagger
 * /api/governments/{id}:
 *   put:
 *     summary: Update government project
 *     tags: [Governments]
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
 *             $ref: '#/components/schemas/Government'
 *     responses:
 *       200:
 *         description: Government project updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Government project not found
 */
router.put('/:id', protect, authorize('superAdmin'), updateGovernment);

/**
 * @swagger
 * /api/governments/{id}:
 *   delete:
 *     summary: Delete government project
 *     tags: [Governments]
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
 *         description: Government project deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Government project not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteGovernment);

/**
 * @swagger
 * /api/governments/state/{stateId}:
 *   get:
 *     summary: Get government projects by state
 *     tags: [Governments]
 *     parameters:
 *       - in: path
 *         name: stateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of government projects for the state
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
 *                     $ref: '#/components/schemas/Government'
 *       404:
 *         description: State not found
 */
router.get('/state/:stateId', getGovernmentsByState);

/**
 * @swagger
 * /api/governments/assembly/{assemblyId}:
 *   get:
 *     summary: Get government projects by assembly
 *     tags: [Governments]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of government projects for the assembly
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
 *                     $ref: '#/components/schemas/Government'
 *       404:
 *         description: Assembly not found
 */
router.get('/assembly/:assemblyId', getGovernmentsByAssembly);

/**
 * @swagger
 * components:
 *   schemas:
 *     Government:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - amount
 *         - state_id
 *         - division_id
 *         - parliament_id
 *         - assembly_id
 *         - block_id
 *         - created_by
 *       properties:
 *         name:
 *           type: string
 *           description: Project name
 *           example: "Road Construction"
 *         type:
 *           type: string
 *           enum: [new, old]
 *           description: Project type
 *           example: "new"
 *         project_complete_date:
 *           type: string
 *           format: date
 *           description: Project completion date
 *           example: "2023-12-31"
 *         amount:
 *           type: number
 *           description: Project budget amount
 *           example: 5000000
 *         state_id:
 *           type: string
 *           description: Reference to State
 *           example: "507f1f77bcf86cd799439016"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439015"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *           example: "507f1f77bcf86cd799439013"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *           example: "507f1f77bcf86cd799439012"
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *           example: "507f1f77bcf86cd799439011"
 *         booth_id:
 *           type: string
 *           description: Reference to Booth (optional)
 *           example: "507f1f77bcf86cd799439021"
 *         created_by:
 *           type: string
 *           description: Reference to User who created
 *           example: "507f1f77bcf86cd799439022"
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated
 *           example: "507f1f77bcf86cd799439022"
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