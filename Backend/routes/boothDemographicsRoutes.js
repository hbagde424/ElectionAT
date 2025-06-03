const express = require('express');
const router = express.Router();
const boothDemographicsController = require('../controllers/boothDemographicsController');

/**
 * @swagger
 * tags:
 *   name: Booth Demographics
 *   description: Booth Demographic Data Management
 */

/**
 * @swagger
 * /api/booth-demographics:
 *   get:
 *     summary: Get all booth demographics
 *     tags: [Booth Demographics]
 *     responses:
 *       200:
 *         description: List of all booth demographics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BoothDemographics'
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create new booth demographics
 *     tags: [Booth Demographics]
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
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.route('/')
  .get(boothDemographicsController.getAllBoothDemographics)
  .post(boothDemographicsController.createBoothDemographics);

/**
 * @swagger
 * /api/booth-demographics/{id}:
 *   get:
 *     summary: Get booth demographics by ID
 *     tags: [Booth Demographics]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         example: "6823469b436f44ab6db31552"
 *     responses:
 *       200:
 *         description: Booth demographics data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoothDemographics'
 *       404:
 *         description: Booth demographics not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update booth demographics
 *     tags: [Booth Demographics]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         example: "6823469b436f44ab6db31552"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BoothDemographics'
 *     responses:
 *       200:
 *         description: Updated booth demographics
 *       400:
 *         description: Bad request
 *       404:
 *         description: Booth demographics not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete booth demographics
 *     tags: [Booth Demographics]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         example: "6823469b436f44ab6db31552"
 *     responses:
 *       200:
 *         description: Booth demographics deleted successfully
 *       404:
 *         description: Booth demographics not found
 *       500:
 *         description: Server error
 */
router.route('/:id')
  .get(boothDemographicsController.getBoothDemographicsById)
  .put(boothDemographicsController.updateBoothDemographics)
  .delete(boothDemographicsController.deleteBoothDemographics);

/**
 * @swagger
 * /api/booth-demographics/booth/{boothId}:
 *   get:
 *     summary: Get booth demographics by booth ID
 *     tags: [Booth Demographics]
 *     parameters:
 *       - in: path
 *         name: boothId
 *         schema:
 *           type: string
 *         required: true
 *         example: "6823469b436f44ab6db31550"
 *     responses:
 *       200:
 *         description: Booth demographics data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoothDemographics'
 *       404:
 *         description: Booth demographics not found for this booth
 *       500:
 *         description: Server error
 */
router.get('/booth/:boothId', boothDemographicsController.getBoothDemographicsByBoothId);

module.exports = router;