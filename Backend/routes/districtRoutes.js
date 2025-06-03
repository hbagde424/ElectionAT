const express = require('express');
const router = express.Router();
const districtController = require('../controllers/districtController');

/**
 * @swagger
 * tags:
 *   name: Districts
 *   description: District management
 */

/**
 * @swagger
 * /api/districts:
 *   post:
 *     summary: Create a new district
 *     tags: [Districts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/District'
 *     responses:
 *       201:
 *         description: District created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/District'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Related entity (parliament or division) not found
 */
router.post('/', districtController.createDistrict);

/**
 * @swagger
 * /api/districts:
 *   get:
 *     summary: Get all districts
 *     tags: [Districts]
 *     responses:
 *       200:
 *         description: List of all districts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/District'
 */
router.get('/', districtController.getDistricts);

/**
 * @swagger
 * /api/districts/division/{divisionId}:
 *   get:
 *     summary: Get districts by division ID
 *     tags: [Districts]
 *     parameters:
 *       - in: path
 *         name: divisionId
 *         schema:
 *           type: string
 *         required: true
 *         description: Division ID
 *     responses:
 *       200:
 *         description: List of districts in the division
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/District'
 */
router.get('/division/:divisionId', districtController.getDistrictsByDivision);

/**
 * @swagger
 * /api/districts/{id}:
 *   get:
 *     summary: Get a district by ID
 *     tags: [Districts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: District ID
 *     responses:
 *       200:
 *         description: District data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/District'
 *       404:
 *         description: District not found
 */
router.get('/:id', districtController.getDistrictById);

/**
 * @swagger
 * /api/districts/{id}:
 *   put:
 *     summary: Update a district
 *     tags: [Districts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: District ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/District'
 *     responses:
 *       200:
 *         description: Updated district data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/District'
 *       400:
 *         description: Bad request
 *       404:
 *         description: District not found
 */
router.put('/:id', districtController.updateDistrict);

/**
 * @swagger
 * /api/districts/{id}:
 *   delete:
 *     summary: Delete a district
 *     tags: [Districts]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: District ID
 *     responses:
 *       200:
 *         description: District deleted successfully
 *       404:
 *         description: District not found
 */
router.delete('/:id', districtController.deleteDistrict);

module.exports = router;