const express = require('express');
const {
  getBooths,
  getBooth,
  createBooth,
  updateBooth,
  deleteBooth,
  importBooths,
  uploadBoothPolygon,
  getBoothRelatedData
} = require('../controllers/boothController');
const { protect, authorize } = require('../middlewares/auth');
const { getUserPermissionsAndHierarchy } = require('../middlewares/permissions');

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
 *         description: Search term for booth names
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
 * /api/booths/{id}/related-data:
 *   get:
 *     summary: Get all booth-related data from different tables
 *     tags: [Booths]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All booth-related data
 *       404:
 *         description: Booth not found
 */
router.get('/:id/related-data', getBoothRelatedData);

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
 * /api/booths/import:
 *   post:
 *     summary: Import booths from Excel
 *     tags: [Booths]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rows:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Import summary
 *       401:
 *         description: Unauthorized
 */
router.post('/import', protect, authorize('superAdmin'), importBooths);

/**
 * @swagger
 * /api/booths/upload-polygon:
 *   post:
 *     summary: Upload booth polygon (GeoJSON)
 *     tags: [Booths]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Polygon uploaded successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/upload-polygon', protect, authorize('superAdmin'), uploadBoothPolygon);

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
 *         - assembly_id
 *         - parliament_id
 *         - division_id
 *         - state_id
 *         - created_by
 *       properties:
 *         name:
 *           type: string
 *           description: Booth name
 *           example: "मानसी"
 *         booth_number:
 *           type: number
 *           description: Booth number
 *           example: 280
 *         full_address:
 *           type: string
 *           description: Full address of booth
 *           example: "प्राथमिक विद्यालय मानसी"
 *         latitude:
 *           type: number
 *           description: Latitude coordinate
 *           example: 12
 *         longitude:
 *           type: number
 *           description: Longitude coordinate
 *           example: 2
 *         Male_Count:
 *           type: number
 *           description: Male voter count
 *           example: 273
 *         Female_Count:
 *           type: number
 *           description: Female voter count
 *           example: 291
 *         others_Count:
 *           type: number
 *           description: Other gender voter count
 *           example: 0
 *         Total:
 *           type: number
 *           description: Total voter count
 *           example: 564
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *           example: "687a11372bbc144034f228c3"
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *           example: "687a036493d4235d02ea1d1"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *           example: "687a021993d4235d02ea1d05"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "685fd2c0267d3d01c364e62f"
 *         state_id:
 *           type: string
 *           description: Reference to State
 *           example: "6825c30edbda2b3debc751ff"
 *         polygon:
 *           type: object
 *           description: GeoJSON polygon data
 *         created_by:
 *           type: string
 *           description: Reference to User who created
 *           example: "684ab4dce856ee7296dee255"
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated
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
