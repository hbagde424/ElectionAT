const express = require('express');
const {
  getCasteLists,
  getCasteList,
  createCasteList,
  updateCasteList,
  deleteCasteList,
  getCasteListsByBooth,
  getCasteListsByCategory
} = require('../controllers/casteListController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Caste Lists
 *   description: Caste list management
 */

/**
 * @swagger
 * /api/caste-lists:
 *   get:
 *     summary: Get all caste lists
 *     tags: [Caste Lists]
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
 *         description: Search term for caste names
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [SC, ST, OBC, General, Other]
 *         description: Filter by category
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
 *         description: List of caste lists
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
 *                     $ref: '#/components/schemas/CasteList'
 */
router.get('/', getCasteLists);

/**
 * @swagger
 * /api/caste-lists/{id}:
 *   get:
 *     summary: Get single caste list entry
 *     tags: [Caste Lists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Caste list entry data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CasteList'
 *       404:
 *         description: Caste list entry not found
 */
router.get('/:id', getCasteList);

/**
 * @swagger
 * /api/caste-lists:
 *   post:
 *     summary: Create new caste list entry
 *     tags: [Caste Lists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CasteList'
 *     responses:
 *       201:
 *         description: Caste list entry created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, createCasteList);

/**
 * @swagger
 * /api/caste-lists/{id}:
 *   put:
 *     summary: Update caste list entry
 *     tags: [Caste Lists]
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
 *             $ref: '#/components/schemas/CasteList'
 *     responses:
 *       200:
 *         description: Caste list entry updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Caste list entry not found
 */
router.put('/:id', protect, updateCasteList);

/**
 * @swagger
 * /api/caste-lists/{id}:
 *   delete:
 *     summary: Delete caste list entry
 *     tags: [Caste Lists]
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
 *         description: Caste list entry deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Caste list entry not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteCasteList);

/**
 * @swagger
 * /api/caste-lists/booth/{boothId}:
 *   get:
 *     summary: Get caste lists by booth
 *     tags: [Caste Lists]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of caste lists for the booth
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
 *                     $ref: '#/components/schemas/CasteList'
 *       404:
 *         description: Booth not found
 */
router.get('/booth/:boothId', getCasteListsByBooth);

/**
 * @swagger
 * /api/caste-lists/category/{category}:
 *   get:
 *     summary: Get caste lists by category
 *     tags: [Caste Lists]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [SC, ST, OBC, General, Other]
 *     responses:
 *       200:
 *         description: List of caste lists for the category
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
 *                     $ref: '#/components/schemas/CasteList'
 *       400:
 *         description: Invalid category
 */
router.get('/category/:category', getCasteListsByCategory);

/**
 * @swagger
 * components:
 *   schemas:
 *     CasteList:
 *       type: object
 *       required:
 *         - category
 *         - caste
 *         - division_id
 *         - parliament_id
 *         - assembly_id
 *         - block_id
 *         - booth_id
 *         - created_by
 *       properties:
 *         category:
 *           type: string
 *           enum: [SC, ST, OBC, General, Other]
 *           description: Caste category
 *           example: "OBC"
 *         caste:
 *           type: string
 *           description: Caste name
 *           example: "Yadav"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439011"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *           example: "507f1f77bcf86cd799439012"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *           example: "507f1f77bcf86cd799439013"
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *           example: "507f1f77bcf86cd799439014"
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *           example: "507f1f77bcf86cd799439015"
 *         created_by:
 *           type: string
 *           description: User who created the record
 *           example: "507f1f77bcf86cd799439016"
 *         updated_by:
 *           type: string
 *           description: User who last updated the record
 *           example: "507f1f77bcf86cd799439017"
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