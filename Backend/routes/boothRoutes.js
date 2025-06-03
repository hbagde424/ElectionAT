const express = require('express');
const {
  getDistricts,
  getDistrictById,
  createDistrict,
  updateDistrict,
  deleteDistrict,
  getDistrictsByDivision
} = require('../controllers/districtController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Districts
 *   description: District management
 */

/**
 * @swagger
 * /api/districts:
 *   get:
 *     summary: Get all districts
 *     tags: [Districts]
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
 *         name: division
 *         schema:
 *           type: string
 *         description: Filter by division ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by district name
 *     responses:
 *       200:
 *         description: List of districts
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
 *                     $ref: '#/components/schemas/District'
 */
router.get('/', getDistricts);

/**
 * @swagger
 * /api/districts/division/{divisionId}:
 *   get:
 *     summary: Get districts by division
 *     tags: [Districts]
 *     parameters:
 *       - in: path
 *         name: divisionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of districts in the division
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/District'
 */
router.get('/division/:divisionId', getDistrictsByDivision);

/**
 * @swagger
 * /api/districts/{id}:
 *   get:
 *     summary: Get single district
 *     tags: [Districts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: District data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/District'
 *       404:
 *         description: District not found
 */
router.get('/:id', getDistrictById);

/**
 * @swagger
 * /api/districts:
 *   post:
 *     summary: Create new district
 *     tags: [Districts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/District'
 *     responses:
 *       201:
 *         description: District created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('admin'), createDistrict);

/**
 * @swagger
 * /api/districts/{id}:
 *   put:
 *     summary: Update district
 *     tags: [Districts]
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
 *             $ref: '#/components/schemas/District'
 *     responses:
 *       200:
 *         description: District updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: District not found
 */
router.put('/:id', protect, authorize('admin'), updateDistrict);

/**
 * @swagger
 * /api/districts/{id}:
 *   delete:
 *     summary: Delete district
 *     tags: [Districts]
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
 *         description: District deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: District not found
 */
router.delete('/:id', protect, authorize('admin'), deleteDistrict);

/**
 * @swagger
 * components:
 *   schemas:
 *     District:
 *       type: object
 *       required:
 *         - name
 *         - division_id
 *       properties:
 *         name:
 *           type: string
 *           description: District name
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament constituency
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;