const express = require('express');
const {
  getStatuses,
  getStatus,
  createStatus,
  updateStatus,
  deleteStatus,
  toggleStatusActive
} = require('../controllers/statusController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Statuses
 *   description: Status management
 */

/**
 * @swagger
 * /api/statuses:
 *   get:
 *     summary: Get all statuses
 *     tags: [Statuses]
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
 *         description: Search term for status names or descriptions
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: system
 *         schema:
 *           type: boolean
 *         description: Filter by system status
 *     responses:
 *       200:
 *         description: List of statuses
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
 *                     $ref: '#/components/schemas/Status'
 */
router.get('/', getStatuses);

/**
 * @swagger
 * /api/statuses/{id}:
 *   get:
 *     summary: Get single status
 *     tags: [Statuses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Status'
 *       404:
 *         description: Status not found
 */
router.get('/:id', getStatus);

/**
 * @swagger
 * /api/statuses:
 *   post:
 *     summary: Create new status
 *     tags: [Statuses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Status'
 *     responses:
 *       201:
 *         description: Status created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
// router.post('/',  createStatus);
router.post('/', protect, authorize('admin', 'superAdmin'), createStatus);

/**
 * @swagger
 * /api/statuses/{id}:
 *   put:
 *     summary: Update status
 *     tags: [Statuses]
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
 *             $ref: '#/components/schemas/Status'
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Status not found
 */
router.put('/:id', protect, authorize('admin', 'superAdmin'), updateStatus);

/**
 * @swagger
 * /api/statuses/{id}:
 *   delete:
 *     summary: Delete status
 *     tags: [Statuses]
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
 *         description: Status deleted
 *       400:
 *         description: Cannot delete system status
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Status not found
 */
router.delete('/:id', protect, authorize('admin', 'superAdmin'), deleteStatus);

/**
 * @swagger
 * /api/statuses/{id}/toggle-active:
 *   patch:
 *     summary: Toggle status active state
 *     tags: [Statuses]
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
 *         description: Status active state toggled
 *       400:
 *         description: Cannot deactivate system status
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Status not found
 */
router.patch('/:id/toggle-active', protect, authorize('admin', 'superAdmin'), toggleStatusActive);

/**
 * @swagger
 * components:
 *   schemas:
 *     Status:
 *       type: object
 *       required:
 *         - name
 *         - created_by
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the status
 *         description:
 *           type: string
 *           description: Description of the status
 *         is_active:
 *           type: boolean
 *           description: Whether the status is active
 *         is_system:
 *           type: boolean
 *           description: Whether this is a system status (cannot be modified)
 *         color_code:
 *           type: string
 *           description: Color code for UI representation (hex format)
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