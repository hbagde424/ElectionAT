const express = require('express');
const {
  getBlocks,
  getBlock,
  createBlock,
  updateBlock,
  deleteBlock,
  getBlocksByAssembly,
  getBlocksByParliament,
  toggleBlockActive
} = require('../controllers/blockController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Blocks
 *   description: Block management
 */

/**
 * @swagger
 * /api/blocks:
 *   get:
 *     summary: Get all blocks
 *     tags: [Blocks]
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
 *         description: Search term for block names
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Urban, Rural, Semi-Urban, Tribal]
 *         description: Filter by block category
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
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of blocks
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
 *                     $ref: '#/components/schemas/Block'
 */
router.get('/', getBlocks);

/**
 * @swagger
 * /api/blocks/{id}:
 *   get:
 *     summary: Get single block
 *     tags: [Blocks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Block data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Block'
 *       404:
 *         description: Block not found
 */
router.get('/:id', getBlock);

/**
 * @swagger
 * /api/blocks:
 *   post:
 *     summary: Create new block
 *     tags: [Blocks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Block'
 *     responses:
 *       201:
 *         description: Block created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin'), createBlock);
// router.post('/', protect, authorize('superAdmin'), createBlock);

/**
 * @swagger
 * /api/blocks/{id}:
 *   put:
 *     summary: Update block
 *     tags: [Blocks]
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
 *             $ref: '#/components/schemas/Block'
 *     responses:
 *       200:
 *         description: Block updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Block not found
 */
router.put('/:id', protect, authorize('superAdmin'), updateBlock);

/**
 * @swagger
 * /api/blocks/{id}:
 *   delete:
 *     summary: Delete block
 *     tags: [Blocks]
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
 *         description: Block deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Block not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteBlock);

/**
 * @swagger
 * /api/blocks/assembly/{assemblyId}:
 *   get:
 *     summary: Get blocks by assembly
 *     tags: [Blocks]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of blocks for the assembly
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
 *                     $ref: '#/components/schemas/Block'
 *       404:
 *         description: Assembly not found
 */
router.get('/assembly/:assemblyId', getBlocksByAssembly);

/**
 * @swagger
 * /api/blocks/parliament/{parliamentId}:
 *   get:
 *     summary: Get blocks by parliament
 *     tags: [Blocks]
 *     parameters:
 *       - in: path
 *         name: parliamentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of blocks for the parliament
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
 *                     $ref: '#/components/schemas/Block'
 *       404:
 *         description: Parliament not found
 */
router.get('/parliament/:parliamentId', getBlocksByParliament);

/**
 * @swagger
 * /api/blocks/{id}/toggle-active:
 *   patch:
 *     summary: Toggle block active status
 *     tags: [Blocks]
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
 *         description: Block active status toggled
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Block not found
 */
router.patch('/:id/toggle-active', protect, authorize('superAdmin'), toggleBlockActive);

/**
 * @swagger
 * components:
 *   schemas:
 *     Block:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - assembly_id
 *         - parliament_id
 *         - district_id
 *         - division_id
 *         - state_id
 *         - created_by
 *       properties:
 *         name:
 *           type: string
 *           description: Block name
 *           example: "Central Block"
 *         category:
 *           type: string
 *           enum: [Urban, Rural, Semi-Urban, Tribal]
 *           description: Block category
 *           example: "Urban"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *           example: "507f1f77bcf86cd799439011"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *           example: "507f1f77bcf86cd799439012"
 *         district_id:
 *           type: string
 *           description: Reference to District
 *           example: "507f1f77bcf86cd799439013"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439014"
 *         state_id:
 *           type: string
 *           description: Reference to State
 *           example: "507f1f77bcf86cd799439015"
 *         created_by:
 *           type: string
 *           description: Reference to User who created
 *           example: "507f1f77bcf86cd799439022"
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated
 *           example: "507f1f77bcf86cd799439023"
 *         is_active:
 *           type: boolean
 *           description: Active status of the block
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