const express = require('express');
const router = express.Router();
const blockController = require('../controllers/blockController');

/**
 * @swagger
 * tags:
 *   name: Blocks
 *   description: Block Management
 */

/**
 * @swagger
 * /api/blocks:
 *   post:
 *     summary: Create a new block
 *     tags: [Blocks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Block'
 *           example:
 *             name: "Block A"
 *             assembly_id: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Block created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Block'
 *             example:
 *               _id: "507f1f77bcf86cd799439012"
 *               name: "Block A"
 *               assembly_id: "507f1f77bcf86cd799439011"
 *               created_at: "2023-05-15T10:00:00Z"
 *               updated_at: "2023-05-15T10:00:00Z"
 *               __v: 0
 *       400:
 *         description: Validation error
 *         example:
 *           error: "Block validation failed: name: Path `name` is required"
 *       404:
 *         description: Assembly not found
 *         example:
 *           error: "Assembly not found"
 */

/**
 * @swagger
 * /api/blocks/{id}:
 *   put:
 *     summary: Update a block
 *     tags: [Blocks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439012"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Block'
 *           example:
 *             name: "Block A Updated"
 *     responses:
 *       200:
 *         description: Block updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Block'
 *             example:
 *               _id: "507f1f77bcf86cd799439012"
 *               name: "Block A Updated"
 *               assembly_id: "507f1f77bcf86cd799439011"
 *               created_at: "2023-05-15T10:00:00Z"
 *               updated_at: "2023-05-15T10:30:00Z"
 *               __v: 0
 *       400:
 *         description: Validation error
 *         example:
 *           error: "Block validation failed: name: Path `name` is required"
 *       404:
 *         description: Block not found
 *         example:
 *           error: "Block not found"
 */

/**
 * @swagger
 * /api/blocks/{id}:
 *   get:
 *     summary: Get block by ID
 *     tags: [Blocks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439012"
 *     responses:
 *       200:
 *         description: Block data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Block'
 *             example:
 *               _id: "507f1f77bcf86cd799439012"
 *               name: "Block A"
 *               assembly_id:
 *                 _id: "507f1f77bcf86cd799439011"
 *                 name: "Lucknow West Assembly"
 *               created_at: "2023-05-15T10:00:00Z"
 *               updated_at: "2023-05-15T10:00:00Z"
 *       404:
 *         description: Block not found
 *         example:
 *           error: "Block not found"
 */

/**
 * @swagger
 * /api/blocks/assembly/{assemblyId}:
 *   get:
 *     summary: Get blocks by assembly ID
 *     tags: [Blocks]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: List of blocks in the assembly
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Block'
 *             example:
 *               - _id: "507f1f77bcf86cd799439012"
 *                 name: "Block A"
 *                 assembly_id: "507f1f77bcf86cd799439011"
 *                 created_at: "2023-05-15T10:00:00Z"
 *                 updated_at: "2023-05-15T10:00:00Z"
 *               - _id: "507f1f77bcf86cd799439013"
 *                 name: "Block B"
 *                 assembly_id: "507f1f77bcf86cd799439011"
 *                 created_at: "2023-05-15T11:00:00Z"
 *                 updated_at: "2023-05-15T11:00:00Z"
 *       404:
 *         description: No blocks found for this assembly
 *         example:
 *           error: "No blocks found for this assembly"
 */

// CRUD Routes
router.post('/', blockController.createBlock);
router.get('/', blockController.getAllBlocks);
router.get('/assembly/:assemblyId', blockController.getBlocksByAssembly);
router.get('/:id', blockController.getBlockById);
router.put('/:id', blockController.updateBlock);
router.delete('/:id', blockController.deleteBlock);

module.exports = router;