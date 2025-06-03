const express = require('express');
const {
  getVolunteers,
  getVolunteerById,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
  getVolunteersByBooth,
  getVolunteersByParty,
  getVolunteersByActivityLevel
} = require('../controllers/boothVolunteersController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Booth Volunteers
 *   description: Party volunteers management at booth level
 */

/**
 * @swagger
 * /api/booth-volunteers:
 *   get:
 *     summary: Get all booth volunteers
 *     tags: [Booth Volunteers]
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
 *         name: booth
 *         schema:
 *           type: string
 *         description: Filter by booth ID
 *       - in: query
 *         name: party
 *         schema:
 *           type: string
 *         description: Filter by party ID
 *       - in: query
 *         name: activity
 *         schema:
 *           type: string
 *           enum: [High, Medium, Low]
 *         description: Filter by activity level
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by volunteer name
 *     responses:
 *       200:
 *         description: List of booth volunteers
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
 *                     $ref: '#/components/schemas/BoothVolunteer'
 */
router.get('/', getVolunteers);

/**
 * @swagger
 * /api/booth-volunteers/{id}:
 *   get:
 *     summary: Get single volunteer record
 *     tags: [Booth Volunteers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Volunteer data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoothVolunteer'
 *       404:
 *         description: Volunteer not found
 */
router.get('/:id', getVolunteerById);

/**
 * @swagger
 * /api/booth-volunteers:
 *   post:
 *     summary: Create new volunteer record
 *     tags: [Booth Volunteers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BoothVolunteer'
 *     responses:
 *       201:
 *         description: Volunteer created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('admin', 'editor'), createVolunteer);

/**
 * @swagger
 * /api/booth-volunteers/{id}:
 *   put:
 *     summary: Update volunteer record
 *     tags: [Booth Volunteers]
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
 *             $ref: '#/components/schemas/BoothVolunteer'
 *     responses:
 *       200:
 *         description: Volunteer updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Volunteer not found
 */
router.put('/:id', protect, authorize('admin', 'editor'), updateVolunteer);

/**
 * @swagger
 * /api/booth-volunteers/{id}:
 *   delete:
 *     summary: Delete volunteer record
 *     tags: [Booth Volunteers]
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
 *         description: Volunteer deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Volunteer not found
 */
router.delete('/:id', protect, authorize('admin'), deleteVolunteer);

/**
 * @swagger
 * /api/booth-volunteers/booth/{boothId}:
 *   get:
 *     summary: Get volunteers by booth ID
 *     tags: [Booth Volunteers]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of volunteers for the booth
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
 *                     $ref: '#/components/schemas/BoothVolunteer'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', getVolunteersByBooth);

/**
 * @swagger
 * /api/booth-volunteers/party/{partyId}:
 *   get:
 *     summary: Get volunteers by party ID
 *     tags: [Booth Volunteers]
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of volunteers for the party
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
 *                     $ref: '#/components/schemas/BoothVolunteer'
 *       404:
 *         description: Party not found
 */
router.get('/party/:partyId', getVolunteersByParty);

/**
 * @swagger
 * /api/booth-volunteers/activity/{activityLevel}:
 *   get:
 *     summary: Get volunteers by activity level
 *     tags: [Booth Volunteers]
 *     parameters:
 *       - in: path
 *         name: activityLevel
 *         required: true
 *         schema:
 *           type: string
 *           enum: [High, Medium, Low]
 *     responses:
 *       200:
 *         description: List of volunteers with specified activity level
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
 *                     $ref: '#/components/schemas/BoothVolunteer'
 */
router.get('/activity/:activityLevel', getVolunteersByActivityLevel);

/**
 * @swagger
 * components:
 *   schemas:
 *     BoothVolunteer:
 *       type: object
 *       required:
 *         - booth_id
 *         - party_id
 *         - name
 *         - phone
 *       properties:
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439011"
 *         party_id:
 *           type: string
 *           description: Reference to Party
 *           example: "507f1f77bcf86cd799439012"
 *         name:
 *           type: string
 *           description: Volunteer's full name
 *           example: "John Doe"
 *         role:
 *           type: string
 *           description: Volunteer's role
 *           example: "Polling Agent"
 *         phone:
 *           type: string
 *           description: Volunteer's phone number
 *           example: "+1234567890"
 *         email:
 *           type: string
 *           description: Volunteer's email address
 *           example: "john.doe@example.com"
 *         area_responsibility:
 *           type: string
 *           description: Area or responsibility assigned
 *           example: "North Sector"
 *         activity_level:
 *           type: string
 *           enum: [High, Medium, Low]
 *           description: Activity level of the volunteer
 *           example: "High"
 *         remarks:
 *           type: string
 *           description: Additional remarks
 *           example: "Very active during campaigns"
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