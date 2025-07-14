const express = require('express');
const {
  getWorkStatuses,
  getWorkStatus,
  createWorkStatus,
  updateWorkStatus,
  deleteWorkStatus,
  addDocument,
  getWorkStatusesByBooth,
  getWorkStatusesByStatus
} = require('../controllers/workStatusController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Work Statuses
 *   description: Work status management
 */

/**
 * @swagger
 * /api/work-statuses:
 *   get:
 *     summary: Get all work statuses
 *     tags: [Work Statuses]
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
 *         description: Search term for work names, descriptions or falia
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (greater than or equal)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (less than or equal)
 *       - in: query
 *         name: minBudget
 *         schema:
 *           type: number
 *         description: Filter by minimum budget
 *       - in: query
 *         name: maxBudget
 *         schema:
 *           type: number
 *         description: Filter by maximum budget
 *       - in: query
 *         name: division
 *         schema:
 *           type: string
 *         description: Filter by division ID
 *       - in: query
 *         name: parliament
 *         schema:
 *           type: string
 *         description: Filter by parliament ID
 *       - in: query
 *         name: assembly
 *         schema:
 *           type: string
 *         description: Filter by assembly ID
 *       - in: query
 *         name: block
 *         schema:
 *           type: string
 *         description: Filter by block ID
 *       - in: query
 *         name: booth
 *         schema:
 *           type: string
 *         description: Filter by booth ID
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
 * /api/work-statuses/{id}:
 *   get:
 *     summary: Get single work status
 *     tags: [Work Statuses]
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
 * /api/work-statuses:
 *   post:
 *     summary: Create new work status
 *     tags: [Work Statuses]
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
router.post('/', protect, authorize('superAdmin', 'superAdmin'), createWorkStatus);

/**
 * @swagger
 * /api/work-statuses/{id}:
 *   put:
 *     summary: Update work status
 *     tags: [Work Statuses]
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
 * /api/work-statuses/{id}:
 *   delete:
 *     summary: Delete work status
 *     tags: [Work Statuses]
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
router.delete('/:id', protect, authorize('superAdmin', 'superAdmin'), deleteWorkStatus);

/**
 * @swagger
 * /api/work-statuses/{id}/documents:
 *   post:
 *     summary: Add document to work status
 *     tags: [Work Statuses]
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the document
 *               url:
 *                 type: string
 *                 description: URL to the document
 *             required:
 *               - name
 *               - url
 *     responses:
 *       200:
 *         description: Document added successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Work status not found
 */
router.post('/:id/documents', protect, addDocument);

/**
 * @swagger
 * /api/work-statuses/booth/{boothId}:
 *   get:
 *     summary: Get work statuses by booth
 *     tags: [Work Statuses]
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
 * /api/work-statuses/status/{status}:
 *   get:
 *     summary: Get work statuses by status
 *     tags: [Work Statuses]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Halted, Cancelled]
 *     responses:
 *       200:
 *         description: List of work statuses with the specified status
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
 *       400:
 *         description: Invalid status
 */
router.get('/status/:status', getWorkStatusesByStatus);

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
 *         department:
 *           type: string
 *           description: Department responsible for the work
 *         status:
 *           type: string
 *           enum: [Pending, In Progress, Completed, Halted, Cancelled]
 *           description: Current status of the work
 *         approved_fund_from:
 *           type: string
 *           enum: [vidhayak nidhi, swechcha nidhi]
 *           description: Source of approved funds
 *         total_budget:
 *           type: number
 *           description: Total budget allocated for the work
 *         spent_amount:
 *           type: number
 *           description: Amount spent so far
 *         falia:
 *           type: string
 *           description: Falia name/location
 *         description:
 *           type: string
 *           description: Detailed description of the work
 *         start_date:
 *           type: string
 *           format: date
 *           description: Work start date
 *         expected_end_date:
 *           type: string
 *           format: date
 *           description: Expected work completion date
 *         actual_end_date:
 *           type: string
 *           format: date
 *           description: Actual work completion date
 *         state_id:
 *           type: string
 *           description: Reference to State
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *         documents:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Document name
 *               url:
 *                 type: string
 *                 description: Document URL
 *               uploaded_at:
 *                 type: string
 *                 format: date-time
 *                 description: Upload timestamp
 *         created_by:
 *           type: string
 *           description: Reference to User who created the record
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated the record
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