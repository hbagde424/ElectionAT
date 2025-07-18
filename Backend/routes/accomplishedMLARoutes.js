const express = require('express');
const {
  getAccomplishedMLAs,
  getAccomplishedMLA,
  createAccomplishedMLA,
  updateAccomplishedMLA,
  deleteAccomplishedMLA,
  getCurrentMLAs,
  getMLAsByAssembly,
  getMLAsByParty
} = require('../controllers/accomplishedMLAController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Accomplished MLAs
 *   description: MLA achievements management
 */

/**
 * @swagger
 * /api/accomplished-mlas:
 *   get:
 *     summary: Get all MLAs
 *     tags: [Accomplished MLAs]
 *     responses:
 *       200:
 *         description: List of MLAs
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
 *                     $ref: '#/components/schemas/AccomplishedMLA'
 */
router.get('/', getAccomplishedMLAs);

/**
 * @swagger
 * /api/accomplished-mlas/{id}:
 *   get:
 *     summary: Get single MLA
 *     tags: [Accomplished MLAs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: MLA data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccomplishedMLA'
 *       404:
 *         description: MLA not found
 */
router.get('/:id', getAccomplishedMLA);

/**
 * @swagger
 * /api/accomplished-mlas:
 *   post:
 *     summary: Create new MLA
 *     tags: [Accomplished MLAs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccomplishedMLA'
 *     responses:
 *       201:
 *         description: MLA created successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/',createAccomplishedMLA);

/**
 * @swagger
 * /api/accomplished-mlas/{id}:
 *   put:
 *     summary: Update MLA
 *     tags: [Accomplished MLAs]
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
 *             $ref: '#/components/schemas/AccomplishedMLA'
 *     responses:
 *       200:
 *         description: MLA updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: MLA not found
 */
router.put('/:id', updateAccomplishedMLA);

/**
 * @swagger
 * /api/accomplished-mlas/{id}:
 *   delete:
 *     summary: Delete MLA
 *     tags: [Accomplished MLAs]
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
 *         description: MLA deleted
 *       404:
 *         description: MLA not found
 */
router.delete('/:id', deleteAccomplishedMLA);

/**
 * @swagger
 * /api/accomplished-mlas/current:
 *   get:
 *     summary: Get current MLAs
 *     tags: [Accomplished MLAs]
 *     responses:
 *       200:
 *         description: List of current MLAs
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
 *                     $ref: '#/components/schemas/AccomplishedMLA'
 */
router.get('/current', getCurrentMLAs);

/**
 * @swagger
 * /api/accomplished-mlas/assembly/{assemblyId}:
 *   get:
 *     summary: Get MLAs by assembly
 *     tags: [Accomplished MLAs]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of MLAs for the assembly
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
 *                     $ref: '#/components/schemas/AccomplishedMLA'
 */
router.get('/assembly/:assemblyId', getMLAsByAssembly);

/**
 * @swagger
 * /api/accomplished-mlas/party/{partyId}:
 *   get:
 *     summary: Get MLAs by party
 *     tags: [Accomplished MLAs]
 *     parameters:
 *       - in: path
 *         name: partyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of MLAs for the party
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
 *                     $ref: '#/components/schemas/AccomplishedMLA'
 */
router.get('/party/:partyId', getMLAsByParty);

/**
 * @swagger
 * components:
 *   schemas:
 *     AccomplishedMLA:
 *       type: object
 *       required:
 *         - assembly_id
 *         - party_id
 *         - name
 *         - term_start
 *       properties:
 *         assembly_id:
 *           type: string
 *           description: Reference to Assembly
 *         party_id:
 *           type: string
 *           description: Reference to Party
 *         name:
 *           type: string
 *           description: MLA's full name
 *           maxLength: 100
 *         term_start:
 *           type: string
 *           format: date
 *           description: Start date of term
 *         term_end:
 *           type: string
 *           format: date
 *           description: End date of term
 *         achievements:
 *           type: array
 *           items:
 *             type: string
 *           description: List of achievements
 *           maxItems: 20
 *         contact_info:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *             phone:
 *               type: string
 *               pattern: '^[0-9]{10}$'
 *             address:
 *               type: string
 *               maxLength: 200
 *         is_current:
 *           type: boolean
 *           description: Whether the MLA is currently serving
 *           default: false
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       example:
 *         assembly_id: "507f1f77bcf86cd799439011"
 *         party_id: "507f1f77bcf86cd799439012"
 *         name: "John Doe"
 *         term_start: "2020-05-15"
 *         term_end: "2025-05-14"
 *         achievements: ["Built new hospital", "Improved road infrastructure"]
 *         contact_info:
 *           email: "john.doe@example.com"
 *           phone: "9876543210"
 *           address: "123 MLA Residence, Capital City"
 *         is_current: true
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;