const express = require('express');
const {
  getBooths,
  getBooth,
  createBooth,
  updateBooth,
  deleteBooth,
  getBoothsByAssembly,
  getBoothsByBlock
} = require('../controllers/boothController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Booths
 *   description: Booth management
 */

/**
 * @swagger
 * /api/booths:
 *   get:
 *     summary: Get all booths
 *     tags: [Booths]
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
 *         description: Search term for booth names or numbers
 *       - in: query
 *         name: block
 *         schema:
 *           type: string
 *         description: Block ID to filter by
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
 *         name: district
 *         schema:
 *           type: string
 *         description: District ID to filter by
 *       - in: query
 *         name: division
 *         schema:
 *           type: string
 *         description: Division ID to filter by
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State ID to filter by
 *     responses:
 *       200:
 *         description: List of booths
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
 *                     $ref: '#/components/schemas/Booth'
 */
router.get('/', getBooths);

/**
 * @swagger
 * /api/booths/{id}:
 *   get:
 *     summary: Get single booth
 *     tags: [Booths]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booth data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booth'
 *       404:
 *         description: Booth not found
 */
router.get('/:id', getBooth);

/**
 * @swagger
 * /api/booths:
 *   post:
 *     summary: Create new booth
 *     tags: [Booths]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booth'
 *     responses:
 *       201:
 *         description: Booth created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin'), createBooth);

/**
 * @swagger
 * /api/booths/{id}:
 *   put:
 *     summary: Update booth
 *     tags: [Booths]
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
 *             $ref: '#/components/schemas/Booth'
 *     responses:
 *       200:
 *         description: Booth updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Booth not found
 */
router.put('/:id', protect, authorize('superAdmin'), updateBooth);

/**
 * @swagger
 * /api/booths/{id}:
 *   delete:
 *     summary: Delete booth
 *     tags: [Booths]
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
 *         description: Booth deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Booth not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteBooth);

/**
 * @swagger
 * /api/booths/assembly/{assemblyId}:
 *   get:
 *     summary: Get booths by assembly
 *     tags: [Booths]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of booths for the assembly
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
 *                     $ref: '#/components/schemas/Booth'
 *       404:
 *         description: Assembly not found
 */
router.get('/assembly/:assemblyId', getBoothsByAssembly);

/**
 * @swagger
 * /api/booths/block/{blockId}:
 *   get:
 *     summary: Get booths by block
 *     tags: [Booths]
 *     parameters:
 *       - in: path
 *         name: blockId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of booths for the block
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
 *                     $ref: '#/components/schemas/Booth'
 *       404:
 *         description: Block not found
 */
router.get('/block/:blockId', getBoothsByBlock);

/**
 * @swagger
 * components:
 *   schemas:
 *     Booth:
 *       type: object
 *       required:
 *         - name
 *         - booth_number
 *         - full_address
 *         - block_id
 *         - assembly_id
 *         - parliament_id
 *         - district_id
 *         - division_id
 *         - state_id
 *         - created_by
 *       properties:
 *         name:
 *           type: string
 *           description: Booth name
 *           example: "Main Polling Booth"
 *         booth_number:
 *           type: string
 *           description: Booth number/identifier
 *           example: "B-42"
 *         full_address:
 *           type: string
 *           description: Complete address of the booth
 *           example: "123 Main St, City, State ZIP"
 *         latitude:
 *           type: number
 *           description: GPS latitude coordinate
 *           example: 40.7128
 *         longitude:
 *           type: number
 *           description: GPS longitude coordinate
 *           example: -74.0060
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *           example: "507f1f77bcf86cd799439011"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *           example: "507f1f77bcf86cd799439012"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *           example: "507f1f77bcf86cd799439013"
 *         district_id:
 *           type: string
 *           description: Reference to District
 *           example: "507f1f77bcf86cd799439014"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439015"
 *         state_id:
 *           type: string
 *           description: Reference to State
 *           example: "507f1f77bcf86cd799439016"
 *         created_by:
 *           type: string
 *           description: Reference to User who created
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