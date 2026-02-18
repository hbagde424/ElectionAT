const express = require('express');
const {
  getAssemblies,
  getAssembly,
  createAssembly,
  updateAssembly,
  deleteAssembly,
  importAssemblies,
  uploadAssemblyPolygon
} = require('../controllers/assemblyController');
const { protect, authorize } = require('../middlewares/auth');
const { getUserPermissionsAndHierarchy } = require('../middlewares/permissions');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Assemblies
 *   description: Assembly management
 */

/**
 * @swagger
 * /api/assemblies:
 *   get:
 *     summary: Get all assemblies
 *     tags: [Assemblies]
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
 *         description: Search term for assembly names
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Urban, Rural, Semi-Urban, Tribal]
 *         description: Filter by assembly type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [General, SC, ST, OBC]
 *         description: Filter by assembly category
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
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of assemblies
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
 *                     $ref: '#/components/schemas/Assembly'
 */
router.get('/', getAssemblies);

/**
 * @swagger
 * /api/assemblies/{id}:
 *   get:
 *     summary: Get single assembly
 *     tags: [Assemblies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assembly data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Assembly'
 *       404:
 *         description: Assembly not found
 */
router.get('/:id', getAssembly);

/**
 * @swagger
 * /api/assemblies:
 *   post:
 *     summary: Create new assembly
 *     tags: [Assemblies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Assembly'
 *     responses:
 *       201:
 *         description: Assembly created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin'), createAssembly);

/**
 * @swagger
 * /api/assemblies/{id}:
 *   put:
 *     summary: Update assembly
 *     tags: [Assemblies]
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
 *             $ref: '#/components/schemas/Assembly'
 *     responses:
 *       200:
 *         description: Assembly updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Assembly not found
 */
router.put('/:id', protect, authorize('superAdmin'), updateAssembly);

/**
 * @swagger
 * /api/assemblies/{id}:
 *   delete:
 *     summary: Delete assembly
 *     tags: [Assemblies]
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
 *         description: Assembly deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Assembly not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteAssembly);

/**
 * @swagger
 * /api/assemblies/import:
 *   post:
 *     summary: Import assemblies from Excel
 *     tags: [Assemblies]
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
router.post('/import', protect, authorize('superAdmin'), importAssemblies);

/**
 * @swagger
 * /api/assemblies/upload-polygon:
 *   post:
 *     summary: Upload assembly polygon (GeoJSON)
 *     tags: [Assemblies]
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
router.post('/upload-polygon', protect, authorize('superAdmin'), uploadAssemblyPolygon);

/**
 * @swagger
 * components:
 *   schemas:
 *     Assembly:
 *       type: object
 *       required:
 *         - name
 *         - AC_NO
 *         - parliament_id
 *         - division_id
 *         - state_id
 *         - created_by
 *       properties:
 *         name:
 *           type: string
 *           description: Assembly name
 *           example: "chhattisgard_assemly"
 *         AC_NO:
 *           type: string
 *           description: Assembly constituency number
 *           example: "1"
 *         type:
 *           type: string
 *           enum: [Urban, Rural, Semi-Urban, Tribal]
 *           description: Assembly type
 *           example: "Urban"
 *         category:
 *           type: string
 *           enum: [General, SC, ST, OBC]
 *           description: Assembly category
 *           example: "General"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *           example: "695df6f9378891b2daab0720"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "695df51637891b2daab65aa"
 *         state_id:
 *           type: string
 *           description: Reference to State
 *           example: "695ddfe612c5383f62b56849"
 *         description:
 *           type: string
 *           description: Assembly description (HTML allowed)
 *         polygon:
 *           type: object
 *           description: GeoJSON polygon data
 *         created_by:
 *           type: string
 *           description: Reference to User who created
 *         updated_by:
 *           type: string
 *           description: Reference to User who last updated
 *         is_active:
 *           type: boolean
 *           description: Active status
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
