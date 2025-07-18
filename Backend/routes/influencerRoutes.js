const express = require('express');
const {
  getInfluencers,
  getInfluencer,
  createInfluencer,
  updateInfluencer,
  deleteInfluencer,
  getInfluencersByBooth,
  getInfluencersByAssembly
} = require('../controllers/influencerController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Influencers
 *   description: Influencer management
 */

/**
 * @swagger
 * /api/influencers:
 *   get:
 *     summary: Get all influencers
 *     tags: [Influencers]
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
 *         description: Search term for influencer names, contact numbers or emails
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
 *         description: List of influencers
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
 *                     $ref: '#/components/schemas/Influencer'
 */
router.get('/', getInfluencers);

/**
 * @swagger
 * /api/influencers/{id}:
 *   get:
 *     summary: Get single influencer
 *     tags: [Influencers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Influencer data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Influencer'
 *       404:
 *         description: Influencer not found
 */
router.get('/:id', getInfluencer);

/**
 * @swagger
 * /api/influencers:
 *   post:
 *     summary: Create new influencer
 *     tags: [Influencers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Influencer'
 *     responses:
 *       201:
 *         description: Influencer created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin'), createInfluencer);

/**
 * @swagger
 * /api/influencers/{id}:
 *   put:
 *     summary: Update influencer
 *     tags: [Influencers]
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
 *             $ref: '#/components/schemas/Influencer'
 *     responses:
 *       200:
 *         description: Influencer updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Influencer not found
 */
router.put('/:id', protect, authorize('superAdmin'), updateInfluencer);

/**
 * @swagger
 * /api/influencers/{id}:
 *   delete:
 *     summary: Delete influencer
 *     tags: [Influencers]
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
 *         description: Influencer deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Influencer not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteInfluencer);

/**
 * @swagger
 * /api/influencers/booth/{boothId}:
 *   get:
 *     summary: Get influencers by booth
 *     tags: [Influencers]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of influencers for the booth
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
 *                     $ref: '#/components/schemas/Influencer'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', getInfluencersByBooth);

/**
 * @swagger
 * /api/influencers/assembly/{assemblyId}:
 *   get:
 *     summary: Get influencers by assembly
 *     tags: [Influencers]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of influencers for the assembly
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
 *                     $ref: '#/components/schemas/Influencer'
 *       404:
 *         description: Assembly not found
 */
router.get('/assembly/:assemblyId', getInfluencersByAssembly);

/**
 * @swagger
 * components:
 *   schemas:
 *     Influencer:
 *       type: object
 *       required:
 *         - name
 *         - contact_number
 *         - full_address
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
 *           description: Influencer name
 *           example: "John Doe"
 *         contact_number:
 *           type: string
 *           description: Primary contact number
 *           example: "9876543210"
 *         alternate_number:
 *           type: string
 *           description: Alternate contact number
 *           example: "9876543211"
 *         email:
 *           type: string
 *           description: Email address
 *           example: "john.doe@example.com"
 *         full_address:
 *           type: string
 *           description: Complete address
 *           example: "123 Main St, City, State ZIP"
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
 *           description: Reference to User who created
 *           example: "507f1f77bcf86cd799439022"
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated
 *           example: "507f1f77bcf86cd799439022"
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