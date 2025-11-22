const express = require('express');
const {
    getFalliyas,
    getFalliya,
    createFalliya,
    updateFalliya,
    deleteFalliya
} = require('../controllers/falliyaController');
const { protect, authorize } = require('../middlewares/auth');
const { getUserPermissionsAndHierarchy } = require('../middlewares/permissions');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Falliyas
 *   description: Falliya management
 */

// Protected: requires authentication via serviceToken
router.get('/', protect, getUserPermissionsAndHierarchy, getFalliyas);

// Protected: requires authentication via serviceToken
router.get('/:id', protect, getUserPermissionsAndHierarchy, getFalliya);

/**
 * @swagger
 * /api/falliyas:
 *   get:
 *     summary: Get all Falliyas
 *     tags: [Falliyas]
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
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for text search
 *       - in: query
 *         name: state_id
 *         schema:
 *           type: string
 *         description: Filter by State ID
 *       - in: query
 *         name: division_id
 *         schema:
 *           type: string
 *         description: Filter by Division ID
 *       - in: query
 *         name: parliament_id
 *         schema:
 *           type: string
 *         description: Filter by Parliament ID
 *       - in: query
 *         name: assembly_id
 *         schema:
 *           type: string
 *         description: Filter by Assembly ID
 *       - in: query
 *         name: block_id
 *         schema:
 *           type: string
 *         description: Filter by Block ID
 *       - in: query
 *         name: booth_id
 *         schema:
 *           type: string
 *         description: Filter by Booth ID
 *       - in: query
 *         name: panchayat_id
 *         schema:
 *           type: string
 *         description: Filter by Panchayat ID
 *       - in: query
 *         name: village_id
 *         schema:
 *           type: string
 *         description: Filter by Village ID
 *       - in: query
 *         name: falliya_name
 *         schema:
 *           type: string
 *         description: Filter by Falliya name
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *         description: Return all records without pagination
 *     responses:
 *       200:
 *         description: List of falliyas
 *   post:
 *     summary: Create a new Falliya
 *     tags: [Falliyas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FalliyaInput'
 *     responses:
 *       201:
 *         description: Falliya created successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/falliyas/{id}:
 *   get:
 *     summary: Get Falliya by ID
 *     tags: [Falliyas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Falliya ID
 *     responses:
 *       200:
 *         description: Falliya details
 *       404:
 *         description: Falliya not found
 *   put:
 *     summary: Update Falliya
 *     tags: [Falliyas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Falliya ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FalliyaInput'
 *     responses:
 *       200:
 *         description: Falliya updated successfully
 *       404:
 *         description: Falliya not found
 *   delete:
 *     summary: Delete Falliya
 *     tags: [Falliyas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Falliya ID
 *     responses:
 *       200:
 *         description: Falliya deleted successfully
 *       404:
 *         description: Falliya not found
 */

router.route('/')
    .get(protect, getUserPermissionsAndHierarchy, getFalliyas)
    .post(protect, authorize('admin', 'superAdmin'), createFalliya);

router.route('/:id')
    .get(protect, getUserPermissionsAndHierarchy, getFalliya)
    .put(protect, authorize('admin', 'superAdmin'), updateFalliya)
    .delete(protect, authorize('admin', 'superAdmin'), deleteFalliya);

/**
 * @swagger
 * components:
 *   schemas:
 *     FalliyaInput:
 *       type: object
 *       required:
 *         - state_id
 *         - division_id
 *         - parliament_id
 *         - assembly_id
 *         - block_id
 *         - booth_id
 *         - panchayat_id
 *         - village_id
 *         - falliya_name
 *       properties:
 *         state_id:
 *           type: string
 *           description: Reference to State
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *         panchayat_id:
 *           type: string
 *           description: Reference to Panchayat
 *         village_id:
 *           type: string
 *           description: Reference to Village
 *         falliya_name:
 *           type: string
 *           description: Name of the falliya
 *           maxLength: 100
 *         location:
 *           type: string
 *           description: Location description
 *           maxLength: 200
 *         latitude:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *           description: Latitude coordinate
 *         longitude:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *           description: Longitude coordinate
 *         male_count:
 *           type: number
 *           minimum: 0
 *           description: Male population count
 *         female_count:
 *           type: number
 *           minimum: 0
 *           description: Female population count
 *         others_count:
 *           type: number
 *           minimum: 0
 *           description: Others population count
 */

module.exports = router;