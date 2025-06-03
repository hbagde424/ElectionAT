const express = require('express');
const {
  getPartyActivities,
  getPartyActivityById,
  createPartyActivity,
  updatePartyActivity,
  deletePartyActivity,
  getActivitiesByParty,
  getActivitiesByAssembly,
  getActivitiesByBooth,
  getActivitiesByType,
  getActivitiesByStatus
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
 *         name: party
 *         schema:
 *           type: string
 *         description: Filter by party ID
 *       - in: query
 *         name: assembly
 *         schema:
 *           type: string
 *         description: Filter by assembly ID
 *       - in: query
 *         name: booth
 *         schema:
 *           type: string
 *         description: Filter by booth ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [rally, sabha, meeting, campaign, door_to_door, press_conference]
 *         description: Filter by activity type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, cancelled, postponed]
 *         description: Filter by activity status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter activities after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter activities before this date
 *       - in: query
 *         name: mediaCoverage
 *         schema:
 *           type: boolean
 *         description: Filter by media coverage presence
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
 *         description: Activity not found
 */
router.get('/:id', getPartyActivityById);

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
 *         description: Activity created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/',  createPartyActivity);
// router.post('/', protect, authorize('admin', 'editor'), createPartyActivity);

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
 *         description: Activity updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Activity not found
 */
router.put('/:id', protect, authorize('admin', 'editor'), updatePartyActivity);

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
 *         description: Activity deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Activity not found
 */
router.delete('/:id', protect, authorize('admin'), deletePartyActivity);

/**
 * @swagger
 * /api/party-activities/party/{partyId}:
 *   get:
 *     summary: Get activities by party ID
 *     tags: [Party Activities]
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of activities for the party
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
router.get('/party/:partyId', getActivitiesByParty);

/**
 * @swagger
 * /api/party-activities/assembly/{assemblyId}:
 *   get:
 *     summary: Get activities by assembly ID
 *     tags: [Party Activities]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of activities for the assembly
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
 *         description: Assembly not found
 */
router.get('/assembly/:assemblyId', getActivitiesByAssembly);

/**
 * @swagger
 * /api/party-activities/booth/{boothId}:
 *   get:
 *     summary: Get activities by booth ID
 *     tags: [Party Activities]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of activities for the booth
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
 *         description: Booth not found
 */
router.get('/booth/:boothId', getActivitiesByBooth);

/**
 * @swagger
 * /api/party-activities/type/{activityType}:
 *   get:
 *     summary: Get activities by type
 *     tags: [Party Activities]
 *     parameters:
 *       - in: path
 *         name: activityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [rally, sabha, meeting, campaign, door_to_door, press_conference]
 *     responses:
 *       200:
 *         description: List of activities of specified type
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
router.get('/type/:activityType', getActivitiesByType);

/**
 * @swagger
 * /api/party-activities/status/{status}:
 *   get:
 *     summary: Get activities by status
 *     tags: [Party Activities]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, cancelled, postponed]
 *     responses:
 *       200:
 *         description: List of activities with specified status
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
router.get('/status/:status', getActivitiesByStatus);

/**
 * @swagger
 * components:
 *   schemas:
 *     PartyActivity:
 *       type: object
 *       required:
 *         - party_id
 *         - activity_type
 *         - title
 *         - activity_date
 *         - created_by
 *       properties:
 *         party_id:
 *           type: string
 *           description: Reference to Party
 *           example: "507f1f77bcf86cd799439011"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *           example: "507f1f77bcf86cd799439012"
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439013"
 *         activity_type:
 *           type: string
 *           enum: [rally, sabha, meeting, campaign, door_to_door, press_conference]
 *           description: Type of political activity
 *           example: "rally"
 *         title:
 *           type: string
 *           description: Title of the activity
 *           example: "Election Rally in Downtown"
 *         description:
 *           type: string
 *           description: Detailed description of the activity
 *           example: "Annual election rally with party leaders"
 *         activity_date:
 *           type: string
 *           format: date-time
 *           description: Date and time of the activity
 *           example: "2023-05-15T10:00:00Z"
 *         status:
 *           type: string
 *           enum: [scheduled, completed, cancelled, postponed]
 *           description: Current status of the activity
 *           example: "scheduled"
 *         created_by:
 *           type: string
 *           description: Reference to User who created the activity
 *           example: "507f1f77bcf86cd799439014"
 *         attendance_count:
 *           type: integer
 *           description: Number of attendees
 *           example: 5000
 *         media_coverage:
 *           type: boolean
 *           description: Whether the activity had media coverage
 *           example: true
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