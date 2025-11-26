const express = require('express');
const {
  getAllBoothInfrastructures,
  getBoothInfrastructure,
  createBoothInfrastructure,
  updateBoothInfrastructure,
  deleteBoothInfrastructure,
  getInfrastructureByPremisesType,
  getInfrastructureByCategorization
} = require('../controllers/boothInfrastructureController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Booth Infrastructure
 *   description: Booth infrastructure and categorization management
 */

/**
 * @swagger
 * /api/booth-infrastructure:
 *   get:
 *     summary: Get all booth infrastructure records
 *     tags: [Booth Infrastructure]
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
 *         name: premisesType
 *         schema:
 *           type: string
 *           enum: [School, Community Hall, Government Building, Other]
 *         description: Filter by premises type
 *       - in: query
 *         name: categorization
 *         schema:
 *           type: string
 *           enum: [Normal, Sensitive, Hyper-sensitive]
 *         description: Filter by categorization
 *     responses:
 *       200:
 *         description: List of booth infrastructure records
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
 *                     $ref: '#/components/schemas/BoothInfrastructure'
 */
router.get('/', getAllBoothInfrastructures);

/**
 * @swagger
 * /api/booth-infrastructure/{id}:
 *   get:
 *     summary: Get single booth infrastructure record
 *     tags: [Booth Infrastructure]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booth infrastructure data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoothInfrastructure'
 *       404:
 *         description: Record not found
 */
router.get('/:id', getBoothInfrastructure);

/**
 * @swagger
 * /api/booth-infrastructure:
 *   post:
 *     summary: Create new booth infrastructure record
 *     tags: [Booth Infrastructure]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BoothInfrastructure'
 *     responses:
 *       201:
 *         description: Record created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin', 'editor'), createBoothInfrastructure);

/**
 * @swagger
 * /api/booth-infrastructure/{id}:
 *   put:
 *     summary: Update booth infrastructure record
 *     tags: [Booth Infrastructure]
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
 *             $ref: '#/components/schemas/BoothInfrastructure'
 *     responses:
 *       200:
 *         description: Record updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Record not found
 */
router.put('/:id', protect, authorize('superAdmin', 'editor'), updateBoothInfrastructure);

/**
 * @swagger
 * /api/booth-infrastructure/{id}:
 *   delete:
 *     summary: Delete booth infrastructure record
 *     tags: [Booth Infrastructure]
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
 *         description: Record deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Record not found
 */
router.delete('/:id', protect, authorize('superAdmin'), deleteBoothInfrastructure);

/**
 * @swagger
 * /api/booth-infrastructure/premises/{premisesType}:
 *   get:
 *     summary: Get infrastructure records by premises type
 *     tags: [Booth Infrastructure]
 *     parameters:
 *       - in: path
 *         name: premisesType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [School, Community Hall, Government Building, Other]
 *     responses:
 *       200:
 *         description: List of infrastructure records for the premises type
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
 *                     $ref: '#/components/schemas/BoothInfrastructure'
 */
router.get('/premises/:premisesType', getInfrastructureByPremisesType);

/**
 * @swagger
 * /api/booth-infrastructure/category/{categorization}:
 *   get:
 *     summary: Get infrastructure records by categorization
 *     tags: [Booth Infrastructure]
 *     parameters:
 *       - in: path
 *         name: categorization
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Normal, Sensitive, Hyper-sensitive]
 *     responses:
 *       200:
 *         description: List of infrastructure records for the categorization
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
 *                     $ref: '#/components/schemas/BoothInfrastructure'
 */
router.get('/category/:categorization', getInfrastructureByCategorization);

/**
 * @swagger
 * components:
 *   schemas:
 *     BoothInfrastructure:
 *       type: object
 *       required:
 *         - booth_id
 *         - premises_type
 *       properties:
 *         booth_id:
 *           type: string
 *           description: Reference to Booth (must be unique)
 *           example: "507f1f77bcf86cd799439011"
 *         premises_type:
 *           type: string
 *           enum: [School, Community Hall, Government Building, Other]
 *           description: Type of premises where booth is located
 *           example: "School"
 *         categorization:
 *           type: string
 *           enum: [Normal, Sensitive, Hyper-sensitive]
 *           description: Sensitivity categorization of the booth
 *           example: "Sensitive"
 *         accessibility_issues:
 *           type: string
 *           description: Description of any accessibility issues
 *           example: "No ramp access for wheelchairs"
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