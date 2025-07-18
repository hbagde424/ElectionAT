const express = require('express');
const router = express.Router();
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

/**
 * @swagger
 * components:
 *   schemas:
 *     PartyActivity:
 *       type: object
 *       required:
 *         - party_id
 *         - state_id
 *         - parliament_id
 *         - activity_type
 *         - title
 *         - activity_date
 *         - created_by
 *       properties:
 *         party_id:
 *           type: string
 *           description: Reference to Party
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
 *         activity_type:
 *           type: string
 *           enum: [rally, sabha, meeting, campaign, door_to_door, press_conference]
 *         title:
 *           type: string
 *           maxLength: 200
 *         description:
 *           type: string
 *           maxLength: 1000
 *         activity_date:
 *           type: string
 *           format: date-time
 *         end_date:
 *           type: string
 *           format: date-time
 *         location:
 *           type: string
 *           maxLength: 200
 *         status:
 *           type: string
 *           enum: [scheduled, completed, cancelled, postponed]
 *           default: scheduled
 *         attendance_count:
 *           type: integer
 *           minimum: 0
 *         media_coverage:
 *           type: boolean
 *           default: false
 *         media_links:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *         created_by:
 *           type: string
 *           description: Reference to User who created
 *         updated_by:
 *           type: string
 *           description: Reference to User who updated
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
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: party
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *       - in: query
 *         name: activity_type
 *         schema:
 *           type: string
 *           enum: [rally, sabha, meeting, campaign, door_to_door, press_conference]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, cancelled, postponed]
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: division
 *         schema:
 *           type: string
 *       - in: query
 *         name: parliament
 *         schema:
 *           type: string
 *       - in: query
 *         name: assembly
 *         schema:
 *           type: string
 *       - in: query
 *         name: block
 *         schema:
 *           type: string
 *       - in: query
 *         name: booth
 *         schema:
 *           type: string
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
 *         description: List of upcoming activities
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

module.exports = router;