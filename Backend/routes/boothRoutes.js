// const express = require('express');
// const router = express.Router();
// const boothController = require('../controllers/boothController');

// // Create a new booth
// router.post('/', boothController.createBooth);

// // Get all booths
// router.get('/', boothController.getAllBooths);

// // Get booths by assembly ID
// // router.get('/assembly/:assemblyId', boothController.getBoothsByAssembly);

// // Get a single booth by ID
// // router.get('/:id', boothController.getBoothById);

// // Update a booth
// // router.put('/:id', boothController.updateBooth);

// // Delete a booth
// // router.delete('/:id', boothController.deleteBooth);

// module.exports = router;



const express = require('express');
const router = express.Router();
const boothController = require('../controllers/boothController');

/**
 * @swagger
 * tags:
 *   name: Booths
 *   description: Booth management
 */

/**
 * @swagger
 * /api/booths:
 *   post:
 *     summary: Create a new booth
 *     tags: [Booths]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booth'
 *     responses:
 *       201:
 *         description: Booth created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booth'
 *       400:
 *         description: Bad request
 */
router.post('/', boothController.createBooth);

/**
 * @swagger
 * /api/booths:
 *   get:
 *     summary: Get all booths
 *     tags: [Booths]
 *     responses:
 *       200:
 *         description: List of all booths
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booth'
 */
router.get('/', boothController.getAllBooths);

/**
 * @swagger
 * /api/booths/assembly/{assemblyId}:
 *   get:
 *     summary: Get booths by assembly ID
 *     tags: [Booths]
 *     parameters:
 *       - in: path
 *         name: assemblyId
 *         schema:
 *           type: string
 *         required: true
 *         description: Assembly ID
 *     responses:
 *       200:
 *         description: List of booths in the assembly
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booth'
 *       404:
 *         description: No booths found for this assembly
 */
// router.get('/assembly/:assemblyId', boothController.getBoothsByAssembly);

/**
 * @swagger
 * /api/booths/{id}:
 *   get:
 *     summary: Get a booth by ID
 *     tags: [Booths]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Booth ID
 *     responses:
 *       200:
 *         description: Booth data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booth'
 *       404:
 *         description: Booth not found
 */
// router.get('/:id', boothController.getBoothById);

/**
 * @swagger
 * /api/booths/{id}:
 *   put:
 *     summary: Update a booth
 *     tags: [Booths]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Booth ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booth'
 *     responses:
 *       200:
 *         description: Updated booth data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booth'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Booth not found
 */
// router.put('/:id', boothController.updateBooth);

/**
 * @swagger
 * /api/booths/{id}:
 *   delete:
 *     summary: Delete a booth
 *     tags: [Booths]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Booth ID
 *     responses:
 *       200:
 *         description: Booth deleted successfully
 *       404:
 *         description: Booth not found
 */
// router.delete('/:id', boothController.deleteBooth);

module.exports = router;