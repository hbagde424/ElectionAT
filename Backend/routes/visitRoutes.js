const express = require('express');
const {
  getVisits,
  getVisit,
  createVisit,
  updateVisit,
  deleteVisit,
  getVisitsByBooth,
  getVisitsByDateRange,
  getVisitsByStatus
} = require('../controllers/visitController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Visits
 *   description: Visit management
 */

/**
 * @swagger
 * /api/visits:
 *   get:
 *     summary: Get all visits
 *     tags: [Visits]
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
 *         name: work_status
 *         schema:
 *           type: string
 *           enum: [announced, approved, in progress, complete]
 *         description: Filter by work status
 *     responses:
 *       200:
 *         description: List of visits
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
 *                     $ref: '#/components/schemas/Visit'
 */
router.get('/', getVisits);

/**
 * @swagger
 * /api/visits/{id}:
 *   get:
 *     summary: Get single visit
 *     tags: [Visits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Visit data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Visit'
 *       404:
 *         description: Visit not found
 */
router.get('/:id', getVisit);

/**
 * @swagger
 * /api/visits:
 *   post:
 *     summary: Create new visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Visit'
 *     responses:
 *       201:
 *         description: Visit created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('admin', 'superAdmin'), createVisit);

/**
 * @swagger
 * /api/visits/{id}:
 *   put:
 *     summary: Update visit
 *     tags: [Visits]
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
 *             $ref: '#/components/schemas/Visit'
 *     responses:
 *       200:
 *         description: Visit updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Visit not found
 */
router.put('/:id', protect, authorize('admin', 'superAdmin'), updateVisit);

/**
 * @swagger
 * /api/visits/{id}:
 *   delete:
 *     summary: Delete visit
 *     tags: [Visits]
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
 *         description: Visit deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Visit not found
 */
router.delete('/:id', protect, authorize('admin', 'superAdmin'), deleteVisit);

/**
 * @swagger
 * /api/visits/booth/{boothId}:
 *   get:
 *     summary: Get visits by booth
 *     tags: [Visits]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of visits for the booth
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
 *                     $ref: '#/components/schemas/Visit'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', getVisitsByBooth);

/**
 * @swagger
 * /api/visits/status/{status}:
 *   get:
 *     summary: Get visits by work status
 *     tags: [Visits]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [announced, approved, in progress, complete]
 *     responses:
 *       200:
 *         description: List of visits with the specified status
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
 *                     $ref: '#/components/schemas/Visit'
 */
router.get('/status/:status', getVisitsByStatus);

/**
 * @swagger
 * /api/visits/date-range:
 *   get:
 *     summary: Get visits by date range
 *     tags: [Visits]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of visits within the date range
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
 *                     $ref: '#/components/schemas/Visit'
 */
router.get('/date-range', getVisitsByDateRange);

/**
 * @swagger
 * components:
 *   schemas:
 *     Visit:
 *       type: object
 *       required:
 *         - state_id
 *         - division_id
 *         - assembly_id
 *         - parliament_id
 *         - block_id
 *         - booth_id
 *         - person_name
 *         - post
 *         - date
 *         - work_status
 *         - created_by
 *       properties:
 *         state_id:
 *           type: string
 *           description: Reference to State
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *         person_name:
 *           type: string
 *           description: Name of the visiting person
 *         post:
 *           type: string
 *           description: Post/position of the visiting person
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date of visit
 *         work_status:
 *           type: string
 *           enum: [announced, approved, in progress, complete]
 *           description: Status of the work
 *         declaration:
 *           type: string
 *           description: Declaration made during visit
 *         remark:
 *           type: string
 *           description: Additional remarks
 *         created_by:
 *           type: string
 *           description: Reference to User who created
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated
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