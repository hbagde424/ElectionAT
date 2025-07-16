const express = require('express');
const {
  getBoothDemographics,
  getBoothDemographic,
  createBoothDemographics,
  updateBoothDemographics,
  deleteBoothDemographics,
  getDemographicsByBooth,
  getDemographicsByAssembly
} = require('../controllers/boothDemographicsController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Booth Demographics
 *   description: Booth demographic data management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     BoothDemographics:
 *       type: object
 *       required:
 *         - booth_id
 *         - state_id
 *         - division_id
 *         - assembly_id
 *         - parliament_id
 *         - block_id
 *         - total_population
 *         - total_electors
 *         - male_electors
 *         - female_electors
 *         - created_by
 *       properties:
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
 *         state_id:
 *           type: string
 *           description: Reference to State
 *         division_id:
 *           type: string
 *           description: Reference to Division
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *         parliament_id:
 *           type: string
 *           description: Reference to Parliament
 *         block_id:
 *           type: string
 *           description: Reference to Block
 *         total_population:
 *           type: number
 *           description: Total population in the booth area
 *         total_electors:
 *           type: number
 *           description: Total eligible voters
 *         male_electors:
 *           type: number
 *           description: Male voters count
 *         female_electors:
 *           type: number
 *           description: Female voters count
 *         other_electors:
 *           type: number
 *           description: Other gender voters count
 *         education:
 *           type: object
 *           properties:
 *             illiterate:
 *               type: number
 *             educated:
 *               type: number
 *             class_1_to_5:
 *               type: number
 *             class_5_to_10:
 *               type: number
 *             class_10_to_12:
 *               type: number
 *             graduate:
 *               type: number
 *             post_graduate:
 *               type: number
 *             other_education:
 *               type: number
 *         annual_income:
 *           type: object
 *           properties:
 *             below_10k:
 *               type: number
 *             _10k_to_20k:
 *               type: number
 *             _25k_to_50k:
 *               type: number
 *             _50k_to_2L:
 *               type: number
 *             _2L_to_5L:
 *               type: number
 *             above_5L:
 *               type: number
 *         age_groups:
 *           type: object
 *           properties:
 *             _18_25:
 *               type: number
 *             _26_40:
 *               type: number
 *             _41_60:
 *               type: number
 *             _60_above:
 *               type: number
 *         caste_population:
 *           type: object
 *           properties:
 *             sc:
 *               type: number
 *             st:
 *               type: number
 *             obc:
 *               type: number
 *             general:
 *               type: number
 *             other:
 *               type: number
 *         literacy_rate:
 *           type: number
 *           description: Literacy rate percentage
 *         religious_composition:
 *           type: object
 *           additionalProperties:
 *             type: number
 *         created_by:
 *           type: string
 *           description: User who created the record
 *         updated_by:
 *           type: string
 *           description: User who last updated the record
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/booth-demographics:
 *   get:
 *     summary: Get all booth demographics
 *     tags: [Booth Demographics]
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
 *         description: Search term for booth names or numbers
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State ID to filter by
 *       - in: query
 *         name: division
 *         schema:
 *           type: string
 *         description: Division ID to filter by
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
 *         name: block
 *         schema:
 *           type: string
 *         description: Block ID to filter by
 *     responses:
 *       200:
 *         description: List of booth demographics
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
 *                     $ref: '#/components/schemas/BoothDemographics'
 */
router.get('/', getBoothDemographics);

/**
 * @swagger
 * /api/booth-demographics/{id}:
 *   get:
 *     summary: Get single booth demographics
 *     tags: [Booth Demographics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booth demographics data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoothDemographics'
 *       404:
 *         description: Booth demographics not found
 */
router.get('/:id', getBoothDemographic);

/**
 * @swagger
 * /api/booth-demographics:
 *   post:
 *     summary: Create new booth demographics
 *     tags: [Booth Demographics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BoothDemographics'
 *     responses:
 *       201:
 *         description: Booth demographics created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post('/', protect, authorize('admin', 'superAdmin'), createBoothDemographics);

/**
 * @swagger
 * /api/booth-demographics/{id}:
 *   put:
 *     summary: Update booth demographics
 *     tags: [Booth Demographics]
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
 *             $ref: '#/components/schemas/BoothDemographics'
 *     responses:
 *       200:
 *         description: Booth demographics updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Booth demographics not found
 */
router.put('/:id', protect, authorize('admin', 'superAdmin'), updateBoothDemographics);

/**
 * @swagger
 * /api/booth-demographics/{id}:
 *   delete:
 *     summary: Delete booth demographics
 *     tags: [Booth Demographics]
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
 *         description: Booth demographics deleted
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Booth demographics not found
 */
router.delete('/:id', protect, authorize('admin', 'superAdmin'), deleteBoothDemographics);

/**
 * @swagger
 * /api/booth-demographics/booth/{boothId}:
 *   get:
 *     summary: Get demographics by booth
 *     tags: [Booth Demographics]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booth demographics data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoothDemographics'
 *       404:
 *         description: Booth or demographics not found
 */
router.get('/booth/:boothId', getDemographicsByBooth);

/**
 * @swagger
 * /api/booth-demographics/assembly/{assemblyId}:
 *   get:
 *     summary: Get demographics by assembly
 *     tags: [Booth Demographics]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of booth demographics for the assembly
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
 *                     $ref: '#/components/schemas/BoothDemographics'
 *       404:
 *         description: Assembly not found
 */
router.get('/assembly/:assemblyId', getDemographicsByAssembly);

module.exports = router;