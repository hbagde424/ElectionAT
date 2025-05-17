// const express = require('express');
// const router = express.Router();
// const stateController = require('../controllers/stateController');

// // Create a new state
// router.post('/', stateController.createState);

// // Get all states
// router.get('/', stateController.getAllStates);

// // Get a single state by ID
// router.get('/:id', stateController.getStateById);

// // Update a state
// router.put('/:id', stateController.updateState);

// // Delete a state
// router.delete('/:id', stateController.deleteState);

// module.exports = router;


const express = require('express');
const router = express.Router();
const stateController = require('../controllers/stateController');

/**
 * @swagger
 * tags:
 *   name: States
 *   description: State management
 */

/**
 * @swagger
 * /api/states:
 *   post:
 *     summary: Create a new state
 *     tags: [States]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/State'
 *     responses:
 *       201:
 *         description: State created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/State'
 *       400:
 *         description: Bad request
 */
router.post('/', stateController.createState);

/**
 * @swagger
 * /api/states:
 *   get:
 *     summary: Get all states
 *     tags: [States]
 *     responses:
 *       200:
 *         description: List of all states
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/State'
 */
router.get('/', stateController.getAllStates);

/**
 * @swagger
 * /api/states/{id}:
 *   get:
 *     summary: Get a state by ID
 *     tags: [States]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: State ID
 *     responses:
 *       200:
 *         description: State data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/State'
 *       404:
 *         description: State not found
 */
router.get('/:id', stateController.getStateById);

/**
 * @swagger
 * /api/states/{id}:
 *   put:
 *     summary: Update a state
 *     tags: [States]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: State ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/State'
 *     responses:
 *       200:
 *         description: Updated state data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/State'
 *       400:
 *         description: Bad request
 *       404:
 *         description: State not found
 */
router.put('/:id', stateController.updateState);

/**
 * @swagger
 * /api/states/{id}:
 *   delete:
 *     summary: Delete a state
 *     tags: [States]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: State ID
 *     responses:
 *       200:
 *         description: State deleted successfully
 *       404:
 *         description: State not found
 */
router.delete('/:id', stateController.deleteState);

module.exports = router;