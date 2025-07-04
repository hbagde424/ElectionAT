const express = require('express');
const {
  getPartyActivities,
  getPartyActivity,
  createPartyActivity,
  updatePartyActivity,
  deletePartyActivity,
  addMediaLink,
  getPartyActivitiesByParty,
  getPartyActivitiesByParliament,
  getPartyActivitiesByDivision,
  getPartyActivitiesByBlock
} = require('../controllers/partyActivityController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Party Activities
 *   description: Party activity management
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
 *         description: Search term for activity titles, descriptions or locations
 *       - in: query
 *         name: party
 *         schema:
 *           type: string
 *         description: Filter by party ID
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
 *       - in: query
 *         name: activity_type
 *         schema:
 *           type: string
 *           enum: [rally, sabha, meeting, campaign, door_to_door, press_conference]
 *         description: Filter by activity type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, cancelled, postponed]
 *         description: Filter by status
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
 *         name: media_coverage
 *         schema:
 *           type: boolean
 *         description: Filter by media coverage
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
router.post('/', protect, createPartyActivity);

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
router.put('/:id', protect, updatePartyActivity);

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
 * /api/party-activities/{id}/media:
 *   post:
 *     summary: Add media link to party activity
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
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: URL to the media content
 *             required:
 *               - url
 *     responses:
 *       200:
 *         description: Media link added successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Party activity not found
 */
router.post('/:id/media', protect, addMediaLink);

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
 *         description: List of party activities for the party
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
 * /api/party-activities/parliament/{parliamentId}:
 *   get:
 *     summary: Get party activities by parliament
 *     tags: [Party Activities]
 *     parameters:
 *       - in: path
 *         name: parliamentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of party activities for the parliament
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
 *         description: Parliament not found
 */
router.get('/parliament/:parliamentId', getPartyActivitiesByParliament);

/**
 * @swagger
 * /api/party-activities/division/{divisionId}:
 *   get:
 *     summary: Get party activities by division
 *     tags: [Party Activities]
 *     parameters:
 *       - in: path
 *         name: divisionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of party activities for the division
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
 *         description: Division not found
 */
router.get('/division/:divisionId', getPartyActivitiesByDivision);

/**
 * @swagger
 * /api/party-activities/block/{blockId}:
 *   get:
 *     summary: Get party activities by block
 *     tags: [Party Activities]
 *     parameters:
 *       - in: path
 *         name: blockId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of party activities for the block
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
 *         description: Block not found
 */
router.get('/block/:blockId', getPartyActivitiesByBlock);

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
 *           description: Type of activity
 *         title:
 *           type: string
 *           description: Title of the activity
 *         description:
 *           type: string
 *           description: Description of the activity
 *         activity_date:
 *           type: string
 *           format: date-time
 *           description: Date and time of the activity
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: End date and time of the activity
 *         location:
 *           type: string
 *           description: Location of the activity
 *         status:
 *           type: string
 *           enum: [scheduled, completed, cancelled, postponed]
 *           description: Current status of the activity
 *         attendance_count:
 *           type: number
 *           description: Number of attendees
 *         media_coverage:
 *           type: boolean
 *           description: Whether there was media coverage
 *         media_links:
 *           type: array
 *           items:
 *             type: string
 *           description: Links to media coverage
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