const express = require('express');
const {
  getCodings,
  getCoding,
  createCoding,
  updateCoding,
  deleteCoding,
  getCodingsByBooth,
  getCodingsByState,
  getCodingsByType
} = require('../controllers/codingController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Codings
 *   description: Coding management
 */

/**
 * @swagger
 * /api/codings:
 *   get:
 *     summary: Get all coding entries
 *     tags: [Codings]
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
 *         description: Search term for name/mobile/coding_type
 *       - in: query
 *         name: coding_type
 *         schema:
 *           type: string
 *         description: Coding type to filter by
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
 *         description: List of coding entries
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
 *                     $ref: '#/components/schemas/Coding'
 */
router.get('/', getCodings);

/**
 * @swagger
 * /api/codings/{id}:
 *   get:
 *     summary: Get single coding entry
 *     tags: [Codings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coding entry data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coding'
 *       404:
 *         description: Coding entry not found
 */
router.get('/:id', getCoding);

/**
 * @swagger
 * /api/codings:
 *   post:
 *     summary: Create new coding entry
 *     tags: [Codings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Coding'
 *     responses:
 *       201:
 *         description: Coding entry created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin'), createCoding);

/**
 * @swagger
 * /api/codings/{id}:
 *   put:
 *     summary: Update coding entry
 *     tags: [Codings]
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
 *             $ref: '#/components/schemas/Coding'
 *     responses:
 *       200:
 *         description: Coding entry updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Coding entry not found
 */
router.put('/:id', protect, authorize('superAdmin'), updateCoding);

/**
 * @swagger
 * /api/codings/{id}:
 *   delete:
 *     summary: Delete coding entry
 *     tags: [Codings]
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
 *         description: Coding entry deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Coding entry not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteCoding);

/**
 * @swagger
 * /api/codings/booth/{boothId}:
 *   get:
 *     summary: Get coding entries by booth
 *     tags: [Codings]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of coding entries for the booth
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
 *                     $ref: '#/components/schemas/Coding'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', getCodingsByBooth);

/**
 * @swagger
 * /api/codings/state/{stateId}:
 *   get:
 *     summary: Get coding entries by state
 *     tags: [Codings]
 *     parameters:
 *       - in: path
 *         name: stateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of coding entries in the state
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
 *                     $ref: '#/components/schemas/Coding'
 *       404:
 *         description: State not found
 */
router.get('/state/:stateId', getCodingsByState);

/**
 * @swagger
 * /api/codings/type/{type}:
 *   get:
 *     summary: Get coding entries by type
 *     tags: [Codings]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [BC, PP, IP, FH, SMM, MS, FP, ER, AK, FM, वरिष्ठ, युवा, वोटर प्रभारी]
 *     responses:
 *       200:
 *         description: List of coding entries of the specified type
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
 *                     $ref: '#/components/schemas/Coding'
 *       400:
 *         description: Invalid coding type
 */
router.get('/type/:type', getCodingsByType);

/**
 * @swagger
 * components:
 *   schemas:
 *     Coding:
 *       type: object
 *       required:
 *         - name
 *         - mobile
 *         - coding_type
 *         - state_id
 *         - division_id
 *         - parliament_id
 *         - assembly_id
 *         - block_id
 *         - booth_id
 *         - created_by
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the person
 *           example: "John Doe"
 *         mobile:
 *           type: string
 *           description: Mobile number (10 digits)
 *           example: "9876543210"
 *         email:
 *           type: string
 *           description: Email address
 *           example: "john@example.com"
 *         facebook:
 *           type: string
 *           description: Facebook profile link
 *           example: "https://facebook.com/johndoe"
 *         instagram:
 *           type: string
 *           description: Instagram profile link
 *           example: "https://instagram.com/johndoe"
 *         twitter:
 *           type: string
 *           description: Twitter profile link
 *           example: "https://twitter.com/johndoe"
 *         whatsapp_number:
 *           type: string
 *           description: WhatsApp number (10 digits)
 *           example: "9876543210"
 *         coding_type:
 *           type: string
 *           enum: [BC, PP, IP, FH, SMM, MS, FP, ER, AK, FM, वरिष्ठ, युवा, वोटर प्रभारी]
 *           description: Type of coding
 *           example: "BC"
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
 *         description:
 *           type: string
 *           description: Candidate description (HTML allowed)
 *           example: "<p>Some description about the candidate.</p>"
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