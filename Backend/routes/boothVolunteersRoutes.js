const express = require('express');
const {
  getBoothVolunteers,
  getBoothVolunteer,
  createBoothVolunteer,
  updateBoothVolunteer,
  deleteBoothVolunteer,
  getVolunteersByBooth,
  getVolunteersByParty,
  getVolunteersByState
} = require('../controllers/boothVolunteersController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Booth Volunteers
 *   description: Booth volunteer management
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, phone or email
 *       - in: query
 *         name: booth
 *         schema:
 *           type: string
 *         description: Booth ID to filter by
 *       - in: query
 *         name: party
 *         schema:
 *           type: string
 *         description: Party ID to filter by
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State ID to filter by
 *       - in: query
 *         name: division
 *         schema:
 *           type: string
 *         description: Division ID to filter by
 *       - in: query
 *         name: assembly
 *         schema:
 *           type: string
 *         description: Assembly ID to filter by
 *       - in: query
 *         name: parliament
 *         schema:
 *           type: string
 *         description: Parliament ID to filter by
 *       - in: query
 *         name: block
 *         schema:
 *           type: string
 *         description: Block ID to filter by
 *       - in: query
 *         name: activity
 *         schema:
 *           type: string
 *           enum: [High, Medium, Low]
 *         description: Filter by activity level
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
router.get('/', getBoothVolunteers);

/**
 * @swagger
 * /api/booth-volunteers/{id}:
 *   get:
 *     summary: Get single booth volunteer
 *     tags: [Booth Volunteers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booth volunteer data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoothVolunteer'
 *       404:
 *         description: Booth volunteer not found
 */
router.get('/:id', getBoothVolunteer);

/**
 * @swagger
 * /api/booth-volunteers:
 *   post:
 *     summary: Create new booth volunteer
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
 *         description: Booth volunteer created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin', 'coordinator'), createBoothVolunteer);

/**
 * @swagger
 * /api/booth-volunteers/{id}:
 *   put:
 *     summary: Update booth volunteer
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
 *         description: Booth volunteer updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Booth volunteer not found
 */
router.put('/:id', protect, authorize('superAdmin', 'coordinator'), updateBoothVolunteer);

/**
 * @swagger
 * /api/booth-volunteers/{id}:
 *   delete:
 *     summary: Delete booth volunteer
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
 *         description: Booth volunteer deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Booth volunteer not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteBoothVolunteer);

/**
 * @swagger
 * /api/booth-volunteers/booth/{boothId}:
 *   get:
 *     summary: Get volunteers by booth
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
 *     summary: Get volunteers by party
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
 * /api/booth-volunteers/state/{stateId}:
 *   get:
 *     summary: Get volunteers by state
 *     tags: [Booth Volunteers]
 *     parameters:
 *       - in: path
 *         name: stateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of volunteers in the state
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
 *         description: State not found
 */
router.get('/state/:stateId', getVolunteersByState);

/**
 * @swagger
 * components:
 *   schemas:
 *     BoothVolunteer:
 *       type: object
 *       required:
 *         - booth_id
 *         - party_id
 *         - state_id
 *         - division_id
 *         - assembly_id
 *         - parliament_id
 *         - block_id
 *         - name
 *         - phone
 *         - created_by
 *       properties:
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439011"
 *         party_id:
 *           type: string
 *           description: Reference to Party
 *           example: "507f1f77bcf86cd799439012"
 *         state_id:
 *           type: string
 *           description: Reference to State
 *           example: "507f1f77bcf86cd799439016"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439015"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *           example: "507f1f77bcf86cd799439013"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *           example: "507f1f77bcf86cd799439014"
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *           example: "507f1f77bcf86cd799439017"
 *         name:
 *           type: string
 *           description: Volunteer's full name
 *           example: "John Doe"
 *         role:
 *           type: string
 *           description: Volunteer's role
 *           example: "Booth Manager"
 *         phone:
 *           type: string
 *           description: Volunteer's phone number
 *           example: "9876543210"
 *         email:
 *           type: string
 *           description: Volunteer's email address
 *           example: "john.doe@example.com"
 *         area_responsibility:
 *           type: string
 *           description: Area of responsibility
 *           example: "Ward 5, Sector 2"
 *         activity_level:
 *           type: string
 *           enum: [High, Medium, Low]
 *           description: Activity level of volunteer
 *           example: "High"
 *         remarks:
 *           type: string
 *           description: Additional remarks
 *           example: "Very active during campaigns"
 *         created_by:
 *           type: string
 *           description: Reference to User who created the record
 *           example: "507f1f77bcf86cd799439022"
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated the record
 *           example: "507f1f77bcf86cd799439023"
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