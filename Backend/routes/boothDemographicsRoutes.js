const express = require('express');
const {
  getBoothDemographics,
  getDemographicsByBooth,
  createBoothDemographics,
  updateBoothDemographics,
  deleteBoothDemographics,
  getDemographicsByAssembly,
  getDemographicsByParliament
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
 *         name: assembly
 *         schema:
 *           type: string
 *         description: Assembly ID to filter by
 *       - in: query
 *         name: parliament
 *         schema:
 *           type: string
 *         description: Parliament ID to filter by
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BoothDemographics'
 */
router.get('/', getBoothDemographics);

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
 *         description: Booth not found
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
 *         description: List of demographics for assembly
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

/**
 * @swagger
 * /api/booth-demographics/parliament/{parliamentId}:
 *   get:
 *     summary: Get demographics by parliament
 *     tags: [Booth Demographics]
 *     parameters:
 *       - in: path
 *         name: parliamentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of demographics for parliament
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
 *         description: Parliament not found
 */
router.get('/parliament/:parliamentId', getDemographicsByParliament);

/**
 * @swagger
 * /api/booth-demographics:
 *   post:
 *     summary: Create booth demographics
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
 *         description: Booth demographics created
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', createBoothDemographics);

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
 *         description: Booth demographics updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Demographics not found
 */
router.put('/:id', protect, authorize('admin'), updateBoothDemographics);

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
 *         description: Unauthorized
 *       404:
 *         description: Demographics not found
 */
router.delete('/:id', protect, authorize('admin'), deleteBoothDemographics);

/**
 * @swagger
 * components:
 *   schemas:
 *     BoothDemographics:
 *       type: object
 *       required:
 *         - booth_id
 *         - assembly_id
 *         - parliament_id
 *         - block_id
 *         - total_population
 *         - total_electors
 *         - male_electors
 *         - female_electors
 *       properties:
 *         booth_id:
 *           type: string
 *           description: Reference to Booth
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
 *           description: Total population count
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
 *           description: Literacy percentage
 *         religious_composition:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: Map of religion to count
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;