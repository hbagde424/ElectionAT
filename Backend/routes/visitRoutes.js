const express = require('express');
const {
  getVisits,
  getVisit,
  createVisit,
  updateVisit,
  deleteVisit,
  getVisitsByBooth
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for person names
 *       - in: query
 *         name: booth
 *         schema:
 *           type: string
 *         description: Booth ID to filter by
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
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
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
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
// router.post('/', createVisit);
router.post('/', protect,  createVisit);
// router.post('/', protect, authorize('admin'), createVisit);

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
router.put('/:id', protect, authorize('admin'), updateVisit);

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
router.delete('/:id', protect, authorize('admin'), deleteVisit);

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
 * components:
 *   schemas:
 *     Visit:
 *       type: object
 *       required:
 *         - booth_id
 *         - block_id
 *         - assembly_id
 *         - parliament_id
 *         - division_id
 *         - person_name
 *         - post
 *         - date
 *       properties:
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *         person_name:
 *           type: string
 *           description: Name of visiting person
 *           example: "John Doe"
 *         post:
 *           type: string
 *           description: Post/Designation of visiting person
 *           example: "MLA"
 *         date:
 *           type: string
 *           format: date-time
 *           description: Visit date
 *           example: "2023-05-15T10:00:00Z"
 *         declaration:
 *           type: string
 *           description: Declaration made during visit
 *         remark:
 *           type: string
 *           description: Additional remarks
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