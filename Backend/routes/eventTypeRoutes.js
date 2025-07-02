const express = require('express');
const {
  getEventTypes,
  getEventType,
  createEventType,
  updateEventType,
  deleteEventType,
  toggleEventTypeStatus
} = require('../controllers/eventTypeController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Event Types
 *   description: Event type management
 */

/**
 * @swagger
 * /api/event-types:
 *   get:
 *     summary: Get all event types
 *     tags: [Event Types]
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
 *         description: Search term for event type names or descriptions
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of event types
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
 *                     $ref: '#/components/schemas/EventType'
 */
router.get('/', getEventTypes);

/**
 * @swagger
 * /api/event-types/{id}:
 *   get:
 *     summary: Get single event type
 *     tags: [Event Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event type data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventType'
 *       404:
 *         description: Event type not found
 */
router.get('/:id', getEventType);

/**
 * @swagger
 * /api/event-types:
 *   post:
 *     summary: Create new event type
 *     tags: [Event Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventType'
 *     responses:
 *       201:
 *         description: Event type created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('admin', 'superAdmin'), createEventType);

/**
 * @swagger
 * /api/event-types/{id}:
 *   put:
 *     summary: Update event type
 *     tags: [Event Types]
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
 *             $ref: '#/components/schemas/EventType'
 *     responses:
 *       200:
 *         description: Event type updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Event type not found
 */
router.put('/:id', protect, authorize('admin', 'superAdmin'), updateEventType);

/**
 * @swagger
 * /api/event-types/{id}:
 *   delete:
 *     summary: Delete event type
 *     tags: [Event Types]
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
 *         description: Event type deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Event type not found
 */
router.delete('/:id', protect, authorize('admin', 'superAdmin'), deleteEventType);

/**
 * @swagger
 * /api/event-types/{id}/toggle-status:
 *   patch:
 *     summary: Toggle event type status
 *     tags: [Event Types]
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
 *         description: Event type status toggled
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Event type not found
 */
router.patch('/:id/toggle-status', protect, authorize('admin', 'superAdmin'), toggleEventTypeStatus);

/**
 * @swagger
 * components:
 *   schemas:
 *     EventType:
 *       type: object
 *       required:
 *         - name
 *         - created_by
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the event type
 *         description:
 *           type: string
 *           description: Description of the event type
 *         is_active:
 *           type: boolean
 *           description: Whether the event type is active
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