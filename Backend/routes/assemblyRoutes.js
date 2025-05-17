const express = require('express');
const router = express.Router();
const assemblyController = require('../controllers/assemblyController');

/**
 * @swagger
 * tags:
 *   name: Assemblies
 *   description: Assembly Constituency Management
 */

/**
 * @swagger
 * /api/assemblies:
 *   post:
 *     summary: Create a new assembly constituency
 *     tags: [Assemblies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Assembly'
 *           example:
 *             name: "Lucknow West"
 *             type: "Urban"
 *             district_id: "507f1f77bcf86cd799439011"
 *             division_id: "507f1f77bcf86cd799439012"
 *             parliament_id: "507f1f77bcf86cd799439013"
 *     responses:
 *       201:
 *         description: Assembly created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Assembly'
 *             example:
 *               _id: "507f1f77bcf86cd799439014"
 *               name: "Lucknow West"
 *               type: "Urban"
 *               district_id: "507f1f77bcf86cd799439011"
 *               division_id: "507f1f77bcf86cd799439012"
 *               parliament_id: "507f1f77bcf86cd799439013"
 *               created_at: "2023-05-15T10:00:00Z"
 *               updated_at: "2023-05-15T10:00:00Z"
 *               __v: 0
 *       400:
 *         description: Validation error
 *         example:
 *           error: "Validation failed: type: `XYZ` is not a valid enum value for path `type`"
 *       404:
 *         description: Related entity not found
 *         example:
 *           error: "District not found"
 */

/**
 * @swagger
 * /api/assemblies/{id}:
 *   put:
 *     summary: Update an assembly constituency
 *     tags: [Assemblies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439014"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Assembly'
 *           example:
 *             name: "Lucknow West Updated"
 *             type: "Mixed"
 *     responses:
 *       200:
 *         description: Assembly updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Assembly'
 *             example:
 *               _id: "507f1f77bcf86cd799439014"
 *               name: "Lucknow West Updated"
 *               type: "Mixed"
 *               district_id: "507f1f77bcf86cd799439011"
 *               division_id: "507f1f77bcf86cd799439012"
 *               parliament_id: "507f1f77bcf86cd799439013"
 *               created_at: "2023-05-15T10:00:00Z"
 *               updated_at: "2023-05-15T10:30:00Z"
 *               __v: 0
 *       404:
 *         description: Assembly not found
 *         example:
 *           error: "Assembly not found"
 */

/**
 * @swagger
 * /api/assemblies/{id}:
 *   get:
 *     summary: Get assembly by ID
 *     tags: [Assemblies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "507f1f77bcf86cd799439014"
 *     responses:
 *       200:
 *         description: Assembly data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Assembly'
 *             example:
 *               _id: "507f1f77bcf86cd799439014"
 *               name: "Lucknow West"
 *               type: "Urban"
 *               district_id: 
 *                 _id: "507f1f77bcf86cd799439011"
 *                 name: "Lucknow District"
 *               division_id: 
 *                 _id: "507f1f77bcf86cd799439012"
 *                 name: "Lucknow Division"
 *               parliament_id: 
 *                 _id: "507f1f77bcf86cd799439013"
 *                 name: "Lucknow Parliamentary Constituency"
 *               created_at: "2023-05-15T10:00:00Z"
 *               updated_at: "2023-05-15T10:00:00Z"
 *       404:
 *         description: Assembly not found
 *         example:
 *           error: "Assembly not found"
 */

/**
 * @swagger
 * tags:
 *   name: Assemblies
 *   description: Assembly constituency management
 */

/**
 * @swagger
 * /api/assemblies:
 *   post:
 *     summary: Create a new assembly constituency
 *     tags: [Assemblies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Assembly'
 *     responses:
 *       201:
 *         description: Assembly created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Assembly'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Related entity (district, division, or parliament) not found
 */
router.post('/', assemblyController.createAssembly);

/**
 * @swagger
 * /api/assemblies:
 *   get:
 *     summary: Get all assembly constituencies
 *     tags: [Assemblies]
 *     responses:
 *       200:
 *         description: List of all assemblies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Assembly'
 */
router.get('/', assemblyController.getAllAssemblies);

/**
 * @swagger
 * /api/assemblies/district/{districtId}:
 *   get:
 *     summary: Get assemblies by district ID
 *     tags: [Assemblies]
 *     parameters:
 *       - in: path
 *         name: districtId
 *         schema:
 *           type: string
 *         required: true
 *         description: District ID
 *     responses:
 *       200:
 *         description: List of assemblies in the district
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Assembly'
 */
router.get('/district/:districtId', assemblyController.getAssembliesByDistrict);

/**
 * @swagger
 * /api/assemblies/parliament/{parliamentId}:
 *   get:
 *     summary: Get assemblies by parliament ID
 *     tags: [Assemblies]
 *     parameters:
 *       - in: path
 *         name: parliamentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Parliament ID
 *     responses:
 *       200:
 *         description: List of assemblies in the parliament constituency
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Assembly'
 */
router.get('/parliament/:parliamentId', assemblyController.getAssembliesByParliament);

/**
 * @swagger
 * /api/assemblies/{id}:
 *   get:
 *     summary: Get an assembly by ID
 *     tags: [Assemblies]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Assembly ID
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
router.get('/:id', assemblyController.getAssemblyById);

/**
 * @swagger
 * /api/assemblies/{id}:
 *   put:
 *     summary: Update an assembly
 *     tags: [Assemblies]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Assembly ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Assembly'
 *     responses:
 *       200:
 *         description: Updated assembly data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Assembly'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Assembly not found
 */
router.put('/:id', assemblyController.updateAssembly);

/**
 * @swagger
 * /api/assemblies/{id}:
 *   delete:
 *     summary: Delete an assembly
 *     tags: [Assemblies]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Assembly ID
 *     responses:
 *       200:
 *         description: Assembly deleted successfully
 *       404:
 *         description: Assembly not found
 */
router.delete('/:id', assemblyController.deleteAssembly);

module.exports = router;