const express = require('express');
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByBooth,
  getEventsByType
} = require('../controllers/eventController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management
 */

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
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
 *         name: state_id
 *         schema:
 *           type: string
 *         description: State ID to filter by
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for event details
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [event, campaign, activity]
 *         description: Event type to filter by
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [done, incomplete, cancelled, postponed]
 *         description: Status to filter by
 *       - in: query
 *         name: division_id
 *         schema:
 *           type: string
 *         description: Division ID to filter by
 *       - in: query
 *         name: parliament_id
 *         schema:
 *           type: string
 *         description: Parliament ID to filter by
 *       - in: query
 *         name: assembly_id
 *         schema:
 *           type: string
 *         description: Assembly ID to filter by
 *       - in: query
 *         name: block_id
 *         schema:
 *           type: string
 *         description: Block ID to filter by
 *       - in: query
 *         name: booth_id
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
 *         description: List of events
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
 *                     $ref: '#/components/schemas/Event'
 */
router.get('/', getEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get single event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 */
router.get('/:id', getEvent);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin', 'organizer'), createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update event
 *     tags: [Events]
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
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Event not found
 */
router.put('/:id', protect, authorize('superAdmin', 'organizer'), updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete event
 *     tags: [Events]
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
 *         description: Event deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Event not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteEvent);

/**
 * @swagger
 * /api/events/booth/{boothId}:
 *   get:
 *     summary: Get events by booth
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of events for the booth
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
 *                     $ref: '#/components/schemas/Event'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', getEventsByBooth);

/**
 * @swagger
 * /api/events/type/{type}:
 *   get:
 *     summary: Get events by type
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [event, campaign, activity]
 *     responses:
 *       200:
 *         description: List of events of the specified type
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
 *                     $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid event type
 */
router.get('/type/:type', getEventsByType);

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - division_id
 *         - parliament_id
 *         - assembly_id
 *         - block_id
 *         - booth_id
 *         - created_by
 *       properties:
 *         name:
 *           type: string
 *           description: Event name
 *           example: "Campaign Rally"
 *         type:
 *           type: string
 *           enum: [event, campaign, activity]
 *           description: Event type
 *           example: "campaign"
 *         status:
 *           type: string
 *           enum: [done, incomplete, cancelled, postponed]
 *           description: Event status
 *           example: "incomplete"
 *         description:
 *           type: string
 *           description: Event description
 *           example: "Annual campaign rally with key speakers"
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: Event start date and time
 *           example: "2023-06-15T10:00:00Z"
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: Event end date and time
 *           example: "2023-06-15T14:00:00Z"
 *         location:
 *           type: string
 *           description: Event location
 *           example: "Central Park, New York"
 *          state_id:
 *           type: string
 *           description: Reference to State
 *           example: "507f1f77bcf86cd799439010"
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
 *           description: Reference to User who created the event
 *           example: "507f1f77bcf86cd799439016"
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated the event
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