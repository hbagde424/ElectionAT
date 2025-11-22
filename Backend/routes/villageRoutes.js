const express = require('express');
const {
    getVillages,
    getVillage,
    createVillage,
    updateVillage,
    deleteVillage,
    importVillages
} = require('../controllers/villageController');
const { protect, authorize } = require('../middlewares/auth');
const { getUserPermissionsAndHierarchy } = require('../middlewares/permissions');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Villages
 *   description: Village management
 */

// Protected: requires authentication via serviceToken
router.get('/', protect, getUserPermissionsAndHierarchy, getVillages);

// Protected: requires authentication via serviceToken
router.get('/:id', protect, getUserPermissionsAndHierarchy, getVillage);

/**
 * @swagger
 * /api/villages:
 *   get:
 *     summary: Get all Villages
 *     tags: [Villages]
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
 *         name: village_name
 *         schema:
 *           type: string
 *         description: Filter by Village name
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
 *         description: List of villages
 *   post:
 *     summary: Create a new Village
 *     tags: [Villages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VillageInput'
 *     responses:
 *       201:
 *         description: Village created successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/villages/{id}:
 *   get:
 *     summary: Get Village by ID
 *     tags: [Villages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Village ID
 *     responses:
 *       200:
 *         description: Village details
 *       404:
 *         description: Village not found
 *   put:
 *     summary: Update Village
 *     tags: [Villages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Village ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VillageInput'
 *     responses:
 *       200:
 *         description: Village updated successfully
 *       404:
 *         description: Village not found
 *   delete:
 *     summary: Delete Village
 *     tags: [Villages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Village ID
 *     responses:
 *       200:
 *         description: Village deleted successfully
 *       404:
 *         description: Village not found
 */

router.route('/')
    .get(protect, getUserPermissionsAndHierarchy, getVillages)
    .post(protect, authorize('admin', 'superAdmin'), createVillage);

// Bulk import
router.post('/import', protect, authorize('admin', 'superAdmin'), importVillages);

router.route('/:id')
    .get(protect, getUserPermissionsAndHierarchy, getVillage)
    .put(protect, authorize('admin', 'superAdmin'), updateVillage)
    .delete(protect, authorize('admin', 'superAdmin'), deleteVillage);

/**
 * @swagger
 * components:
 *   schemas:
 *     VillageInput:
 *       type: object
 *       required:
 *         - state_id
 *         - division_id
 *         - parliament_id
 *         - assembly_id
 *         - block_id
 *         - booth_id
 *         - panchayat_id
 *         - village_name
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
 *         village_name:
 *           type: string
 *           description: Name of the village
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
