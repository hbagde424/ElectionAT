const express = require('express');
const {
  getAssemblies,
  getAssembly,
  createAssembly,
  updateAssembly,
  deleteAssembly,
  getAssembliesByDistrict,
  getAssembliesByDivision,
  getAssembliesByParliament,
  getAssembliesByType,
  getAssembliesByCategory
} = require('../controllers/assemblyController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Assemblies
 *   description: Assembly constituency management
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
 *         name: parliament
 *         schema:
 *           type: string
 *         description: Parliament ID to filter by
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Urban, Rural, Mixed]
 *         description: Type to filter by
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [General, Reserved, Special]
 *         description: Category to filter by
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
router.post('/', protect, authorize('admin'), createAssembly);

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
router.put('/:id', protect, authorize('admin'), updateAssembly);

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
router.delete('/:id', protect, authorize('admin'), deleteAssembly);

/**
 * @swagger
 * /api/assemblies/district/{districtId}:
 *   get:
 *     summary: Get assemblies by district
 *     tags: [Assemblies]
 *     parameters:
 *       - in: path
 *         name: districtId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Urban, Rural, Mixed]
 *         description: Type to filter by
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [General, Reserved, Special]
 *         description: Category to filter by
 *     responses:
 *       200:
 *         description: List of assemblies in the district
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
 *                     $ref: '#/components/schemas/Assembly'
 *       404:
 *         description: District not found
 */
router.get('/district/:districtId', getAssembliesByDistrict);

/**
 * @swagger
 * /api/assemblies/division/{divisionId}:
 *   get:
 *     summary: Get assemblies by division
 *     tags: [Assemblies]
 *     parameters:
 *       - in: path
 *         name: divisionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Urban, Rural, Mixed]
 *         description: Type to filter by
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [General, Reserved, Special]
 *         description: Category to filter by
 *     responses:
 *       200:
 *         description: List of assemblies in the division
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
 *                     $ref: '#/components/schemas/Assembly'
 *       404:
 *         description: Division not found
 */
router.get('/division/:divisionId', getAssembliesByDivision);

/**
 * @swagger
 * /api/assemblies/parliament/{parliamentId}:
 *   get:
 *     summary: Get assemblies by parliament
 *     tags: [Assemblies]
 *     parameters:
 *       - in: path
 *         name: parliamentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Urban, Rural, Mixed]
 *         description: Type to filter by
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [General, Reserved, Special]
 *         description: Category to filter by
 *     responses:
 *       200:
 *         description: List of assemblies in the parliament
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
 *                     $ref: '#/components/schemas/Assembly'
 *       404:
 *         description: Parliament not found
 */
router.get('/parliament/:parliamentId', getAssembliesByParliament);

/**
 * @swagger
 * /api/assemblies/type/{type}:
 *   get:
 *     summary: Get assemblies by type
 *     tags: [Assemblies]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Urban, Rural, Mixed]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [General, Reserved, Special]
 *         description: Category to filter by
 *     responses:
 *       200:
 *         description: List of assemblies by type
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
 *                     $ref: '#/components/schemas/Assembly'
 */
router.get('/type/:type', getAssembliesByType);

/**
 * @swagger
 * /api/assemblies/category/{category}:
 *   get:
 *     summary: Get assemblies by category
 *     tags: [Assemblies]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [General, Reserved, Special]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Urban, Rural, Mixed]
 *         description: Type to filter by
 *     responses:
 *       200:
 *         description: List of assemblies by category
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
 *                     $ref: '#/components/schemas/Assembly'
 */
router.get('/category/:category', getAssembliesByCategory);

/**
 * @swagger
 * components:
 *   schemas:
 *     Assembly:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - category
 *         - district_id
 *         - division_id
 *         - parliament_id
 *       properties:
 *         name:
 *           type: string
 *           description: Assembly constituency name
 *           example: "Lucknow West"
 *         type:
 *           type: string
 *           enum: [Urban, Rural, Mixed]
 *           description: Type of assembly constituency
 *           example: "Urban"
 *         category:
 *           type: string
 *           enum: [General, Reserved, Special]
 *           description: Category of assembly constituency
 *           example: "General"
 *         district_id:
 *           type: string
 *           description: Reference to District
 *           example: "507f1f77bcf86cd799439011"
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *           example: "507f1f77bcf86cd799439012"
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *           example: "507f1f77bcf86cd799439013"
 *         is_active:
 *           type: boolean
 *           description: Whether the assembly is active
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