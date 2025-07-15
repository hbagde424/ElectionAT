const express = require('express');
const {
  getWorkStatuses,
  getWorkStatus,
  createWorkStatus,
  updateWorkStatus,
  deleteWorkStatus,
  getWorkStatusesByBooth,
  getWorkStatusesByBlock,
  getWorkStatusesByAssembly,
  getWorkStatusStatistics
} = require('../controllers/workStatusController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Work Status
 *   description: Work status management
 */

/**
 * @swagger
 * /api/work-status:
 *   get:
 *     summary: Get all work statuses
 *     tags: [Work Status]
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
 *         description: Search term for work name, description, or falia
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Halted, Cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: fund_source
 *         schema:
 *           type: string
 *           enum: [vidhayak nidhi, swechcha nidhi]
 *         description: Filter by approved fund source
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
 *       - in: query
 *         name: start_date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date from
 *       - in: query
 *         name: start_date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date to
 *       - in: query
 *         name: end_date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by expected end date from
 *       - in: query
 *         name: end_date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by expected end date to
 *     responses:
 *       200:
 *         description: List of work statuses
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
 *                     $ref: '#/components/schemas/WorkStatus'
 */
router.get('/', getWorkStatuses);

/**
 * @swagger
 * /api/work-status/statistics:
 *   get:
 *     summary: Get work status statistics
 *     tags: [Work Status]
 *     responses:
 *       200:
 *         description: Work status statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       totalBudget:
 *                         type: number
 *                       totalSpent:
 *                         type: number
 */
router.get('/statistics', getWorkStatusStatistics);

/**
 * @swagger
 * /api/work-status/{id}:
 *   get:
 *     summary: Get single work status
 *     tags: [Work Status]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Work status data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkStatus'
 *       404:
 *         description: Work status not found
 */
router.get('/:id', getWorkStatus);

/**
 * @swagger
 * /api/work-status:
 *   post:
 *     summary: Create new work status
 *     tags: [Work Status]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkStatus'
 *     responses:
 *       201:
 *         description: Work status created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('admin', 'superAdmin'), createWorkStatus);

/**
 * @swagger
 * /api/work-status/{id}:
 *   put:
 *     summary: Update work status
 *     tags: [Work Status]
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
 *             $ref: '#/components/schemas/WorkStatus'
 *     responses:
 *       200:
 *         description: Work status updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Work status not found
 */
router.put('/:id', protect, authorize('admin', 'superAdmin'), updateWorkStatus);

/**
 * @swagger
 * /api/work-status/{id}:
 *   delete:
 *     summary: Delete work status
 *     tags: [Work Status]
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
 *         description: Work status deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Work status not found
 */
router.delete('/:id', protect, authorize('admin', 'superAdmin'), deleteWorkStatus);

/**
 * @swagger
 * /api/work-status/booth/{boothId}:
 *   get:
 *     summary: Get work statuses by booth
 *     tags: [Work Status]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of work statuses for the booth
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
 *                     $ref: '#/components/schemas/WorkStatus'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', getWorkStatusesByBooth);

/**
 * @swagger
 * /api/work-status/block/{blockId}:
 *   get:
 *     summary: Get work statuses by block
 *     tags: [Work Status]
 *     parameters:
 *       - in: path
 *         name: blockId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of work statuses for the block
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
 *                     $ref: '#/components/schemas/WorkStatus'
 *       404:
 *         description: Block not found
 */
router.get('/block/:blockId', getWorkStatusesByBlock);

/**
 * @swagger
 * /api/work-status/assembly/{assemblyId}:
 *   get:
 *     summary: Get work statuses by assembly
 *     tags: [Work Status]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of work statuses for the assembly
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
 *                     $ref: '#/components/schemas/WorkStatus'
 *       404:
 *         description: Assembly not found
 */
router.get('/assembly/:assemblyId', getWorkStatusesByAssembly);

/**
 * @swagger
 * components:
 *   schemas:
 *     WorkStatus:
 *       type: object
 *       required:
 *         - work_name
 *         - department
 *         - approved_fund_from
 *         - total_budget
 *         - start_date
 *         - expected_end_date
 *         - state_id
 *         - division_id
 *         - parliament_id
 *         - assembly_id
 *         - block_id
 *         - booth_id
 *         - created_by
 *       properties:
 *         work_name:
 *           type: string
 *           description: Name of the work
 *           example: "Road Construction"
 *         department:
 *           type: string
 *           description: Department responsible
 *           example: "Public Works"
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Halted, Cancelled]
 *           description: Current status of the work
 *           example: "In Progress"
 *         approved_fund_from:
 *           type: string
 *           enum: [vidhayak nidhi, swechcha nidhi]
 *           description: Source of approved funds
 *           example: "vidhayak nidhi"
 *         total_budget:
 *           type: number
 *           description: Total approved budget
 *           example: 500000
 *         spent_amount:
 *           type: number
 *           description: Amount spent so far
 *           example: 250000
 *         falia:
 *           type: string
 *           description: Falia/area name
 *           example: "Main Road"
 *         description:
 *           type: string
 *           description: Detailed description of the work
 *           example: "Construction of 2km road with drainage"
 *         start_date:
 *           type: string
 *           format: date
 *           description: Work start date
 *           example: "2023-01-15"
 *         expected_end_date:
 *           type: string
 *           format: date
 *           description: Expected completion date
 *           example: "2023-06-30"
 *         actual_end_date:
 *           type: string
 *           format: date
 *           description: Actual completion date
 *           example: "2023-07-15"
 *         state_id:
 *           type: string
 *           description: Reference to State
 *           example: "507f1f77bcf86cd799439011"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439012"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *           example: "507f1f77bcf86cd799439013"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *           example: "507f1f77bcf86cd799439014"
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *           example: "507f1f77bcf86cd799439015"
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439016"
 *         documents:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Document name
 *                 example: "Approval Letter"
 *               url:
 *                 type: string
 *                 description: Document URL
 *                 example: "https://example.com/docs/approval.pdf"
 *               uploaded_at:
 *                 type: string
 *                 format: date-time
 *                 description: Upload timestamp
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
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;