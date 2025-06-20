const express = require('express');
const {
  getVolunteers,
  getVolunteerById,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
  getVolunteersByBooth,
  getVolunteersByParty,
  getVolunteersByAssembly,
  getVolunteersByParliament,
  getVolunteersByBlock,
  getVolunteersByActivityLevel
} = require('../controllers/boothVolunteersController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Booth Volunteers
 *   description: Party volunteers management at booth level with geographic hierarchy
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
 *         name: assembly
 *         schema:
 *           type: string
 *         description: Filter by assembly constituency ID
 *       - in: query
 *         name: parliament
 *         schema:
 *           type: string
 *         description: Filter by parliamentary constituency ID
 *       - in: query
 *         name: block
 *         schema:
 *           type: string
 *         description: Filter by block ID
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
 *         description: List of booth volunteers with geographic hierarchy
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
 *     summary: Get single volunteer record with geographic hierarchy
 *     tags: [Booth Volunteers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Volunteer data with geographic references
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
 *     summary: Create new volunteer record with automatic geographic hierarchy
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
 *         description: Volunteer created with geographic hierarchy
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/',  createVolunteer);
// router.post('/', protect, authorize('admin', 'editor'), createVolunteer);

/**
 * @swagger
 * /api/booth-volunteers/{id}:
 *   put:
 *     summary: Update volunteer record (geographic hierarchy maintained)
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
 *     summary: Get volunteers by booth ID with geographic hierarchy
 *     tags: [Booth Volunteers]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of volunteers for the booth with geographic references
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
 *     summary: Get volunteers by party ID with geographic hierarchy
 *     tags: [Booth Volunteers]
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of volunteers for the party with geographic references
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
 * /api/booth-volunteers/assembly/{assemblyId}:
 *   get:
 *     summary: Get volunteers by assembly constituency ID
 *     tags: [Booth Volunteers]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of volunteers for the assembly constituency
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
 *         description: Assembly constituency not found
 */
router.get('/assembly/:assemblyId', getVolunteersByAssembly);

/**
 * @swagger
 * /api/booth-volunteers/parliament/{parliamentId}:
 *   get:
 *     summary: Get volunteers by parliamentary constituency ID
 *     tags: [Booth Volunteers]
 *     parameters:
 *       - in: path
 *         name: parliamentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of volunteers for the parliamentary constituency
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
 *         description: Parliamentary constituency not found
 */
router.get('/parliament/:parliamentId', getVolunteersByParliament);

/**
 * @swagger
 * /api/booth-volunteers/block/{blockId}:
 *   get:
 *     summary: Get volunteers by block ID
 *     tags: [Booth Volunteers]
 *     parameters:
 *       - in: path
 *         name: blockId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of volunteers for the block
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
 *         description: Block not found
 */
router.get('/block/:blockId', getVolunteersByBlock);

/**
 * @swagger
 * /api/booth-volunteers/activity/{activityLevel}:
 *   get:
 *     summary: Get volunteers by activity level with geographic hierarchy
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
 *         - assembly_id
 *         - parliament_id
 *         - block_id
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
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly Constituency
 *           example: "507f1f77bcf86cd799439013"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliamentary Constituency
 *           example: "507f1f77bcf86cd799439014"
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *           example: "507f1f77bcf86cd799439015"
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