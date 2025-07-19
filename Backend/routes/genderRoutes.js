const express = require('express');
const {
  getGenders,
  getGender,
  createGender,
  updateGender,
  deleteGender,
  getGendersByBooth,
  getGendersByState
} = require('../controllers/genderController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Genders
 *   description: Gender statistics management
 */

/**
 * @swagger
 * /api/genders:
 *   get:
 *     summary: Get all gender entries
 *     tags: [Genders]
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
 *         description: Search term for male/female/others counts
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
 *         description: List of gender entries
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
 *                     $ref: '#/components/schemas/Gender'
 */
router.get('/', getGenders);

/**
 * @swagger
 * /api/genders/{id}:
 *   get:
 *     summary: Get single gender entry
 *     tags: [Genders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Gender entry data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Gender'
 *       404:
 *         description: Gender entry not found
 */
router.get('/:id', getGender);

/**
 * @swagger
 * /api/genders:
 *   post:
 *     summary: Create new gender entry
 *     tags: [Genders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Gender'
 *     responses:
 *       201:
 *         description: Gender entry created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin'), createGender);

/**
 * @swagger
 * /api/genders/{id}:
 *   put:
 *     summary: Update gender entry
 *     tags: [Genders]
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
 *             $ref: '#/components/schemas/Gender'
 *     responses:
 *       200:
 *         description: Gender entry updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Gender entry not found
 */
router.put('/:id', protect, authorize('superAdmin'), updateGender);

/**
 * @swagger
 * /api/genders/{id}:
 *   delete:
 *     summary: Delete gender entry
 *     tags: [Genders]
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
 *         description: Gender entry deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Gender entry not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteGender);

/**
 * @swagger
 * /api/genders/booth/{boothId}:
 *   get:
 *     summary: Get gender entries by booth
 *     tags: [Genders]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of gender entries for the booth
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
 *                     $ref: '#/components/schemas/Gender'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', getGendersByBooth);

/**
 * @swagger
 * /api/genders/state/{stateId}:
 *   get:
 *     summary: Get gender entries by state
 *     tags: [Genders]
 *     parameters:
 *       - in: path
 *         name: stateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of gender entries in the state
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
 *                     $ref: '#/components/schemas/Gender'
 *       404:
 *         description: State not found
 */
router.get('/state/:stateId', getGendersByState);

/**
 * @swagger
 * components:
 *   schemas:
 *     Gender:
 *       type: object
 *       required:
 *         - male
 *         - female
 *         - others
 *         - state_id
 *         - division_id
 *         - parliament_id
 *         - assembly_id
 *         - block_id
 *         - booth_id
 *         - created_by
 *       properties:
 *         male:
 *           type: number
 *           description: Count of males
 *           example: 500
 *         female:
 *           type: number
 *           description: Count of females
 *           example: 550
 *         others:
 *           type: number
 *           description: Count of otherss
 *           example: 550
 *         state_id:
 *           type: string
 *           description: Reference to State
 *           example: "507f1f77bcf86cd799439016"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439015"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *           example: "507f1f77bcf86cd799439013"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *           example: "507f1f77bcf86cd799439012"
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *           example: "507f1f77bcf86cd799439011"
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439010"
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