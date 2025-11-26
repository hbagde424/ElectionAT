const express = require('express');
const {
    getPanchayats,
    getPanchayat,
    createPanchayat,
    updatePanchayat,
    deletePanchayat,
    importPanchayats
} = require('../controllers/panchayatController');
const { protect, authorize } = require('../middlewares/auth');
const { getUserPermissionsAndHierarchy } = require('../middlewares/permissions');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Panchayats
 *   description: Panchayat management
 */

/**
 * @swagger
 * /api/panchayats:
 *   get:
 *     summary: Get all Panchayats
 *     tags: [Panchayats]
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
 *         name: panchayat_name
 *         schema:
 *           type: string
 *         description: Filter by Panchayat name
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
 *         description: List of panchayats
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
 *                     $ref: '#/components/schemas/Panchayat'
 *   post:
 *     summary: Create a new Panchayat
 *     tags: [Panchayats]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PanchayatInput'
 *     responses:
 *       201:
 *         description: Panchayat created successfully
 *       400:
 *         description: Bad request
 */

/**
 * @swagger
 * /api/panchayats/{id}:
 *   get:
 *     summary: Get Panchayat by ID
 *     tags: [Panchayats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Panchayat ID
 *     responses:
 *       200:
 *         description: Panchayat details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Panchayat'
 *       404:
 *         description: Panchayat not found
 *   put:
 *     summary: Update Panchayat
 *     tags: [Panchayats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Panchayat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PanchayatInput'
 *     responses:
 *       200:
 *         description: Panchayat updated successfully
 *       404:
 *         description: Panchayat not found
 *   delete:
 *     summary: Delete Panchayat
 *     tags: [Panchayats]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Panchayat ID
 *     responses:
 *       200:
 *         description: Panchayat deleted successfully
 *       404:
 *         description: Panchayat not found
 */

router.route('/')
    .get(protect, getUserPermissionsAndHierarchy, getPanchayats)
    .post(protect, authorize('admin', 'superAdmin'), createPanchayat);

// Bulk import
router.post('/import', protect, authorize('admin', 'superAdmin'), importPanchayats);

router.route('/:id')
    .get(protect, getUserPermissionsAndHierarchy, getPanchayat)
    .put(protect, authorize('admin', 'superAdmin'), updatePanchayat)
    .delete(protect, authorize('admin', 'superAdmin'), deletePanchayat);

/**
 * @swagger
 * components:
 *   schemas:
 *     Panchayat:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         state_id:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *         division_id:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *         parliament_id:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *         assembly_id:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             AC_NO:
 *               type: number
 *         block_id:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *         booth_id:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             booth_number:
 *               type: string
 *         panchayat_name:
 *           type: string
 *         location:
 *           type: string
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 *         male_count:
 *           type: number
 *         female_count:
 *           type: number
 *         others_count:
 *           type: number
 *         total_count:
 *           type: number
 *         created_by:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             username:
 *               type: string
 *         updated_by:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             username:
 *               type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     PanchayatInput:
 *       type: object
 *       required:
 *         - state_id
 *         - division_id
 *         - parliament_id
 *         - assembly_id
 *         - block_id
 *         - booth_id
 *         - panchayat_name
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
 *         panchayat_name:
 *           type: string
 *           description: Name of the panchayat
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
