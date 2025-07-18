const express = require('express');
const {
  getLocalDynamics,
  getLocalDynamicsByBooth,
  createLocalDynamics,
  updateLocalDynamics,
  deleteLocalDynamics
} = require('../controllers/localDynamicsController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: LocalDynamics
 *   description: Booth-level local dynamics management
 */

/**
 * @swagger
 * /api/local-dynamics:
 *   get:
 *     summary: Get all local dynamics records
 *     tags: [LocalDynamics]
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
 *         name: booth
 *         schema:
 *           type: string
 *         description: Filter by booth ID
 *     responses:
 *       200:
 *         description: List of local dynamics records
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
 *                     $ref: '#/components/schemas/LocalDynamics'
 */
router.get('/', getLocalDynamics);

/**
 * @swagger
 * /api/local-dynamics/booth/{boothId}:
 *   get:
 *     summary: Get local dynamics by booth ID
 *     tags: [LocalDynamics]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Local dynamics data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocalDynamics'
 *       404:
 *         description: Record not found
 */
router.get('/booth/:boothId', getLocalDynamicsByBooth);

/**
 * @swagger
 * /api/local-dynamics:
 *   post:
 *     summary: Create new local dynamics record
 *     tags: [LocalDynamics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocalDynamics'
 *     responses:
 *       201:
 *         description: Record created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('superAdmin', 'field-agent'), createLocalDynamics);

/**
 * @swagger
 * /api/local-dynamics/{id}:
 *   put:
 *     summary: Update local dynamics record
 *     tags: [LocalDynamics]
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
 *             $ref: '#/components/schemas/LocalDynamics'
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
router.put('/:id', protect, authorize('superAdmin', 'field-agent'), updateLocalDynamics);

/**
 * @swagger
 * /api/local-dynamics/{id}:
 *   delete:
 *     summary: Delete local dynamics record
 *     tags: [LocalDynamics]
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
router.delete('/:id', protect, authorize('superAdmin'), deleteLocalDynamics);

/**
 * @swagger
 * components:
 *   schemas:
 *     LocalDynamics:
 *       type: object
 *       required:
 *         - booth_id
 *       properties:
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *         dominant_caste:
 *           type: string
 *           description: Dominant caste in the area
 *         known_issues:
 *           type: string
 *           description: Known local issues
 *         local_leader:
 *           type: string
 *           description: Influential local leader
 *         grassroots_orgs:
 *           type: string
 *           description: Active grassroots organizations
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */
module.exports = router;