const express = require('express');
const {
  getBlocks,
  getBlock,
  createBlock,
  updateBlock,
  deleteBlock,
  getBlocksByAssembly,
  getBlocksByCategory
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
 *         name: assembly
 *         schema:
 *           type: string
 *         description: Assembly ID to filter by
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Urban, Rural, Semi-Urban, Tribal]
 *         description: Category to filter by
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
router.post('/', protect, authorize('SuperAdmin', 'editor', 'SuperAdmin'), createBlock);

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
router.put('/:id', protect, authorize('admin', 'editor'), updateBlock);

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
router.delete('/:id', protect, authorize('admin'), deleteBlock);

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
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Urban, Rural, Semi-Urban, Tribal]
 *         description: Category to filter by
 *     responses:
 *       200:
 *         description: List of blocks in the assembly
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
 * /api/blocks/category/{category}:
 *   get:
 *     summary: Get blocks by category
 *     tags: [Blocks]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Urban, Rural, Semi-Urban, Tribal]
 *       - in: query
 *         name: assembly
 *         schema:
 *           type: string
 *         description: Assembly ID to filter by
 *     responses:
 *       200:
 *         description: List of blocks by category
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
 */
router.get('/category/:category', getBlocksByCategory);

/**
 * @swagger
 * components:
 *   schemas:
 *     Block:
 *       type: object
 *       required:
 *         - name
 *         - assembly_id
 *         - category
 *         - created_by
 *       properties:
 *         name:
 *           type: string
 *           description: Block name
 *           example: "Block A"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *           example: "507f1f77bcf86cd799439011"
 *         category:
 *           type: string
 *           enum: [Urban, Rural, Semi-Urban, Tribal]
 *           description: Block category
 *           example: "Urban"
 *         created_by:
 *           type: string
 *           description: Reference to User who created the block
 *           example: "507f1f77bcf86cd799439012"
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated the block
 *           example: "507f1f77bcf86cd799439013"
 *         is_active:
 *           type: boolean
 *           description: Whether the block is active
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