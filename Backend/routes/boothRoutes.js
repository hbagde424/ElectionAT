const express = require('express');
const {
  getBooths,
  getBooth,
  createBooth,
  updateBooth,
  deleteBooth,
  getBoothsByAssembly,
  getBoothsByParliament,
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
 *         name: booth_number
 *         schema:
 *           type: string
 *         description: Filter by booth number
 *       - in: query
 *         name: assembly_id
 *         schema:
 *           type: string
 *         description: Filter by assembly constituency
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
router.post('/',  createBooth);
// router.post('/', protect, authorize('admin'), createBooth);

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
router.put('/:id', protect, authorize('admin'), updateBooth);

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
router.delete('/:id', protect, authorize('admin'), deleteBooth);

/**
 * @swagger
 * /api/booths/assembly/{assemblyId}:
 *   get:
 *     summary: Get booths by assembly constituency
 *     tags: [Booths]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of booths in the assembly
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
 * /api/booths/parliament/{parliamentId}:
 *   get:
 *     summary: Get booths by parliament constituency
 *     tags: [Booths]
 *     parameters:
 *       - in: path
 *         name: parliamentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of booths in the parliament
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
 *         description: Parliament not found
 */
router.get('/parliament/:parliamentId', getBoothsByParliament);

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
 *         description: List of booths in the block
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
 *         - block_id
 *         - full_address
 *         - assembly_id
 *         - parliament_id
 *       properties:
 *         name:
 *           type: string
 *           example: "Booth 123"
 *         booth_number:
 *           type: string
 *           example: "123"
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *         full_address:
 *           type: string
 *           example: "123 Main St, District, State"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *         latitude:
 *           type: number
 *           example: 28.6139
 *         longitude:
 *           type: number
 *           example: 77.2090
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

module.exports = router;