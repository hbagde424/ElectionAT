const express = require('express');
const {
  getWorkStatuses,
  getWorkStatus,
  createWorkStatus,
  updateWorkStatus,
  deleteWorkStatus,
  getWorkStatusesByBooth
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
 *         description: Search term for work names
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
 *         name: booth
 *         schema:
 *           type: string
 *         description: Booth ID to filter by
 *       - in: query
 *         name: assembly
 *         schema:
 *           type: string
 *         description: Assembly ID to filter by
 *       - in: query
 *         name: creator
 *         schema:
 *           type: string
 *         description: Creator user ID to filter by
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
router.post('/', protect, createWorkStatus);

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
router.put('/:id', protect, updateWorkStatus);

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
router.delete('/:id', protect, authorize('superAdmin'), deleteWorkStatus);

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
 * components:
 *   schemas:
 *     WorkStatus:
 *       type: object
 *       required:
 *         - work_name
 *         - department
 *         - approved_fund
 *         - total_budget
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
 *         approved_fund:
 *           type: number
 *           description: Approved fund amount
 *           example: 500000
 *         total_budget:
 *           type: number
 *           description: Total budget allocated
 *           example: 750000
 *         falia:
 *           type: string
 *           description: Falia name (if applicable)
 *           example: "Main Street"
 *         description:
 *           type: string
 *           description: Work description
 *           example: "Construction of 2km road with drainage"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439011"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *           example: "507f1f77bcf86cd799439012"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *           example: "507f1f77bcf86cd799439013"
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *           example: "507f1f77bcf86cd799439014"
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439015"
 *         created_by:
 *           type: string
 *           description: User who created the record
 *           example: "507f1f77bcf86cd799439016"
 *         updated_by:
 *           type: string
 *           description: User who last updated the record
 *           example: "507f1f77bcf86cd799439017"
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