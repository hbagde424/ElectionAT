const express = require('express');
const {
  getPartyActivities,
  getPartyActivity,
  createPartyActivity,
  updatePartyActivity,
  deletePartyActivity,
  getPartyActivitiesByParty,
  getUpcomingPartyActivities
} = require('../controllers/partyActivityController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Party Activities
 *   description: Political party activity management
 */

/**
 * @swagger
 * /api/party-activities:
 *   get:
 *     summary: Get all party activities
 *     tags: [Party Activities]
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
 *         description: Search term for activity title, description or location
 *       - in: query
 *         name: party
 *         schema:
 *           type: string
 *         description: Party ID to filter by
 *       - in: query
 *         name: activity_type
 *         schema:
 *           type: string
 *           enum: [rally, sabha, meeting, campaign, door_to_door, press_conference]
 *         description: Activity type to filter by
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, cancelled, postponed]
 *         description: Status to filter by
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for date range filter
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for date range filter
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
 *         description: List of party activities
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
 *                     $ref: '#/components/schemas/PartyActivity'
 */
router.get('/', getPartyActivities);

/**
 * @swagger
 * /api/party-activities/{id}:
 *   get:
 *     summary: Get single party activity
 *     tags: [Party Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Party activity data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PartyActivity'
 *       404:
 *         description: Party activity not found
 */
router.get('/:id', getPartyActivity);

/**
 * @swagger
 * /api/party-activities:
 *   post:
 *     summary: Create new party activity
 *     tags: [Party Activities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PartyActivity'
 *     responses:
 *       201:
 *         description: Party activity created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('admin', 'superAdmin'), createPartyActivity);

/**
 * @swagger
 * /api/party-activities/{id}:
 *   put:
 *     summary: Update party activity
 *     tags: [Party Activities]
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
 *             $ref: '#/components/schemas/PartyActivity'
 *     responses:
 *       200:
 *         description: Party activity updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Party activity not found
 */
router.put('/:id', protect, authorize('admin', 'superAdmin'), updatePartyActivity);

/**
 * @swagger
 * /api/party-activities/{id}:
 *   delete:
 *     summary: Delete party activity
 *     tags: [Party Activities]
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
 *         description: Party activity deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Party activity not found
 */
router.delete('/:id', protect, authorize('admin', 'superAdmin'), deletePartyActivity);

/**
 * @swagger
 * /api/party-activities/party/{partyId}:
 *   get:
 *     summary: Get party activities by party
 *     tags: [Party Activities]
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of party activities for the specified party
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
 *                     $ref: '#/components/schemas/PartyActivity'
 *       404:
 *         description: Party not found
 */
router.get('/party/:partyId', getPartyActivitiesByParty);

/**
 * @swagger
 * /api/party-activities/upcoming:
 *   get:
 *     summary: Get upcoming party activities
 *     tags: [Party Activities]
 *     responses:
 *       200:
 *         description: List of upcoming party activities
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
 *                     $ref: '#/components/schemas/PartyActivity'
 */
router.get('/upcoming', getUpcomingPartyActivities);

/**
 * @swagger
 * components:
 *   schemas:
 *     PartyActivity:
 *       type: object
 *       required:
 *         - party_id
 *         - parliament_id
 *         - activity_type
 *         - title
 *         - activity_date
 *         - created_by
 *       properties:
 *         party_id:
 *           type: string
 *           description: Reference to Party
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
 *         activity_type:
 *           type: string
 *           enum: [rally, sabha, meeting, campaign, door_to_door, press_conference]
 *           description: Type of activity
 *           example: "rally"
 *         title:
 *           type: string
 *           description: Title of the activity
 *           example: "Election Campaign Kickoff"
 *         description:
 *           type: string
 *           description: Detailed description of the activity
 *           example: "Annual election campaign kickoff with party leaders"
 *         activity_date:
 *           type: string
 *           format: date-time
 *           description: Scheduled date and time of the activity
 *           example: "2023-05-15T10:00:00Z"
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: End date and time of the activity
 *           example: "2023-05-15T14:00:00Z"
 *         location:
 *           type: string
 *           description: Physical location of the activity
 *           example: "Central Park, Main Stage"
 *         status:
 *           type: string
 *           enum: [scheduled, completed, cancelled, postponed]
 *           description: Current status of the activity
 *           example: "scheduled"
 *         attendance_count:
 *           type: integer
 *           description: Number of attendees
 *           example: 500
 *         media_coverage:
 *           type: boolean
 *           description: Whether the event had media coverage
 *           example: true
 *         media_links:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           description: Links to media coverage
 *           example: ["https://example.com/news/event-coverage"]
 *         created_by:
 *           type: string
 *           description: Reference to User who created the activity
 *           example: "507f1f77bcf86cd799439022"
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated the activity
 *           example: "507f1f77bcf86cd799439022"
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